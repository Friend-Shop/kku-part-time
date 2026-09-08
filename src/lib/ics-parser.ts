export interface ParsedClassSchedule {
  course_code: string | null;
  course_name: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  room: string | null;
  original_summary: string;
  raw_start: string;
  raw_end: string;
}

export interface IcsParseResult {
  success: boolean;
  schedules: ParsedClassSchedule[];
  errors: string[];
  warnings: string[];
}

const DAY_MAP: Record<string, number> = {
  SU: 0,
  MO: 1,
  TU: 2,
  WE: 3,
  TH: 4,
  FR: 5,
  SA: 6,
};

const DAY_NAME_MAP: Record<string, number> = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
};

function unfoldIcsLines(raw: string): string[] {
  const normalized = raw.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const lines: string[] = [];
  let buffer = "";
  for (const line of normalized.split("\n")) {
    if (line.startsWith(" ") || line.startsWith("\t")) {
      buffer += line.slice(1);
    } else {
      if (buffer) lines.push(buffer);
      buffer = line;
    }
  }
  if (buffer) lines.push(buffer);
  return lines;
}

function splitIcsLine(line: string): { key: string; params: Record<string, string>; value: string } {
  const colonIdx = line.indexOf(":");
  if (colonIdx === -1) return { key: line.trim(), params: {}, value: "" };
  const keyPart = line.slice(0, colonIdx);
  const value = line.slice(colonIdx + 1);
  const semicolonIdx = keyPart.indexOf(";");
  let key = keyPart;
  const params: Record<string, string> = {};
  if (semicolonIdx !== -1) {
    key = keyPart.slice(0, semicolonIdx);
    const paramStr = keyPart.slice(semicolonIdx + 1);
    for (const p of paramStr.split(";")) {
      const eq = p.indexOf("=");
      if (eq !== -1) {
        params[p.slice(0, eq).toUpperCase()] = p.slice(eq + 1).replace(/^"|"$/g, "");
      }
    }
  }
  return { key: key.trim().toUpperCase(), params, value };
}

function parseIcsDateTime(value: string, params: Record<string, string>): { date: Date; isDateOnly: boolean; tzid: string | null } {
  const tzid = params["TZID"] || null;
  if (value.includes("T")) {
    return { date: parseIcsTimestamp(value, tzid), isDateOnly: false, tzid };
  }
  return { date: parseIcsDateOnly(value), isDateOnly: true, tzid };
}

function parseIcsTimestamp(s: string, tzid: string | null): Date {
  const clean = s.replace(/Z$/, "");
  const year = parseInt(clean.slice(0, 4), 10);
  const month = parseInt(clean.slice(4, 6), 10) - 1;
  const day = parseInt(clean.slice(6, 8), 10);
  const hasTime = clean.length >= 15;
  let hour = 0, minute = 0, second = 0;
  if (hasTime) {
    const t = clean.split("T")[1] || "";
    hour = parseInt(t.slice(0, 2), 10);
    minute = parseInt(t.slice(2, 4), 10);
    second = parseInt(t.slice(4, 6) || "0", 10);
  }
  if (s.endsWith("Z") || tzid === "UTC" || tzid === "Etc/UTC") {
    return new Date(Date.UTC(year, month, day, hour, minute, second));
  }
  // Timetabled classes are wall-clock times.  Do not convert a TZID value to
  // the browser's timezone: that would shift a class such as 09:00 Bangkok.
  return new Date(year, month, day, hour, minute, second);
}

function parseIcsDateOnly(s: string): Date {
  const year = parseInt(s.slice(0, 4), 10);
  const month = parseInt(s.slice(4, 6), 10) - 1;
  const day = parseInt(s.slice(6, 8), 10);
  return new Date(year, month, day, 0, 0, 0);
}

function pad2(n: number): string {
  return n.toString().padStart(2, "0");
}

function formatTime(date: Date): string {
  return `${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
}

function extractCourseCode(summary: string): { course_code: string | null; course_name: string } {
  const trimmed = summary.trim();
  const patterns: RegExp[] = [
    /^([A-Z]{2,}\s*\d{3,})[\s\-–_]+(.+)$/i,
    /^([A-Z]{2,}\d{3,})[\s\-–_]+(.+)$/i,
    /^(\d{6,})[\s\-–_]+(.+)$/,
    /^([A-Z]{2,}-\d{3,})[\s\-–_]+(.+)$/i,
  ];
  for (const rx of patterns) {
    const m = trimmed.match(rx);
    if (m) {
      return {
        course_code: m[1].replace(/\s+/g, "").toUpperCase(),
        course_name: m[2].trim(),
      };
    }
  }
  return { course_code: null, course_name: trimmed };
}

function unescapeIcsText(value: string): string {
  return value
    .replace(/\\n/gi, " ")
    .replace(/\\,/g, ",")
    .replace(/\\;/g, ";")
    .replace(/\\\\/g, "\\");
}

function getJsDayOfWeek(icsDay: string): number | null {
  const up = icsDay.toUpperCase().slice(0, 2);
  if (DAY_MAP[up] !== undefined) return DAY_MAP[up];
  return null;
}

interface VEvent {
  summary: string;
  description?: string;
  location?: string;
  dtstart?: { date: Date; isDateOnly: boolean; tzid: string | null };
  dtend?: { date: Date; isDateOnly: boolean; tzid: string | null };
  rrule?: Record<string, string>;
}

function parseRrule(value: string): Record<string, string> {
  const result: Record<string, string> = {};
  for (const part of value.split(";")) {
    const eq = part.indexOf("=");
    if (eq !== -1) {
      result[part.slice(0, eq).toUpperCase()] = part.slice(eq + 1);
    }
  }
  return result;
}

function collectVEvents(lines: string[]): VEvent[] {
  const events: VEvent[] = [];
  let inEvent = false;
  let current: Partial<VEvent> = {};
  for (const line of lines) {
    const { key, params, value } = splitIcsLine(line);
    if (key === "BEGIN" && value === "VEVENT") {
      inEvent = true;
      current = {};
      continue;
    }
    if (key === "END" && value === "VEVENT") {
      inEvent = false;
      if (Object.keys(current).length > 0) events.push(current as VEvent);
      current = {};
      continue;
    }
    if (!inEvent) continue;
    switch (key) {
      case "SUMMARY":
        current.summary = unescapeIcsText(value);
        break;
      case "DESCRIPTION":
        current.description = value;
        break;
      case "LOCATION":
        current.location = unescapeIcsText(value);
        break;
      case "DTSTART":
        current.dtstart = parseIcsDateTime(value, params);
        break;
      case "DTEND":
        current.dtend = parseIcsDateTime(value, params);
        break;
      case "RRULE":
        current.rrule = parseRrule(value);
        break;
    }
  }
  return events;
}

function expandRecurringEvent(ev: VEvent, errors: string[], warnings: string[]): ParsedClassSchedule[] {
  const result: ParsedClassSchedule[] = [];
  if (!ev.dtstart) {
    errors.push(`Event "${ev.summary || "(no name)"}" ไม่มีวันและเวลาเริ่ม (DTSTART) — ข้าม`);
    return result;
  }
  if (!ev.dtend) {
    errors.push(`Event "${ev.summary || "(no name)"}" ไม่มีวันและเวลาจบ (DTEND) — ข้าม`);
    return result;
  }

  const startDate = ev.dtstart.date;
  const endDate = ev.dtend.date;

  if (endDate.getTime() <= startDate.getTime()) {
    errors.push(`Event "${ev.summary || "(no name)"}" มีเวลาจบน้อยกว่าหรือเท่ากับเวลาเริ่ม — ข้าม`);
    return result;
  }

  const startTimeStr = formatTime(startDate);
  const endTimeStr = formatTime(endDate);

  const { course_code, course_name } = extractCourseCode(ev.summary || "");
  if (!course_name) {
    warnings.push(`พบ event ที่ไม่มีชื่อวิชา — ข้าม`);
    return result;
  }

  const room = ev.location && ev.location.trim() ? ev.location.trim() : null;

  const rrule = ev.rrule;
  if (!rrule) {
    result.push({
      course_code,
      course_name,
      day_of_week: startDate.getDay(),
      start_time: startTimeStr,
      end_time: endTimeStr,
      room,
      original_summary: ev.summary,
      raw_start: startDate.toISOString(),
      raw_end: endDate.toISOString(),
    });
    return result;
  }

  const freq = (rrule["FREQ"] || "").toUpperCase();
  const byday = rrule["BYDAY"] || "";
  const until = rrule["UNTIL"];
  const count = rrule["COUNT"] ? parseInt(rrule["COUNT"], 10) : null;
  const interval = rrule["INTERVAL"] ? parseInt(rrule["INTERVAL"], 10) : 1;

  if (freq === "WEEKLY") {
    const days: number[] = [];
    if (byday) {
      for (const d of byday.split(",")) {
        const dow = getJsDayOfWeek(d.trim());
        if (dow !== null) days.push(dow);
      }
    }
    if (days.length === 0) {
      days.push(startDate.getDay());
    }

    const maxWeeks = count || 52;
    const untilDate = until ? parseIcsTimestamp(until.replace(/Z$/, ""), until.endsWith("Z") ? "UTC" : null) : null;

    const seenDays = new Set<number>();
    let cursor = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
    const startSunday = new Date(cursor);
    startSunday.setDate(cursor.getDate() - cursor.getDay());
    // Compare calendar days, not instants: the first occurrence may start at
    // 09:00 while its day marker is midnight.
    const startDay = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());

    for (let w = 0; w < maxWeeks; w++) {
      const weekStart = new Date(startSunday);
      weekStart.setDate(startSunday.getDate() + w * 7 * interval);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);

      if (untilDate && weekStart.getTime() > untilDate.getTime()) break;

      for (const dow of days) {
        if (seenDays.has(dow)) continue;
        const dayDate = new Date(weekStart);
        dayDate.setDate(weekStart.getDate() + dow);
        if (dayDate.getTime() < startDay.getTime()) continue;
        if (untilDate && dayDate.getTime() > untilDate.getTime()) continue;

        result.push({
          course_code,
          course_name,
          day_of_week: dow,
          start_time: startTimeStr,
          end_time: endTimeStr,
          room,
          original_summary: ev.summary,
          raw_start: new Date(dayDate.getFullYear(), dayDate.getMonth(), dayDate.getDate(),
            startDate.getHours(), startDate.getMinutes(), startDate.getSeconds()).toISOString(),
          raw_end: new Date(dayDate.getFullYear(), dayDate.getMonth(), dayDate.getDate(),
            endDate.getHours(), endDate.getMinutes(), endDate.getSeconds()).toISOString(),
        });
        seenDays.add(dow);
      }

      if (seenDays.size === days.length && !until && days.every(d => seenDays.has(d))) {
        break;
      }
    }
    if (result.length === 0) {
      warnings.push(`Event "${course_name}" เป็น recurring แต่ไม่สามารถขยายวันได้ — ใช้วันเดิม`);
      result.push({
        course_code,
        course_name,
        day_of_week: startDate.getDay(),
        start_time: startTimeStr,
        end_time: endTimeStr,
        room,
        original_summary: ev.summary,
        raw_start: startDate.toISOString(),
        raw_end: endDate.toISOString(),
      });
    }
  } else if (freq === "DAILY" || freq === "MONTHLY" || freq === "YEARLY") {
    warnings.push(`Event "${course_name}" มี RRULE FREQ=${freq} ไม่รองรับ — ใช้วันเริ่มต้น`);
    result.push({
      course_code,
      course_name,
      day_of_week: startDate.getDay(),
      start_time: startTimeStr,
      end_time: endTimeStr,
      room,
      original_summary: ev.summary,
      raw_start: startDate.toISOString(),
      raw_end: endDate.toISOString(),
    });
  } else {
    result.push({
      course_code,
      course_name,
      day_of_week: startDate.getDay(),
      start_time: startTimeStr,
      end_time: endTimeStr,
      room,
      original_summary: ev.summary,
      raw_start: startDate.toISOString(),
      raw_end: endDate.toISOString(),
    });
  }

  return result;
}

export function parseIcsFile(text: string): IcsParseResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!text || text.trim().length === 0) {
    return { success: false, schedules: [], errors: ["ไฟล์ว่างเปล่า"], warnings: [] };
  }

  const lines = unfoldIcsLines(text);
  const hasVCalendar = lines.some(l => splitIcsLine(l).key === "BEGIN" && splitIcsLine(l).value === "VCALENDAR");
  if (!hasVCalendar) {
    return { success: false, schedules: [], errors: ["ไฟล์นี้ไม่ใช่ไฟล์ตารางเรียน .ics ที่ถูกต้อง (ไม่มี BEGIN:VCALENDAR)"], warnings: [] };
  }

  const events = collectVEvents(lines);
  if (events.length === 0) {
    return { success: false, schedules: [], errors: ["ไม่พบรายการตารางเรียน (VEVENT) ในไฟล์นี้"], warnings: [] };
  }

  const allSchedules: ParsedClassSchedule[] = [];
  const seenKeys = new Set<string>();

  for (const ev of events) {
    const expanded = expandRecurringEvent(ev, errors, warnings);
    for (const s of expanded) {
      const key = `${s.day_of_week}|${s.start_time}|${s.end_time}|${s.course_name}|${s.room || ""}`;
      if (seenKeys.has(key)) {
        warnings.push(`พบรายการซ้ำ: ${s.course_name} ${s.day_of_week} ${s.start_time}-${s.end_time} — ข้ามรายการซ้ำ`);
        continue;
      }
      seenKeys.add(key);
      allSchedules.push(s);
    }
  }

  allSchedules.sort((a, b) => {
    if (a.day_of_week !== b.day_of_week) return a.day_of_week - b.day_of_week;
    return a.start_time.localeCompare(b.start_time);
  });

  const success = allSchedules.length > 0;
  if (!success && errors.length === 0) {
    errors.push("ไม่สามารถแปลงรายการตารางเรียนได้ กรุณาตรวจสอบไฟล์");
  }

  return { success, schedules: allSchedules, errors, warnings };
}

export function dayName(day: number): string {
  return ["อาทิตย์", "จันทร์", "อังคาร", "พุธ", "พฤหัสบดี", "ศุกร์", "เสาร์"][day] ?? "";
}

export function dayShortName(day: number): string {
  return ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"][day] ?? "";
}

export function dayThShort(day: number): string {
  return ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"][day] ?? "";
}

export function isValidTime(t: string): boolean {
  return /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(t);
}

export function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

export function minutesToTime(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${pad2(h)}:${pad2(m)}`;
}

export interface TimeSlot {
  start_time: string;
  end_time: string;
}

export function schedulesOverlap(a: TimeSlot, b: TimeSlot): boolean {
  const aStart = timeToMinutes(a.start_time);
  const aEnd = timeToMinutes(a.end_time);
  const bStart = timeToMinutes(b.start_time);
  const bEnd = timeToMinutes(b.end_time);
  return aStart < bEnd && bStart < aEnd;
}

export interface ConflictResult {
  hasConflict: boolean;
  conflictingSchedules: Array<{ day: number; class_schedule: TimeSlot & { course_name: string; course_code: string | null; room: string | null }; job_schedule: TimeSlot }>;
}

export function checkScheduleConflicts(
  classSchedules: Array<{ day_of_week: number; start_time: string; end_time: string; course_name: string; course_code: string | null; room: string | null }>,
  jobSchedules: Array<{ day_of_week: number; start_time: string; end_time: string }>,
): ConflictResult {
  const conflicting: ConflictResult["conflictingSchedules"] = [];
  for (const job of jobSchedules) {
    for (const cs of classSchedules) {
      if (cs.day_of_week !== job.day_of_week) continue;
      if (schedulesOverlap(
        { start_time: cs.start_time, end_time: cs.end_time },
        { start_time: job.start_time, end_time: job.end_time },
      )) {
        conflicting.push({
          day: cs.day_of_week,
          class_schedule: {
            start_time: cs.start_time,
            end_time: cs.end_time,
            course_name: cs.course_name,
            course_code: cs.course_code,
            room: cs.room,
          },
          job_schedule: { start_time: job.start_time, end_time: job.end_time },
        });
      }
    }
  }
  return { hasConflict: conflicting.length > 0, conflictingSchedules: conflicting };
}

export function kkuDayFromText(text: string): number | null {
  const low = text.toLowerCase().trim();
  for (const [name, day] of Object.entries(DAY_NAME_MAP)) {
    if (low.includes(name)) return day;
  }
  const thaiMap: Array<[string, number]> = [
    ["อาทิตย์", 0], ["จันทร์", 1], ["อังคาร", 2], ["พุธ", 3],
    ["พฤหัส", 4], ["ศุกร์", 5], ["เสาร์", 6],
  ];
  for (const [name, day] of thaiMap) {
    if (text.includes(name)) return day;
  }
  return null;
}
