import { supabase } from "@/integrations/supabase/client";
import { calculateJobMatch, type JobMatchResult, type WeeklySlot } from "@/lib/job-matching";
import { getStudentProfileId, normalizeScheduleTime } from "@/lib/class-schedules";

export type RecommendedJob = {
  job: any;
  store: any | null;
  schedules: WeeklySlot[];
  match: JobMatchResult;
};

export async function getRecommendedJobs(studentId: string, limit = 24): Promise<RecommendedJob[]> {
  const [{ data: student }, { data: profile }, { data: classes }, { data: jobs, error }] = await Promise.all([
    supabase.from("student_profiles" as any).select("skills, preferred_job_types, preferred_work_days, min_hourly_rate").eq("user_id", studentId).maybeSingle(),
    supabase.from("profiles").select("latitude, longitude").eq("id", studentId).maybeSingle(),
    supabase.from("class_schedules" as any).select("day_of_week,start_time,end_time").eq("student_id", studentId),
    supabase.from("jobs" as any).select("id,title,description,job_type,vacancies,hourly_rate,store_id,required_skills,created_at").eq("status", "open").order("created_at", { ascending: false }).limit(limit),
  ]);
  if (error) throw error;
  const jobList = (jobs ?? []) as any[];
  if (!jobList.length) return [];
  const ids = jobList.map(j => j.id);
  const storeIds = [...new Set(jobList.map(j => j.store_id).filter(Boolean))];
  const [{ data: jobSchedules }, { data: stores }] = await Promise.all([
    supabase.from("job_schedules" as any).select("job_id,day_of_week,start_time,end_time").in("job_id", ids),
    storeIds.length ? supabase.from("stores" as any).select("id,store_name,latitude,longitude,address").in("id", storeIds) : Promise.resolve({ data: [] }),
  ]);
  const schedulesByJob = new Map<string, WeeklySlot[]>();
  for (const raw of (jobSchedules ?? []) as any[]) {
    const list = schedulesByJob.get(raw.job_id) ?? [];
    list.push({ ...raw, start_time: normalizeScheduleTime(raw.start_time), end_time: normalizeScheduleTime(raw.end_time) });
    schedulesByJob.set(raw.job_id, list);
  }
  const storesById = new Map(((stores ?? []) as any[]).map(s => [s.id, s]));
  const classSlots = ((classes ?? []) as any[]).map(s => ({ ...s, start_time: normalizeScheduleTime(s.start_time), end_time: normalizeScheduleTime(s.end_time) }));
  const matchProfile = { ...(student ?? {}), latitude: profile?.latitude, longitude: profile?.longitude };
  const recommended = jobList.map(job => {
    const store = job.store_id ? storesById.get(job.store_id) ?? null : null;
    const schedules = schedulesByJob.get(job.id) ?? [];
    return { job, store, schedules, match: calculateJobMatch(matchProfile, classSlots, { ...job, latitude: store?.latitude, longitude: store?.longitude, schedules }) };
  }).sort((a, b) => b.match.match_score - a.match.match_score);

  void supabase.from("job_matches" as any).upsert(recommended.map(r => ({
    student_id: studentId, job_id: r.job.id, match_score: r.match.match_score,
    schedule_score: r.match.schedule_score, skill_score: r.match.skill_score,
    distance_score: r.match.distance_score, preference_score: r.match.preference_score,
    match_reason: { reasons: r.match.reasons, considerations: r.match.considerations },
  })), { onConflict: "student_id,job_id" });
  return recommended;
}
