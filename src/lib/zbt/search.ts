// Explainable job matching. Pure algorithmic scoring — no AI claims.
// Every score returns a per-component breakdown so the UI can show WHY a job matched.

import rawJobs from '@/data/jobs.demo.json';
import type { ParsedIntent } from './nlu';

export interface Job {
  job_id: string;
  title: string;
  title_ta: string;
  company: string;
  location: string;
  location_ta: string;
  district: string;
  zone: string;
  state: string;
  salary_min: number;
  salary_max: number;
  experience_min_years: number;
  experience_label: string;
  experience_label_ta: string;
  education: string;
  skills: string[];
  employment_type: string;
  shift: string;
  shift_ta: string;
  description: string;
  description_ta: string;
  category: string;
  source: string;
  source_url: string;
  posted_date: string;
}

export const JOBS = rawJobs as Job[];

export const DATASET_META = {
  count: JOBS.length,
  label: 'DEMO DATA',
  note: 'Synthetic dataset generated deterministically for demonstration. Not real employer listings.',
  generatedOn: '2026-08-26',
};

export interface MatchBreakdown {
  category: number; // 0-100
  location: number; // 0-100
  experience: number; // 0-100
  salary: number; // 0-100
  shift: number; // 0-100
}

export interface ScoredJob {
  job: Job;
  score: number; // 0-100 overall
  breakdown: MatchBreakdown;
}

const WEIGHTS = { category: 0.35, location: 0.25, experience: 0.15, salary: 0.15, shift: 0.1 };

const ZONE_OF_DISTRICT: Record<string, string> = Object.fromEntries(
  JOBS.map((j) => [j.district, j.zone]),
);

function scoreCategory(job: Job, intent: ParsedIntent): number {
  if (!intent.category) return 70; // no constraint -> neutral-positive
  return job.category === intent.category ? 100 : 20;
}

function scoreLocation(job: Job, intent: ParsedIntent): number {
  if (!intent.district) return 70;
  if (job.district === intent.district) return 100;
  if (job.zone === ZONE_OF_DISTRICT[intent.district]) return 55;
  return 25;
}

function scoreExperience(job: Job, intent: ParsedIntent): number {
  const candidate = intent.fresher ? 0 : intent.experienceYears;
  if (candidate === undefined) return 75;
  if (candidate >= job.experience_min_years) return 100;
  const gap = job.experience_min_years - candidate;
  // A fresher cannot honestly claim a 1+ year requirement.
  if (candidate === 0) return gap === 1 ? 30 : 10;
  if (gap <= 1) return 70;
  if (gap <= 2) return 40;
  return 15;
}

function scoreSalary(job: Job, intent: ParsedIntent): number {
  if (!intent.salaryMin) return 75;
  if (job.salary_max >= intent.salaryMin) {
    // How comfortably does the job clear the ask?
    const overshoot = (job.salary_max - intent.salaryMin) / Math.max(intent.salaryMin, 1);
    return overshoot >= 0.2 ? 100 : 85;
  }
  // Job max below ask: how close?
  const shortfall = (intent.salaryMin - job.salary_max) / intent.salaryMin;
  if (shortfall <= 0.1) return 50;
  if (shortfall <= 0.25) return 25;
  return 5;
}

function scoreShift(job: Job, intent: ParsedIntent): number {
  if (intent.excludeShifts.includes(job.shift)) return 0;
  if (intent.preferShift) return job.shift === intent.preferShift ? 100 : 60;
  return 80;
}

export function searchJobs(intent: ParsedIntent, limit = 12): ScoredJob[] {
  const scored: ScoredJob[] = JOBS.map((job) => {
    const breakdown: MatchBreakdown = {
      category: scoreCategory(job, intent),
      location: scoreLocation(job, intent),
      experience: scoreExperience(job, intent),
      salary: scoreSalary(job, intent),
      shift: scoreShift(job, intent),
    };
    const score = Math.round(
      breakdown.category * WEIGHTS.category +
        breakdown.location * WEIGHTS.location +
        breakdown.experience * WEIGHTS.experience +
        breakdown.salary * WEIGHTS.salary +
        breakdown.shift * WEIGHTS.shift,
    );
    return { job, score, breakdown };
  });

  // Hard filter: excluded shifts are non-negotiable.
  const eligible = scored.filter((s) => !intent.excludeShifts.includes(s.job.shift));
  // Drop very poor matches unless result set is thin.
  const good = eligible.filter((s) => s.score >= 45);
  const pool = good.length >= 3 ? good : eligible;

  const ranked = pool.sort((a, b) => b.score - a.score).slice(0, limit);
  return ranked;
}

export function countExactDistrict(results: ScoredJob[], district?: string): number {
  if (!district) return results.length;
  return results.filter((r) => r.job.district === district).length;
}
