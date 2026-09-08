import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { SlidersHorizontal, Sparkles } from "lucide-react";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { useAuth } from "@/hooks/use-auth";
import { getRecommendedJobs } from "@/lib/student-matches";
import { RecommendedJobCard } from "@/components/matching/RecommendedJobCard";

export const Route = createFileRoute("/student/recommended")({ component: () => <RoleGuard role="student"><RecommendedPage /></RoleGuard> });

function RecommendedPage() {
  const { user } = useAuth();
  const [minimum, setMinimum] = useState(0);
  const [sort, setSort] = useState("best");
  const { data = [], isLoading } = useQuery({ queryKey: ["recommended-jobs", user?.id], queryFn: () => getRecommendedJobs(user!.id), enabled: !!user?.id, staleTime: 60_000 });
  const jobs = useMemo(() => data.filter(x => x.match.match_score >= minimum).sort((a, b) => sort === "pay" ? b.job.hourly_rate - a.job.hourly_rate : sort === "new" ? +new Date(b.job.created_at) - +new Date(a.job.created_at) : sort === "near" ? (a.match.distance_km ?? Infinity) - (b.match.distance_km ?? Infinity) : b.match.match_score - a.match.match_score), [data, minimum, sort]);
  return <div className="mx-auto max-w-7xl space-y-6">
    <header><div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary"><Sparkles className="h-3.5 w-3.5" /> SMART MATCHING</div><h1 className="mt-3 font-display text-4xl font-bold">งานที่เหมาะกับคุณ</h1><p className="mt-1 text-sm text-muted-foreground">คะแนนอ้างอิงจากตารางเรียน, Skills, ความต้องการ, ค่าแรง และระยะทาง</p></header>
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-3"><SlidersHorizontal className="h-4 w-4 text-muted-foreground" /><select value={minimum} onChange={e => setMinimum(Number(e.target.value))} className="rounded-md border border-input bg-background px-3 py-2 text-sm"><option value={0}>คะแนนทั้งหมด</option><option value={90}>90%+</option><option value={80}>80%+</option><option value={70}>70%+</option></select><select value={sort} onChange={e => setSort(e.target.value)} className="rounded-md border border-input bg-background px-3 py-2 text-sm"><option value="best">Best Match</option><option value="pay">Highest Pay</option><option value="new">Newest</option><option value="near">Nearest</option></select></div>
    {isLoading ? <p className="text-sm text-muted-foreground">กำลังวิเคราะห์งาน…</p> : jobs.length ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{jobs.map(item => <RecommendedJobCard key={item.job.id} item={item} />)}</div> : <div className="rounded-xl border border-dashed border-border p-12 text-center"><h2 className="font-display text-xl font-bold">ยังไม่มีงานที่ตรงกับคุณ</h2><p className="mt-2 text-sm text-muted-foreground">เพิ่ม Skills และตารางเรียนเพื่อให้ระบบแนะนำงานได้แม่นยำขึ้น</p></div>}
  </div>;
}
