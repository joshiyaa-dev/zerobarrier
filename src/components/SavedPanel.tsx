// Saved jobs + application tracker board + recent search history.
import { useEffect, useMemo, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { JOBS, type ScoredJob } from '@/lib/zbt/search';
import {
  getSavedJobs, getTracker, removeTracker, clearSearchHistory,
  getSearchHistory, type TrackerStage,
} from '@/lib/zbt/store';
import JobCard from './JobCard';
import JobDetail from './JobDetail';

const STAGES: TrackerStage[] = ['saved', 'applied', 'interview', 'offer'];
const STAGE_COLOR: Record<TrackerStage, string> = {
  saved: 'border-slate-500/40',
  applied: 'border-cyan-400/50',
  interview: 'border-amber-400/60',
  offer: 'border-emerald-400/70',
};

export default function SavedPanel({ lang }: { lang: 'ta' | 'en' }) {
  const [version, setVersion] = useState(0);
  const [detail, setDetail] = useState<ScoredJob | null>(null);
  const t = (en: string, ta: string) => (lang === 'ta' ? ta : en);

  useEffect(() => setVersion((v) => v + 1), []);

  const savedIds = useMemo(() => getSavedJobs(), [version]);
  const tracker = useMemo(() => getTracker(), [version]);
  const history = useMemo(() => getSearchHistory(), [version]);

  const savedJobs = savedIds
    .map((id) => JOBS.find((j) => j.job_id === id))
    .filter(Boolean)
    .map((job) => ({ job: job!, score: 0, breakdown: { category: 0, location: 0, experience: 0, salary: 0, shift: 100 } }));

  return (
    <div className="space-y-5">
      {/* Application pipeline */}
      <div>
        <h3 className="mb-2 text-sm font-black uppercase tracking-widest text-cyan-400">
          {t('Application Tracker', 'விண்ணப்ப கண்காணிப்பு')}
        </h3>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {STAGES.map((stage) => {
            const ids = Object.values(tracker).filter((e) => e.stage === stage).map((e) => e.jobId);
            return (
              <div key={stage} className={`rounded-2xl border-2 ${STAGE_COLOR[stage]} bg-slate-950/60 p-3`}>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-300">{stage} ({ids.length})</p>
                <div className="mt-2 space-y-1.5">
                  {ids.map((id) => {
                    const j = JOBS.find((x) => x.job_id === id);
                    if (!j) return null;
                    return (
                      <div key={id} className="group flex items-center gap-1 rounded-lg bg-slate-900 p-2">
                        <button onClick={() => setDetail({ job: j, score: 0, breakdown: { category: 0, location: 0, experience: 0, salary: 0, shift: 100 } })}
                          className="min-w-0 flex-1 truncate text-left text-[11px] font-semibold text-slate-200 hover:text-cyan-300">
                          {lang === 'ta' ? j.title_ta : j.title}
                        </button>
                        <button onClick={() => { removeTracker(id); setVersion((v) => v + 1); }}
                          className="shrink-0 text-slate-600 opacity-0 transition group-hover:opacity-100 hover:text-rose-400" aria-label="Remove">
                          <Trash2 size={12} />
                        </button>
                      </div>
                    );
                  })}
                  {ids.length === 0 && <p className="text-[11px] italic text-slate-600">{t('Empty', 'காலியாக')}</p>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bookmarked jobs */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-black uppercase tracking-widest text-amber-400">
            {t('Saved Jobs', 'சேமித்த வேலைகள்')} ({savedJobs.length})
          </h3>
        </div>
        {savedJobs.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-white/10 p-6 text-center text-sm text-slate-500">
            {t('Bookmark jobs from Browse or search results — they appear here.', 'வேலைகளை இங்கே சேமிக்கவும்.')}
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {savedJobs.slice(0, 24).map((sj) => (
              <JobCard key={sj.job.job_id} job={sj} lang={lang} onOpen={() => setDetail(sj)} />
            ))}
          </div>
        )}
      </div>

      {/* Recent searches */}
      {history.length > 0 && (
        <div>
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">{t('Recent Searches', 'அண்மை தேடல்கள்')}</h3>
            <button onClick={() => { clearSearchHistory(); setVersion((v) => v + 1); }}
              className="text-[11px] font-bold text-rose-300 hover:text-rose-200">✕ clear</button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {history.map((h) => (
              <span key={h} className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-300">{h}</span>
            ))}
          </div>
        </div>
      )}

      <JobDetail scored={detail} lang={lang} onClose={() => setDetail(null)} />
    </div>
  );
}
