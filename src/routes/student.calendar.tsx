import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { BriefcaseBusiness, GraduationCap } from "lucide-react";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { dayThShort } from "@/lib/ics-parser";
import { getStudentProfileId, normalizeScheduleTime } from "@/lib/class-schedules";

export const Route = createFileRoute("/student/calendar")({ component: () => <RoleGuard role="student"><StudentCalendar /></RoleGuard> });
function StudentCalendar() {
  const { user } = useAuth();
  const { data = [], isLoading } = useQuery({ queryKey: ["combined-calendar", user?.id], enabled: !!user?.id, queryFn: async () => {
    const profileId = await getStudentProfileId(user!.id);
    const [{ data: classes }, { data: work }] = await Promise.all([
      supabase.from("class_schedules" as any).select("id,course_name,course_code,room,day_of_week,start_time,end_time").eq("student_id", profileId),
      supabase.from("work_schedules" as any).select("id,job_id,work_date,start_time,end_time,status,total_wage,hours_worked").eq("student_id", user!.id).in("status", ["scheduled", "confirmed", "active"]),
    ]);
    const workRows = (work ?? []) as any[]; const ids = [...new Set(workRows.map(x => x.job_id))];
    const { data: jobs } = ids.length ? await supabase.from("jobs" as any).select("id,title,hourly_rate").in("id", ids) : { data: [] };
    const jobMap = new Map(((jobs ?? []) as any[]).map(x => [x.id, x]));
    return [...((classes ?? []) as any[]).map(x => ({ ...x, kind: "class", day: x.day_of_week, title: x.course_name, detail: `${x.course_code ? `${x.course_code} · ` : ""}${x.room || ""}` })), ...workRows.map(x => { const job = jobMap.get(x.job_id); const earned = x.total_wage ?? (x.hours_worked != null && job?.hourly_rate != null ? x.hours_worked * job.hourly_rate : null); return { ...x, kind: "work", day: new Date(`${x.work_date}T12:00:00`).getDay(), title: job?.title || "งาน", detail: earned != null ? `รายได้ ฿${earned}` : "ตารางงาน" }; })].map(x => ({ ...x, start_time: normalizeScheduleTime(x.start_time), end_time: normalizeScheduleTime(x.end_time) }));
  }});
  const days = [1,2,3,4,5,6,0];
  return <div className="mx-auto max-w-6xl space-y-6"><header><h1 className="font-display text-4xl font-bold">ตารางเรียนและงาน</h1><p className="mt-1 text-sm text-muted-foreground">รวมเฉพาะตารางงานที่ได้รับการยืนยันแล้ว</p></header>{isLoading ? <p>กำลังโหลด…</p> : <div className="grid gap-3 md:grid-cols-7">{days.map(day => <section key={day} className="min-h-52 rounded-xl border border-border bg-card p-3"><h2 className="border-b border-border pb-2 font-display font-bold">{dayThShort(day)}</h2><div className="mt-3 space-y-2">{data.filter(x => x.day === day).sort((a,b) => a.start_time.localeCompare(b.start_time)).map(x => <div key={`${x.kind}-${x.id}`} className={`rounded-lg p-2 text-xs ${x.kind === "class" ? "bg-sky-100 text-sky-900 dark:bg-sky-950/40 dark:text-sky-200" : "bg-primary/15"}`}><div className="flex items-center gap-1 font-bold">{x.kind === "class" ? <GraduationCap className="h-3.5 w-3.5" /> : <BriefcaseBusiness className="h-3.5 w-3.5" />}{x.start_time}–{x.end_time}</div><div className="mt-1 font-semibold">{x.title}</div><div className="mt-0.5 opacity-70">{x.detail}</div></div>)}{!data.some(x => x.day === day) && <p className="pt-4 text-center text-xs text-muted-foreground">ว่าง</p>}</div></section>)}</div>}</div>;
}
