// Deterministic DEMO dataset generator for ZeroBarrier.
// Produces realistic-but-synthetic blue/grey-collar job records for Tamil Nadu.
// Every record is labelled source:"DEMO DATA". No real employer listings are used.
// Run: node scripts/generate-jobs.mjs  ->  src/data/jobs.demo.json
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(__dirname, '../src/data/jobs.demo.json');

// Deterministic PRNG (mulberry32)
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(20260826);
const pick = (arr) => arr[Math.floor(rand() * arr.length)];
const randInt = (min, max) => Math.floor(rand() * (max - min + 1)) + min;

const DISTRICTS = [
  { city: 'Chennai', ta: 'சென்னை', zone: 'north' },
  { city: 'Coimbatore', ta: 'கோயம்புத்தூர்', zone: 'west' },
  { city: 'Madurai', ta: 'மதுரை', zone: 'south' },
  { city: 'Salem', ta: 'சேலம்', zone: 'west' },
  { city: 'Tiruchirappalli', ta: 'திருச்சிராப்பள்ளி', zone: 'central' },
  { city: 'Tiruppur', ta: 'திருப்பூர்', zone: 'west' },
  { city: 'Erode', ta: 'ஈரோடு', zone: 'west' },
  { city: 'Vellore', ta: 'வேலூர்', zone: 'north' },
  { city: 'Thanjavur', ta: 'தஞ்சாவூர்', zone: 'delta' },
  { city: 'Tirunelveli', ta: 'திருநெல்வேலி', zone: 'south' },
  { city: 'Thoothukudi', ta: 'தூத்துக்குடி', zone: 'south' },
  { city: 'Dindigul', ta: 'திண்டுக்கல்', zone: 'south' },
  { city: 'Karur', ta: 'கரூர்', zone: 'west' },
  { city: 'Namakkal', ta: 'நாமக்கல்', zone: 'west' },
  { city: 'Hosur', ta: 'ஓசூர்', zone: 'west' },
  { city: 'Cuddalore', ta: 'கடலூர்', zone: 'delta' },
  { city: 'Kanchipuram', ta: 'காஞ்சிபுரம்', zone: 'north' },
  { city: 'Tiruvannamalai', ta: 'திருவண்ணாமலை', zone: 'north' },
  { city: 'Pudukkottai', ta: 'புதுக்கோட்டை', zone: 'central' },
  { city: 'Sivakasi', ta: 'சிவகாசி', zone: 'south' },
  { city: 'Ranipet', ta: 'இராணிப்பேட்டை', zone: 'north' },
  { city: 'Chengalpattu', ta: 'செங்கல்பட்டு', zone: 'north' },
  { city: 'Villupuram', ta: 'விழுப்புரம்', zone: 'delta' },
  { city: 'Nagapattinam', ta: 'நாகப்பட்டினம்', zone: 'delta' },
  { city: 'Dharmapuri', ta: 'தர்மபுரி', zone: 'west' },
  { city: 'Krishnagiri', ta: 'கிருஷ்ணகிரி', zone: 'west' },
  { city: 'Perambalur', ta: 'பெரம்பலூர்', zone: 'central' },
  { city: 'Ariyalur', ta: 'அரியலூர்', zone: 'central' },
  { city: 'Theni', ta: 'தேனி', zone: 'south' },
  { city: 'Nagercoil', ta: 'நாகர்கோவில்', zone: 'south' },
];

const COMPANY_PREFIX = ['Sri Balaji', 'Annai', 'Kovai', 'Vasan', 'Bharath', 'Amman', 'Murugan', 'Ganesh', 'Lakshmi', 'SKS', 'RR', 'SV', 'Vel', 'Sakthi', 'Arasu', 'Jaya', 'Meenakshi', 'Kamban', 'Ponni', 'Chella'];
const COMPANY_SUFFIX = {
  industrial: ['Industries', 'Engineering Works', 'Technologies', 'Manufacturing', 'Automation'],
  textiles: ['Textiles', 'Garments', 'Spinning Mills', 'Apparels'],
  logistics: ['Logistics', 'Transports', 'Cargo Movers', 'Speed Couriers'],
  services: ['Facility Services', 'Services Pvt Ltd', 'Manpower Solutions', 'Support Services'],
  retail: ['Super Market', 'Retail India', 'Stores', 'Traders'],
  food: ['Foods', 'Hotels', 'Restaurant', 'Caterers'],
  healthcare: ['Hospitals', 'Medical Centre', 'Healthcare', 'Clinics'],
  security: ['Security Services', 'Safety Force', 'Guard Solutions'],
};

// category -> roles with salary bands (₹/month, realistic TN bands), skills, education bias
const ROLES = [
  { cat: 'electrician', suffix: 'industrial', titles: [
    { en: 'Electrician', ta: 'எலக்ட்ரீஷியன்', min: 14000, max: 22000 },
    { en: 'Wireman', ta: 'மின் கம்பி பணியாளர்', min: 13000, max: 20000 },
    { en: 'Electrical Maintenance Technician', ta: 'மின் பராமரிப்பு தொழில்நுட்பர்', min: 16000, max: 26000 } ],
    skills: ['wiring', 'panel wiring', 'motor repair', 'troubleshooting', 'installation'], edu: ['ITI', 'Diploma', '10th'] },
  { cat: 'technician', suffix: 'industrial', titles: [
    { en: 'AC Technician', ta: 'ஏசி டெக்னீஷியன்', min: 15000, max: 25000 },
    { en: 'Refrigeration Technician', ta: 'குளிர்சாதன டெக்னீஷியன்', min: 15000, max: 24000 },
    { en: 'CCTV Technician', ta: 'சிசிடிவி டெக்னீஷியன்', min: 13000, max: 21000 },
    { en: 'Mobile Service Technician', ta: 'மொபைல் சர்வீஸ் டெக்னீஷியன்', min: 12000, max: 20000 } ],
    skills: ['installation', 'servicing', 'fault diagnosis', 'repairs'], edu: ['ITI', 'Diploma', '12th'] },
  { cat: 'machine_operator', suffix: 'industrial', titles: [
    { en: 'Machine Operator', ta: 'இயந்திர ஆபரேட்டர்', min: 14000, max: 22000 },
    { en: 'Packing Machine Operator', ta: 'பேக்கிங் இயந்திர ஆபரேட்டர்', min: 13000, max: 20000 },
    { en: 'Textile Machine Operator', ta: 'ஜவுளி இயந்திர ஆபரேட்டர்', min: 13000, max: 21000 } ],
    skills: ['machine handling', 'quality check', 'production line'], edu: ['10th', '12th', 'ITI'] },
  { cat: 'cnc_operator', suffix: 'industrial', titles: [
    { en: 'CNC Operator', ta: 'சிஎன்சி ஆபரேட்டர்', min: 17000, max: 28000 },
    { en: 'VMC Operator', ta: 'விஎம்சி ஆபரேட்டர்', min: 16000, max: 27000 },
    { en: 'CNC Setting Technician', ta: 'சிஎன்சி செட்டிங் டெக்னீஷியன்', min: 19000, max: 32000 } ],
    skills: ['CNC turning', 'milling', 'G-code basics', 'tool setting', 'blueprint reading'], edu: ['ITI', 'Diploma'] },
  { cat: 'welder', suffix: 'industrial', titles: [
    { en: 'Welder (ARC)', ta: 'வெல்டர் (ARC)', min: 15000, max: 24000 },
    { en: 'Welder (MIG)', ta: 'வெல்டர் (MIG)', min: 16000, max: 26000 },
    { en: 'Fabrication Welder', ta: 'ஃபேப்ரிகேஷன் வெல்டர்', min: 15000, max: 25000 } ],
    skills: ['arc welding', 'MIG welding', 'TIG welding', 'fabrication', 'blueprint reading'], edu: ['ITI', '8th', '10th'] },
  { cat: 'fitter_mechanic', suffix: 'industrial', titles: [
    { en: 'Fitter', ta: 'பிட்டர்', min: 14000, max: 23000 },
    { en: 'Diesel Mechanic', ta: 'டீசல் மெக்கானிக்', min: 15000, max: 24000 },
    { en: 'Two Wheeler Mechanic', ta: 'இரு சக்கர வாகன மெக்கானிக்', min: 12000, max: 20000 },
    { en: 'Car Mechanic', ta: 'கார் மெக்கானிக்', min: 14000, max: 24000 } ],
    skills: ['assembly', 'engine repair', 'fitting', 'lathe work', 'vehicle servicing'], edu: ['ITI', '8th', '10th'] },
  { cat: 'driver', suffix: 'logistics', titles: [
    { en: 'Car Driver', ta: 'கார் ஓட்டுநர்', min: 14000, max: 22000 },
    { en: 'Tempo Driver', ta: 'டெம்போ ஓட்டுநர்', min: 15000, max: 24000 },
    { en: 'Lorry Driver', ta: 'லாரி ஓட்டுநர்', min: 18000, max: 30000 },
    { en: 'Auto Driver', ta: 'ஆட்டோ ஓட்டுநர்', min: 12000, max: 20000 },
    { en: 'Bus Driver', ta: 'பஸ் ஓட்டுநர்', min: 16000, max: 25000 } ],
    skills: ['valid driving licence', 'route knowledge', 'safe driving', 'basic vehicle maintenance'], edu: ['8th', '10th', 'Any'] },
  { cat: 'warehouse', suffix: 'logistics', titles: [
    { en: 'Warehouse Assistant', ta: 'கிடங்கு உதவியாளர்', min: 13000, max: 20000 },
    { en: 'Picker and Packer', ta: 'பிக்கர் மற்றும் பேக்கர்', min: 12000, max: 19000 },
    { en: 'Forklift Operator', ta: 'ஃபோர்க்லிஃப்ட் ஆபரேட்டர்', min: 16000, max: 25000 },
    { en: 'Store Keeper', ta: 'ஸ்டோர் கீப்பர்', min: 14000, max: 22000 } ],
    skills: ['stock management', 'loading unloading', 'inventory entry', 'forklift licence'], edu: ['10th', '12th', 'Any'] },
  { cat: 'delivery', suffix: 'logistics', titles: [
    { en: 'Delivery Partner', ta: 'டெலிவரி பார்ட்னர்', min: 15000, max: 25000 },
    { en: 'Field Delivery Executive', ta: 'ஃபீல்ட் டெலிவரி எக்சிகியூட்டிவ்', min: 14000, max: 23000 } ],
    skills: ['two wheeler', 'smartphone usage', 'customer handling', 'area knowledge'], edu: ['10th', '12th', 'Any'] },
  { cat: 'maintenance', suffix: 'services', titles: [
    { en: 'Maintenance Technician', ta: 'பராமரிப்பு டெக்னீஷியன்', min: 15000, max: 24000 },
    { en: 'Building Maintenance Staff', ta: 'கட்டிட பராமரிப்பு பணியாளர்', min: 12000, max: 19000 },
    { en: 'Plumber', ta: 'குழாய் பணியாளர்', min: 14000, max: 23000 } ],
    skills: ['plumbing', 'civil repairs', 'electrical basics', 'painting'], edu: ['8th', '10th', 'ITI'] },
  { cat: 'security', suffix: 'security', titles: [
    { en: 'Security Guard', ta: 'பாதுகாப்பு காவலர்', min: 12000, max: 18000 },
    { en: 'Head Security Guard', ta: 'தலைமை காவலர்', min: 15000, max: 22000 },
    { en: 'Housekeeping Staff', ta: 'வீட்டு வேலை பணியாளர்', min: 11000, max: 17000 } ],
    skills: ['discipline', 'patrolling', 'gate register', 'emergency response'], edu: ['8th', '10th', 'Any'] },
  { cat: 'retail_sales', suffix: 'retail', titles: [
    { en: 'Sales Executive', ta: 'சேல்ஸ் எக்சிகியூட்டிவ்', min: 12000, max: 22000 },
    { en: 'Store Assistant', ta: 'கடை உதவியாளர்', min: 11000, max: 18000 },
    { en: 'Billing Cashier', ta: 'பில்லிங் கேஷியர்', min: 12000, max: 19000 },
    { en: 'Telecaller', ta: 'டெலிகாலர்', min: 11000, max: 18000 } ],
    skills: ['communication', 'billing', 'customer service', 'tamil typing'], edu: ['10th', '12th', 'Any Degree'] },
  { cat: 'hospitality', suffix: 'food', titles: [
    { en: 'Cook', ta: 'சமையல்காரர்', min: 13000, max: 22000 },
    { en: 'Kitchen Helper', ta: 'சமையலறை உதவியாளர்', min: 10000, max: 16000 },
    { en: 'Hotel Housekeeping', ta: 'ஹோட்டல் ஹவுஸ்கீப்பிங்', min: 11000, max: 17000 },
    { en: 'Waiter', ta: 'வெய்ட்டர்', min: 11000, max: 18000 } ],
    skills: ['cooking', 'food safety', 'cleaning', 'customer service'], edu: ['8th', '10th', 'Any'] },
  { cat: 'construction', suffix: 'industrial', titles: [
    { en: 'Construction Worker', ta: 'கட்டுமான தொழிலாளி', min: 13000, max: 20000 },
    { en: 'Mason', ta: 'சிமென்ட் கட்டுபவர்', min: 16000, max: 25000 },
    { en: 'Painter', ta: 'வண்ணம் தீட்டுபவர்', min: 13000, max: 21000 },
    { en: 'Carpenter', ta: 'தச்சர்', min: 15000, max: 24000 },
    { en: 'Tile Layer', ta: 'டைல் பணியாளர்', min: 15000, max: 24000 } ],
    skills: ['cement work', 'brick work', 'plastering', 'wood work', 'finishing'], edu: ['8th', 'Any', '10th'] },
  { cat: 'textile', suffix: 'textiles', titles: [
    { en: 'Tailor', ta: 'தையல்காரர்', min: 11000, max: 19000 },
    { en: 'Weaving Machine Operator', ta: 'நெசவு இயந்திர ஆபரேட்டர்', min: 12000, max: 20000 },
    { en: 'Embroidery Machine Operator', ta: 'எம்பிராய்டரி இயந்திர ஆபரேட்டர்', min: 12000, max: 19000 },
    { en: 'Checking and Packing Staff', ta: 'செக்கிங் மற்றும் பேக்கிங் பணியாளர்', min: 10000, max: 16000 } ],
    skills: ['stitching', 'pattern cutting', 'machine operating', 'quality checking'], edu: ['8th', '10th', '12th'] },
  { cat: 'healthcare_support', suffix: 'healthcare', titles: [
    { en: 'Hospital Attender', ta: 'மருத்துவமனை அட்டெண்டர்', min: 11000, max: 17000 },
    { en: 'Nursing Assistant', ta: 'நர்சிங் அசிஸ்டண்ட்', min: 12000, max: 19000 },
    { en: 'Lab Assistant', ta: 'லேப் அசிஸ்டண்ட்', min: 12000, max: 19000 },
    { en: 'Pharmacy Helper', ta: 'பார்மசி ஹெல்ப்பர்', min: 11000, max: 17000 } ],
    skills: ['patient care', 'hygiene protocols', 'sample handling', 'record keeping'], edu: ['10th', '12th', 'Any Degree'] },
  { cat: 'agriculture', suffix: 'services', titles: [
    { en: 'Farm Assistant', ta: 'பண்ணை உதவியாளர்', min: 10000, max: 16000 },
    { en: 'Dairy Worker', ta: 'பால் பண்ணை பணியாளர்', min: 10000, max: 15000 },
    { en: 'Nursery Worker', ta: 'நர்சரி பணியாளர்', min: 10000, max: 15000 } ],
    skills: ['crop care', 'harvesting', 'irrigation', 'livestock handling'], edu: ['8th', 'Any', '10th'] },
];

const SHIFTS = [
  { en: 'Day', ta: 'பகல்' }, { en: 'Night', ta: 'இரவு' },
  { en: 'Rotational', ta: 'மாறுதல்' }, { en: 'Flexible', ta: 'நெகிழ்வான' },
];
const EMPLOYMENT = ['Full-time', 'Full-time', 'Full-time', 'Contract', 'Part-time'];
const EXP_BANDS = [
  { yrs: 0, labelEn: 'Fresher friendly', labelTa: 'புதியவர்களுக்கும்' },
  { yrs: 0, labelEn: '0-1 years', labelTa: '0-1 ஆண்டு' },
  { yrs: 1, labelEn: '1-3 years', labelTa: '1-3 ஆண்டு' },
  { yrs: 2, labelEn: '2-4 years', labelTa: '2-4 ஆண்டு' },
  { yrs: 3, labelEn: '3-5 years', labelTa: '3-5 ஆண்டு' },
];

function postedDate() {
  const daysAgo = randInt(0, 21);
  const d = new Date(Date.UTC(2026, 7, 26) - daysAgo * 86400000);
  return d.toISOString().slice(0, 10);
}

const jobs = [];
let id = 1;
const TARGET = 520;

while (jobs.length < TARGET) {
  const roleGroup = pick(ROLES);
  const title = pick(roleGroup.titles);
  const dist = pick(DISTRICTS);
  const company = `${pick(COMPANY_PREFIX)} ${pick(COMPANY_SUFFIX[roleGroup.suffix])}`;
  const salMin = randInt(title.min, Math.max(title.min, title.max - 4000));
  const salMax = Math.min(title.max, salMin + randInt(2000, 8000));
  const exp = pick(EXP_BANDS);
  const edu = pick(roleGroup.edu);
  const shift = pick(SHIFTS);
  const emp = pick(EMPLOYMENT);
  const skills = [...roleGroup.skills].sort(() => rand() - 0.5).slice(0, randInt(2, 3));

  jobs.push({
    job_id: `ZB-${String(id++).padStart(4, '0')}`,
    title: title.en,
    title_ta: title.ta,
    company,
    location: dist.city,
    location_ta: dist.ta,
    district: dist.city,
    zone: dist.zone,
    state: 'Tamil Nadu',
    salary_min: salMin,
    salary_max: salMax,
    experience_min_years: exp.yrs,
    experience_label: exp.labelEn,
    experience_label_ta: exp.labelTa,
    education: edu,
    skills,
    employment_type: emp,
    shift: shift.en,
    shift_ta: shift.ta,
    description: `${title.en} needed for ${company} at ${dist.city}. Work: ${skills.join(', ')}. Salary ₹${salMin.toLocaleString('en-IN')}-₹${salMax.toLocaleString('en-IN')} per month. ${exp.labelEn}. Shift: ${shift.en}.`,
    description_ta: `${dist.ta}ல் உள்ள ${company}க்கு ${title.ta} தேவை. சம்பளம் மாதம் ₹${salMin.toLocaleString('en-IN')} முதல் ₹${salMax.toLocaleString('en-IN')} வரை. ${exp.labelTa}.`,
    category: roleGroup.cat,
    source: 'DEMO DATA',
    source_url: '',
    posted_date: postedDate(),
  });
}

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, JSON.stringify(jobs, null, 1), 'utf8');
console.log(`Wrote ${jobs.length} demo jobs -> ${OUT}`);
