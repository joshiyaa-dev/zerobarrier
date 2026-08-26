// Browse-all screen: filters, sort, pagination, free-text search over 520 jobs.
import { useMemo, useState } from 'react';
import { Search, SlidersHorizontal, ChevronLeft, ChevronRight } from 'lucide-react';
import {
  defaultBrowseQuery, filterJobs, ALL_CATEGORIES, ALL_DISTRICTS,
  ALL_SHIFTS, type SortKey, type BrowseQuery,
} from '@/lib/zbt/browse';
import { JOBS } from '@/lib/zbt/search';
import JobCard from './JobCard';
import JobDetail from './JobDetail';
import type { ScoredJob } from '@/lib/zbt/search';
import { getSearchHistory } from '@/lib/zbt/store';

const fmt = (n: number) => '₹' + Math.round(n / 1000) + 'k';

export default function BrowseJobs({ lang }: { lang: 'ta' | 'en' }) {
  const [q, setQ] = useState<BrowseQuery>(defaultBrowseQuery);
  const [showFilters, setShowFilters] = useState(false);
  const [detail, setDetail] = useState<ScoredJob | null>(null);
  const t = (en: string, ta: string) => (lang === 'ta' ? ta : en);

  const result = useMemo(() => filterJobs(q), [q]);
  const history = useMemo(() => getSearchHistory(), []);

  const set = (patch: Partial<BrowseQuery>) => setQ((prev) => ({ ...prev, page: 1, ...patch }));

  const toggleShift = (s: string) =>
    set({ shifts: q.shifts.includes(s) ? q.shifts.filter((x) => x !== s) : [...q.shifts, s] });

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            value={q.text}
            onChange={(e) => set({ text: e.target.value })}
            placeholder={t('Search jobs… (Tanglish works!)', 'வேலை தேடு… (Tanglish ok!)')}
            className="w-full rounded-full border border-white/10 bg-slate-900 py-2.5 pl-9 pr-3 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
          />
          {history.length > 0 && !q.text && (
            <div className="mt-1.5 flex flex-wrap gap-1">
              {history.slice(0, 6).map((h) => (
                <button key={h} onClick={() => set({ text: h })}
                  className="rounded-full bg-slate-800 px-2.5 py-0.5 text-[11px] text-slate-300 hover:bg-slate-700">
                  ↺ {h}
                </button>
              ))}
            </div>
          )}
        </div>
        <select value={q.sort} onChange={(e) => set({ sort: e.target.value as SortKey })}
          className="rounded-full border border-white/10 bg-slate-900 px-3 text-xs text-white">
          <option value="newest">{t('Newest', 'புதியவை')}</option>
          <option value="salary_desc">Salary ↓</option>
          <option value="salary_asc">Salary ↑</option>
        </select>
        <button onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-1 rounded-full border px-3 text-xs font-bold ${showFilters ? 'border-cyan-400 bg-cyan-500/20 text-cyan-300' : 'border-white/10 bg-slate-900 text-slate-300'}`}>
          <SlidersHorizontal size={14} /> Filters
        </button>
      </div>

      {showFilters && (
        <div className="grid grid-cols-2 gap-3 rounded-2xl border border-white/10 bg-slate-950/60 p-4 sm:grid-cols-4">
          <label className="text-xs text-slate-400">{t('Category', 'வகை')}
            <select value={q.category ?? ''} onChange={(e) => set({ category: e.target.value || undefined })}
              className="mt-1 w-full rounded-lg bg-slate-800 p-2 text-sm text-white">
              <option value="">All</option>
              {ALL_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>
          <label className="text-xs text-slate-400">{t('District', 'மாவட்டம்')}
            <select value={q.district ?? ''} onChange={(e) => set({ district: e.target.value || undefined })}
              className="mt-1 w-full rounded-lg bg-slate-800 p-2 text-sm text-white">
              <option value="">All</option>
              {ALL_DISTRICTS.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </label>
          <label className="text-xs text-slate-400">{t('Education', 'கல்வி')}
            <select value={q.education ?? ''} onChange={(e) => set({ education: e.target.value || undefined })}
              className="mt-1 w-full rounded-lg bg-slate-800 p-2 text-sm text-white">
              <option value="">All</option>
              {ALL_EDUCATION.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </label>
          <label className="text-xs text-slate-400">{t('Min salary', 'குறைந்த சம்பளம்')}: {q.minSalary ? fmt(q.minSalary) : t('any', 'எதுவும்')}
            <input type="range" min={0} max={60000} step={2500} value={q.minSalary ?? 0}
              onChange={(e) => set({ minSalary: Number(e.target.value) || undefined })}
              className="mt-2 w-full accent-cyan-400" />
          </label>
          <div className="col-span-2 sm:col-span-4">
            <p className="mb-1 text-xs text-slate-400">{t('Shifts allowed (none = all)', 'ஷிஃப்ட்')}</p>
            <div className="flex flex-wrap gap-1.5">
              {ALL_SHIFTS.map((s) => (
                <button key={s} onClick={() => toggleShift(s)}
                  className={`rounded-full px-3 py-1 text-[11px] font-bold ${q.shifts.includes(s) ? 'bg-cyan-500 text-black' : 'bg-slate-800 text-slate-300'}`}>
                  {s}
                </button>
              ))}
              {(q.category || q.district || q.education || q.minSalary || q.shifts.length) && (
                <button onClick={() => set(defaultBrowseQuery())} className="rounded-full bg-rose-500/20 px-3 py-1 text-[11px] font-bold text-rose-300">✕ clear</button>
              )}
            </div>
          </div>
        </div>
      )}

      <p className="text-xs font-semibold text-slate-400">
        {result.total} {t('jobs found', 'வேலைகள்')} · {JOBS.length} total · page {result.page}/{result.pages}
      </p>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {result.pageJobs.map((job) => (
          <JobCard key={job.job_id} job={{ job, score: 0, breakdown: { category: 0, location: 0, experience: 0, salary: 0, shift: 100 } }} lang={lang} onOpen={() => setDetail({ job, score: 0, breakdown: { category: 0, location: 0, experience: 0, salary: 0, shift: 100 } })} />
        ))}
      </div>

      {result.pages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-2">
          <button disabled={result.page <= 1} onClick={() => setQ((p) => ({ ...p, page: p.page - 1 }))}
            className="rounded-full bg-slate-800 p-2 text-white disabled:opacity-30"><ChevronLeft size={18} /></button>
          <span className="text-sm text-slate-300">{result.page} / {result.pages}</span>
          <button disabled={result.page >= result.pages} onClick={() => setQ((p) => ({ ...p, page: p.page + 1 }))}
            className="rounded-full bg-slate-800 p-2 text-white disabled:opacity-30"><ChevronRight size={18} /></button>
        </div>
      )}

      <JobDetail scored={detail} lang={lang} onClose={() => setDetail(null)} />
    </div>
  );
}
