// ZeroBarrier client-side persistence: profile, saved jobs, application
// tracker, search history, accessibility settings. All localStorage, no server.

export interface WorkerProfile {
  name: string;
  category?: string;
  district?: string;
  salaryMin?: number;
  experienceYears?: number;
  fresher: boolean;
  education?: string;
  shiftPreference?: string;
  excludeShifts: string[];
  mobile?: string;
  updatedAt: string;
}

export type TrackerStage = 'saved' | 'applied' | 'interview' | 'offer';

export interface TrackerEntry {
  jobId: string;
  stage: TrackerStage;
  note?: string;
  updatedAt: string;
}

const KEYS = {
  profile: 'zb-profile',
  saved: 'zb-saved-jobs',
  tracker: 'zb-tracker',
  history: 'zb-search-history',
  a11y: 'zb-a11y',
} as const;

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage full/blocked */
  }
}

// ---------- profile ----------

export const emptyProfile = (): WorkerProfile => ({
  name: '',
  fresher: false,
  excludeShifts: [],
  updatedAt: new Date().toISOString(),
});

export const getProfile = (): WorkerProfile | null => read<WorkerProfile | null>(KEYS.profile, null);
export const saveProfile = (p: WorkerProfile) => write(KEYS.profile, { ...p, updatedAt: new Date().toISOString() });
export const clearProfile = () => localStorage.removeItem(KEYS.profile);

// ---------- saved jobs ----------

export function getSavedJobs(): string[] {
  return read<string[]>(KEYS.saved, []);
}

export function toggleSaved(jobId: string): boolean {
  const list = getSavedJobs();
  const idx = list.indexOf(jobId);
  if (idx >= 0) {
    list.splice(idx, 1);
    write(KEYS.saved, list);
    return false; // now unsaved
  }
  list.unshift(jobId);
  write(KEYS.saved, list.slice(0, 200));
  return true; // now saved
}

// ---------- application tracker ----------

export function getTracker(): Record<string, TrackerEntry> {
  return read<Record<string, TrackerEntry>>(KEYS.tracker, {});
}

export function setTrackerStage(jobId: string, stage: TrackerStage, note?: string) {
  const all = getTracker();
  all[jobId] = { jobId, stage, note, updatedAt: new Date().toISOString() };
  write(KEYS.tracker, all);
}

export function removeTracker(jobId: string) {
  const all = getTracker();
  delete all[jobId];
  write(KEYS.tracker, all);
}

// ---------- recent searches ----------

export function getSearchHistory(): string[] {
  return read<string[]>(KEYS.history, []);
}

export function pushSearchHistory(query: string) {
  if (!query.trim()) return;
  const list = getSearchHistory().filter((q) => q !== query.trim());
  list.unshift(query.trim());
  write(KEYS.history, list.slice(0, 12));
}

export function clearSearchHistory() {
  localStorage.removeItem(KEYS.history);
}

// ---------- accessibility ----------

export interface A11ySettings {
  largeText: boolean;
  highContrast: boolean;
}

export const getA11y = (): A11ySettings => read<A11ySettings>(KEYS.a11y, { largeText: false, highContrast: false });
export const saveA11y = (s: A11ySettings) => write(KEYS.a11y, s);
