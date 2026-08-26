// Compact job card used by Browse + Saved views. Click opens the detail modal.
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { ScoredJob } from '@/lib/zbt/search';

interface Props {
  job: ScoredJob;
  lang: 'ta' | 'en';
  onOpen?: () => void;
}

const fmt = (n: number) => '₹' + n.toLocaleString('en-IN');

export default function JobCard({ job, lang, onOpen }: Props) {
  const { job: j, score } = job;
  const t = (en: string, ta: string) => (lang === 'ta' ? ta : en);
  return (
    <Card
      onClick={onOpen}
      className={`border-white/10 bg-slate-900/90 p-4 transition ${onOpen ? 'cursor-pointer hover:border-cyan-400/40 hover:bg-slate-800/90' : ''}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-slate-100">{lang === 'ta' ? j.title_ta : j.title}</p>
          <p className="truncate text-xs text-slate-400">{j.company} · {lang === 'ta' ? j.location_ta : j.location}</p>
        </div>
        {score > 0 && (
          <span className={`shrink-0 text-base font-black ${score >= 75 ? 'text-emerald-400' : score >= 55 ? 'text-amber-300' : 'text-slate-300'}`}>
            {score}%
          </span>
        )}
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        <Badge className="bg-emerald-500/15 text-[10px] text-emerald-300 hover:bg-emerald-500/15">
          {fmt(j.salary_min)}–{fmt(j.salary_max)}{t('/mo', '/மாதம்')}
        </Badge>
        <Badge className="bg-slate-700/60 text-[10px] text-slate-200 hover:bg-slate-700/60">{j.shift} shift</Badge>
        <Badge className="bg-slate-700/60 text-[10px] text-slate-200 hover:bg-slate-700/60">{j.posted_date}</Badge>
      </div>
    </Card>
  );
}
