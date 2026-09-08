import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, CheckCheck } from "lucide-react";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/student/notifications")({ component: () => <RoleGuard role="student"><Notifications /></RoleGuard> });
function Notifications() {
  const { user } = useAuth(); const qc = useQueryClient();
  const { data = [] } = useQuery({ queryKey: ["student-notifications", user?.id], enabled: !!user?.id, queryFn: async () => { const { data, error } = await supabase.from("notifications").select("*").eq("user_id", user!.id).order("created_at", { ascending: false }).limit(50); if (error) throw error; return data; } });
  const markAll = async () => { await supabase.from("notifications").update({ is_read: true }).eq("user_id", user!.id).eq("is_read", false); await qc.invalidateQueries({ queryKey: ["student-notifications", user?.id] }); };
  const mark = async (id: string) => { await supabase.from("notifications").update({ is_read: true }).eq("id", id); await qc.invalidateQueries({ queryKey: ["student-notifications", user?.id] }); };
  return <div className="mx-auto max-w-3xl space-y-6"><header className="flex items-center justify-between"><div><h1 className="font-display text-4xl font-bold">การแจ้งเตือน</h1><p className="mt-1 text-sm text-muted-foreground">สถานะใบสมัคร งานที่แนะนำ และตารางงาน</p></div><button onClick={markAll} className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm font-semibold"><CheckCheck className="h-4 w-4" />อ่านทั้งหมด</button></header>{data.length ? <div className="space-y-2">{data.map(n => <button key={n.id} onClick={() => mark(n.id)} className={`w-full rounded-xl border p-4 text-left ${n.is_read ? "border-border bg-card" : "border-primary/40 bg-primary/5"}`}><div className="flex gap-3"><Bell className="mt-0.5 h-4 w-4 text-primary" /><div><div className="font-bold">{n.title}</div>{n.message && <p className="mt-1 text-sm text-muted-foreground">{n.message}</p>}<p className="mt-2 text-xs text-muted-foreground">{new Date(n.created_at).toLocaleString("th-TH")}</p></div></div></button>)}</div> : <div className="rounded-xl border border-dashed border-border p-12 text-center text-muted-foreground">ยังไม่มีการแจ้งเตือน</div>}</div>;
}
