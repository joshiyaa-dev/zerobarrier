const { execFile } = require('child_process');
const util = require('util');
const path = require('path');

const execFilePromise = util.promisify(execFile);

function toLangCode(language) {
    const l = String(language || '').toLowerCase();
    return l.startsWith('ta') ? 'ta' : 'en';
}

function containsTamil(text) {
    return /[\u0B80-\u0BFF]/.test(String(text || ''));
}

function looksLikeEnglish(text) {
    return /[a-z]/i.test(String(text || ''));
}

async function translateIfNeeded(text, targetLanguage) {
    const raw = String(text || '').trim();
    if (!raw) return raw;

    const target = toLangCode(targetLanguage);
    const source = target === 'ta' ? 'en' : 'ta';

    if (target === 'ta' && containsTamil(raw)) return raw;
    if (target === 'en' && looksLikeEnglish(raw)) return raw;

    try {
        const scriptPath = path.join(__dirname, '../translate_offline.py');
        const { stdout } = await execFilePromise('python', [scriptPath, raw, source, target], { timeout: 8000 });
        const translated = String(stdout || '').trim();
        return translated || raw;
    } catch (error) {
        // Translation is optional; silently return original if not available
        console.log(`[TRANSLATE] Offline translation unavailable: ${error.message.substring(0, 60)}`);
        return raw;
    }
}

module.exports = {
    translateIfNeeded,
    toLangCode,
};
