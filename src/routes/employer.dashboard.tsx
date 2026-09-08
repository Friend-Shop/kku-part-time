import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { BriefcaseBusiness, FileText, Store, Users } from "lucide-react";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/employer/dashboard")({ component: () => <RoleGuard role="employer"><EmployerDashboard /></RoleGuard> });
function EmployerDashboard() {
  const { user } = useAuth();
  const { data = { stores: [] as any[], jobs: [] as any[], applications: [] as any[] }, isLoading } = useQuery({
    queryKey: ["employer-dashboard", user?.id],
    enabled: !!user?.id,
    staleTime: 30_000,
    queryFn: async () => {
      const { data: stores, error } = await supabase
        .from("stores" as any)
        .select("id,store_name,category,address")
        .eq("employer_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      const ids = (stores ?? []).map((s: any) => s.id);
      if (!ids.length) return { stores: [], jobs: [], applications: [] };
      const { data: jobs } = await supabase
        .from("jobs" as any)
        .select("id,title,status,hourly_rate,store_id,vacancies")
        .in("store_id", ids);
      const jobIds = (jobs ?? []).map((j: any) => j.id);
      const { data: applications } = jobIds.length
        ? await supabase.from("applications" as any).select("id,status,job_id").in("job_id", jobIds)
        : { data: [] };
      return { stores: stores ?? [], jobs: jobs ?? [], applications: applications ?? [] };
    },
  });
  return <div className="mx-auto max-w-7xl space-y-6"><header className="flex flex-wrap items-end justify-between gap-3"><div><h1 className="font-display text-4xl font-bold">Employer Dashboard</h1><p className="mt-1 text-sm text-muted-foreground">จัดการร้าน งาน และผู้สมัครของคุณ</p></div><Link to="/employer/jobs" className="rounded-md bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground">สร้างประกาศงาน</Link></header>{isLoading ? <div className="h-40 animate-pulse rounded-xl bg-muted" /> : <><section className="grid gap-4 sm:grid-cols-3"><Stat icon={Store} label="ร้านของฉัน" value={data.stores.length}/><Stat icon={BriefcaseBusiness} label="ประกาศงาน" value={data.jobs.length}/><Stat icon={Users} label="ผู้สมัครทั้งหมด" value={data.applications.length}/></section>{data.stores.length === 0 ? <div className="rounded-xl border border-dashed border-border p-12 text-center"><Store className="mx-auto h-10 w-10 text-muted-foreground"/><h2 className="mt-3 font-display text-xl font-bold">เริ่มจากเพิ่มร้านของคุณ</h2><p className="mt-1 text-sm text-muted-foreground">ต้องมีร้านก่อนจึงจะสร้างประกาศงานได้</p><Link to="/employer/stores" className="mt-5 inline-flex rounded-md bg-primary px-4 py-2 text-sm font-bold text-primary-foreground">เพิ่มร้าน</Link></div> : <section className="rounded-xl border border-border bg-card p-5"><h2 className="font-display text-xl font-bold">ประกาศงานล่าสุด</h2>{data.jobs.length ? <div className="mt-3 space-y-2">{data.jobs.slice(0,5).map((job:any)=><div key={job.id} className="flex items-center justify-between rounded-lg bg-muted/50 p-3"><div><b>{job.title}</b><p className="text-xs text-muted-foreground">฿{job.hourly_rate ?? 0}/ชั่วโมง · {job.status}</p></div><FileText className="h-4 w-4 text-primary"/></div>)}</div> : <p className="mt-4 text-sm text-muted-foreground">ยังไม่มีประกาศงาน</p>}</section>}</>}</div>;
}
function Stat({ icon: Icon, label, value }: any) { return <div className="rounded-xl border border-border bg-card p-5"><Icon className="h-5 w-5 text-primary"/><p className="mt-3 text-xs text-muted-foreground">{label}</p><p className="font-display text-3xl font-bold">{value}</p></div>; }
