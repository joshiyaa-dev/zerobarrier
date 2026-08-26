const fs = require('fs');
const path = require('path');
const axios = require('axios');

const jobsDataPath = path.join(__dirname, '../data/jobs.json');

const CATEGORY_QUERIES = [
    'construction worker',
    'mason',
    'warehouse helper',
    'loading unloading staff',
    'delivery driver'
];

function readLocalJobs() {
    try {
        if (!fs.existsSync(jobsDataPath)) {
            return [];
        }
        const parsed = JSON.parse(fs.readFileSync(jobsDataPath, 'utf8'));
        return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
        console.warn('[JOBS] Failed to read local jobs:', error.message);
        return [];
    }
}

function writeLocalJobs(jobs) {
    fs.writeFileSync(jobsDataPath, JSON.stringify(jobs, null, 2));
}

function hasTamil(text) {
    return /[\u0B80-\u0BFF]/.test(String(text || ''));
}

function inferTamilTitle(title) {
    const raw = String(title || '').trim();
    if (!raw) return '';
    if (hasTamil(raw)) return raw;

    const normalized = raw.toLowerCase();

    const phraseMap = [
        [/construction\s+worker|construction\s+labou?r/, 'கட்டுமான தொழிலாளி'],
        [/construction\s+helper/, 'கட்டுமான உதவியாளர்'],
        [/loading\s*(and|&)\s*unloading\s*(staff|worker)?/, 'ஏற்றும் இறக்கும் பணியாளர்'],
        [/warehouse\s+(picker|helper|worker)/, 'கிடங்கு பணியாளர்'],
        [/delivery\s+van\s+driver/, 'டெலிவரி வேன் ஓட்டுநர்'],
        [/forklift\s+operator/, 'ஃபோர்க்லிப்ட் இயக்குநர்'],
        [/steel\s+fixer/, 'ஸ்டீல் ஃபிக்சர் பணியாளர்'],
        [/scaffolding\s+worker/, 'ஸ்காஃஃபோல்டிங் பணியாளர்'],
    ];

    for (const [pattern, translated] of phraseMap) {
        if (pattern.test(normalized)) return translated;
    }

    const wordMap = {
        construction: 'கட்டுமான',
        worker: 'தொழிலாளி',
        labour: 'தொழிலாளி',
        labor: 'தொழிலாளி',
        helper: 'உதவியாளர்',
        mason: 'மேசன்',
        steel: 'ஸ்டீல்',
        fixer: 'ஃபிக்சர்',
        scaffolding: 'ஸ்காஃஃபோல்டிங்',
        warehouse: 'கிடங்கு',
        picker: 'பணியாளர்',
        forklift: 'ஃபோர்க்லிப்ட்',
        operator: 'இயக்குநர்',
        logistics: 'லாஜிஸ்டிக்ஸ்',
        loading: 'ஏற்றும்',
        unloading: 'இறக்கும்',
        staff: 'பணியாளர்',
        delivery: 'டெலிவரி',
        driver: 'ஓட்டுநர்',
        van: 'வேன்',
        executive: 'நிர்வாகி',
        supervisor: 'மேற்பார்வையாளர்',
        technician: 'தொழில்நுட்ப நிபுணர்',
        assistant: 'உதவியாளர்',
    };

    const words = normalized
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter(Boolean)
        .map((w) => wordMap[w] || '');

    const translated = words.filter(Boolean).join(' ').trim();
    return translated || 'பொது தொழிலாளர்';
}

function inferTamilLocation(location) {
    const map = {
        chennai: 'சென்னை',
        coimbatore: 'கோயம்புத்தூர்',
        madurai: 'மதுரை',
        trichy: 'திருச்சி',
        tiruchirappalli: 'திருச்சி',
        salem: 'சேலம்',
        hosur: 'ஓசூர்',
        erode: 'ஈரோடு',
        tiruppur: 'திருப்பூர்',
        krishnagiri: 'கிருஷ்ணகிரி',
        vellore: 'வேலூர்',
        bangalore: 'பெங்களூரு',
        bengaluru: 'பெங்களூரு',
        tamilnadu: 'தமிழ்நாடு',
        tamil: 'தமிழ்',
        nadu: 'நாடு',
        india: 'இந்தியா',
        in: 'இந்தியா',
    };

    const raw = String(location || '').trim();
    if (!raw) return '';
    if (hasTamil(raw)) return raw;

    const tokens = raw
        .toLowerCase()
        .replace(/[^a-z,\s]/g, ' ')
        .split(/[\s,]+/)
        .filter(Boolean);

    const mapped = tokens.map((token) => map[token]).filter(Boolean);
    if (mapped.length > 0) {
        return Array.from(new Set(mapped)).join(', ');
    }

    return raw;
}

function normalizeSalary(value) {
    const salary = Number(value || 0);
    if (!Number.isFinite(salary) || salary <= 0) return 0;
    return Math.round(salary);
}

function normalizeJob(raw, indexHint = 0) {
    const title = String(raw.job || raw.title || raw.position || '').trim();
    const location = String(raw.location || raw.city || raw.area || 'India').trim();
    if (!title) return null;

    const providedTamilTitle = String(raw.jobTa || '').trim();
    const jobTamil = providedTamilTitle && hasTamil(providedTamilTitle)
        ? providedTamilTitle
        : inferTamilTitle(title);

    const providedTamilLocation = String(raw.locationTa || '').trim();
    const locationTamil = providedTamilLocation && hasTamil(providedTamilLocation)
        ? providedTamilLocation
        : inferTamilLocation(location);

    return {
        id: Number(raw.id) || Date.now() + indexHint,
        job: title,
        jobTa: jobTamil,
        location,
        locationTa: locationTamil,
        salary: normalizeSalary(raw.salary || raw.min_salary || raw.salary_min || 0),
        source: String(raw.source || raw.platform || 'local').trim(),
        applyUrl: String(raw.applyUrl || raw.redirect_url || raw.url || '').trim(),
        updatedAt: new Date().toISOString(),
    };
}

function dedupeJobs(jobs) {
    const seen = new Set();
    const out = [];

    for (const job of jobs) {
        const key = `${String(job.job || '').toLowerCase()}|${String(job.location || '').toLowerCase()}|${String(job.source || '').toLowerCase()}`;
        if (!key || seen.has(key)) continue;
        seen.add(key);
        out.push(job);
    }

    return out;
}

async function fetchFromAdzuna() {
    const appId = process.env.ADZUNA_APP_ID;
    const appKey = process.env.ADZUNA_APP_KEY;
    if (!appId || !appKey) return [];

    const collected = [];

    for (const query of CATEGORY_QUERIES) {
        const endpoint = 'https://api.adzuna.com/v1/api/jobs/in/search/1';
        const response = await axios.get(endpoint, {
            params: {
                app_id: appId,
                app_key: appKey,
                what: query,
                where: 'India',
                results_per_page: 15,
                content_type: 'application/json',
            },
            timeout: 12000,
        });

        const results = Array.isArray(response.data?.results) ? response.data.results : [];
        for (const item of results) {
            collected.push(normalizeJob({
                id: item.id,
                title: item.title,
                location: item.location?.display_name || 'India',
                salary: item.salary_min || item.salary_max || 0,
                source: 'adzuna',
                applyUrl: item.redirect_url,
            }, collected.length + 1));
        }
    }

    return collected.filter(Boolean);
}

async function fetchFromRapidApiJSearch() {
    const openWebNinjaKey = process.env.OPENWEBNINJA_API_KEY;
    if (!openWebNinjaKey) return [];

    const collected = [];

    for (const query of CATEGORY_QUERIES) {
        try {
            const response = await axios.get('https://api.openwebninja.com/jsearch/search', {
                params: {
                    query: `${query} in Tamil Nadu`,
                    page: '1',
                    num_pages: '1',
                    country: 'in',
                    language: 'en',
                    date_posted: 'month',
                },
                headers: {
                    'x-api-key': openWebNinjaKey,
                },
                timeout: 12000,
            });

            const rows = Array.isArray(response.data?.data) ? response.data.data : [];
            for (const item of rows) {
                const loc = [item.job_city, item.job_state, item.job_country].filter(Boolean).join(', ') || 'India';
                collected.push(normalizeJob({
                    id: item.job_id,
                    title: item.job_title,
                    location: loc,
                    salary: item.job_min_salary || item.job_max_salary || 0,
                    source: String(item.job_publisher || 'openwebninja-jsearch'),
                    applyUrl: item.job_apply_link,
                }, collected.length + 1));
            }
        } catch (error) {
            const reason = error.response?.data?.message || error.message;
            console.warn(`[JOBS] OpenWebNinja query failed: ${String(reason).slice(0, 120)}`);
        }
    }

    return collected.filter(Boolean);
}

async function syncJobsFromInternet() {
    const [adzunaJobs, rapidJobs] = await Promise.allSettled([
        fetchFromAdzuna(),
        fetchFromRapidApiJSearch(),
    ]);

    const onlineJobs = [];
    if (adzunaJobs.status === 'fulfilled') onlineJobs.push(...adzunaJobs.value);
    if (rapidJobs.status === 'fulfilled') onlineJobs.push(...rapidJobs.value);

    const localJobs = readLocalJobs().map((j, idx) => normalizeJob(j, idx + 1)).filter(Boolean);

    const selected = onlineJobs.length > 0 ? onlineJobs : localJobs;
    const merged = dedupeJobs(selected)
        .filter((job) => job.salary >= 0)
        .slice(0, 120)
        .map((job, idx) => ({ ...job, id: idx + 1 }));

    if (merged.length > 0) {
        writeLocalJobs(merged);
    }

    return {
        source: onlineJobs.length > 0 ? 'online' : 'local-fallback',
        total: merged.length,
        jobs: merged,
    };
}

function getJobs() {
    return readLocalJobs().map((job, idx) => normalizeJob(job, idx + 1)).filter(Boolean);
}

module.exports = {
    getJobs,
    syncJobsFromInternet,
};
