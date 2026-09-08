import { dayThShort, timeToMinutes, minutesToTime } from "@/lib/ics-parser";
import type { ClassScheduleRow } from "@/lib/class-schedules";
import { MapPin, BookOpen, Clock } from "lucide-react";

interface WeeklyCalendarProps {
  schedules: ClassScheduleRow[];
  startHour?: number;
  endHour?: number;
  onEdit?: (s: ClassScheduleRow) => void;
  onDelete?: (s: ClassScheduleRow) => void;
}

const DAY_LABELS = [0, 1, 2, 3, 4, 5, 6];
const DAY_FULL = ["อาทิตย์", "จันทร์", "อังคาร", "พุธ", "พฤหัส", "ศุกร์", "เสาร์"];

const COLORS = [
  "bg-violet-100 border-violet-300 text-violet-900 dark:bg-violet-950/50 dark:border-violet-800 dark:text-violet-200",
  "bg-sky-100 border-sky-300 text-sky-900 dark:bg-sky-950/50 dark:border-sky-800 dark:text-sky-200",
  "bg-emerald-100 border-emerald-300 text-emerald-900 dark:bg-emerald-950/50 dark:border-emerald-800 dark:text-emerald-200",
  "bg-amber-100 border-amber-300 text-amber-900 dark:bg-amber-950/50 dark:border-amber-800 dark:text-amber-200",
  "bg-rose-100 border-rose-300 text-rose-900 dark:bg-rose-950/50 dark:border-rose-800 dark:text-rose-200",
  "bg-cyan-100 border-cyan-300 text-cyan-900 dark:bg-cyan-950/50 dark:border-cyan-800 dark:text-cyan-200",
  "bg-fuchsia-100 border-fuchsia-300 text-fuchsia-900 dark:bg-fuchsia-950/50 dark:border-fuchsia-800 dark:text-fuchsia-200",
];

function colorFor(courseName: string, code: string | null, n: number): string {
  const key = (code || courseName).toLowerCase();
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0;
  return COLORS[(h + n) % COLORS.length];
}

export function WeeklyCalendar({ schedules, startHour = 8, endHour = 21, onEdit, onDelete }: WeeklyCalendarProps) {
  const hours: number[] = [];
  for (let h = startHour; h <= endHour; h++) hours.push(h);

  const byDay = new Map<number, ClassScheduleRow[]>();
  for (const s of schedules) {
    if (!byDay.has(s.day_of_week)) byDay.set(s.day_of_week, []);
    byDay.get(s.day_of_week)!.push(s);
  }

  const totalHeight = (endHour - startHour + 1) * 60;
  const cellH = 60;
  const headW = 56;
  const colW = 140;

  return (
    <div className="w-full overflow-x-auto rounded-xl border border-border bg-card">
      <div
        className="relative min-w-[calc(56px + 7 * 140px)]"
        style={{ minWidth: `${headW + 7 * colW}px` }}
      >
        <div className="sticky top-0 z-10 flex border-b border-border bg-card/95 backdrop-blur">
          <div
            className="flex flex-shrink-0 items-center justify-center border-r border-border bg-muted/40 font-display text-xs font-bold text-muted-foreground"
            style={{ width: headW, height: 44 }}
          >
            <Clock className="h-3.5 w-3.5 mr-1" />
            เวลา
          </div>
          {DAY_LABELS.map(d => (
            <div
              key={d}
              className={`flex flex-col items-center justify-center border-r border-border last:border-r-0 font-display font-bold ${byDay.has(d) ? "bg-primary/5" : "bg-muted/10"}`}
              style={{ width: colW, height: 44 }}
            >
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{DAY_FULL[d].slice(0, 3)}</div>
              <div className="text-sm text-foreground flex items-center gap-1">
                <span className="rounded bg-primary/10 px-1.5 text-primary">{dayThShort(d)}</span>
                <span>{byDay.get(d)?.length || 0}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="relative" style={{ height: totalHeight }}>
          {hours.map((h, idx) => (
            <div
              key={h}
              className="absolute left-0 right-0 border-t border-border/60"
              style={{ top: idx * cellH }}
            >
              <div
                className="absolute -translate-y-1/2 flex items-center justify-center border-r border-border bg-muted/20 text-[11px] font-semibold text-muted-foreground"
                style={{ width: headW, height: 28 }}
              >
                {String(h).padStart(2, "0")}:00
              </div>
            </div>
          ))}
          <div
            className="absolute left-0 right-0 border-t border-border"
            style={{ top: (hours.length - 1) * cellH + cellH }}
          />

          {DAY_LABELS.map((day, dayIdx) => {
            const list = byDay.get(day) || [];
            return (
              <div
                key={day}
                className="absolute top-0 border-r border-border/50 last:border-r-0"
                style={{
                  left: headW + dayIdx * colW,
                  width: colW,
                  height: totalHeight,
                }}
              >
                {list.map((s, n) => {
                  const startMin = timeToMinutes(s.start_time) - startHour * 60;
                  const endMin = timeToMinutes(s.end_time) - startHour * 60;
                  const top = Math.max(0, startMin);
                  const height = Math.max(28, Math.min(totalHeight - top, endMin - startMin));
                  const color = colorFor(s.course_name, s.course_code, n);
                  return (
                    <div
                      key={s.id}
                      className={`absolute left-1.5 right-1.5 flex cursor-pointer flex-col overflow-hidden rounded-md border px-2 py-1.5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${color}`}
                      style={{ top, height }}
                      onClick={() => onEdit?.(s)}
                      onContextMenu={(e) => { e.preventDefault(); onDelete?.(s); }}
                      title={s.course_name}
                    >
                      <div className="flex items-center gap-1 text-[10px] font-bold leading-tight opacity-80">
                        {s.course_code && <BookOpen className="h-2.5 w-2.5" />}
                        <span className="truncate">{s.course_code || "·"}</span>
                      </div>
                      <div className="mt-0.5 line-clamp-2 text-[11px] font-bold leading-tight">
                        {s.course_name}
                      </div>
                      <div className="mt-auto flex items-center gap-1 pt-1 text-[10px] opacity-80">
                        <Clock className="h-2.5 w-2.5 flex-shrink-0" />
                        <span className="font-semibold">{s.start_time}-{s.end_time}</span>
                      </div>
                      {s.room && (
                        <div className="flex items-center gap-1 text-[10px] opacity-80">
                          <MapPin className="h-2.5 w-2.5 flex-shrink-0" />
                          <span className="truncate">{s.room}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
