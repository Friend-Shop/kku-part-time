import { supabase } from "@/integrations/supabase/client";
import type { ParsedClassSchedule } from "@/lib/ics-parser";

export interface ClassScheduleRow {
  id: string;
  student_id: string;
  course_code: string | null;
  course_name: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  room: string | null;
  created_at: string;
  updated_at: string;
}

export interface ClassScheduleInsert {
  student_id: string;
  course_code?: string | null;
  course_name: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  room?: string | null;
}

export type ImportMode = "replace" | "merge";

export interface SaveResult {
  success: boolean;
  inserted: number;
  skipped: number;
  errors: string[];
  warnings: string[];
}

/** PostgreSQL `time` values may arrive as HH:mm:ss; UI logic uses HH:mm. */
export function normalizeScheduleTime(value: string): string {
  return value.slice(0, 5);
}

const _profileIdCache = new Map<string, string>();

export async function getStudentProfileId(userId: string): Promise<string> {
  if (_profileIdCache.has(userId)) return _profileIdCache.get(userId)!;
  const { data, error } = await supabase
    .from("student_profiles" as any)
    .select("id")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  const id = data?.id ?? userId;
  _profileIdCache.set(userId, id);
  return id as string;
}

function mkDedupKey(s: { day_of_week: number; start_time: string; end_time: string; course_name: string; room: string | null; course_code: string | null }): string {
  return `${s.day_of_week}|${s.start_time}|${s.end_time}|${(s.course_code || "").toUpperCase()}|${s.course_name.trim()}|${(s.room || "").trim()}`;
}

function validDay(d: number): boolean {
  return Number.isInteger(d) && d >= 0 && d <= 6;
}

function validTimeStr(t: string): boolean {
  return typeof t === "string" && /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(t);
}

export async function getStudentClassSchedules(userId: string): Promise<ClassScheduleRow[]> {
  const { data, error } = await supabase
    .from("class_schedules" as any)
    .select("*")
    .eq("student_id", userId)
    .order("day_of_week", { ascending: true })
    .order("start_time", { ascending: true });
  if (error) throw error;
  return ((data as ClassScheduleRow[]) || []).map(s => ({
    ...s,
    start_time: normalizeScheduleTime(s.start_time),
    end_time: normalizeScheduleTime(s.end_time),
  }));
}

export async function saveClassSchedules(
  userId: string,
  parsedSchedules: ParsedClassSchedule[],
  mode: ImportMode,
): Promise<SaveResult> {
  const errors: string[] = [];
  const warnings: string[] = [];
  let inserted = 0;
  let skipped = 0;

  const validSchedules: ClassScheduleInsert[] = [];
  for (const s of parsedSchedules) {
    if (!validDay(s.day_of_week)) {
      warnings.push(`รายการ "${s.course_name}" มีวันไม่ถูกต้อง (${s.day_of_week}) — ข้าม`);
      continue;
    }
    if (!validTimeStr(s.start_time) || !validTimeStr(s.end_time)) {
      warnings.push(`รายการ "${s.course_name}" มีรูปแบบเวลาไม่ถูกต้อง — ข้าม`);
      continue;
    }
    const sMin = parseInt(s.start_time.split(":")[0], 10) * 60 + parseInt(s.start_time.split(":")[1], 10);
    const eMin = parseInt(s.end_time.split(":")[0], 10) * 60 + parseInt(s.end_time.split(":")[1], 10);
    if (eMin <= sMin) {
      warnings.push(`รายการ "${s.course_name}" มีเวลาจบน้อยกว่าหรือเท่ากับเวลาเริ่ม — ข้าม`);
      continue;
    }
    if (!s.course_name || !s.course_name.trim()) {
      warnings.push(`พบรายการที่ไม่มีชื่อวิชา — ข้าม`);
      continue;
    }
    validSchedules.push({
      student_id: userId,
      course_code: s.course_code,
      course_name: s.course_name.trim(),
      day_of_week: s.day_of_week,
      start_time: s.start_time,
      end_time: s.end_time,
      room: s.room ? s.room.trim() : null,
    });
  }

  if (validSchedules.length === 0) {
    return { success: false, inserted: 0, skipped: parsedSchedules.length, errors: ["ไม่มีรายการตารางเรียนที่ถูกต้องสำหรับบันทึก"], warnings };
  }

  try {
    const existing = await getStudentClassSchedules(userId);
    const existingKeys = new Set(existing.map(mkDedupKey));
    const toInsert: ClassScheduleInsert[] = [];
    const seenNewKeys = new Set<string>();

    if (mode === "replace") {
      const { error: delError } = await supabase
        .from("class_schedules" as any)
        .delete()
        .eq("student_id", userId);
      if (delError) {
        errors.push(`ไม่สามารถลบตารางเรียนเดิมได้: ${delError.message}`);
        return { success: false, inserted: 0, skipped: validSchedules.length, errors, warnings };
      }
      for (const s of validSchedules) {
        const k = mkDedupKey(s);
        if (seenNewKeys.has(k)) { skipped++; continue; }
        seenNewKeys.add(k);
        toInsert.push(s);
      }
    } else {
      for (const s of validSchedules) {
        const k = mkDedupKey(s);
        if (existingKeys.has(k)) { skipped++; continue; }
        if (seenNewKeys.has(k)) { skipped++; continue; }
        seenNewKeys.add(k);
        toInsert.push(s);
      }
    }

    if (toInsert.length === 0) {
      return { success: true, inserted: 0, skipped, errors, warnings: [...warnings, "ไม่มีรายการใหม่ที่ต้องบันทึก"] };
    }

    const { error: insError } = await supabase
      .from("class_schedules" as any)
      .insert(toInsert as any[]);
    if (insError) {
      errors.push(`ไม่สามารถบันทึกตารางเรียนได้: ${insError.message}`);
      return { success: false, inserted: 0, skipped: validSchedules.length, errors, warnings };
    }
    inserted = toInsert.length;
    return { success: true, inserted, skipped, errors, warnings };
  } catch (e: any) {
    errors.push(`เกิดข้อผิดพลาดระหว่างบันทึก: ${e?.message || "ไม่ทราบสาเหตุ"}`);
    return { success: false, inserted: 0, skipped: validSchedules.length, errors, warnings };
  }
}

export async function addSingleSchedule(s: ClassScheduleInsert): Promise<{ success: boolean; error?: string }> {
  if (!validDay(s.day_of_week)) return { success: false, error: "วันไม่ถูกต้อง" };
  if (!validTimeStr(s.start_time) || !validTimeStr(s.end_time)) return { success: false, error: "รูปแบบเวลาไม่ถูกต้อง" };
  const sMin = parseInt(s.start_time.split(":")[0], 10) * 60 + parseInt(s.start_time.split(":")[1], 10);
  const eMin = parseInt(s.end_time.split(":")[0], 10) * 60 + parseInt(s.end_time.split(":")[1], 10);
  if (eMin <= sMin) return { success: false, error: "เวลาจบต้องมากกว่าเวลาเริ่ม" };
  if (!s.course_name?.trim()) return { success: false, error: "ต้องระบุชื่อวิชา" };

  const existing = await getStudentClassSchedules(s.student_id);
  const duplicate = existing.some(e => mkDedupKey(e) === mkDedupKey(s));
  if (duplicate) return { success: false, error: "มีรายการตารางเรียนนี้อยู่แล้ว" };

  const { error } = await supabase.from("class_schedules" as any).insert([{
    student_id: s.student_id,
    course_code: s.course_code ?? null,
    course_name: s.course_name.trim(),
    day_of_week: s.day_of_week,
    start_time: s.start_time,
    end_time: s.end_time,
    room: s.room ?? null,
  } as any]);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function updateSingleSchedule(id: string, studentId: string, patch: Partial<ClassScheduleInsert>): Promise<{ success: boolean; error?: string }> {
  if (patch.day_of_week !== undefined && !validDay(patch.day_of_week)) return { success: false, error: "วันไม่ถูกต้อง" };
  if (patch.start_time !== undefined && !validTimeStr(patch.start_time)) return { success: false, error: "รูปแบบเวลาเริ่มไม่ถูกต้อง" };
  if (patch.end_time !== undefined && !validTimeStr(patch.end_time)) return { success: false, error: "รูปแบบเวลาจบไม่ถูกต้อง" };
  if (patch.course_name !== undefined && !patch.course_name.trim()) return { success: false, error: "ต้องระบุชื่อวิชา" };
  const existing = await getStudentClassSchedules(studentId);
  const current = existing.find(s => s.id === id);
  if (!current) return { success: false, error: "ไม่พบรายการตารางเรียน" };
  const next = { ...current, ...patch };
  if (next.start_time >= next.end_time) return { success: false, error: "เวลาจบต้องมากกว่าเวลาเริ่ม" };
  if (existing.some(s => s.id !== id && mkDedupKey(s) === mkDedupKey(next))) {
    return { success: false, error: "มีรายการตารางเรียนนี้อยู่แล้ว" };
  }
  const { error } = await supabase
    .from("class_schedules" as any)
    .update(patch as any)
    .eq("id", id)
    .eq("student_id", studentId);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function deleteSingleSchedule(id: string, studentId: string): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from("class_schedules" as any)
    .delete()
    .eq("id", id)
    .eq("student_id", studentId);
  if (error) return { success: false, error: error.message };
  return { success: true };
}
