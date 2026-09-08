import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { thb } from "@/lib/finance";
export const Route=createFileRoute("/student/earnings")({component:()=> <RoleGuard role="student"><EarningsPage/></RoleGuard>});
function EarningsPage() {
  const { user } = useAuth();
  const { data = [], isLoading } = useQuery({
    queryKey: ["earnings", user?.id], enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase.from("work_schedules" as any).select("id,job_id,work_date,start_time,end_time,status,hourly_rate,total_hours,total_earnings").eq("student_id", user!.id).in("status", ["completed", "scheduled", "confirmed"] as any).order("work_date", { ascending: false });
      if (error) throw error;
      const rows = data ?? []; const ids = [...new Set(rows.map((x: any) => x.job_id))];
      const { data: jobs } = ids.length ? await supabase.from("jobs" as any).select("id,title").in("id", ids) : { data: [] };
      const names = new Map((jobs ?? []).map((x: any) => [x.id, x.title]));
      return rows.map((x: any) => ({ ...x, title: names.get(x.job_id) || "งาน" }));
    },
  });
  const sums = (from: Date) => data.filter((x: any) => new Date(x.work_date) >= from && x.status === "completed").reduce((sum: number, x: any) => sum + Number(x.total_earnings ?? (x.total_hours ?? 0) * (x.hourly_rate ?? 0)), 0);
  const today = new Date(); const week = new Date(today); week.setDate(today.getDate() - today.getDay()); const month = new Date(today.getFullYear(), today.getMonth(), 1);
  const cards = [["วันนี้", sums(new Date(today.toDateString()))], ["สัปดาห์นี้", sums(week)], ["เดือนนี้", sums(month)], ["ทั้งหมด", sums(new Date(0))]];
  return <div className="mx-auto max-w-5xl space-y-6"><header><h1 className="font-display text-4xl font-bold">Earnings</h1><p className="mt-1 text-sm text-muted-foreground">รายได้จริงจากงานที่เสร็จสมบูรณ์ และรายได้ที่คาดหวังจากตารางงาน</p></header><div className="grid gap-3 sm:grid-cols-4">{cards.map(([label, value]) => <div key={String(label)} className="rounded-xl border border-border bg-card p-4"><div className="text-xs text-muted-foreground">{label}</div><div className="mt-1 font-display text-xl font-bold">{thb(Number(value))}</div></div>)}</div>{isLoading ? <p>กำลังโหลด…</p> : <div className="overflow-hidden rounded-xl border border-border bg-card">{data.length ? data.map((x: any) => <div key={x.id} className="flex justify-between border-b border-border p-4"><div><b>{x.title}</b><p className="text-xs text-muted-foreground">{x.work_date} · {x.total_hours ?? "—"} ชม. · ฿{Number(x.hourly_rate ?? 0)}/ชม.</p></div><b className={x.status === "completed" ? "text-emerald-600" : "text-muted-foreground"}>{x.status === "completed" ? thb(Number(x.total_earnings ?? (x.total_hours ?? 0) * (x.hourly_rate ?? 0))) : "Expected"}</b></div>) : <div className="p-12 text-center text-muted-foreground">ยังไม่มีตารางงาน</div>}</div>}</div>;
}
