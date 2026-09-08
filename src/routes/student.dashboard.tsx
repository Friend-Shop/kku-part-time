import { createFileRoute, Link } from "@tanstack/react-router";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import {
  CalendarDays, Briefcase, Search, BadgeDollarSign, Clock,
  MapPin, FileText, GraduationCap, Star, ChevronRight, Filter
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { checkScheduleConflicts, dayThShort } from "@/lib/ics-parser";
import { JobScheduleConflict } from "@/components/schedule/JobScheduleConflict";
import { getRecommendedJobs } from "@/lib/student-matches";
import { RecommendedJobCard } from "@/components/matching/RecommendedJobCard";
import { normalizeScheduleTime } from "@/lib/class-schedules";
import { getStudentClassSchedules } from "@/lib/class-schedules";

export const Route = createFileRoute("/student/dashboard")({
  component: () => (
    <RoleGuard role="student" as any>
      <StudentDashboard />
    </RoleGuard>
  ),
});

function StudentDashboard() {
  const { user } = useAuth();
  const studentId = user!.id;

  const { data: schedules = [] } = useQuery({
    queryKey: ["class_schedules", studentId],
    queryFn: () => getStudentClassSchedules(studentId),
    enabled: !!studentId,
    staleTime: 60_000,
  });

  const { data: profile } = useQuery({
    queryKey: ["profile", studentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles" as any)
        .select("full_name, avatar_url, email, id")
        .eq("id", studentId)
        .maybeSingle();
      if (error) throw error;
      return data as any;
    },
    enabled: !!studentId,
    staleTime: 5 * 60_000,
  });

  const { data: recommendedJobs = [], isLoading: recommendationsLoading } = useQuery({
    queryKey: ["recommended-jobs", studentId],
    queryFn: () => getRecommendedJobs(studentId, 12),
    enabled: !!studentId,
    staleTime: 2 * 60_000,
  });

  const { data: jobsWithMeta = [], isLoading } = useQuery({
    queryKey: ["jobs_feed", studentId],
    queryFn: async () => {
      const { data: jobs, error } = await supabase
        .from("jobs" as any)
        .select("id,title,description,job_type,vacancies,hourly_rate,store_id,status,created_at")
        .eq("status", "open")
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      if (!jobs || jobs.length === 0) return [];
      const jobIds = (jobs as any[]).map(j => j.id);
      const storeIds = [...new Set((jobs as any[]).map(j => j.store_id).filter(Boolean))];
      const [{ data: schedulesByJob }, { data: stores }] = await Promise.all([
        supabase.from("job_schedules" as any).select("job_id, day_of_week, start_time, end_time").in("job_id", jobIds),
        storeIds.length ? supabase.from("stores" as any).select("id, store_name").in("id", storeIds) : Promise.resolve({ data: [] }),
      ]);
      const sMap = new Map<string, any[]>();
      for (const rawSchedule of (schedulesByJob || []) as any[]) {
        const s = {
          ...rawSchedule,
          start_time: normalizeScheduleTime(rawSchedule.start_time),
          end_time: normalizeScheduleTime(rawSchedule.end_time),
        };
        if (!sMap.has(s.job_id)) sMap.set(s.job_id, []);
        sMap.get(s.job_id)!.push(s);
      }
      const storeMap = new Map<string, any>();
      for (const store of (stores || []) as any[]) {
        storeMap.set(store.id, store);
      }
      return (jobs as any[]).map(j => ({
        job: j,
        schedules: sMap.get(j.id) || [],
        employer: storeMap.get(j.store_id) ? { company_name: storeMap.get(j.store_id).store_name } : null,
      }));
    },
    staleTime: 30_000,
  });

  const stats = useMemo(() => {
    let weeklyHrs = 0;
    const uniqueCourses = new Set<string>();
    for (const s of schedules) {
      const sh = parseInt(s.start_time.split(":")[0], 10) * 60 + parseInt(s.start_time.split(":")[1], 10);
      const eh = parseInt(s.end_time.split(":")[0], 10) * 60 + parseInt(s.end_time.split(":")[1], 10);
      weeklyHrs += (eh - sh);
      uniqueCourses.add(`${s.course_code || ""}${s.course_name}`);
    }
    return {
      courses: uniqueCourses.size,
      studyHrs: Math.round((weeklyHrs / 60) * 10) / 10,
      jobCount: jobsWithMeta.length,
    };
  }, [schedules, jobsWithMeta]);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <header className="rounded-2xl border border-border bg-gradient-to-br from-card via-primary/5 to-card p-6 md:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-2.5 py-1 text-xs font-semibold text-muted-foreground">
              <GraduationCap className="h-3.5 w-3.5 text-primary" />
              KKU Student Dashboard
            </div>
            <h1 className="mt-3 font-display text-4xl font-bold tracking-tight">
              สวัสดี, {profile?.full_name?.split(" ")[0] || "เพื่อน"} 👋
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {schedules.length === 0
                ? "ยังไม่มีตารางเรียน — นำเข้า .ics เพื่อเปรียบเทียบเวลางาน Part-Time ได้ทันที"
                : `มี ${schedules.length} รายการตารางเรียน · พร้อมค้นหางาน Part-Time ที่ไม่ชนเรียนแล้ว`}
            </p>
          </div>
          <Link
            to="/student/schedule"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-3 font-display font-bold text-primary-foreground transition hover:opacity-90"
          >
            <CalendarDays className="h-4 w-4" />
            จัดการตารางเรียน
          </Link>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-4">
          {[
            { label: "รายการตารางเรียน", val: schedules.length, icon: CalendarDays, tone: "bg-primary text-primary-foreground" },
            { label: "วิชาทั้งหมด", val: stats.courses, icon: FileText, tone: "bg-sky-500 text-white" },
            { label: "ชั่วโมงเรียน/สัปดาห์", val: `${stats.studyHrs} ชม.`, icon: Clock, tone: "bg-violet-500 text-white" },
            { label: "งานที่เปิดรับสมัคร", val: stats.jobCount, icon: Briefcase, tone: "bg-emerald-500 text-white" },
          ].map((c, i) => (
            <div key={i} className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${c.tone}`}>
                  <c.icon className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{c.label}</div>
                  <div className="font-display text-2xl font-bold leading-tight">{c.val}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </header>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <div><h2 className="font-display text-2xl font-bold">งานที่เหมาะกับคุณ</h2><p className="text-sm text-muted-foreground">เรียงจาก Match Score สูงสุด</p></div>
          <Link to="/student/recommended" className="text-xs font-semibold text-primary hover:underline">ดูทั้งหมด</Link>
        </div>
        {recommendationsLoading ? <div className="h-48 animate-pulse rounded-xl bg-muted" /> : recommendedJobs.length ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{recommendedJobs.slice(0, 5).map(item => <RecommendedJobCard key={item.job.id} item={item} />)}</div> : <div className="rounded-xl border border-dashed border-border p-7 text-center text-sm text-muted-foreground">ยังไม่มีงานที่ตรงกับคุณ — เพิ่ม Skills และตารางเรียนเพื่อให้คำแนะนำแม่นยำขึ้น</div>}
      </section>

      <section className="rounded-xl border border-border bg-card p-4 md:p-5">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              placeholder="ค้นหางาน Part-Time, ร้านค้า, ประเภทงาน…"
              className="w-full rounded-md border border-input bg-background pl-9 pr-3 py-2.5 text-sm focus:border-primary focus:outline-none"
            />
          </div>
          <button className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-2.5 text-sm font-semibold hover:bg-muted">
            <Filter className="h-4 w-4" />
            กรอง
          </button>
          <Link
            to="/student/schedule"
            className="inline-flex items-center gap-1.5 rounded-md bg-muted px-3 py-2.5 text-sm font-bold hover:bg-muted/70"
          >
            <CalendarDays className="h-4 w-4" />
            นำเข้า .ics
          </Link>
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-2xl font-bold">งานแนะนำสำหรับคุณ</h2>
          <Link to="/student/schedule" className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1">
            ดูทั้งหมด <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-56 rounded-xl border border-border bg-card animate-pulse" />
            ))}
          </div>
        ) : jobsWithMeta.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center">
            <Briefcase className="mx-auto mb-3 h-12 w-12 opacity-30" />
            <h3 className="font-display text-xl font-bold">ยังไม่มีรายการงาน</h3>
            <p className="mt-1 text-sm text-muted-foreground">รายการงานจะถูกเพิ่มโดยผู้ว่าจ้างในระบบ</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {jobsWithMeta.map(({ job, schedules: js, employer }) => {
              const conflict = checkScheduleConflicts(
                schedules.map(s => ({
                  day_of_week: s.day_of_week, start_time: s.start_time, end_time: s.end_time,
                  course_name: s.course_name, course_code: s.course_code, room: s.room,
                })),
                js.map((s: any) => ({
                  day_of_week: s.day_of_week, start_time: s.start_time, end_time: s.end_time,
                })),
              );
              const hrsPerWeek = js.reduce((acc: number, s: any) => {
                const sh = parseInt(s.start_time.split(":")[0], 10) * 60 + parseInt(s.start_time.split(":")[1], 10);
                const eh = parseInt(s.end_time.split(":")[0], 10) * 60 + parseInt(s.end_time.split(":")[1], 10);
                return acc + (eh - sh);
              }, 0) / 60;
              return (
                <Link
                  key={job.id}
                  to="/student/job/$id"
                  params={{ id: job.id }}
                  className="group flex flex-col rounded-xl border border-border bg-card p-5 text-left transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
                >
                  <div className="mb-2">
                    <JobScheduleConflict conflict={conflict} compact />
                  </div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-display text-lg font-bold leading-tight group-hover:text-primary">
                        {job.title}
                      </h3>
                      <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                        {employer?.company_name || "ร้านค้า"}
                        {employer?.is_verified && (
                          <span className="rounded bg-sky-100 px-1 text-[10px] font-bold text-sky-700 dark:bg-sky-950/40 dark:text-sky-400">
                            ✓
                          </span>
                        )}
                        {employer?.rating && (
                          <span className="inline-flex items-center gap-0.5 font-semibold text-amber-600">
                            <Star className="h-3 w-3 fill-current" />
                            {Number(employer.rating).toFixed(1)}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="font-display text-xl font-bold text-primary inline-flex items-center gap-0.5">
                        <BadgeDollarSign className="h-4 w-4" />
                        {job.hourly_rate}
                      </div>
                      <div className="text-[10px] text-muted-foreground">ต่อชั่วโมง</div>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {js.slice(0, 3).map((s: any, i: number) => (
                      <span key={i} className="inline-flex items-center gap-1 rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
                        <span className="rounded bg-primary/10 px-1 font-black text-primary">{dayThShort(s.day_of_week)}</span>
                        {s.start_time}
                      </span>
                    ))}
                    {js.length > 3 && (
                      <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
                        +{js.length - 3}
                      </span>
                    )}
                    {hrsPerWeek > 0 && (
                      <span className="ml-auto inline-flex items-center gap-1 rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400">
                        <Clock className="h-3 w-3" />
                        {hrsPerWeek.toFixed(1)} ชม./สัปดาห์
                      </span>
                    )}
                  </div>

                  {job.description && (
                    <p className="mt-3 line-clamp-2 text-xs text-muted-foreground">
                      {job.description}
                    </p>
                  )}

                  {job.job_type && (
                    <div className="mt-3 pt-3 border-t border-border flex items-center text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3 mr-1" />
                      <span className="capitalize">{job.job_type}</span>
                      {job.vacancies && (
                        <>
                          <span className="mx-1.5 opacity-40">·</span>
                          <span>รับ {job.vacancies} คน</span>
                        </>
                      )}
                      <ChevronRight className="ml-auto h-3.5 w-3.5 text-primary opacity-0 -translate-x-1 transition group-hover:opacity-100 group-hover:translate-x-0" />
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
