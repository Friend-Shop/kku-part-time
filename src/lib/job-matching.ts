import { schedulesOverlap, timeToMinutes } from "@/lib/ics-parser";

function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const radiusKm = 6371;
  const dLat = (b.lat - a.lat) * Math.PI / 180;
  const dLng = (b.lng - a.lng) * Math.PI / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * Math.PI / 180) * Math.cos(b.lat * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * radiusKm * Math.asin(Math.sqrt(h));
}

export type WeeklySlot = { day_of_week: number; start_time: string; end_time: string };

export interface StudentMatchProfile {
  skills?: string[] | null;
  preferred_job_types?: string[] | null;
  preferred_work_days?: number[] | null;
  min_hourly_rate?: number | null;
  latitude?: number | null;
  longitude?: number | null;
}

export interface JobMatchInput {
  required_skills?: string[] | null;
  job_type?: string | null;
  hourly_rate?: number | null;
  latitude?: number | null;
  longitude?: number | null;
  schedules: WeeklySlot[];
}

export interface JobMatchResult {
  match_score: number;
  schedule_score: number;
  skill_score: number;
  preference_score: number;
  rate_score: number;
  distance_score: number;
  availability_score: number;
  distance_km: number | null;
  reasons: string[];
  considerations: string[];
}

const normalise = (value: string) => value.trim().toLocaleLowerCase();
const clamp = (value: number) => Math.max(0, Math.min(100, value));

function skillScore(student: string[], required: string[], reasons: string[]): number {
  if (!required.length) {
    reasons.push("งานนี้ไม่ได้กำหนดทักษะบังคับ");
    return 50;
  }
  if (!student.length) return 0;
  const studentSet = new Set(student.map(normalise));
  const matches = required.filter(skill => studentSet.has(normalise(skill)));
  if (matches.length) reasons.push(`ตรงกับ Skills ${matches.length}/${required.length}`);
  return Math.round((matches.length / required.length) * 100);
}

function distanceScore(profile: StudentMatchProfile, job: JobMatchInput): { score: number; km: number | null } {
  if (profile.latitude == null || profile.longitude == null || job.latitude == null || job.longitude == null) {
    return { score: 50, km: null };
  }
  const km = haversineKm({ lat: profile.latitude, lng: profile.longitude }, { lat: job.latitude, lng: job.longitude });
  if (km < 1) return { score: 100, km };
  if (km < 3) return { score: 80, km };
  if (km < 5) return { score: 60, km };
  if (km < 10) return { score: 40, km };
  return { score: 20, km };
}

/** Calculates a deterministic 0–100 score from live student and job data. */
export function calculateJobMatch(
  profile: StudentMatchProfile,
  classSchedules: WeeklySlot[],
  job: JobMatchInput,
): JobMatchResult {
  const reasons: string[] = [];
  const considerations: string[] = [];
  const jobSlots = job.schedules ?? [];
  const conflicts = jobSlots.filter(jobSlot => classSchedules.some(classSlot =>
    classSlot.day_of_week === jobSlot.day_of_week && schedulesOverlap(classSlot, jobSlot),
  ));
  const schedule_score = conflicts.length ? 0 : 100;
  if (conflicts.length) considerations.push("ตารางงานชนกับตารางเรียนของคุณ");
  else if (jobSlots.length) reasons.push("ไม่ชนตารางเรียน");
  else reasons.push("งานนี้ยังไม่ระบุตารางงาน");

  // Free-time coverage assumes the student is available between 08:00–22:00,
  // except for class periods. It measures the exact share of job time uncovered.
  let availableMinutes = 0;
  let requestedMinutes = 0;
  for (const jobSlot of jobSlots) {
    const start = Math.max(timeToMinutes(jobSlot.start_time), 8 * 60);
    const end = Math.min(timeToMinutes(jobSlot.end_time), 22 * 60);
    if (end <= start) continue;
    requestedMinutes += end - start;
    const overlaps = classSchedules.filter(c => c.day_of_week === jobSlot.day_of_week);
    let blocked = 0;
    for (const c of overlaps) {
      blocked += Math.max(0, Math.min(end, timeToMinutes(c.end_time)) - Math.max(start, timeToMinutes(c.start_time)));
    }
    availableMinutes += Math.max(0, end - start - blocked);
  }
  const availability_score = requestedMinutes ? Math.round((availableMinutes / requestedMinutes) * 100) : 50;
  if (jobSlots.length && !conflicts) reasons.push(`เวลาว่างของคุณตรงกับงานนี้ ${availability_score}%`);

  const skill_score = skillScore(profile.skills ?? [], job.required_skills ?? [], reasons);
  if (job.required_skills?.length && skill_score === 0) considerations.push("ยังไม่มี Skills ที่ตรงกับงานนี้");

  const types = (profile.preferred_job_types ?? []).map(normalise);
  const days = profile.preferred_work_days ?? [];
  const typeScore = types.length ? (job.job_type && types.includes(normalise(job.job_type)) ? 100 : 0) : 50;
  const jobDays = [...new Set(jobSlots.map(s => s.day_of_week))];
  const dayScore = days.length && jobDays.length ? Math.round(jobDays.filter(d => days.includes(d)).length / jobDays.length * 100) : 50;
  const preference_score = Math.round((typeScore + dayScore) / 2);
  if (types.length && typeScore === 100) reasons.push("ตรงกับประเภทงานที่คุณสนใจ");
  if (days.length && dayScore === 100) reasons.push("ตรงกับวันที่สะดวก");

  const minimum = profile.min_hourly_rate;
  const wage = job.hourly_rate ?? 0;
  const rate_score = minimum && minimum > 0 ? clamp(Math.round((wage / minimum) * 100)) : 50;
  if (minimum && wage >= minimum) reasons.push("ค่าแรงสูงกว่าที่คุณต้องการ");
  if (minimum && wage < minimum) considerations.push("ค่าแรงต่ำกว่าที่คุณตั้งไว้");

  const distance = distanceScore(profile, job);
  if (distance.km != null) reasons.push(`อยู่ห่างจากคุณ ${distance.km.toFixed(1)} km`);

  const match_score = Math.round(
    schedule_score * .4 + skill_score * .2 + preference_score * .15 +
    rate_score * .1 + distance.score * .1 + availability_score * .05,
  );
  return {
    match_score: clamp(match_score), schedule_score, skill_score, preference_score,
    rate_score, distance_score: distance.score, availability_score, distance_km: distance.km,
    reasons, considerations,
  };
}

export function matchBand(score: number): string {
  if (score >= 90) return "Excellent Match";
  if (score >= 75) return "Good Match";
  if (score >= 60) return "Fair Match";
  return "Low Match";
}
