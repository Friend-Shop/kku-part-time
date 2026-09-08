import { Link } from "@tanstack/react-router";
import { CheckCircle2, AlertTriangle, MapPin, Star } from "lucide-react";
import type { RecommendedJob } from "@/lib/student-matches";
import { matchBand } from "@/lib/job-matching";

export function RecommendedJobCard({ item }: { item: RecommendedJob }) {
  const { job, store, match } = item;
  const excellent = match.match_score >= 75;
  return (
    <Link to="/student/job/$id" params={{ id: job.id }} className="group flex h-full flex-col rounded-xl border border-border bg-card p-5 transition hover:-translate-y-0.5 hover:border-primary hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-display text-lg font-bold group-hover:text-primary">{job.title}</h3>
          <p className="mt-1 text-xs text-muted-foreground">{store?.store_name || "สถานประกอบการ"}</p>
        </div>
        <div className={`shrink-0 rounded-lg px-2.5 py-1.5 text-right ${excellent ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
          <div className="flex items-center gap-1 text-sm font-black"><Star className="h-3.5 w-3.5" /> {match.match_score}%</div>
          <div className="text-[9px] font-semibold opacity-80">{matchBand(match.match_score)}</div>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between text-sm">
        <span className="font-bold text-primary">฿{job.hourly_rate} <span className="font-normal text-muted-foreground">/ ชั่วโมง</span></span>
        {match.distance_km != null && <span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="h-3.5 w-3.5" />{match.distance_km.toFixed(1)} km</span>}
      </div>
      <div className="mt-4 space-y-1.5 border-t border-border pt-3 text-xs">
        {match.reasons.slice(0, 3).map(reason => <div key={reason} className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400"><CheckCircle2 className="h-3.5 w-3.5" />{reason}</div>)}
        {match.considerations.slice(0, 1).map(reason => <div key={reason} className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400"><AlertTriangle className="h-3.5 w-3.5" />{reason}</div>)}
      </div>
    </Link>
  );
}
