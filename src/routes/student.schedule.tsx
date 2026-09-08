import { createFileRoute } from "@tanstack/react-router";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import {
  Upload, Plus, BookOpen, CalendarDays, RefreshCw, CheckCircle2,
  AlertTriangle, X, Loader2, FileCheck, ListTodo
} from "lucide-react";
import { IcsUploader } from "@/components/schedule/IcsUploader";
import { SchedulePreviewList } from "@/components/schedule/SchedulePreviewList";
import { ImportModeDialog, type ImportMode } from "@/components/schedule/ImportModeDialog";
import { WeeklyCalendar } from "@/components/schedule/WeeklyCalendar";
import { ScheduleEditDialog } from "@/components/schedule/ScheduleEditDialog";
import type { IcsParseResult, ParsedClassSchedule } from "@/lib/ics-parser";
import {
  getStudentClassSchedules,
  saveClassSchedules,
  addSingleSchedule,
  updateSingleSchedule,
  deleteSingleSchedule,
  type ClassScheduleRow,
  type ClassScheduleInsert,
} from "@/lib/class-schedules";

export const Route = createFileRoute("/student/schedule")({
  component: () => (
    <RoleGuard role="student" as any>
      <MySchedulePage />
    </RoleGuard>
  ),
});

type Stage = "empty" | "uploaded" | "mode-dialog" | "saving" | "saved";

function MySchedulePage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const studentId = user!.id;

  const { data: schedules = [], refetch, isLoading, isFetching } = useQuery({
    queryKey: ["class_schedules", studentId],
    queryFn: () => getStudentClassSchedules(studentId),
    enabled: !!studentId,
  });

  const [parseResult, setParseResult] = useState<IcsParseResult | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [stage, setStage] = useState<Stage>("empty");
  const [saving, setSaving] = useState(false);
  const [saveSummary, setSaveSummary] = useState<{
    inserted: number; skipped: number; mode: ImportMode; warnings: string[];
  } | null>(null);

  const [editOpen, setEditOpen] = useState(false);
  const [editMode, setEditMode] = useState<"add" | "edit">("add");
  const [editTarget, setEditTarget] = useState<ClassScheduleRow | null>(null);

  const showPreview = stage !== "empty" && parseResult !== null;
  const existingCount = schedules.length;
  const newCount = parseResult?.schedules.length ?? 0;

  const onParsed = (r: IcsParseResult, fn: string) => {
    setParseResult(r);
    setFileName(fn);
    setStage(r.success ? "uploaded" : "empty");
    setSaveSummary(null);
    if (r.success) {
      toast.success(`อ่านไฟล์สำเร็จ พบ ${r.schedules.length} รายการ`);
    }
  };

  const cancelPreview = () => {
    setParseResult(null);
    setFileName("");
    setStage("empty");
    setSaveSummary(null);
  };

  const confirmImport = () => {
    if (!parseResult || parseResult.schedules.length === 0) return;
    if (existingCount > 0) {
      setStage("mode-dialog");
    } else {
      void doImport("replace");
    }
  };

  const doImport = async (mode: ImportMode) => {
    if (!parseResult) return;
    setSaving(true);
    setStage("saving");
    const res = await saveClassSchedules(studentId, parseResult.schedules, mode);
    setSaving(false);
    if (!res.success) {
      toast.error(res.errors[0] || "นำเข้าไม่สำเร็จ");
      setStage("uploaded");
      return;
    }
    await qc.invalidateQueries({ queryKey: ["class_schedules"] });
    setSaveSummary({ inserted: res.inserted, skipped: res.skipped, mode, warnings: res.warnings });
    setStage("saved");
    setParseResult(null);
    setFileName("");
    toast.success(
      res.inserted > 0
        ? `นำเข้าสำเร็จ ${res.inserted} รายการ${res.skipped > 0 ? ` (ข้าม ${res.skipped})` : ""}`
        : `ไม่มีรายการใหม่ที่ต้องบันทึก (ข้าม ${res.skipped})`,
    );
  };

  const onSaveManual = async (
    data: Omit<ClassScheduleInsert, "student_id">,
    id?: string,
  ) => {
    if (editMode === "add") {
      return addSingleSchedule({ ...data, student_id: studentId });
    } else if (id) {
      return updateSingleSchedule(id, studentId, data);
    }
    await qc.invalidateQueries({ queryKey: ["class_schedules"] });
    return { success: false, error: "ไม่พบ ID" };
  };

  const onDeleteManual = async (id: string) => {
    const r = await deleteSingleSchedule(id, studentId);
    if (r.success) await qc.invalidateQueries({ queryKey: ["class_schedules"] });
    return r;
  };

  const openAdd = () => {
    setEditMode("add");
    setEditTarget(null);
    setEditOpen(true);
  };
  const openEdit = (s: ClassScheduleRow) => {
    setEditMode("edit");
    setEditTarget(s);
    setEditOpen(true);
  };
  const openDelete = (s: ClassScheduleRow) => {
    void onDeleteManual(s.id);
  };

  const stats = useMemo(() => {
    const byDay = new Map<number, number>();
    let totalMin = 0;
    for (const s of schedules) {
      byDay.set(s.day_of_week, (byDay.get(s.day_of_week) ?? 0) + 1);
      const [sh, sm] = s.start_time.split(":").map(Number);
      const [eh, em] = s.end_time.split(":").map(Number);
      totalMin += (eh * 60 + em) - (sh * 60 + sm);
    }
    return {
      total: schedules.length,
      days: byDay.size,
      hours: Math.round((totalMin / 60) * 10) / 10,
      uniqueCourses: new Set(schedules.map(s => `${s.course_code || ""}${s.course_name}`)).size,
    };
  }, [schedules]);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-bold tracking-tight">ตารางเรียนของฉัน</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            นำเข้าจากไฟล์ .ics หรือจัดการด้วยมือ — ใช้เปรียบเทียบเวลางาน Part-Time
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-2 text-sm font-semibold transition hover:bg-muted disabled:opacity-60"
          >
            <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
            รีเฟรช
          </button>
          <button
            onClick={openAdd}
            className="inline-flex items-center gap-1.5 rounded-md bg-muted px-3 py-2 text-sm font-bold transition hover:bg-muted/70"
          >
            <Plus className="h-4 w-4" />
            เพิ่มวิชา
          </button>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-4">
        {[
          { k: "วิชาเรียนทั้งหมด", v: stats.total, icon: BookOpen, tone: "bg-primary text-primary-foreground" },
          { k: "จำนวนวันที่มีเรียน", v: `${stats.days} วัน`, icon: CalendarDays, tone: "bg-sky-500 text-white" },
          { k: "ชั่วโมงต่อสัปดาห์", v: `${stats.hours} ชม.`, icon: ListTodo, tone: "bg-emerald-500 text-white" },
          { k: "วิชาที่แตกต่าง", v: stats.uniqueCourses, icon: FileCheck, tone: "bg-amber-500 text-white" },
        ].map((c, i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${c.tone}`}>
                <c.icon className="h-5 w-5" />
              </div>
              <div>
                <div className="text-xs text-muted-foreground">{c.k}</div>
                <div className="font-display text-2xl font-bold leading-tight">{c.v}</div>
              </div>
            </div>
          </div>
        ))}
      </section>

      {!showPreview ? (
        <section className="grid gap-5 lg:grid-cols-5">
          <div className="lg:col-span-2 space-y-4">
            <div className="rounded-xl border border-border bg-card p-5">
              <h2 className="font-display text-xl font-bold flex items-center gap-2">
                <Upload className="h-5 w-5 text-primary" />
                นำเข้าตารางเรียน .ics
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">
                รองรับไฟล์นักศึกษา KKU (.ics) — parse ในเบราว์เซอร์ ไม่ต้องอัปโหลดไฟล์จริง
              </p>
              <div className="mt-4">
                <IcsUploader onParsed={onParsed} />
              </div>
            </div>

            {saveSummary && (
              <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-4 dark:border-emerald-800/60 dark:bg-emerald-950/30">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  <div className="flex-1">
                    <div className="font-display font-bold text-emerald-800 dark:text-emerald-300">
                      บันทึกเรียบร้อย
                    </div>
                    <div className="mt-0.5 text-xs text-emerald-700/80 dark:text-emerald-400/80">
                      โหมด: {saveSummary.mode === "replace" ? "แทนที่เดิม" : "เพิ่มต่อ"} ·
                      เพิ่ม {saveSummary.inserted} รายการ ·
                      ข้าม {saveSummary.skipped} รายการ
                    </div>
                    {saveSummary.warnings.length > 0 && (
                      <details className="mt-2 rounded-md bg-white/60 p-2 text-xs dark:bg-black/20">
                        <summary className="cursor-pointer font-semibold text-emerald-800 dark:text-emerald-300">
                          คำเตือน ({saveSummary.warnings.length})
                        </summary>
                        <ul className="mt-1 ml-4 list-disc space-y-0.5 text-emerald-700 dark:text-emerald-400">
                          {saveSummary.warnings.slice(0, 10).map((w, i) => <li key={i}>{w}</li>)}
                        </ul>
                      </details>
                    )}
                  </div>
                  <button
                    onClick={() => setSaveSummary(null)}
                    className="rounded-md p-1 hover:bg-emerald-100 dark:hover:bg-emerald-950/50"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            <div className="rounded-xl border border-border bg-card p-5">
              <h2 className="font-display text-xl font-bold">รายการวิชา ({schedules.length})</h2>
              {isLoading ? (
                <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /> กำลังโหลดตารางเรียน…
                </div>
              ) : schedules.length === 0 ? (
                <div className="mt-4 rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                  <CalendarDays className="mx-auto mb-2 h-8 w-8 opacity-40" />
                  ยังไม่มีตารางเรียน — กดนำเข้า .ics หรือเพิ่มวิชาด้วยมือ
                </div>
              ) : (
                <div className="mt-3 max-h-[420px] space-y-1.5 overflow-y-auto pr-1">
                  {schedules.map(s => (
                    <button
                      key={s.id}
                      onClick={() => openEdit(s)}
                      className="flex w-full items-center gap-3 rounded-lg border border-border bg-background px-3 py-2 text-left transition hover:border-primary/60 hover:bg-primary/5"
                    >
                      <div className="flex h-10 w-10 flex-col items-center justify-center rounded-md bg-primary/10 text-primary">
                        <div className="text-[10px] font-black leading-none">
                          {["อา","จ","อ","พ","พฤ","ศ","ส"][s.day_of_week]}
                        </div>
                        <div className="text-[10px] font-bold opacity-80 mt-0.5">{s.start_time.replace(":","")}</div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5">
                          {s.course_code && (
                            <span className="rounded bg-emerald-100 px-1.5 text-[10px] font-black text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
                              {s.course_code}
                            </span>
                          )}
                          <span className="font-semibold truncate">{s.course_name}</span>
                        </div>
                        <div className="mt-0.5 text-xs text-muted-foreground truncate">
                          {s.start_time}–{s.end_time}
                          {s.room && ` · ${s.room}`}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-3">
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="font-display text-xl font-bold">ปฏิทินรายสัปดาห์</h2>
                <div className="text-xs text-muted-foreground">
                  คลิกเพื่อแก้ไข · คลิกขวาเพื่อลบ
                </div>
              </div>
              {isLoading ? (
                <div className="flex h-96 items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : schedules.length === 0 ? (
                <div className="flex h-96 flex-col items-center justify-center rounded-lg border border-dashed border-border text-muted-foreground">
                  <CalendarDays className="mb-3 h-12 w-12 opacity-30" />
                  <p className="font-display text-lg font-bold">ยังไม่มีตารางเรียน</p>
                  <p className="text-sm">นำเข้าไฟล์ .ics หรือเพิ่มวิชาเพื่อแสดงตาราง</p>
                </div>
              ) : (
                <WeeklyCalendar
                  schedules={schedules}
                  onEdit={openEdit}
                  onDelete={openDelete}
                />
              )}
            </div>
          </div>
        </section>
      ) : (
        <section className="grid gap-5 lg:grid-cols-5">
          <div className="lg:col-span-2 space-y-4">
            <div className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-xl font-bold flex items-center gap-2">
                  <FileCheck className="h-5 w-5 text-primary" />
                  ตรวจสอบข้อมูล
                </h2>
                <button
                  onClick={cancelPreview}
                  className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-2.5 py-1 text-xs font-semibold hover:bg-muted"
                >
                  <X className="h-3.5 w-3.5" />
                  ยกเลิก
                </button>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                ตรวจสอบรายการตารางเรียนที่ parse ได้ ก่อนนำเข้าฐานข้อมูล
              </p>

              <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-md bg-primary/10 p-3">
                  <div className="text-muted-foreground">รายการทั้งหมด</div>
                  <div className="mt-0.5 font-display text-2xl font-bold text-primary">{newCount}</div>
                </div>
                <div className={`rounded-md p-3 ${existingCount > 0 ? "bg-amber-100 dark:bg-amber-950/30" : "bg-emerald-100 dark:bg-emerald-950/30"}`}>
                  <div className="text-muted-foreground">ตารางเดิม</div>
                  <div className={`mt-0.5 font-display text-2xl font-bold ${existingCount > 0 ? "text-amber-700 dark:text-amber-400" : "text-emerald-700 dark:text-emerald-400"}`}>{existingCount}</div>
                </div>
              </div>

              {parseResult.errors.length > 0 && (
                <div className="mt-4 rounded-lg border border-red-300 bg-red-50 p-3 text-xs text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-400">
                  <div className="flex items-center gap-1.5 font-bold">
                    <AlertTriangle className="h-3.5 w-3.5" /> ข้อผิดพลาด ({parseResult.errors.length})
                  </div>
                  <ul className="mt-1 ml-5 list-disc space-y-0.5">
                    {parseResult.errors.slice(0, 3).map((e, i) => <li key={i}>{e}</li>)}
                  </ul>
                </div>
              )}
              {parseResult.warnings.length > 0 && (
                <div className="mt-3 rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-400">
                  <div className="flex items-center gap-1.5 font-bold">
                    <AlertTriangle className="h-3.5 w-3.5" /> คำเตือน ({parseResult.warnings.length})
                  </div>
                  <ul className="mt-1 ml-5 list-disc space-y-0.5">
                    {parseResult.warnings.slice(0, 3).map((w, i) => <li key={i}>{w}</li>)}
                  </ul>
                </div>
              )}

              <div className="mt-5 flex gap-2">
                <button
                  onClick={cancelPreview}
                  className="flex-1 rounded-md border border-border bg-card px-3 py-2.5 text-sm font-semibold transition hover:bg-muted"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={confirmImport}
                  disabled={parseResult.schedules.length === 0}
                  className="flex flex-[1.3] items-center justify-center gap-1.5 rounded-md bg-primary px-3 py-2.5 text-sm font-bold text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  นำเข้าตารางเรียน
                </button>
              </div>
            </div>
          </div>

          <div className="lg:col-span-3">
            <div className="rounded-xl border border-border bg-card p-4 max-h-[80vh] overflow-auto">
              <SchedulePreviewList
                schedules={parseResult.schedules}
                warnings={parseResult.warnings}
                errors={parseResult.errors}
                fileName={fileName}
              />
            </div>
          </div>
        </section>
      )}

      <ImportModeDialog
        open={stage === "mode-dialog"}
        newCount={newCount}
        existingCount={existingCount}
        loading={saving}
        onCancel={() => setStage("uploaded")}
        onConfirm={(mode) => void doImport(mode)}
      />

      <ScheduleEditDialog
        open={editOpen}
        mode={editMode}
        initial={editTarget}
        onClose={() => { setEditOpen(false); void qc.invalidateQueries({ queryKey: ["class_schedules"] }); }}
        onSave={onSaveManual}
        onDelete={onDeleteManual}
      />
    </div>
  );
}
