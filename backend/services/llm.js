const fs = require('fs');
const path = require('path');
const { toLangCode } = require('./translate');
const jobsService = require('./jobs');

const usersDataPath = path.join(__dirname, '../data/users.json');

function getJobs() {
    const jobs = jobsService.getJobs();
    return Array.isArray(jobs) ? jobs : [];
}

function getUserData(userId) {
    if (!fs.existsSync(usersDataPath)) return null;
    const users = JSON.parse(fs.readFileSync(usersDataPath, 'utf8'));
    return users[userId] || null;
}

function saveUserData(userId, data) {
    let users = {};
    if (fs.existsSync(usersDataPath)) {
        users = JSON.parse(fs.readFileSync(usersDataPath, 'utf8'));
    }
    users[userId] = { ...users[userId], ...data };
    fs.writeFileSync(usersDataPath, JSON.stringify(users, null, 2));
}

function resetUserConversation(userId) {
    saveUserData(userId, {
        flow: { stage: 'await_job' },
        lastQuestionTa: '',
        name: '',
        mobile: '',
        aadhaar: '',
        joinAvailability: '',
        experience: '',
        appliedJobId: null,
        appliedJob: '',
        appliedAt: ''
    });
}

async function generateResponse(userText, userId = 'user_2', preferredLanguage = 'auto') {
    try {
        const userMemory = getUserData(userId) || {};
        const flow = userMemory.flow || { stage: 'await_job' };
        const text = String(userText || '').trim();
        const targetLang = resolveTargetLanguage(preferredLanguage, text);
        const jobs = getJobs();

        if (!text) {
            return { emotion: 'NEUTRAL', text: '' };
        }

        if (isRepeatRequest(text)) {
            const lastQuestion = String(userMemory.lastQuestionTa || '').trim();
            if (lastQuestion) {
                return {
                    emotion: 'NEUTRAL',
                    text: lastQuestion,
                    collectField: collectFieldForStage(flow.stage),
                    jobOptions: flow.stage === 'await_job' ? jobs : []
                };
            }
        }

        if (isGreetingOrWake(text) && flow.stage === 'await_job') {
            return askQuestion(
                userId,
                flow,
                'HAPPY',
                promptText(
                    targetLang,
                    'ஜீரோ பேரியருக்கு வரவேற்கிறேன். குரல் மூலம் வேலை பெயரை சொல்லி வேலைகளை கண்டுபிடிக்கலாம். இப்போது நீங்கள் எந்த வேலை தேடுகிறீர்கள்? நான் கேட்டு கொண்டு இருக்கிறேன்.',
                    'Welcome to Zero Barrier. You can find jobs by speaking the job name. Which job are you looking for now? I am listening.'
                ),
                '',
                jobs
            );
        }

        if (flow.stage === 'await_job') {
            const selectedJob = matchJob(text, jobs);
            const requestedRole = extractRequestedRole(text);

            if (isLanguageFeedback(text)) {
                return askQuestion(
                    userId,
                    flow,
                    'NEUTRAL',
                    promptText(
                        targetLang,
                        `நான் தமிழில் பேசுவேன். புரியவில்லை என்றால் 'திருப்பி சொல்லு' அல்லது 'repeat' என்று சொல்லுங்கள். இப்போது நீங்கள் தேடும் வேலை பெயரை மட்டும் சொல்லுங்கள்.`,
                        `I will speak in English. If you did not understand, say repeat. Tell me only the job name you want.`
                    ),
                    '',
                    jobs
                );
            }

            if (isDriverRequest(text)) {
                const nextFlow = {
                    stage: 'collect_name',
                    requestedRole: 'டிரைவர்',
                    waitingListOnly: true,
                    selectedJobId: null,
                    selectedJobTitle: null
                };

                saveUserData(userId, { flow: nextFlow });

                return askQuestion(
                    userId,
                    nextFlow,
                    'NEUTRAL',
                    promptText(
                        targetLang,
                        'டிரைவர் வேலை இப்போது உங்கள் இடத்தில் திறந்த நிலையில் இல்லை. உங்களை waiting list-ல் சேர்த்துவிட்டோம். நாங்கள் உங்களை மீண்டும் அழைப்போம். உங்கள் பெயர் என்ன?',
                        'Driver jobs are not open in your area right now. We will add you to the waiting list and call you back. What is your name?'
                    ),
                    'waiting_list'
                );
            }

            const explicitJobIntent = isJobIntent(text);
            if (!selectedJob && !requestedRole && !explicitJobIntent) {
                return askQuestion(
                    userId,
                    flow,
                    'NEUTRAL',
                    promptText(
                        targetLang,
                        `சரி. நான் புரிந்துகொண்டேன். இப்போது வேலை பெயரை மட்டும் சொல்லுங்கள். உதாரணம்: மேசன், ஃபோர்க்லிப்ட் ஆபரேட்டர், டிரைவர்.`,
                        `Okay, I understand. Please say only the job name. Examples: mason, forklift operator, driver.`
                    ),
                    '',
                    jobs
                );
            }

            if (!selectedJob && !requestedRole && explicitJobIntent) {
                return askQuestion(
                    userId,
                    flow,
                    'NEUTRAL',
                    promptText(
                        targetLang,
                        `நல்லது. எந்த வேலை ரோல் வேண்டும் என்று பெயரை சொல்லுங்கள்.`,
                        `Good. Please tell me the job role you want.`
                    ),
                    '',
                    jobs
                );
            }

            const nextFlow = {
                stage: 'collect_name',
                requestedRole: requestedRole || text,
                selectedJobId: selectedJob ? selectedJob.id : null,
                selectedJobTitle: selectedJob ? getJobTitleTamil(selectedJob) : null
            };

            saveUserData(userId, { flow: nextFlow });

            const availabilityLine = selectedJob
                ? promptText(
                    targetLang,
                    `நல்லது. ${getJobTitleTamil(selectedJob)} வேலை தற்போது கிடைக்கிறது.`,
                    `Good. ${getJobTitleEnglish(selectedJob)} is currently available.`
                )
                : promptText(
                    targetLang,
                    `நல்லது. ${requestedRole || 'இந்த'} வேலை இப்போது பட்டியலில் இல்லை, ஆனாலும் பதிவு செய்து வைக்கலாம்.`,
                    `Good. ${requestedRole || 'This'} job is not listed right now, but we can still register you.`
                );

            return askQuestion(
                userId,
                nextFlow,
                'HAPPY',
                `${availabilityLine} ${promptText(targetLang, 'சரி, இந்த வேலையிற்காக சில சரிபார்ப்பு தகவல்கள் வேண்டும். உங்கள் பெயர் என்ன?', 'Okay, I need a few verification details for this job. What is your name?')}`,
                ''
            );
        }

        if (flow.stage === 'collect_name') {
            const name = extractNameFromText(text) || text;
            const nextFlow = { ...flow, stage: 'collect_mobile' };
            saveUserData(userId, { name, flow: nextFlow });
            return askQuestion(userId, nextFlow, 'HAPPY', promptText(targetLang, 'சரி. உங்கள் மொபைல் எண் என்ன? 10 இலக்கமாக சொல்லுங்கள்.', 'Okay. What is your mobile number? Please say 10 digits.'), 'mobile');
        }

        if (flow.stage === 'collect_mobile') {
            const mobile = extractDigits(text);
            if (mobile.length !== 10) {
                return askQuestion(userId, flow, 'CONCERNED', promptText(targetLang, 'மொபைல் எண் 10 இலக்கமாக இருக்க வேண்டும். உங்கள் மொபைல் எண்ணை மீண்டும் சொல்லுங்கள்.', 'Mobile number must be 10 digits. Please say your mobile number again.'), 'mobile');
            }
            const nextFlow = { ...flow, stage: 'collect_aadhaar' };
            saveUserData(userId, { mobile, flow: nextFlow });
            return askQuestion(userId, nextFlow, 'HAPPY', promptText(targetLang, 'சரி. உங்கள் ஆதார் எண் என்ன? 12 இலக்கமாக சொல்லுங்கள்.', 'Okay. What is your Aadhaar number? Please say 12 digits.'), 'aadhaar');
        }

        if (flow.stage === 'collect_aadhaar') {
            const aadhaar = extractDigits(text);
            if (aadhaar.length !== 12) {
                return askQuestion(userId, flow, 'CONCERNED', promptText(targetLang, 'ஆதார் எண் 12 இலக்கமாக இருக்க வேண்டும். மீண்டும் சொல்லுங்கள்.', 'Aadhaar number must be 12 digits. Please say it again.'), 'aadhaar');
            }
            const nextFlow = { ...flow, stage: 'collect_join_date' };
            saveUserData(userId, { aadhaar, flow: nextFlow });
            return askQuestion(userId, nextFlow, 'NEUTRAL', promptText(targetLang, 'நீங்கள் எப்போது வேலைக்கு சேர்ந்துக்கொள்ள தயாராக இருக்கிறீர்கள்?', 'When are you ready to join the job?'), '');
        }

        if (flow.stage === 'collect_join_date') {
            const nextFlow = { ...flow, stage: 'collect_one_week_confirm' };
            saveUserData(userId, { joinAvailability: text, flow: nextFlow });
            return askQuestion(
                userId,
                nextFlow,
                'SERIOUS',
                promptText(targetLang, 'இந்த வேலை ஒரு வாரம் முழு நேர வேலை. நீங்கள் ஒரு வாரம் முழுவதும் வேலை செய்ய தயார் தானே?', 'This is a full week job. Are you ready to work for a full week?'),
                ''
            );
        }

        if (flow.stage === 'collect_one_week_confirm') {
            const oneWeekConfirmed = isYes(text) ? 'yes' : isNo(text) ? 'no' : text;
            const nextFlow = { ...flow, stage: 'collect_experience' };
            saveUserData(userId, { oneWeekConfirmed, flow: nextFlow });
            return askQuestion(userId, nextFlow, 'NEUTRAL', promptText(targetLang, 'உங்களுக்கு முன் வேலை அனுபவம் இருக்கிறதா? இருந்தால் எவ்வளவு?', 'Do you have any previous work experience? If yes, how much?'), '');
        }

        if (flow.stage === 'collect_experience') {
            const selectedJob = flow.selectedJobTitle || flow.requestedRole || 'இந்த';
            const nextFlow = { stage: 'await_job' };
            saveUserData(userId, {
                experience: text,
                appliedJobId: flow.selectedJobId || null,
                appliedJob: selectedJob,
                appliedAt: new Date().toISOString(),
                flow: nextFlow
            });

            const thanks = flow.waitingListOnly
                ? promptText(targetLang, `நன்றி. டிரைவர் waiting list-ல் உங்கள் விவரங்கள் பதிவு செய்யப்பட்டது. நாங்கள் உங்களை மீண்டும் அழைப்போம்.`, 'Thank you. Your details have been recorded in the driver waiting list. We will call you back.')
                : promptText(targetLang, `நன்றி. ${selectedJob} வேலைக்கு உங்கள் விவரங்கள் பதிவு செய்யப்பட்டது.`, `Thank you. Your details have been recorded for the ${selectedJob} job.`);
            const nextPrompt = flow.waitingListOnly
                ? promptText(targetLang, 'வேறு வேலை தேவைப்பட்டால் வேலை பெயரை சொல்லுங்கள்.', 'If you want another job, just say the job name.')
                : promptText(targetLang, 'அடுத்ததாக நீங்கள் தேடும் வேலையின் பெயரை சொல்லுங்கள்.', 'Next, tell me the next job you want.');
            return askQuestion(userId, nextFlow, 'HAPPY', `${thanks} ${nextPrompt}`, '', jobs);
        }

        // Default fallback: always steer back to job search in Tamil.
        return askQuestion(
            userId,
            { stage: 'await_job' },
            'NEUTRAL',
            promptText(targetLang, 'நான் வேலை தேட உதவ தயாராக இருக்கிறேன். நீங்கள் எந்த வேலை தேடுகிறீர்கள்?', 'I am ready to help you find work. What job are you looking for?'),
            '',
            jobs
        );
    } catch (error) {
        console.error("[LLM] Error:", error.message);
        return { emotion: 'NEUTRAL', text: '' };
    }
}

module.exports = {
    generateResponse,
    resetUserConversation
};

/**
 * Extract name from user text with smart heuristics
 */
function extractNameFromText(text) {
    // Remove common phrases
    let cleaned = text
        .toLowerCase()
        .replace(/^(my name is|i am|i'm|call me|i'm called)\s+/i, '')
        .replace(/[.,!?;]/g, '')
        .trim();
    
    // Extract first capitalized word(s) - likely a name
    const capitalizedMatch = text.match(/\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\b/);
    if (capitalizedMatch) {
        return capitalizedMatch[1];
    }
    
    // Fallback: take first meaningful word if no caps
    const words = cleaned.split(/\s+/).filter(w => w.length > 2 && !isCommonWord(w));
    if (words.length > 0 && words[0].length < 15) {
        return words[0].charAt(0).toUpperCase() + words[0].slice(1);
    }
    
    return null;
}

/**
 * Common words that are probably not names
 */
function isCommonWord(word) {
    const common = ['want', 'need', 'like', 'find', 'look', 'job', 'work', 'please', 'help', 'tired', 'need', 'give'];
    return common.includes(word.toLowerCase());
}

function containsTamil(text) {
    return /[\u0B80-\u0BFF]/.test(text);
}

function resolveTargetLanguage(preferredLanguage, text) {
    if (preferredLanguage && String(preferredLanguage).toLowerCase() !== 'auto') {
        return toLangCode(preferredLanguage);
    }
    return 'ta';
}

function extractDigits(text) {
    return String(text || '').replace(/\D/g, '');
}

function isYes(text) {
    const t = text.toLowerCase();
    return /\b(yes|yeah|yep|ok|okay|apply|sure|ready)\b/.test(t) || /ஆம்|ஆமா|சரி|தயார்/.test(text);
}

function isNo(text) {
    const t = text.toLowerCase();
    return /\b(no|nope|later|not now|not ready)\b/.test(t) || /வேண்டாம்|இல்லை/.test(text);
}

function isRepeatRequest(text) {
    const t = String(text || '').toLowerCase();
    return /\b(repeat|say again|again|once more|thirupi|thirumba|purila|puriyala|puriyala\b|puriyalae|puriyala sir|puriya la)\b/.test(t) || /திருப்பி|மீண்டும்|புரியல/.test(text);
}

function isGreetingOrWake(text) {
    const t = String(text || '').toLowerCase();
    return /\b(hello|hi|start|ready|vanakkam)\b/.test(t) || /வணக்கம்|தொடங்கு|ஆரம்பி/.test(text);
}

function isLanguageFeedback(text) {
    const t = String(text || '').toLowerCase();
    return /\b(tamil|tamizh|purila|puriyala|repeat|thirupi|thirumba|understand|not understand|speak)\b/.test(t)
        || /தமிழ்|புரியல|புரியவில்லை|திருப்பி|மீண்டும்/.test(text);
}

function isJobIntent(text) {
    const t = String(text || '').toLowerCase();
    if (/\b(job|jobs|work|role|vacancy|opening|construction|logistics|driver|warehouse|mason|forklift|helper)\b/.test(t)) {
        return true;
    }
    if (/வேலை|வேலைகள்|கட்டுமானம்|லாஜிஸ்டிக்ஸ்|டிரைவர்|ஓட்டுநர்|கிடங்கு|மேசன்|பணியாளர்/.test(text)) {
        return true;
    }

    const maybeId = Number(extractDigits(t));
    return Number.isInteger(maybeId) && maybeId > 0;
}

function matchJob(text, jobsData) {
    const normalized = String(text || '').toLowerCase().trim();
    const asNumber = Number(extractDigits(normalized));
    if (Number.isInteger(asNumber)) {
        const byId = jobsData.find((j) => j.id === asNumber);
        if (byId) return byId;
    }

    return jobsData.find((job) => {
        const jobEn = String(job.job || '').toLowerCase();
        const jobTa = String(job.jobTa || '').toLowerCase();
        const locationEn = String(job.location || '').toLowerCase();
        const locationTa = String(job.locationTa || '').toLowerCase();
        return normalized.includes(jobEn)
            || normalized.includes(jobTa)
            || normalized.includes(locationEn)
            || normalized.includes(locationTa);
    }) || null;
}

function extractRequestedRole(text) {
    const normalized = String(text || '').toLowerCase();
    if (normalized.includes('construction') || /கட்டுமான/.test(text)) return 'கட்டுமான பணியாளர்';
    if (normalized.includes('logistics') || /லாஜிஸ்டிக்ஸ்|சரக்கு|கையிருப்பு/.test(text)) return 'லாஜிஸ்டிக்ஸ் பணியாளர்';
    if (normalized.includes('driver') || /டிரைவர்|ஓட்டுநர்/.test(text)) return 'டிரைவர்';
    if (normalized.includes('warehouse') || /கிடங்கு|கையிருப்பு/.test(text)) return 'வேர்‌ஹவுஸ் பணியாளர்';
    return '';
}

function collectFieldForStage(stage) {
    if (stage === 'await_job') return '';
    if (stage === 'collect_name') return '';
    if (stage === 'collect_mobile') return 'mobile';
    if (stage === 'collect_aadhaar') return 'aadhaar';
    return '';
}

function askQuestion(userId, flow, emotion, text, collectField = '', jobOptions = []) {
    saveUserData(userId, { flow, lastQuestionTa: text });
    return {
        emotion,
        text,
        collectField,
        jobOptions
    };
}

function formatJobsListTamil() {
    const list = getJobs()
        .map((j) => `${getJobTitleTamil(j)} - ${getJobLocationTamil(j)} - ${formatSalaryTamil(j.salary)}`)
        .join(' | ');
    return `கட்டுமானம் மற்றும் லாஜிஸ்டிக்ஸ் துறையில் உள்ள வேலைகள்: ${list}.`;
}

function getJobTitleTamil(job) {
    return String(job?.jobTa || job?.job || '').trim();
}

function getJobTitleEnglish(job) {
    return String(job?.job || job?.jobTa || '').trim();
}

function getJobLocationTamil(job) {
    return String(job?.locationTa || job?.location || '').trim();
}

function twoDigitTamil(n) {
    const ones = [
        'பூஜ்யம்', 'ஒன்று', 'இரண்டு', 'மூன்று', 'நான்கு', 'ஐந்து', 'ஆறு', 'ஏழு', 'எட்டு', 'ஒன்பது',
        'பத்து', 'பதினொன்று', 'பன்னிரண்டு', 'பதிமூன்று', 'பதினான்கு', 'பதினைந்து', 'பதினாறு', 'பதினேழு', 'பதினெட்டு', 'பத்தொன்பது'
    ];
    const tens = {
        2: 'இருபது',
        3: 'முப்பது',
        4: 'நாற்பது',
        5: 'ஐம்பது',
        6: 'அறுபது',
        7: 'எழுபது',
        8: 'எண்பது',
        9: 'தொண்ணூறு'
    };

    if (n < 20) return ones[n];
    const t = Math.floor(n / 10);
    const u = n % 10;
    return u === 0 ? tens[t] : `${tens[t]} ${ones[u]}`;
}

function numberToTamilWords(value) {
    const n = Number(value);
    if (!Number.isFinite(n)) return String(value);

    const whole = Math.trunc(Math.abs(n));
    if (whole === 0) return 'பூஜ்யம்';

    const underThousand = (num) => {
        if (num < 100) return twoDigitTamil(num);
        const h = Math.floor(num / 100);
        const rem = num % 100;
        const hundredText = h === 1 ? 'நூறு' : `${twoDigitTamil(h)} நூறு`;
        return rem ? `${hundredText} ${twoDigitTamil(rem)}` : hundredText;
    };

    const parts = [];
    const crore = Math.floor(whole / 10000000);
    const lakh = Math.floor((whole % 10000000) / 100000);
    const thousand = Math.floor((whole % 100000) / 1000);
    const rest = whole % 1000;

    if (crore) parts.push(`${underThousand(crore)} கோடி`);
    if (lakh) parts.push(`${underThousand(lakh)} லட்சம்`);
    if (thousand) parts.push(`${underThousand(thousand)} ஆயிரம்`);
    if (rest) parts.push(underThousand(rest));

    return parts.join(' ').trim();
}

function normalizeTamilSpeechText(text) {
    return String(text || '').replace(/\d+/g, (digitChunk) => numberToTamilWords(Number(digitChunk)));
}

function formatSalaryTamil(salary) {
    return `நாளுக்கு ${numberToTamilWords(salary)} ரூபாய்`;
}

function isDriverRequest(text) {
    const normalized = String(text || '').toLowerCase();
    return /\b(driver|drivers|driving|delivery van driver|van driver)\b/.test(normalized)
        || /டிரைவர்|ஓட்டுநர்|வான்/.test(text);
}

function promptText(targetLang, tamilText, englishText) {
    if (String(targetLang || '').startsWith('en')) {
        return englishText;
    }
    return normalizeTamilSpeechText(tamilText);
}
