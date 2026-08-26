const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');
const { execFile } = require('child_process');
const util = require('util');
const execFilePromise = util.promisify(execFile);

/**
 * REAL STT: Converts audio file to text using Python SpeechRecognition
 */
async function convertAudioToText(audioPath, language = 'ta-IN') {
    const activeLanguage = String(language || 'ta-IN');
    console.log(`[STT] Processing audio: ${audioPath}`);
    console.log(`[STT] Language: ${activeLanguage}`);

    const cloudText = await convertAudioToTextCloud(audioPath, activeLanguage);
    if (cloudText) {
        console.log(`[STT] ✅ Cloud transcription: "${cloudText}"`);
        return cloudText;
    }

    return convertAudioToTextOffline(audioPath, activeLanguage);
}

function toShortLang(language) {
    const lower = String(language || '').toLowerCase();
    if (lower.startsWith('ta')) return 'ta';
    if (lower.startsWith('en')) return 'en';
    return 'en';
}

async function convertAudioToTextCloud(audioPath, language) {
    const openAiKey = process.env.OPENAI_API_KEY;
    const groqKey = process.env.GROQ_API_KEY;
    const shortLang = toShortLang(language);

    if (!openAiKey && !groqKey) {
        return '';
    }

    const form = new FormData();
    form.append('file', fs.createReadStream(audioPath));
    form.append('language', shortLang);

    try {
        if (openAiKey) {
            form.append('model', process.env.OPENAI_STT_MODEL || 'gpt-4o-mini-transcribe');
            const { data } = await axios.post('https://api.openai.com/v1/audio/transcriptions', form, {
                headers: {
                    Authorization: `Bearer ${openAiKey}`,
                    ...form.getHeaders(),
                },
                timeout: 30000,
            });
            return String(data?.text || '').trim();
        }

        form.append('model', process.env.GROQ_STT_MODEL || 'whisper-large-v3-turbo');
        const { data } = await axios.post('https://api.groq.com/openai/v1/audio/transcriptions', form, {
            headers: {
                Authorization: `Bearer ${groqKey}`,
                ...form.getHeaders(),
            },
            timeout: 30000,
        });
        return String(data?.text || '').trim();
    } catch (error) {
        const reason = error.response?.data?.error?.message || error.message;
        console.warn(`[STT] Cloud STT failed, using offline fallback: ${String(reason).slice(0, 140)}`);
        return '';
    }
}

async function convertAudioToTextOffline(audioPath, activeLanguage) {
    
    try {
        const scriptPath = path.join(__dirname, '../transcribe_stt.py');
        const { stdout, stderr } = await execFilePromise(
            'python',
            [scriptPath, audioPath, activeLanguage],
            { timeout: 120000 }
        );
        
        const text = stdout.trim();

        if (stderr && stderr.trim()) {
            console.log(`[STT] Error output: ${stderr.trim()}`);
        }

        if (!text || text.includes('[STT]')) {
            return "";
        }
        
        console.log(`[STT] ✅ Transcribed: "${text}"`);
        return text;

    } catch (error) {
        console.error(`[STT] ❌ Error:`, error.message);
        return "";
    }
}

module.exports = {
    convertAudioToText
};
