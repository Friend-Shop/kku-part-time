import { AlertTriangle, CheckCircle2, Clock, MapPin, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { dayThShort } from "@/lib/ics-parser";
import type { ConflictResult } from "@/lib/ics-parser";

interface JobScheduleConflictProps {
  conflict: ConflictResult;
  compact?: boolean;
}

export function JobScheduleConflict({ conflict, compact = false }: JobScheduleConflictProps) {
  const [open, setOpen] = useState(!compact);
  const { hasConflict, conflictingSchedules } = conflict;

  if (compact && !hasConflict) {
    return (
      <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 dark:border-emerald-800/60 dark:bg-emerald-950/30 dark:text-emerald-400">
        <CheckCircle2 className="h-3.5 w-3.5" />
        ไม่ชนกับตารางเรียน
      </div>
    );
  }

  if (compact && hasConflict) {
    return (
      <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700 dark:border-amber-800/60 dark:bg-amber-950/30 dark:text-amber-400">
        <AlertTriangle className="h-3.5 w-3.5" />
        เวลางาน {conflictingSchedules.length} ช่วง ชนกับตารางเรียน
      </div>
    );
  }

  return (
    <div
      className={
        hasConflict
          ? "rounded-xl border border-amber-300 bg-gradient-to-br from-amber-50 to-amber-100/50 dark:border-amber-800/60 dark:from-amber-950/40 dark:to-amber-950/20"
          : "rounded-xl border border-emerald-300 bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:border-emerald-800/60 dark:from-emerald-950/40 dark:to-emerald-950/20"
      }
    >
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left"
      >
        <div
          className={
            "flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full " +
            (hasConflict
              ? "bg-amber-200 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400"
              : "bg-emerald-200 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400")
          }
        >
          {hasConflict
            ? <AlertTriangle className="h-5 w-5" />
            : <CheckCircle2 className="h-5 w-5" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className={`font-display font-bold ${hasConflict ? "text-amber-900 dark:text-amber-300" : "text-emerald-900 dark:text-emerald-300"}`}>
            {hasConflict
              ? "⚠️ เวลางานชนกับตารางเรียนของคุณ"
              : "✓ เวลางานนี้ไม่ชนกับตารางเรียน"}
          </div>
          <div className={`mt-0.5 text-xs ${hasConflict ? "text-amber-700/80 dark:text-amber-400/80" : "text-emerald-700/80 dark:text-emerald-400/80"}`}>
            {hasConflict
              ? `มี ${conflictingSchedules.length} รายการที่ซ้อนเวลากัน`
              : "เวลางานทุกช่วงว่างจากตารางเรียนของคุณแล้ว"}
          </div>
        </div>
        <div className="text-muted-foreground">
          {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </div>
      </button>

      {open && hasConflict && (
        <div className="border-t border-amber-200/70 px-4 py-3 space-y-2 dark:border-amber-900/50">
          {conflictingSchedules.map((c, i) => (
            <div key={i} className="flex items-start gap-3 rounded-lg border border-amber-200 bg-white/70 p-3 text-sm dark:border-amber-900/50 dark:bg-amber-950/30">
              <div className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md bg-amber-200 text-[10px] font-black text-amber-800 dark:bg-amber-900/70 dark:text-amber-300">
                {dayThShort(c.day)}
              </div>
              <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <div className="text-[10px] uppercase tracking-widest text-amber-700/70 dark:text-amber-400/70">
                    ตารางเรียน
                  </div>
                  <div className="font-bold text-amber-900 dark:text-amber-200">
                    {c.class_schedule.course_code && (
                      <span className="mr-1 rounded bg-amber-200 px-1 text-[10px] dark:bg-amber-900/60">
                        {c.class_schedule.course_code}
                      </span>
                    )}
                    {c.class_schedule.course_name}
                  </div>
                  <div className="mt-0.5 inline-flex items-center gap-1 text-xs text-amber-700/80 dark:text-amber-400/80">
                    <Clock className="h-3 w-3" />
                    {c.class_schedule.start_time} – {c.class_schedule.end_time}
                  </div>
                  {c.class_schedule.room && (
                    <div className="mt-0.5 inline-flex items-center gap-1 text-xs text-amber-700/80 dark:text-amber-400/80 ml-2">
                      <MapPin className="h-3 w-3" />
                      {c.class_schedule.room}
                    </div>
                  )}
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-widest text-rose-700/80 dark:text-rose-400/80">
                    เวลางานที่ชน
                  </div>
                  <div className="font-bold text-rose-800 dark:text-rose-300 inline-flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {c.job_schedule.start_time} – {c.job_schedule.end_time}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
