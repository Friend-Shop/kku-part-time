import { createFileRoute } from "@tanstack/react-router";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  CalendarDays, Briefcase, Star, FileText, ChevronRight,
  Clock, MapPin, BadgeDollarSign, UserRound, GraduationCap
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { checkScheduleConflicts, dayThShort } from "@/lib/ics-parser";
import { JobScheduleConflict } from "@/components/schedule/JobScheduleConflict";
import { getStudentClassSchedules, normalizeScheduleTime } from "@/lib/class-schedules";
import { toast } from "sonner";

export const Route = createFileRoute("/student/job/$id")({
  component: () => (
    <RoleGuard role="student" as any>
      <JobDetailPage />
    </RoleGuard>
  ),
});

interface JobRow {
  id: string;
  store_id: string | null;
  title: string;
  description: string | null;
  job_type: string | null;
  hourly_rate: number;
  vacancies?: number | null;
  status: string | null;
  created_at: string;
}

function JobDetailPage() {
  const { user } = useAuth();
  const studentId = user!.id;
  const { id } = Route.useParams();
  const [applying, setApplying] = useState(false);

  const { data: schedules = [], isLoading: sLoading } = useQuery({
    queryKey: ["class_schedules", studentId],
    queryFn: () => getStudentClassSchedules(studentId),
    enabled: !!studentId,
  });

  const { data: job, isLoading: jLoading } = useQuery({
    queryKey: ["job", id],
    queryFn: async () => {
      const { data: jobRow, error: jErr } = await supabase
        .from("jobs" as any)
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (jErr) throw jErr;
      if (!jobRow) return null;
      const { data: jobSchedules } = await supabase
        .from("job_schedules" as any)
        .select("day_of_week, start_time, end_time")
        .eq("job_id", id);
      const { data: employer } = (jobRow as JobRow).store_id
        ? await supabase.from("stores" as any).select("store_name, phone, address").eq("id", (jobRow as JobRow).store_id).maybeSingle()
        : { data: null };
      return {
        job: jobRow as JobRow,
        schedules: ((jobSchedules || []) as any[]).map(s => ({
          ...s,
          start_time: normalizeScheduleTime(s.start_time),
          end_time: normalizeScheduleTime(s.end_time),
        })),
        employer: employer as any,
      };
    },
    enabled: !!id,
  });

  const conflict = checkScheduleConflicts(
    schedules.map(s => ({
      day_of_week: s.day_of_week, start_time: s.start_time, end_time: s.end_time,
      course_name: s.course_name, course_code: s.course_code, room: s.room,
    })),
    job?.schedules?.map(s => ({
      day_of_week: s.day_of_week, start_time: s.start_time, end_time: s.end_time,
    })) || [],
  );

  if (jLoading || sLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-muted-foreground">กำลังโหลด…</div>
      </div>
    );
  }

  if (!job?.job) {
    return (
      <div className="mx-auto max-w-3xl">
        <div className="rounded-xl border border-border bg-card p-10 text-center">
          <Briefcase className="mx-auto mb-3 h-12 w-12 opacity-30" />
          <h2 className="font-display text-xl font-bold">ไม่พบรายการงาน</h2>
          <Link to="/student/dashboard" className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
            กลับหน้าหลัก <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    );
  }

  const j = job.job;
  const js = job.schedules || [];
  const emp = job.employer;

  const applyForJob = async () => {
    setApplying(true);
    const { error } = await supabase.from("applications" as any).insert({ job_id: j.id, student_id: studentId, status: "pending" });
    setApplying(false);
    if (error) {
      toast.error(error.code === "23505" ? "คุณสมัครงานนี้แล้ว" : "ไม่สามารถสมัครงานได้ กรุณาลองใหม่");
      return;
    }
    toast.success("ส่งใบสมัครเรียบร้อยแล้ว");
  };

  const totalHoursPerWeek = js.reduce((acc, s) => {
    const sh = parseInt(s.start_time.split(":")[0], 10) * 60 + parseInt(s.start_time.split(":")[1], 10);
    const eh = parseInt(s.end_time.split(":")[0], 10) * 60 + parseInt(s.end_time.split(":")[1], 10);
    return acc + (eh - sh);
  }, 0) / 60;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link to="/student/dashboard" className="text-xs font-semibold text-muted-foreground hover:text-primary">
            ← ค้นหางาน
          </Link>
          <h1 className="font-display text-4xl font-bold mt-2">{j.title}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <div className="inline-flex items-center gap-1">
              <UserRound className="h-4 w-4" />
              <span>{emp?.store_name || "ร้านค้า"}</span>
            </div>
            {j.job_type && (
              <>
                <span className="opacity-40">·</span>
                <span className="rounded-full border border-border px-2 py-0.5 text-xs font-medium capitalize">
                  {j.job_type}
                </span>
              </>
            )}
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card px-4 py-3 text-right">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">อัตราค่าจ้าง</div>
          <div className="font-display text-2xl font-bold text-primary flex items-center justify-end gap-1">
            <BadgeDollarSign className="h-5 w-5" />
            {j.hourly_rate}
            <span className="text-sm font-medium text-muted-foreground">/ ชั่วโมง</span>
          </div>
          {totalHoursPerWeek > 0 && (
            <div className="text-xs text-muted-foreground">
              ≈ ฿{(totalHoursPerWeek * j.hourly_rate).toLocaleString()}/สัปดาห์ ({totalHoursPerWeek.toFixed(1)} ชม.)
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <JobScheduleConflict conflict={conflict} />

          <section className="rounded-xl border border-border bg-card p-5">
            <h2 className="font-display text-xl font-bold flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              เวลาทำงาน
              <span className="ml-auto text-xs font-medium text-muted-foreground">
                {js.length} วัน / สัปดาห์
              </span>
            </h2>
            {js.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">ไม่ระบุเวลาทำงาน</p>
            ) : (
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {js
                  .sort((a, b) => (a.day_of_week - b.day_of_week) || a.start_time.localeCompare(b.start_time))
                  .map((s, i) => (
                    <div key={i} className="flex items-center gap-3 rounded-lg border border-border bg-background p-3">
                      <div className="flex h-10 w-10 flex-col items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <div className="text-[10px] font-black leading-none">{dayThShort(s.day_of_week)}</div>
                      </div>
                      <div>
                        <div className="font-bold">{s.start_time} – {s.end_time}</div>
                        <div className="text-xs text-muted-foreground">
                          {(() => {
                            const sh = parseInt(s.start_time.split(":")[0], 10) * 60 + parseInt(s.start_time.split(":")[1], 10);
                            const eh = parseInt(s.end_time.split(":")[0], 10) * 60 + parseInt(s.end_time.split(":")[1], 10);
                            const hrs = (eh - sh) / 60;
                            return `≈ ${hrs.toFixed(1)} ชั่วโมง · ฿${(hrs * j.hourly_rate).toFixed(0)}`;
                          })()}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </section>

          {j.description && (
            <section className="rounded-xl border border-border bg-card p-5">
              <h2 className="font-display text-xl font-bold">รายละเอียดงาน</h2>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                {j.description}
              </p>
            </section>
          )}

          {j.requirements && (
            <section className="rounded-xl border border-border bg-card p-5">
              <h2 className="font-display text-xl font-bold">คุณวุฒิ / ข้อกำหนด</h2>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                {j.requirements}
              </p>
            </section>
          )}

          {j.benefits && (
            <section className="rounded-xl border border-border bg-card p-5">
              <h2 className="font-display text-xl font-bold">สวัสดิการ</h2>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                {j.benefits}
              </p>
            </section>
          )}
        </div>

        <div className="space-y-5">
          <section className="sticky top-4 rounded-xl border border-border bg-card p-5 space-y-4">
            <div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">ข้อมูลร้าน</div>
              <div className="mt-2 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <MapPin className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold truncate">{emp?.store_name || "ร้านค้า"}</div>
                  {emp?.phone && (
                    <div className="text-xs text-muted-foreground">📞 {emp.phone}</div>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              {j.vacancies !== null && j.vacancies !== undefined && (
                <div className="rounded-lg bg-muted/40 p-2.5">
                  <div className="text-muted-foreground">อัตรา</div>
                  <div className="mt-0.5 font-display text-lg font-bold">{j.vacancies} คน</div>
                </div>
              )}
              {totalHoursPerWeek > 0 && (
                <div className="rounded-lg bg-muted/40 p-2.5">
                  <div className="text-muted-foreground">ชั่วโมง/สัปดาห์</div>
                  <div className="mt-0.5 font-display text-lg font-bold">{totalHoursPerWeek.toFixed(1)}</div>
                </div>
              )}
            </div>

            <button onClick={applyForJob} disabled={applying} className="w-full rounded-md bg-primary py-3 font-display font-bold text-primary-foreground transition hover:opacity-90 disabled:opacity-60">
              <span className="inline-flex items-center gap-1.5">
                <FileText className="h-4 w-4" />
                {applying ? "กำลังส่งใบสมัคร…" : "สมัครงานนี้"}
              </span>
            </button>
            <button className="w-full rounded-md border border-border bg-card py-2.5 text-sm font-semibold transition hover:bg-muted">
              💾 บันทึกเพื่อดูภายหลัง
            </button>

            {conflict.hasConflict ? (
              <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-300">
                <div className="font-bold flex items-center gap-1.5">
                  <CalendarDays className="h-3.5 w-3.5" />
                  ข้อควรระวัง
                </div>
                <p className="mt-1">งานนี้มีเวลาทำงานที่ซ้อนกับตารางเรียนของคุณ — โปรดพิจารณาอย่างรอบคอบก่อนสมัคร</p>
              </div>
            ) : (
              <div className="rounded-lg border border-emerald-300 bg-emerald-50 p-3 text-xs text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300">
                <div className="font-bold flex items-center gap-1.5">
                  <GraduationCap className="h-3.5 w-3.5" />
                  เวลาเรียนปลอดภัย
                </div>
                <p className="mt-1">เวลาทำงานของงานนี้ไม่ซ้อนกับตารางเรียนของคุณ — สมัครได้เลย!</p>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
