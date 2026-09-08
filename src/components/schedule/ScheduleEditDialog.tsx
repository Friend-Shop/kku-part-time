import { useState, useEffect } from "react";
import { X, Save, Trash2, BookOpen, MapPin, Clock, CalendarDays } from "lucide-react";
import { toast } from "sonner";
import type { ClassScheduleRow, ClassScheduleInsert } from "@/lib/class-schedules";

interface ScheduleEditDialogProps {
  open: boolean;
  mode: "add" | "edit";
  initial?: ClassScheduleRow | null;
  onClose: () => void;
  onSave: (data: Omit<ClassScheduleInsert, "student_id">, id?: string) => Promise<{ success: boolean; error?: string }>;
  onDelete?: (id: string) => Promise<{ success: boolean; error?: string }>;
}

const DAYS: Array<{ v: number; l: string; s: string }> = [
  { v: 0, l: "วันอาทิตย์", s: "อา" },
  { v: 1, l: "วันจันทร์", s: "จ" },
  { v: 2, l: "วันอังคาร", s: "อ" },
  { v: 3, l: "วันพุธ", s: "พ" },
  { v: 4, l: "วันพฤหัสบดี", s: "พฤ" },
  { v: 5, l: "วันศุกร์", s: "ศ" },
  { v: 6, l: "วันเสาร์", s: "ส" },
];

const INPUT = "w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm focus:border-primary focus:outline-none";
const LABEL = "text-xs uppercase tracking-widest text-muted-foreground";

export function ScheduleEditDialog({ open, mode, initial, onClose, onSave, onDelete }: ScheduleEditDialogProps) {
  const [courseCode, setCourseCode] = useState("");
  const [courseName, setCourseName] = useState("");
  const [day, setDay] = useState<number>(1);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("12:00");
  const [room, setRoom] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    if (mode === "edit" && initial) {
      setCourseCode(initial.course_code || "");
      setCourseName(initial.course_name);
      setDay(initial.day_of_week);
      setStartTime(initial.start_time);
      setEndTime(initial.end_time);
      setRoom(initial.room || "");
    } else {
      setCourseCode("");
      setCourseName("");
      setDay(1);
      setStartTime("09:00");
      setEndTime("12:00");
      setRoom("");
    }
    setErr(null);
    setSaving(false);
    setDeleting(false);
  }, [open, mode, initial]);

  if (!open) return null;

  const validate = (): string | null => {
    if (!courseName.trim()) return "ต้องระบุชื่อวิชา";
    if (day < 0 || day > 6) return "วันไม่ถูกต้อง";
    const sMin = parseInt(startTime.split(":")[0], 10) * 60 + parseInt(startTime.split(":")[1], 10);
    const eMin = parseInt(endTime.split(":")[0], 10) * 60 + parseInt(endTime.split(":")[1], 10);
    if (eMin <= sMin) return "เวลาจบต้องมากกว่าเวลาเริ่ม";
    return null;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const v = validate();
    if (v) { setErr(v); return; }
    setErr(null);
    setSaving(true);
    const payload: Omit<ClassScheduleInsert, "student_id"> = {
      course_code: courseCode.trim() || null,
      course_name: courseName.trim(),
      day_of_week: day,
      start_time: startTime,
      end_time: endTime,
      room: room.trim() || null,
    };
    const res = await onSave(payload, mode === "edit" ? initial?.id : undefined);
    setSaving(false);
    if (!res.success) {
      setErr(res.error || "ไม่สามารถบันทึกได้");
      toast.error(res.error || "ไม่สามารถบันทึกได้");
      return;
    }
    toast.success(mode === "add" ? "เพิ่มวิชาแล้ว" : "บันทึกการแก้ไขแล้ว");
    onClose();
  };

  const handleDelete = async () => {
    if (mode !== "edit" || !initial || !onDelete) return;
    if (!confirm(`ยืนยันลบ "${initial.course_name}" ออกจากตารางเรียน?`)) return;
    setDeleting(true);
    const r = await onDelete(initial.id);
    setDeleting(false);
    if (!r.success) {
      toast.error(r.error || "ไม่สามารถลบได้");
      return;
    }
    toast.success("ลบวิชาแล้ว");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <form onSubmit={submit} className="w-full max-w-md rounded-2xl border border-border bg-background shadow-2xl">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div>
            <h3 className="font-display text-lg font-bold">
              {mode === "add" ? "เพิ่มวิชาใหม่" : "แก้ไขวิชา"}
            </h3>
            <p className="text-xs text-muted-foreground">
              {mode === "add" ? "เพิ่มตารางเรียนด้วยมือ" : `${initial?.course_code || ""} ${initial?.course_name || ""}`}
            </p>
          </div>
          <button type="button" onClick={onClose} className="rounded-md p-1.5 hover:bg-muted">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 p-6">
          <div className="grid gap-3 sm:grid-cols-5">
            <div className="sm:col-span-2">
              <label className={LABEL}><BookOpen className="inline h-3 w-3 mr-1" />รหัสวิชา</label>
              <input
                value={courseCode}
                onChange={(e) => setCourseCode(e.target.value.toUpperCase())}
                className={`${INPUT} mt-1 font-mono font-bold uppercase tracking-wider`}
                placeholder="CP101"
              />
            </div>
            <div className="sm:col-span-3">
              <label className={LABEL}>ชื่อวิชา *</label>
              <input
                required
                value={courseName}
                onChange={(e) => setCourseName(e.target.value)}
                className={`${INPUT} mt-1`}
                placeholder="Database Systems"
              />
            </div>
          </div>

          <div>
            <label className={`${LABEL} flex items-center gap-1`}>
              <CalendarDays className="inline h-3 w-3" />วันเรียน *
            </label>
            <div className="mt-2 grid grid-cols-7 gap-1 rounded-lg border border-border p-1">
              {DAYS.map(d => (
                <button
                  key={d.v}
                  type="button"
                  onClick={() => setDay(d.v)}
                  className={`rounded-md py-1.5 text-xs font-semibold transition ${
                    day === d.v
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "hover:bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {d.s}
                </button>
              ))}
            </div>
            <div className="mt-1 text-xs text-muted-foreground">{DAYS[day].l}</div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={`${LABEL} flex items-center gap-1`}>
                <Clock className="inline h-3 w-3" />เวลาเริ่ม *
              </label>
              <input
                required
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className={`${INPUT} mt-1 font-mono`}
              />
            </div>
            <div>
              <label className={`${LABEL} flex items-center gap-1`}>
                <Clock className="inline h-3 w-3" />เวลาจบ *
              </label>
              <input
                required
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className={`${INPUT} mt-1 font-mono`}
              />
            </div>
          </div>

          <div>
            <label className={`${LABEL} flex items-center gap-1`}>
              <MapPin className="inline h-3 w-3" />ห้องเรียน
            </label>
            <input
              value={room}
              onChange={(e) => setRoom(e.target.value)}
              className={`${INPUT} mt-1`}
              placeholder="SC310"
            />
          </div>

          {err && (
            <div className="rounded-md border border-red-300 bg-red-50 p-3 text-xs font-medium text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-400">
              ⚠ {err}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-border bg-muted/30 px-6 py-4">
          <div>
            {mode === "edit" && onDelete && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={saving || deleting}
                className="inline-flex items-center gap-1.5 rounded-md border border-red-300 bg-red-50 px-3 py-2 text-xs font-bold text-red-700 transition hover:bg-red-100 disabled:opacity-60 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-400 dark:hover:bg-red-950/50"
              >
                <Trash2 className="h-3.5 w-3.5" />
                ลบ
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving || deleting}
              className="rounded-md border border-border bg-card px-4 py-2 text-sm font-semibold transition hover:bg-muted disabled:opacity-60"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={saving || deleting}
              className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-bold text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
            >
              <Save className="h-4 w-4" />
              {mode === "add" ? "เพิ่มวิชา" : "บันทึก"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
