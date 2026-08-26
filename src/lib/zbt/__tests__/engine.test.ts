import { describe, it, expect } from 'vitest';
import { parseIntent, parseSalary } from '../nlu';
import { searchJobs, JOBS } from '../search';
import { handleUserInput, welcome, emptyState } from '../agent';

describe('nlu.parseIntent', () => {
  it('parses English: role + district + salary', () => {
    const p = parseIntent('Coimbatore electrician jobs, minimum 15000');
    expect(p.category).toBe('electrician');
    expect(p.district).toBe('Coimbatore');
    expect(p.salaryMin).toBe(15000);
  });

  it('parses Tanglish with negated night shift', () => {
    const p = parseIntent('Chennai la machine operator job venum, night shift vendam');
    expect(p.category).toBe('machine_operator');
    expect(p.district).toBe('Chennai');
    expect(p.excludeShifts).toContain('Night');
  });

  it('parses Tamil script location and role', () => {
    const p = parseIntent('சென்னைல ஓட்டுநர் வேலை வேணும்');
    expect(p.district).toBe('Chennai');
    expect(p.category).toBe('driver');
  });

  it('parses salary in k format', () => {
    expect(parseSalary('salary minimum 15k venum')).toBe(15000);
    expect(parseSalary('20000')).toBe(20000);
    expect(parseSalary('1.5 lakh')).toBe(150000);
  });

  it('detects fresher / no experience', () => {
    const p = parseIntent('Experience illa, any job in Salem');
    expect(p.fresher).toBe(true);
    expect(p.experienceYears).toBe(0);
    expect(p.district).toBe('Salem');
  });

  it('parses experience years', () => {
    const p = parseIntent('3 years experience welder in Madurai');
    expect(p.experienceYears).toBe(3);
    expect(p.category).toBe('welder');
  });
});

describe('search.searchJobs', () => {
  it('dataset has 500+ jobs all labelled DEMO DATA', () => {
    expect(JOBS.length).toBeGreaterThanOrEqual(500);
    expect(JOBS.every((j) => j.source === 'DEMO DATA')).toBe(true);
  });

  it('returns results ranked by score for a full query', () => {
    const intent = parseIntent('Coimbatore electrician jobs minimum 15000');
    const res = searchJobs(intent);
    expect(res.length).toBeGreaterThan(0);
    expect(res[0].job.category).toBe('electrician');
    expect(res[0].job.district).toBe('Coimbatore');
    expect(res[0].score).toBeGreaterThanOrEqual(res[res.length - 1].score);
  });

  it('never returns excluded shifts', () => {
    const intent = parseIntent('Chennai la machine operator job, night shift vendam');
    const res = searchJobs(intent);
    expect(res.every((r) => r.job.shift !== 'Night')).toBe(true);
  });

  it('respects fresher constraint ordering (fresher-friendly first)', () => {
    const intent = parseIntent('fresher electrician job in Chennai');
    const res = searchJobs(intent);
    expect(res.length).toBeGreaterThan(0);
    // A fresher must never see a 2+ year requirement as the top result.
    expect(res[0].job.experience_min_years).toBeLessThanOrEqual(1);
  });
});

describe('agent.handleUserInput', () => {
  it('full freeform query returns results with summary', () => {
    const reply = handleUserInput('Coimbatore la electrician jobs irukka? salary 15000', emptyState(), 'en');
    expect(reply.results?.length ?? 0).toBeGreaterThan(0);
    expect(reply.text).toMatch(/matching jobs found/);
    expect(reply.state.stage).toBe('results');
  });

  it('asks for role when input has none, then fills slots across turns', () => {
    let reply = handleUserInput('hello I want a job', emptyState(), 'en');
    expect(reply.state.stage).toBe('need_role');

    reply = handleUserInput('welder', reply.state, 'en');
    expect(reply.state.stage).toBe('need_location');
    expect(reply.state.intent.category).toBe('welder');

    reply = handleUserInput('Madurai', reply.state, 'en');
    expect(reply.state.stage).toBe('results');
    // Honest fallback: if Madurai has no welder jobs, the reply must say so.
    const hasExact = (reply.results ?? []).some((r) => r.job.district === 'Madurai');
    if (!hasExact) {
      expect(reply.text).toMatch(/No such jobs in Madurai/);
    } else {
      expect(reply.results?.[0].job.district).toBe('Madurai');
    }
  });

  it('reset command restarts dialogue', () => {
    const s = handleUserInput('driver chennai', emptyState(), 'en').state;
    const reply = handleUserInput('reset', s, 'en');
    expect(reply.state.stage).toBe('idle');
    expect(reply.text).toBe(welcome('en'));
  });
});
