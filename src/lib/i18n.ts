export type Language = 'ta' | 'en';

const translations = {
  en: {
    // Splash
    appName: 'Zero Barrier',
    tagline: 'Jobs for Everyone',
    
    // Language
    selectLanguage: 'Choose Language',
    tamil: 'தமிழ்',
    english: 'English',
    
    // Roles
    selectRole: 'Who are you?',
    worker: 'Job Seeker',
    employer: 'Employer',
    
    // Worker Home
    tapToSpeak: 'Tap to Speak',
    listening: 'Listening...',
    findJobs: 'Find Jobs',
    applied: 'Applied',
    profile: 'Profile',
    
    // Jobs
    jobs: 'Jobs',
    salary: 'Salary',
    location: 'Location',
    apply: 'Apply Now',
    applied_success: 'Applied!',
    successMessage: 'Your application was sent',
    goHome: 'Go Home',
    perMonth: '/month',
    
    // Profile
    name: 'Name',
    skill: 'Skill',
    save: 'Save',
    saved: 'Saved!',
    
    // Employer
    dashboard: 'Dashboard',
    jobsPosted: 'Jobs Posted',
    applicants: 'Applicants',
    addJob: 'Add Job',
    title: 'Title',
    postJob: 'Post Job',
    jobPosted: 'Job Posted!',
    viewApplicants: 'View Applicants',
    noApplicants: 'No applicants yet',
    back: 'Back',
  },
  ta: {
    appName: 'ஜீரோ பேரியர்',
    tagline: 'அனைவருக்கும் வேலை',
    
    selectLanguage: 'மொழி தேர்வு',
    tamil: 'தமிழ்',
    english: 'English',
    
    selectRole: 'நீங்கள் யார்?',
    worker: 'வேலை தேடுபவர்',
    employer: 'முதலாளி',
    
    tapToSpeak: 'பேச தட்டவும்',
    listening: 'கேட்கிறது...',
    findJobs: 'வேலை தேடு',
    applied: 'விண்ணப்பித்தவை',
    profile: 'சுயவிவரம்',
    
    jobs: 'வேலைகள்',
    salary: 'சம்பளம்',
    location: 'இடம்',
    apply: 'விண்ணப்பிக்க',
    applied_success: 'விண்ணப்பித்தது!',
    successMessage: 'உங்கள் விண்ணப்பம் அனுப்பப்பட்டது',
    goHome: 'முகப்பு',
    perMonth: '/மாதம்',
    
    name: 'பெயர்',
    skill: 'திறமை',
    location2: 'இடம்',
    save: 'சேமி',
    saved: 'சேமிக்கப்பட்டது!',
    
    dashboard: 'டாஷ்போர்டு',
    jobsPosted: 'வேலைகள் பதிவு',
    applicants: 'விண்ணப்பதாரர்கள்',
    addJob: 'வேலை சேர்',
    title: 'தலைப்பு',
    postJob: 'வேலை பதிவு',
    jobPosted: 'வேலை பதிவு செய்யப்பட்டது!',
    viewApplicants: 'விண்ணப்பதாரர்களைப் பார்',
    noApplicants: 'விண்ணப்பதாரர்கள் இல்லை',
    back: 'பின்',
  },
} as const;

export function getLanguage(): Language {
  return (localStorage.getItem('zb-language') as Language) || 'ta';
}

export function setLanguage(lang: Language) {
  localStorage.setItem('zb-language', lang);
}

export function t(key: keyof typeof translations.en): string {
  const lang = getLanguage();
  return translations[lang]?.[key] || translations.en[key] || key;
}

export function getRole(): 'worker' | 'employer' | null {
  return localStorage.getItem('zb-role') as 'worker' | 'employer' | null;
}

export function setRole(role: 'worker' | 'employer') {
  localStorage.setItem('zb-role', role);
}
