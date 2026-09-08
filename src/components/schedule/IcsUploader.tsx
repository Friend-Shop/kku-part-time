import { useRef, useState, type ChangeEvent } from "react";
import { Upload, FileUp, AlertCircle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { parseIcsFile, type IcsParseResult, type ParsedClassSchedule } from "@/lib/ics-parser";

interface IcsUploaderProps {
  onParsed: (result: IcsParseResult, fileName: string) => void;
  disabled?: boolean;
}

export function IcsUploader({ onParsed, disabled }: IcsUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "parsing" | "error">("idle");

  const validateAndParse = async (file: File) => {
    if (!file.name.toLowerCase().endsWith(".ics")) {
      toast.error("กรุณาเลือกไฟล์ตารางเรียน .ics");
      setStatus("error");
      return;
    }
    if (file.size === 0) {
      toast.error("ไฟล์ว่างเปล่า กรุณาเลือกไฟล์ใหม่");
      setStatus("error");
      return;
    }
    setFileName(file.name);
    setStatus("parsing");
    try {
      const text = await file.text();
      const result = parseIcsFile(text);
      setStatus(result.success ? "idle" : "error");
      if (!result.success) {
        const firstErr = result.errors[0] || "ไม่สามารถอ่านไฟล์ได้";
        toast.error(`ไม่สามารถ parse ไฟล์ได้: ${firstErr}`);
      }
      onParsed(result, file.name);
    } catch (e: any) {
      setStatus("error");
      toast.error("เกิดข้อผิดพลาดขณะอ่านไฟล์ กรุณาลองไฟล์ใหม่");
      onParsed({ success: false, schedules: [], errors: [e?.message || "Unknown error"], warnings: [] }, file.name);
    }
  };

  const onChange = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) void validateAndParse(f);
    if (inputRef.current) inputRef.current.value = "";
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f) void validateAndParse(f);
  };

  const accent = status === "error"
    ? "border-red-400 bg-red-50 dark:bg-red-950/30"
    : dragging
      ? "border-primary bg-primary/10"
      : "border-border bg-card hover:border-primary/60";

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      onClick={() => !disabled && inputRef.current?.click()}
      className={`group relative cursor-pointer rounded-xl border-2 border-dashed p-6 transition ${accent} ${disabled ? "opacity-60 pointer-events-none cursor-not-allowed" : ""}`}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".ics,text/calendar"
        onChange={onChange}
        className="hidden"
        disabled={disabled}
      />
      <div className="flex flex-col items-center gap-3 text-center">
        <div className={`rounded-full p-3 transition ${status === "error" ? "bg-red-100 text-red-600 dark:bg-red-950/50" : dragging ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground group-hover:text-primary group-hover:bg-primary/10"}`}>
          {status === "parsing" ? (
            <FileUp className="h-7 w-7 animate-bounce" />
          ) : status === "error" ? (
            <AlertCircle className="h-7 w-7" />
          ) : (
            <Upload className="h-7 w-7" />
          )}
        </div>
        <div>
          <div className="font-display text-lg font-bold">
            {status === "parsing" ? "กำลังอ่านไฟล์…" : "นำเข้าตารางเรียน"}
          </div>
          <div className="mt-1 text-sm text-muted-foreground">
            {fileName ? `ไฟล์ล่าสุด: ${fileName}` : "คลิกเพื่อเลือก หรือลากไฟล์ .ics มาวางที่นี่"}
          </div>
          <div className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
            <CheckCircle2 className="h-3 w-3 text-emerald-500" />
            รองรับเฉพาะไฟล์ .ics
          </div>
        </div>
      </div>
    </div>
  );
}
