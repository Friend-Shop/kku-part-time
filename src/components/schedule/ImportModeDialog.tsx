import { useState } from "react";
import { Replace, PlusCircle, AlertTriangle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export type ImportMode = "replace" | "merge";

interface ImportModeDialogProps {
  open: boolean;
  newCount: number;
  existingCount: number;
  onCancel: () => void;
  onConfirm: (mode: ImportMode) => void;
  loading?: boolean;
}

export function ImportModeDialog({ open, newCount, existingCount, onCancel, onConfirm, loading }: ImportModeDialogProps) {
  const [selected, setSelected] = useState<ImportMode>("merge");
  if (!open) return null;

  const modes: Array<{ value: ImportMode; title: string; desc: string; icon: any; accent: string }> = [
    {
      value: "merge",
      title: "เพิ่มต่อจากตารางเรียนเดิม",
      desc: "นำเข้าวิชาใหม่ โดยข้ามรายการที่ซ้ำกับตารางเดิมอัตโนมัติ",
      icon: PlusCircle,
      accent: "border-emerald-400 bg-emerald-50 dark:bg-emerald-950/30",
    },
    {
      value: "replace",
      title: "แทนที่ตารางเรียนเดิมทั้งหมด",
      desc: "ลบตารางเรียนเดิมทั้งหมด แล้วนำเข้ารายการใหม่แทนที่",
      icon: Replace,
      accent: "border-rose-400 bg-rose-50 dark:bg-rose-950/30",
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl border border-border bg-background shadow-2xl">
        <div className="flex items-center gap-3 border-b border-border px-6 py-4">
          <div className="rounded-full bg-amber-100 p-2 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-display text-lg font-bold">เลือกวิธีการนำเข้าตารางเรียน</h3>
            <p className="text-xs text-muted-foreground">
              ตารางเดิม: <span className="font-semibold text-foreground">{existingCount} รายการ</span>
              <span className="mx-1">·</span>
              ใหม่: <span className="font-semibold text-foreground">{newCount} รายการ</span>
            </p>
          </div>
        </div>
        <div className="space-y-2 p-6">
          {modes.map(m => (
            <button
              key={m.value}
              onClick={() => setSelected(m.value)}
              disabled={loading}
              className={cn(
                "w-full rounded-xl border-2 p-4 text-left transition",
                selected === m.value ? m.accent : "border-border bg-card hover:border-primary/40",
                loading && "opacity-60 pointer-events-none",
              )}
            >
              <div className="flex items-start gap-3">
                <div className={cn(
                  "mt-0.5 flex h-9 w-9 items-center justify-center rounded-lg",
                  selected === m.value ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
                )}>
                  <m.icon className="h-4.5 w-4.5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-display font-bold">{m.title}</span>
                    {m.value === "merge" && (
                      <span className="rounded bg-primary px-1.5 py-0.5 text-[10px] font-bold text-primary-foreground">
                        DEFAULT
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{m.desc}</p>
                </div>
                <div className={cn(
                  "mt-1 h-4 w-4 rounded-full border-2 flex items-center justify-center",
                  selected === m.value ? "border-primary bg-primary" : "border-muted-foreground/30",
                )}>
                  {selected === m.value && <div className="h-1.5 w-1.5 rounded-full bg-primary-foreground" />}
                </div>
              </div>
            </button>
          ))}
        </div>
        <div className="flex justify-end gap-2 border-t border-border bg-muted/30 px-6 py-4">
          <button
            onClick={onCancel}
            disabled={loading}
            className="rounded-md border border-border bg-card px-4 py-2 text-sm font-semibold transition hover:bg-muted disabled:opacity-60"
          >
            ยกเลิก
          </button>
          <button
            onClick={() => onConfirm(selected)}
            disabled={loading}
            className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-bold text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            ยืนยันนำเข้า
          </button>
        </div>
      </div>
    </div>
  );
}
