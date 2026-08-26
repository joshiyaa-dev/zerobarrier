// Explainable job results panel. Shows the WHY behind every match score.
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { ScoredJob } from '@/lib/zbt/search';

interface Props {
  results: ScoredJob[];
  lang: 'ta' | 'en';
}

const fmt = (n: number) => '₹' + n.toLocaleString('en-IN');

function Bar({ label, value }: { label: string; value: number }) {
  const color = value >= 80 ? 'bg-emerald-500' : value >= 50 ? 'bg-amber-400' : 'bg-rose-500';
  return (
    <div className="flex items-center gap-2 text-[11px]">
      <span className="w-20 shrink-0 text-slate-400">{label}</span>
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-700">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${value}%` }} />
      </div>
      <span className="w-8 text-right font-mono text-slate-300">{value}%</span>
    </div>
  );
}

export default function JobResultsPanel({ results, lang }: Props) {
  if (results.length === 0) return null;
  const t = (en: string, ta: string) => (lang === 'ta' ? ta : en);

  return (
    <div className="w-full max-w-xl space-y-3">
      <div className="flex items-center justify-between px-1">
        <p className="text-xs font-bold uppercase tracking-widest text-cyan-400">
          {t('Matching Jobs', 'பொருத்தமான வேலைகள்')}
        </p>
        <Badge variant="outline" className="border-amber-500/40 bg-amber-500/10 text-[10px] text-amber-300">
          DEMO DATA · Algorithmic Match
        </Badge>
      </div>

      <div className="max-h-[46vh] space-y-3 overflow-y-auto pr-1">
        {results.slice(0, 6).map(({ job, score, breakdown }, idx) => (
          <Card key={job.job_id} className="border-white/10 bg-slate-900/90 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-base font-bold text-slate-100">
                  {idx === 0 && '⭐ '}
                  {lang === 'ta' ? job.title_ta : job.title}
                </p>
                <p className="truncate text-xs text-slate-400">{job.company} · {lang === 'ta' ? job.location_ta : job.location}</p>
              </div>
              <div className="flex flex-col items-center">
                <span className={`text-lg font-black ${score >= 75 ? 'text-emerald-400' : score >= 55 ? 'text-amber-300' : 'text-slate-300'}`}>
                  {score}%
                </span>
                <span className="text-[9px] uppercase tracking-wider text-slate-500">match</span>
              </div>
            </div>

            <div className="mt-2 flex flex-wrap gap-1.5">
              <Badge className="bg-emerald-500/15 text-[10px] text-emerald-300 hover:bg-emerald-500/15">
                {fmt(job.salary_min)}–{fmt(job.salary_max)}{t('/mo', '/மாதம்')}
              </Badge>
              <Badge className="bg-slate-700/60 text-[10px] text-slate-200 hover:bg-slate-700/60">
                {lang === 'ta' ? job.experience_label_ta : job.experience_label}
              </Badge>
              <Badge className="bg-slate-700/60 text-[10px] text-slate-200 hover:bg-slate-700/60">
                {lang === 'ta' ? `${job.shift_ta} ஷிஃப்ட்` : `${job.shift} shift`}
              </Badge>
              <Badge className="bg-slate-700/60 text-[10px] text-slate-200 hover:bg-slate-700/60">{job.education}</Badge>
            </div>

            <details className="group mt-2">
              <summary className="cursor-pointer list-none text-[11px] font-semibold text-cyan-400">
                {t('Why this score?', 'இந்த மதிப்பெண் ஏன்?')}
              </summary>
              <div className="mt-2 space-y-1">
                <Bar label={t('Role', 'வேலை')} value={breakdown.category} />
                <Bar label={t('Location', 'இடம்')} value={breakdown.location} />
                <Bar label={t('Experience', 'அனுபவம்')} value={breakdown.experience} />
                <Bar label={t('Salary', 'சம்பளம்')} value={breakdown.salary} />
                <Bar label={t('Shift', 'ஷிஃப்ட்')} value={breakdown.shift} />
              </div>
            </details>
          </Card>
        ))}
      </div>
    </div>
  );
}
