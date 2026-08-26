// Job detail modal: full info, match breakdown, share, save, tracker stage.
import { useEffect, useState } from 'react';
import { X, Share2, Bookmark, BookmarkCheck } from 'lucide-react';
import type { ScoredJob } from '@/lib/zbt/search';
import { toggleSaved } from '@/lib/zbt/store';
import { setTrackerStage, getTracker, removeTracker, type TrackerStage } from '@/lib/zbt/store';

interface Props {
  scored: ScoredJob | null;
  lang: 'ta' | 'en';
  onClose: () => void;
}

const fmt = (n: number) => '₹' + n.toLocaleString('en-IN');

function Bar({ label, value }: { label: string; value: number }) {
  const color = value >= 80 ? 'bg-emerald-500' : value >= 50 ? 'bg-amber-400' : 'bg-rose-500';
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-24 shrink-0 text-slate-400">{label}</span>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-700">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${value}%` }} />
      </div>
      <span className="w-9 text-right font-mono text-slate-300">{value}%</span>
    </div>
  );
}

export default function JobDetail({ scored, lang, onClose }: Props) {
  const [saved, setSaved] = useState(false);
  const [stage, setStage] = useState<TrackerStage | null>(null);
  const [shared, setShared] = useState(false);

  useEffect(() => {
    if (!scored) return;
    try {
      import('@/lib/zbt/store').then((s) => {
        setSaved(s.getSavedJobs().includes(scored.job.job_id));
        setStage(s.getTracker()[scored.job.job_id]?.stage ?? null);
      });
    } catch { /* noop */ }
  }, [scored]);

  if (!scored) return null;
  const { job, score, breakdown } = scored;
  const t = (en: string, ta: string) => (lang === 'ta' ? ta : en);

  const share = async () => {
    const text = `${job.title} — ${job.company}, ${job.location}. ${fmt(job.salary_min)}-${fmt(job.salary_max)}/mo. Via ZeroBarrier.`;
    try {
      if (navigator.share) {
        await navigator.share({ title: job.title, text });
      } else {
        await navigator.clipboard.writeText(text);
        setShared(true);
        setTimeout(() => setShared(false), 2000);
      }
    } catch { /* user cancelled */ }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 sm:items-center sm:p-6" onClick={onClose}>
      <div
        className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-3xl border border-white/10 bg-slate-900 p-6 sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-xl font-black text-white">{t(job.title_ta, job.title)}</h3>
            <p className="text-sm text-slate-400">{job.company} · {job.location}</p>
          </div>
          <button onClick={onClose} aria-label="Close" className="rounded-full bg-slate-800 p-2 text-slate-300 hover:bg-slate-700">
            <X size={16} />
          </button>
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-bold text-emerald-300">{fmt(job.salary_min)}–{fmt(job.salary_max)}{t('/மாதம்', '/mo')}</span>
          <span className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-200">{job.shift} shift</span>
          <span className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-200">{job.experience_label}</span>
          <span className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-200">{job.education}</span>
          <span className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-200">{job.employment_type}</span>
          <span className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-200">Posted {job.posted_date}</span>
        </div>

        <p className="mt-4 text-sm leading-relaxed text-slate-300">{lang === 'ta' ? job.description_ta : job.description}</p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {job.skills.map((s) => (
            <span key={s} className="rounded-md bg-cyan-500/10 px-2 py-0.5 text-[11px] font-semibold text-cyan-300">{s}</span>
          ))}
        </div>

        <details className="mt-4 rounded-xl border border-white/10 bg-slate-950/60 p-4" open>
          <summary className="cursor-pointer text-sm font-bold text-cyan-400">
            {t('Why this score?', 'இந்த மதிப்பெண் ஏன்?')} — {score}%
          </summary>
          <div className="mt-3 space-y-1.5">
            <Bar label={t('Role', 'வேலை')} value={breakdown.category} />
            <Bar label={t('Location', 'இடம்')} value={breakdown.location} />
            <Bar label={t('Experience', 'அனுபவம்')} value={breakdown.experience} />
            <Bar label={t('Salary', 'சம்பளம்')} value={breakdown.salary} />
            <Bar label={t('Shift', 'ஷிஃப்ட்')} value={breakdown.shift} />
          </div>
        </details>

        <div className="mt-5 space-y-3">
          <div className="flex gap-2">
            <button
              onClick={() => setSaved(toggleSaved(job.job_id))}
              className={`flex flex-1 items-center justify-center gap-2 rounded-full py-2.5 text-sm font-bold ${saved ? 'bg-amber-500/20 text-amber-300' : 'bg-slate-800 text-slate-200 hover:bg-slate-700'}`}
            >
              {saved ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
              {saved ? t('Saved', 'சேமிக்கப்பட்டது') : t('Save job', 'சேமி')}
            </button>
            <button onClick={share} className="flex flex-1 items-center justify-center gap-2 rounded-full bg-slate-800 py-2.5 text-sm font-bold text-slate-200 hover:bg-slate-700">
              <Share2 size={16} /> {shared ? t('Copied!', 'நகல்!') : t('Share', 'பங்கிடு')}
            </button>
          </div>

          <div>
            <p className="mb-1.5 text-xs font-bold uppercase tracking-wider text-slate-500">{t('Application status', 'விண்ணப்ப நிலை')}</p>
            <div className="grid grid-cols-5 gap-1">
              {(['saved', 'applied', 'interview', 'offer'] as TrackerStage[]).map((s) => (
                <button
                  key={s}
                  onClick={() => { setTrackerStage(job.job_id, s); setStage(s); }}
                  className={`rounded-lg py-2 text-[11px] font-bold capitalize ${stage === s ? 'bg-cyan-500 text-black' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
                >
                  {s}
                </button>
              ))}
              <button
                onClick={() => { removeTracker(job.job_id); setStage(null); }}
                className="rounded-lg bg-slate-800 py-2 text-[11px] font-bold text-rose-300 hover:bg-slate-700"
              >
                clear
              </button>
            </div>
          </div>
        </div>

        <p className="mt-4 text-center text-[10px] text-slate-600">{job.source} · {job.job_id}</p>
      </div>
    </div>
  );
}
