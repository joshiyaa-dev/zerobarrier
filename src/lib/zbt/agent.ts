// ZeroBarrier on-device voice agent.
// Deterministic dialogue manager: parse -> fill slots -> ask for missing -> search -> respond.
// Rule-based NLU only. No LLM, no network. Honest by construction.

import { parseIntent, type ParsedIntent } from './nlu';
import { searchJobs, countExactDistrict, DATASET_META, JOBS as JOBS_REF, type ScoredJob } from './search';

export type Lang = 'ta' | 'en';
export type AgentStage = 'idle' | 'need_role' | 'need_location' | 'results';

export interface AgentState {
  stage: AgentStage;
  intent: Partial<ParsedIntent>;
  lastResults?: ScoredJob[];
}

export interface AgentReply {
  text: string;
  state: AgentState;
  results?: ScoredJob[];
}

export const emptyState = (): AgentState => ({ stage: 'idle', intent: {} });

function fmtINR(n: number): string {
  return '₹' + n.toLocaleString('en-IN');
}

export function welcome(lang: Lang): string {
  return lang === 'ta'
    ? `ஜீரோ பேரியருக்கு வரவேற்கிறேன். ${DATASET_META.count} டெமோ வேலைகள் உள்ளன. எந்த வேலை தேடுகிறீர்கள்? உதாரணம்: "கோயம்புத்தூர்ல எலக்ட்ரீஷியன் வேலை, சம்பளம் 15000".`
    : `Welcome to Zero Barrier. I have ${DATASET_META.count} demo jobs. What work are you looking for? For example: "Electrician job in Coimbatore, salary 15000".`;
}

export function handleUserInput(input: string, prevState: AgentState, lang: Lang): AgentReply {
  const text = input.toLowerCase().trim();

  // Global commands
  if (/^(reset|start over|restart|புதுசா|மீண்டும்)/.test(text)) {
    return { text: welcome(lang), state: emptyState() };
  }
  if (/help|உதவி/.test(text) && prevState.stage === 'idle') {
    return {
      text:
        lang === 'ta'
          ? 'நீங்கள் வேலை, இடம், சம்பளம், ஷிஃப்ட் சொல்லலாம். உதாரணம்: "சென்னைல டிரைவர் வேலை, night shift vendam".'
          : 'You can tell me the job, place, salary and shift. Example: "Driver job in Chennai, no night shift".',
      state: prevState,
    };
  }

  const parsed = parseIntent(input);
  const merged: Partial<ParsedIntent> = { ...prevState.intent };

  // Merge new info over old (new values win when present)
  if (parsed.category) merged.category = parsed.category;
  if (parsed.district) merged.district = parsed.district;
  if (parsed.salaryMin) merged.salaryMin = parsed.salaryMin;
  if (parsed.excludeShifts.length) merged.excludeShifts = [...(merged.excludeShifts ?? []), ...parsed.excludeShifts];
  if (parsed.preferShift) merged.preferShift = parsed.preferShift;
  if (parsed.experienceYears !== undefined) merged.experienceYears = parsed.experienceYears;
  if (parsed.fresher) { merged.fresher = true; merged.experienceYears = 0; }
  if (parsed.education) merged.education = parsed.education;
  if (parsed.employmentType) merged.employmentType = parsed.employmentType;

  const asIntent: ParsedIntent = {
    category: merged.category,
    roleKeywords: [],
    district: merged.district,
    salaryMin: merged.salaryMin,
    excludeShifts: merged.excludeShifts ?? [],
    preferShift: merged.preferShift,
    experienceYears: merged.experienceYears,
    fresher: !!merged.fresher,
    education: merged.education,
    employmentType: merged.employmentType,
    raw: input,
  };

  // Slot filling: need at least a role/category to be useful.
  if (!asIntent.category) {
    return {
      text:
        lang === 'ta'
          ? 'எந்த வேலை தேடுகிறீர்கள்? எலக்ட்ரீஷியன், டிரைவர், வெல்டர், டெலிவரி...'
          : 'What kind of work are you looking for? Electrician, driver, welder, delivery...',
      state: { stage: 'need_role', intent: asIntent },
    };
  }

  if (!asIntent.district) {
    return {
      text:
        lang === 'ta'
          ? `${categoryLabel(asIntent.category, 'ta')} வேலை. எந்த ஊரில் பார்க்கவும்?`
          : `${categoryLabel(asIntent.category, 'en')} jobs. Which city or district?`,
      state: { stage: 'need_location', intent: asIntent },
    };
  }

  const results = searchJobs(asIntent);
  if (results.length === 0) {
    return {
      text:
        lang === 'ta'
          ? 'இந்த தேடலுக்கு பொருத்தமான வேலை இல்லை. வேறு ஊர் அல்லது வேலை முயற்சிக்கவும்.'
          : 'No matching jobs found. Try another city or job type.',
      state: { stage: 'results', intent: asIntent },
    };
  }

  // Honesty rule: if the requested district has zero jobs, say so explicitly.
  const exactCount = countExactDistrict(results, asIntent.district);
  let prefix = '';
  if (asIntent.district && exactCount === 0) {
    prefix =
      lang === 'ta'
        ? `${districtLabelTa(asIntent.district)}ல் இப்போது இந்த வேலை இல்லை. அருகிலுள்ள ஊர்களின் முடிவுகள்: `
        : `No such jobs in ${asIntent.district} right now. Showing nearby districts: `;
  }

  const top = results[0];
  const summary =
    lang === 'ta'
      ? `${results.length} வேலைகள் கிட்டத்தட்ட பொருத்தம். முதலில்: ${top.job.title_ta}, ${top.job.location_ta}, சம்பளம் ${fmtINR(top.job.salary_min)} முதல் ${fmtINR(top.job.salary_max)}, ${Math.round(top.score)} சதவீதம் பொருத்தம்.`
      : `${results.length} matching jobs found. Top result: ${top.job.title} in ${top.job.location}, salary ${fmtINR(top.job.salary_min)} to ${fmtINR(top.job.salary_max)} per month, ${Math.round(top.score)} percent match.`;

  return {
    text: prefix + summary,
    results,
    state: { stage: 'results', intent: asIntent },
  };
}

export function categoryLabel(cat: string, lang: Lang): string {
  const labelsTa: Record<string, string> = {
    electrician: 'எலக்ட்ரீஷியன்', technician: 'டெக்னீஷியன்', machine_operator: 'மெஷின் ஆபரேட்டர்',
    cnc_operator: 'சிஎன்சி ஆபரேட்டர்', welder: 'வெல்டர்', fitter_mechanic: 'மெக்கானிக்',
    driver: 'டிரைவர்', warehouse: 'கிடங்கு வேலை', delivery: 'டெலிவரி', maintenance: 'பராமரிப்பு',
    security: 'காவல் வேலை', retail_sales: 'கடை வேலை', hospitality: 'ஹோட்டல் வேலை',
    construction: 'கட்டுமானம்', textile: 'ஜவுளி வேலை', healthcare_support: 'மருத்துவமனை வேலை',
    agriculture: 'விவசாயம்',
  };
  if (lang === 'ta') return labelsTa[cat] ?? cat;
  return cat.replace(/_/g, ' ');
}

function districtLabelTa(district: string): string {
  const job = JOBS_REF.find((j) => j.district === district);
  return job?.location_ta ?? district;
}
