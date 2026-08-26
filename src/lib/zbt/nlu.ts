// ZeroBarrier rule-based intent parser.
// Deterministic, offline, explainable. Supports English, Tamil script and Tanglish
// (Tamil words written in Latin script) as spoken in Tamil Nadu.

export interface ParsedIntent {
  category?: string;
  roleKeywords: string[];
  district?: string;
  salaryMin?: number;
  excludeShifts: string[];
  preferShift?: string;
  experienceYears?: number;
  fresher: boolean;
  education?: string;
  employmentType?: string;
  raw: string;
}

const DISTRICT_ALIASES: Record<string, string> = {
  chennai: 'Chennai', 'சென்னை': 'Chennai',
  coimbatore: 'Coimbatore', kovai: 'Coimbatore', 'கோயம்புத்தூர்': 'Coimbatore',
  madurai: 'Madurai', 'மதுரை': 'Madurai',
  salem: 'Salem', 'சேலம்': 'Salem',
  trichy: 'Tiruchirappalli', tiruchirappalli: 'Tiruchirappalli', 'திருச்சிராப்பள்ளி': 'Tiruchirappalli', 'திருச்சி': 'Tiruchirappalli',
  tiruppur: 'Tiruppur', tirupur: 'Tiruppur', 'திருப்பூர்': 'Tiruppur',
  erode: 'Erode', 'ஈரோடு': 'Erode',
  vellore: 'Vellore', 'வேலூர்': 'Vellore',
  thanjavur: 'Thanjavur', tanjore: 'Thanjavur', 'தஞ்சாவூர்': 'Thanjavur',
  tirunelveli: 'Tirunelveli', nellai: 'Tirunelveli', 'திருநெல்வேலி': 'Tirunelveli',
  thoothukudi: 'Thoothukudi', tuticorin: 'Thoothukudi', 'தூத்துக்குடி': 'Thoothukudi',
  dindigul: 'Dindigul', 'திண்டுக்கல்': 'Dindigul',
  karur: 'Karur', 'கரூர்': 'Karur',
  namakkal: 'Namakkal', 'நாமக்கல்': 'Namakkal',
  hosur: 'Hosur', 'ஓசூர்': 'Hosur',
  cuddalore: 'Cuddalore', 'கடலூர்': 'Cuddalore',
  kanchipuram: 'Kanchipuram', 'காஞ்சிபுரம்': 'Kanchipuram',
  tiruvannamalai: 'Tiruvannamalai', 'திருவண்ணாமலை': 'Tiruvannamalai',
  pudukkottai: 'Pudukkottai', 'புதுக்கோட்டை': 'Pudukkottai',
  sivakasi: 'Sivakasi', 'சிவகாசி': 'Sivakasi',
  ranipet: 'Ranipet', 'இராணிப்பேட்டை': 'Ranipet',
  chengalpattu: 'Chengalpattu', 'செங்கல்பட்டு': 'Chengalpattu',
  villupuram: 'Villupuram', 'விழுப்புரம்': 'Villupuram',
  nagapattinam: 'Nagapattinam', 'நாகப்பட்டினம்': 'Nagapattinam',
  dharmapuri: 'Dharmapuri', 'தர்மபுரி': 'Dharmapuri',
  krishnagiri: 'Krishnagiri', 'கிருஷ்ணகிரி': 'Krishnagiri',
  perambalur: 'Perambalur', 'பெரம்பலூர்': 'Perambalur',
  ariyalur: 'Ariyalur', 'அரியலூர்': 'Ariyalur',
  theni: 'Theni', 'தேனி': 'Theni',
  nagercoil: 'Nagercoil', 'நாகர்கோவில்': 'Nagercoil',
};

// category -> keyword aliases (Latin + Tamil)
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  electrician: ['electrician', 'wireman', 'wiring', 'electrical', 'மின்சாரம்', 'எலக்ட்ரீஷியன்', 'மின்சார வேலை', 'வயர்மேன்'],
  technician: ['technician', 'ac technician', 'fridge', 'refrigeration', 'cctv', 'mobile service', 'ac சர்வீஸ்', 'டெக்னீஷியன்'],
  machine_operator: ['machine operator', 'machine', 'packing machine', 'production', 'இயந்திரம்', 'மெஷின்', 'ஆபரேட்டர்'],
  cnc_operator: ['cnc', 'vmc', 'lathe', 'சிஎன்சி', 'லேத்'],
  welder: ['welder', 'welding', 'fabrication', 'வெல்டிங்', 'வெல்டர்'],
  fitter_mechanic: ['fitter', 'mechanic', 'diesel', 'two wheeler mechanic', 'car mechanic', 'மெக்கானிக்', 'பிட்டர்'],
  driver: ['driver', 'drive', 'tempo', 'lorry', 'auto driver', 'bus driver', 'cab', 'ஓட்டுநர்', 'டிரைவர்', 'வாகனம் ஓட்ட'],
  warehouse: ['warehouse', 'godown', 'store keeper', 'picker', 'packer', 'forklift', 'கிடங்கு', 'வேர்ஹவுஸ்', 'பேக்கிங்'],
  delivery: ['delivery', 'courier', 'swiggy', 'zomato', 'டெலிவரி'],
  maintenance: ['maintenance', 'plumber', 'plumbing', 'building maintenance', 'குழாய்', 'பராமரிப்பு', 'பிளம்பர்'],
  security: ['security', 'guard', 'housekeeping', 'watchman', 'காவல்', 'பாதுகாப்பு', 'செக்கியூரிட்டி'],
  retail_sales: ['sales', 'salesman', 'cashier', 'billing', 'telecaller', 'shop assistant', 'store assistant', 'கடை', 'விற்பனை', 'கேஷியர்'],
  hospitality: ['cook', 'cooking', 'kitchen', 'waiter', 'hotel', 'சமையல்', 'சமையல்காரர்', 'ஹோட்டல்'],
  construction: ['construction', 'mason', 'painter', 'carpenter', 'tile', 'scaffold', 'கட்டுமானம்', 'தச்சர்', 'வேலை தளம்'],
  textile: ['tailor', 'tailoring', 'weaving', 'embroidery', 'garment', 'textile', 'தையல்', 'ஜவுளி', 'நெசவு'],
  healthcare_support: ['hospital', 'nursing', 'nurse assistant', 'lab assistant', 'pharmacy helper', 'attender', 'மருத்துவமனை', 'நர்ஸ்'],
  agriculture: ['farm', 'farming', 'dairy', 'nursery', 'agriculture', 'விவசாயம்', 'பண்ணை'],
};

const NEGATION_WORDS = ['vendam', 'venam', 'illa', 'no', 'not', 'avoid', 'வேண்டாம்', 'வேண்டாம்', 'இல்லை'];

function normalize(text: string): string {
  return text.toLowerCase().replace(/[.,!?;:"']/g, ' ').replace(/\s+/g, ' ').trim();
}

export function parseSalary(text: string): number | undefined {
  // "15000", "15,000", "15k", "1.5 lakh", "twenty thousand" not supported (kept honest).
  const lower = text.toLowerCase();

  const kMatch = lower.match(/(\d+(?:\.\d+)?)\s*k\b/);
  if (kMatch) return Math.round(parseFloat(kMatch[1]) * 1000);

  const commaMatch = lower.replace(/,/g, '').match(/₹?\s*(\d{4,6})/);
  if (commaMatch) {
    const val = parseInt(commaMatch[1], 10);
    if (val >= 3000 && val <= 200000) return val;
  }

  const lakhMatch = lower.match(/(\d+(?:\.\d+)?)\s*(?:lakh|lakhs|லட்சம்)/);
  if (lakhMatch) return Math.round(parseFloat(lakhMatch[1]) * 100000);

  return undefined;
}

export function parseDistrict(text: string): string | undefined {
  for (const [alias, canonical] of Object.entries(DISTRICT_ALIASES)) {
    if (text.includes(alias)) return canonical;
  }
  return undefined;
}

/** Canonical district list for pickers (derived from the alias table). */
export function districtOptions(): string[] {
  return Array.from(new Set(Object.values(DISTRICT_ALIASES))).sort();
}

export function parseCategories(text: string): { categories: string[]; keywords: string[] } {
  const categories: string[] = [];
  const keywords: string[] = [];
  for (const [cat, aliases] of Object.entries(CATEGORY_KEYWORDS)) {
    for (const alias of aliases) {
      if (text.includes(alias)) {
        if (!categories.includes(cat)) categories.push(cat);
        if (!keywords.includes(alias)) keywords.push(alias);
      }
    }
  }
  return { categories, keywords };
}

export function parseShifts(text: string): { exclude: string[]; prefer?: string } {
  const exclude: string[] = [];
  let prefer: string | undefined;

  const hasNight = /night|iravu|இரவு/.test(text);
  const hasDay = /\bday\b|pagal|பகல்/.test(text);

  if (hasNight) {
    if (NEGATION_WORDS.some((n) => text.includes(n))) {
      exclude.push('Night');
    } else {
      prefer = 'Night';
    }
  }
  if (hasDay && !hasNight) prefer = 'Day';

  return { exclude, prefer };
}

export function parseExperience(text: string): { years?: number; fresher: boolean } {
  const fresherPatterns = [/fresher/, /experience\s*(illa|illai|il-la|not there|no experience)/, /அனுபவம்\s*இல்லை/, /அனுபவம்\s*வேண்டாம்/];
  if (fresherPatterns.some((p) => p.test(text))) return { years: 0, fresher: true };

  const yrMatch = text.match(/(\d+)\s*(?:years?|yrs?|varusham|ஆண்டு)\b/);
  if (yrMatch) return { years: parseInt(yrMatch[1], 10), fresher: false };

  const expMatch = text.match(/(\d+)\s*experience/);
  if (expMatch) return { years: parseInt(expMatch[1], 10), fresher: false };

  return { years: undefined, fresher: false };
}

export function parseEducation(text: string): string | undefined {
  if (/iti|ஐடிஐ/.test(text)) return 'ITI';
  if (/diploma|டிப்ளமோ/.test(text)) return 'Diploma';
  if (/\bdegree\b|டிகிரி/.test(text)) return 'Any Degree';
  if (/12th|12 th|hsc|பனிரண்டு/.test(text)) return '12th';
  if (/10th|10 th|sslc|பத்தாம்/.test(text)) return '10th';
  if (/8th|8 th|எட்டாம்/.test(text)) return '8th';
  return undefined;
}

export function parseEmploymentType(text: string): string | undefined {
  if (/part.?time|பகுதி நேரம்/.test(text)) return 'Part-time';
  if (/contract|ஒப்பந்த/.test(text)) return 'Contract';
  if (/full.?time|முழு நேரம்/.test(text)) return 'Full-time';
  return undefined;
}

export function parseIntent(raw: string): ParsedIntent {
  const text = normalize(raw);
  const { categories } = parseCategories(text);
  const exp = parseExperience(text);
  const shifts = parseShifts(text);

  return {
    category: categories.length === 1 ? categories[0] : categories[0],
    roleKeywords: categories,
    district: parseDistrict(text),
    salaryMin: parseSalary(text),
    excludeShifts: shifts.exclude,
    preferShift: shifts.prefer,
    experienceYears: exp.years,
    fresher: exp.fresher,
    education: parseEducation(text),
    employmentType: parseEmploymentType(text),
    raw,
  };
}
