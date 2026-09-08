import { dayThShort, dayName, type ParsedClassSchedule } from "@/lib/ics-parser";
import { AlertCircle, BookOpen, MapPin, Clock, CheckCircle2, X } from "lucide-react";

interface PreviewListProps {
  schedules: ParsedClassSchedule[];
  warnings: string[];
  errors: string[];
  fileName: string;
}

export function SchedulePreviewList({ schedules, warnings, errors, fileName }: PreviewListProps) {
  const grouped = new Map<number, ParsedClassSchedule[]>();
  for (const s of schedules) {
    if (!grouped.has(s.day_of_week)) grouped.set(s.day_of_week, []);
    grouped.get(s.day_of_week)!.push(s);
  }
  const daysSorted = Array.from(grouped.keys()).sort();

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-3">
        <BookOpen className="h-5 w-5 text-primary" />
        <div className="flex-1 text-sm">
          <span className="font-semibold">ตารางเรียนที่พบ</span>
          <span className="text-muted-foreground"> · </span>
          <span className="text-muted-foreground">{fileName}</span>
        </div>
        <div className="flex gap-2 text-xs">
          <span className="rounded-md bg-primary/10 px-2 py-0.5 font-semibold text-primary">
            {schedules.length} รายการ
          </span>
          {warnings.length > 0 && (
            <span className="rounded-md bg-amber-100 px-2 py-0.5 font-semibold text-amber-700 dark:bg-amber-950/40 dark:text-amber-400">
              ⚠ {warnings.length}
            </span>
          )}
          {errors.length > 0 && (
            <span className="rounded-md bg-red-100 px-2 py-0.5 font-semibold text-red-700 dark:bg-red-950/40 dark:text-red-400">
              ✕ {errors.length}
            </span>
          )}
        </div>
      </div>

      {errors.length > 0 && (
        <div className="space-y-1 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-400">
          {errors.slice(0, 5).map((e, i) => (
            <div key={i} className="flex items-start gap-2">
              <X className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <span>{e}</span>
            </div>
          ))}
          {errors.length > 5 && <div className="text-xs opacity-70">และอีก {errors.length - 5} รายการ</div>}
        </div>
      )}

      {warnings.length > 0 && (
        <div className="space-y-1 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-400">
          {warnings.slice(0, 5).map((w, i) => (
            <div key={i} className="flex items-start gap-2">
              <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <span>{w}</span>
            </div>
          ))}
          {warnings.length > 5 && <div className="text-xs opacity-70">และอีก {warnings.length - 5} รายการ</div>}
        </div>
      )}

      <div className="space-y-3">
        {daysSorted.map(d => (
          <div key={d} className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="flex items-center gap-2 border-b border-border bg-muted/40 px-4 py-2">
              <span className="rounded-md bg-primary px-2 py-0.5 text-xs font-bold text-primary-foreground">
                {dayThShort(d)}
              </span>
              <span className="font-display text-sm font-semibold">วัน{dayName(d)}</span>
              <span className="text-xs text-muted-foreground">({grouped.get(d)!.length} วิชา)</span>
            </div>
            <div className="divide-y divide-border">
              {grouped.get(d)!.map((s, i) => (
                <div key={i} className="flex items-start gap-3 px-4 py-3">
                  <div className="mt-1 flex h-10 w-10 flex-col items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Clock className="h-3.5 w-3.5" />
                    <span className="text-[10px] font-bold leading-none mt-0.5">
                      {s.start_time.replace(":", "")}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      {s.course_code && (
                        <span className="rounded-md bg-emerald-100 px-1.5 py-0.5 text-xs font-bold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
                          {s.course_code}
                        </span>
                      )}
                      <span className="font-semibold">{s.course_name}</span>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      <CheckCircle2 className="h-3 w-3 text-primary" />
                      <span>{s.start_time} – {s.end_time}</span>
                      {s.room && (
                        <>
                          <span className="opacity-40">·</span>
                          <MapPin className="h-3 w-3" />
                          <span>Room: {s.room}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
