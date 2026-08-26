// Browse engine: free-text search, sorting, filtering, pagination over the
// bundled dataset. Pure functions, unit-testable.

import { JOBS, type Job, type ScoredJob } from './search';
import { parseIntent } from './nlu';
import { searchJobs } from './search';

export type SortKey = 'match' | 'salary_desc' | 'salary_asc' | 'newest';

export interface BrowseQuery {
  text: string;
  category?: string;
  district?: string;
  minSalary?: number;
  shifts: string[]; // allowed shifts; empty = all
  education?: string;
  employmentType?: string;
  sort: SortKey;
  page: number;
  pageSize: number;
}

export const defaultBrowseQuery = (): BrowseQuery => ({
  text: '',
  shifts: [],
  sort: 'newest',
  page: 1,
  pageSize: 12,
});

export function filterJobs(q: BrowseQuery): { total: number; pageJobs: Job[]; pages: number } {
  let pool = JOBS;

  if (q.text.trim()) {
    // Reuse the NLU parser so typed search understands Tanglish too,
    // then fall back to substring matching on title/company/skills.
    const intent = parseIntent(q.text);
    if (intent.category || intent.district || intent.salaryMin) {
      const scored: ScoredJob[] = searchJobs(intent, 60);
      const ids = new Set(scored.map((s) => s.job.job_id));
      pool = pool.filter((j) => ids.has(j.job_id));
    } else {
      const needle = q.text.toLowerCase();
      pool = pool.filter(
        (j) =>
          j.title.toLowerCase().includes(needle) ||
          j.company.toLowerCase().includes(needle) ||
          j.location.toLowerCase().includes(needle) ||
          j.skills.some((s) => s.includes(needle)),
      );
    }
  }
  if (q.category) pool = pool.filter((j) => j.category === q.category);
  if (q.district) pool = pool.filter((j) => j.district === q.district);
  if (q.minSalary) pool = pool.filter((j) => j.salary_max >= q.minSalary!);
  if (q.shifts.length) pool = pool.filter((j) => q.shifts.includes(j.shift));
  if (q.education) pool = pool.filter((j) => j.education === q.education);
  if (q.employmentType) pool = pool.filter((j) => j.employment_type === q.employmentType);

  const sorted = [...pool];
  switch (q.sort) {
    case 'salary_desc': sorted.sort((a, b) => b.salary_max - a.salary_max); break;
    case 'salary_asc': sorted.sort((a, b) => a.salary_min - b.salary_min); break;
    case 'newest': sorted.sort((a, b) => b.posted_date.localeCompare(a.posted_date)); break;
    case 'match':
    default: {
      // Match order only meaningful with parsed intent; else newest.
      sorted.sort((a, b) => b.posted_date.localeCompare(a.posted_date));
    }
  }

  const total = sorted.length;
  const pages = Math.max(1, Math.ceil(total / q.pageSize));
  const page = Math.min(Math.max(1, q.page), pages);
  const start = (page - 1) * q.pageSize;
  return { total, pageJobs: sorted.slice(start, start + q.pageSize), pages };
}

export const ALL_CATEGORIES = Array.from(new Set(JOBS.map((j) => j.category))).sort();
export const ALL_DISTRICTS = Array.from(new Set(JOBS.map((j) => j.district))).sort();
export const ALL_SHIFTS = Array.from(new Set(JOBS.map((j) => j.shift)));
export const ALL_EDUCATION = Array.from(new Set(JOBS.map((j) => j.education)));
