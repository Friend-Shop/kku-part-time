import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { BriefcaseBusiness, Plus, Trash2, Clock, Pencil, X, RotateCcw } from "lucide-react";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";

const DAY_OPTIONS = [
  { v: 0, l: "อาทิตย์" },
  { v: 1, l: "จันทร์" },
  { v: 2, l: "อังคาร" },
  { v: 3, l: "พุธ" },
  { v: 4, l: "พฤหัสบดี" },
  { v: 5, l: "ศุกร์" },
  { v: 6, l: "เสาร์" },
];

const STATUS_OPTIONS = [
  { v: "open", l: "เปิดรับสมัคร" },
  { v: "paused", l: "หยุดรับชั่วคราว" },
  { v: "closed", l: "ปิดรับสมัคร" },
];

type JobScheduleInput = {
  day_of_week: string;
  start_time: string;
  end_time: string;
};

export const Route = createFileRoute("/employer/jobs")({
  component: () => <RoleGuard role="employer"><Jobs /></RoleGuard>,
});

function Jobs() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: stores = [] } = useQuery({
    queryKey: ["employer-stores", user?.id],
    enabled: !!user?.id,
    staleTime: 60_000,
    queryFn: async () => {
      const { data } = await supabase.from("stores" as any).select("id,store_name").eq("employer_id", user!.id);
      return data ?? [];
    },
  });

  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ["employer-jobs", user?.id, stores.length],
    enabled: !!user?.id && stores.length > 0,
    staleTime: 30_000,
    queryFn: async () => {
      const storeIds = stores.map((s: any) => s.id);
      const { data: jobsData, error: jobsError } = await supabase
        .from("jobs" as any)
        .select("*")
        .in("store_id", storeIds)
        .order("created_at", { ascending: false });
      if (jobsError) throw jobsError;
      if (!jobsData?.length) return [];
      const jobIds = jobsData.map((j: any) => j.id);
      const { data: schedulesData } = await supabase
        .from("job_schedules" as any)
        .select("id,job_id,day_of_week,start_time,end_time")
        .in("job_id", jobIds);
      const sByJob = new Map<string, any[]>();
      for (const s of (schedulesData ?? []) as any[]) {
        if (!sByJob.has(s.job_id)) sByJob.set(s.job_id, []);
        sByJob.get(s.job_id)!.push(s);
      }
      return (jobsData as any[]).map(j => ({ ...j, _schedules: sByJob.get(j.id) ?? [] }));
    },
  });

  const [editingJobId, setEditingJobId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [store, setStore] = useState("");
  const [rate, setRate] = useState("");
  const [type, setType] = useState("");
  const [vacancies, setVacancies] = useState("1");
  const [status, setStatus] = useState("open");
  const [description, setDescription] = useState("");
  const [schedules, setSchedules] = useState<JobScheduleInput[]>([
    { day_of_week: "1", start_time: "09:00", end_time: "12:00" },
  ]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const isEditing = editingJobId !== null;

  const resetForm = () => {
    setEditingJobId(null);
    setTitle("");
    setStore("");
    setRate("");
    setType("");
    setVacancies("1");
    setStatus("open");
    setDescription("");
    setSchedules([{ day_of_week: "1", start_time: "09:00", end_time: "12:00" }]);
    setError("");
  };

  const addSchedule = () => {
    setSchedules(prev => [...prev, { day_of_week: "1", start_time: "09:00", end_time: "12:00" }]);
  };

  const removeSchedule = (idx: number) => {
    setSchedules(prev => prev.filter((_, i) => i !== idx));
  };

  const updateSchedule = (idx: number, field: keyof JobScheduleInput, value: string) => {
    setSchedules(prev => prev.map((s, i) => i === idx ? { ...s, [field]: value } : s));
  };

  const startEdit = (job: any) => {
    setEditingJobId(job.id);
    setTitle(job.title ?? "");
    setStore(job.store_id ?? "");
    setRate(String(job.hourly_rate ?? ""));
    setType(job.job_type ?? "");
    setVacancies(String(job.vacancies ?? 1));
    setStatus(job.status ?? "open");
    setDescription(job.description ?? "");
    const loaded: JobScheduleInput[] = ((job._schedules ?? []) as any[]).map(s => ({
      day_of_week: String(s.day_of_week),
      start_time: String(s.start_time ?? "").slice(0, 5),
      end_time: String(s.end_time ?? "").slice(0, 5),
    }));
    setSchedules(loaded.length ? loaded : [{ day_of_week: "1", start_time: "09:00", end_time: "12:00" }]);
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cancelEdit = () => {
    resetForm();
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!store || !title.trim() || Number(rate) <= 0) {
      setError("เลือกร้าน กรอกชื่องาน และค่าแรงที่มากกว่า 0");
      return;
    }
    const vacNum = Number(vacancies);
    if (!Number.isFinite(vacNum) || vacNum < 1) {
      setError("จำนวนที่รับสมัครต้องมากกว่า 0");
      return;
    }
    const validSchedules = schedules.filter(s => {
      if (!s.day_of_week || !s.start_time || !s.end_time) return false;
      return s.start_time < s.end_time;
    });
    if (schedules.length > 0 && validSchedules.length !== schedules.length) {
      setError("มีตารางเวลาที่ไม่ถูกต้อง (เวลาเริ่มต้องน้อยกว่าเวลาจบ)");
      return;
    }

    setSaving(true);
    try {
      if (isEditing) {
        const jobId = editingJobId!;
        const { error: updateError } = await supabase
          .from("jobs" as any)
          .update({
            store_id: store,
            title: title.trim(),
            hourly_rate: Number(rate),
            job_type: type || null,
            vacancies: vacNum,
            status: status || "open",
            description: description || null,
          } as any)
          .eq("id", jobId);
        if (updateError) throw updateError;

        const { error: delError } = await supabase
          .from("job_schedules" as any)
          .delete()
          .eq("job_id", jobId);
        if (delError) throw delError;

        if (validSchedules.length > 0) {
          const { error: schedError } = await supabase
            .from("job_schedules" as any)
            .insert(validSchedules.map(s => ({
              job_id: jobId,
              day_of_week: Number(s.day_of_week),
              start_time: s.start_time,
              end_time: s.end_time,
            })));
          if (schedError) throw schedError;
        }
      } else {
        const { data: insertedJobs, error: jobError } = await supabase
          .from("jobs" as any)
          .insert({
            store_id: store,
            title: title.trim(),
            hourly_rate: Number(rate),
            job_type: type || null,
            vacancies: vacNum,
            description: description || null,
            status: status || "open",
          } as any)
          .select("id");
        if (jobError) throw jobError;

        if (validSchedules.length > 0 && insertedJobs?.[0]) {
          const jobId = insertedJobs[0].id;
          const { error: schedError } = await supabase
            .from("job_schedules" as any)
            .insert(validSchedules.map(s => ({
              job_id: jobId,
              day_of_week: Number(s.day_of_week),
              start_time: s.start_time,
              end_time: s.end_time,
            })));
          if (schedError) throw schedError;
        }
      }

      resetForm();
      await qc.invalidateQueries({ queryKey: ["employer-jobs", user?.id] });
      await qc.invalidateQueries({ queryKey: ["employer-dashboard", user?.id] });
      await qc.invalidateQueries({ queryKey: ["jobs_feed"] });
      await qc.invalidateQueries({ queryKey: ["recommended-jobs"] });
    } catch (err: any) {
      setError("บันทึกงานไม่สำเร็จ: " + (err?.message ?? ""));
    } finally {
      setSaving(false);
    }
  };

  const statusBadge = (st: string) => {
    switch (st) {
      case "open": return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400";
      case "paused": return "bg-amber-500/10 text-amber-600 dark:text-amber-400";
      case "closed": return "bg-slate-500/10 text-slate-600 dark:text-slate-400";
      default: return "bg-primary/10 text-primary";
    }
  };

  const statusLabel = (st: string) => {
    return STATUS_OPTIONS.find(o => o.v === st)?.l ?? st;
  };

  const scheduleBadge = (s: any) => {
    const day = DAY_OPTIONS.find(d => d.v === Number(s.day_of_week))?.l ?? "";
    return `${day} ${s.start_time?.slice?.(0, 5) ?? s.start_time}-${s.end_time?.slice?.(0, 5) ?? s.end_time}`;
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-4xl font-bold">จัดการงาน</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {isEditing ? `กำลังแก้ไขงาน #${editingJobId?.slice(0, 8)} — เสร็จแล้วกดบันทึกด้านล่าง` : "สร้างและดูประกาศงานของร้านคุณ"}
          </p>
        </div>
        {isEditing && (
          <button
            type="button"
            onClick={cancelEdit}
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-2 text-sm font-semibold hover:bg-muted"
          >
            <RotateCcw className="h-4 w-4" /> ยกเลิก / สร้างงานใหม่
          </button>
        )}
      </header>

      {stores.length ? (
        <form onSubmit={save} className={`grid gap-3 rounded-xl border bg-card p-5 md:grid-cols-2 ${isEditing ? "border-primary/50 ring-1 ring-primary/20" : "border-border"}`}>
          <div className="md:col-span-2 flex items-center justify-between">
            <h2 className="font-display text-xl font-bold">
              {isEditing ? "แก้ไขประกาศงาน" : "สร้างประกาศงานใหม่"}
            </h2>
            {isEditing && (
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary">
                <Pencil className="h-3 w-3" /> EDIT MODE
              </span>
            )}
          </div>

          <select value={store} onChange={e => setStore(e.target.value)} disabled={saving} className="rounded border border-input bg-background p-2.5 disabled:opacity-60">
            <option value="">เลือกร้าน *</option>
            {stores.map((s: any) => <option key={s.id} value={s.id}>{s.store_name}</option>)}
          </select>
          <input required value={title} onChange={e => setTitle(e.target.value)} disabled={saving} placeholder="ชื่อตำแหน่งงาน *" className="rounded border border-input bg-background p-2.5 disabled:opacity-60" />
          <input required value={rate} onChange={e => setRate(e.target.value)} type="number" min="1" disabled={saving} placeholder="ค่าแรงต่อชั่วโมง (บาท) *" className="rounded border border-input bg-background p-2.5 disabled:opacity-60" />
          <input required value={vacancies} onChange={e => setVacancies(e.target.value)} type="number" min="1" disabled={saving} placeholder="จำนวนที่รับสมัคร (คน) *" className="rounded border border-input bg-background p-2.5 disabled:opacity-60" />
          <input value={type} onChange={e => setType(e.target.value)} disabled={saving} placeholder="ประเภทงาน (เช่น Part-time, เซิร์ฟเวอร์, แคชเชียร์)" className="rounded border border-input bg-background p-2.5 disabled:opacity-60" />
          <select value={status} onChange={e => setStatus(e.target.value)} disabled={saving} className="rounded border border-input bg-background p-2.5 disabled:opacity-60">
            {STATUS_OPTIONS.map(o => <option key={o.v} value={o.v}>{isEditing ? "สถานะ: " : ""}{o.l}</option>)}
          </select>
          <textarea value={description} onChange={e => setDescription(e.target.value)} disabled={saving} placeholder="รายละเอียดงาน" className="min-h-24 rounded border border-input bg-background p-2.5 md:col-span-2 disabled:opacity-60" />

          <div className="md:col-span-2">
            <div className="mb-2 flex items-center justify-between">
              <label className="flex items-center gap-1.5 text-sm font-semibold"><Clock className="h-4 w-4 text-primary" />ตารางเวลาที่เปิดรับ</label>
              <button type="button" onClick={addSchedule} disabled={saving} className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2.5 py-1 text-xs font-semibold hover:bg-muted disabled:opacity-40">
                <Plus className="h-3.5 w-3.5" /> เพิ่มช่วงเวลา
              </button>
            </div>
            <div className="space-y-2">
              {schedules.length === 0 && <p className="text-xs text-muted-foreground">ยังไม่มีช่วงเวลา — กดปุ่มเพิ่มด้านบน</p>}
              {schedules.map((s, idx) => (
                <div key={idx} className="grid gap-2 rounded-lg border border-border bg-background/50 p-2.5 sm:grid-cols-[1fr,1fr,1fr,auto] items-center">
                  <select value={s.day_of_week} onChange={e => updateSchedule(idx, "day_of_week", e.target.value)} disabled={saving} className="rounded border border-input bg-background p-2 text-sm disabled:opacity-60">
                    <option value="">เลือกวัน</option>
                    {DAY_OPTIONS.map(d => <option key={d.v} value={String(d.v)}>{d.l}</option>)}
                  </select>
                  <input type="time" value={s.start_time} onChange={e => updateSchedule(idx, "start_time", e.target.value)} disabled={saving} className="rounded border border-input bg-background p-2 text-sm disabled:opacity-60" />
                  <input type="time" value={s.end_time} onChange={e => updateSchedule(idx, "end_time", e.target.value)} disabled={saving} className="rounded border border-input bg-background p-2 text-sm disabled:opacity-60" />
                  <button type="button" onClick={() => removeSchedule(idx)} disabled={saving || schedules.length <= 1} className="inline-flex items-center justify-center rounded-md border border-border bg-background p-2 text-destructive hover:bg-destructive/10 disabled:opacity-40">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {error && <p className="text-sm text-destructive md:col-span-2">{error}</p>}
          <div className="flex gap-2 md:col-span-2">
            {isEditing && (
              <button type="button" onClick={cancelEdit} disabled={saving} className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-4 py-2.5 text-sm font-bold hover:bg-muted disabled:opacity-60">
                <X className="h-4 w-4" /> ยกเลิก
              </button>
            )}
            <button disabled={saving} className="flex-1 rounded bg-primary px-4 py-2.5 font-bold text-primary-foreground disabled:opacity-60">
              {saving ? "กำลังบันทึก…" : isEditing ? "บันทึกการแก้ไข" : "เผยแพร่งาน"}
            </button>
          </div>
        </form>
      ) : (
        <div className="rounded-xl border border-dashed border-border p-10 text-center text-muted-foreground">กรุณาเพิ่มร้านก่อนสร้างงาน</div>
      )}

      {isLoading ? (
        <p>กำลังโหลด…</p>
      ) : jobs.length ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <h2 className="font-display text-xl font-bold">งานที่ลงไว้แล้ว ({jobs.length})</h2>
            <p className="text-xs text-muted-foreground">กดไอคอน ✏️ เพื่อแก้ไขรายการ</p>
          </div>
          {jobs.map((j: any) => (
            <div key={j.id} className={`rounded-xl border bg-card p-4 transition ${editingJobId === j.id ? "border-primary/70 ring-2 ring-primary/20" : "border-border hover:border-primary/30"}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <b className="font-display text-lg">{j.title}</b>
                    {j.vacancies && <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground">รับ {j.vacancies} คน</span>}
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${statusBadge(j.status)}`}>{statusLabel(j.status)}</span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">฿{j.hourly_rate}/ชั่วโมง · {j.job_type || "ไม่ระบุประเภท"}</p>
                  {j.description && <p className="mt-1.5 line-clamp-2 text-xs text-muted-foreground">{j.description}</p>}
                  {j._schedules?.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {j._schedules.map((s: any, i: number) => (
                        <span key={i} className="rounded-md bg-primary/10 px-1.5 py-0.5 text-[11px] font-bold text-primary">{scheduleBadge(s)}</span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-1.5">
                  <button
                    type="button"
                    onClick={() => startEdit(j)}
                    title="แก้ไขงานนี้"
                    className={`inline-flex h-9 w-9 items-center justify-center rounded-md border transition ${editingJobId === j.id ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background text-primary hover:bg-primary/10"}`}
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : stores.length ? (
        <div className="rounded-xl border border-dashed border-border p-10 text-center text-muted-foreground">
          <BriefcaseBusiness className="mx-auto mb-2 h-8 w-8" />ยังไม่มีประกาศงาน
        </div>
      ) : null}
    </div>
  );
}
