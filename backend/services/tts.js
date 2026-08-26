const fs = require('fs');
const path = require('path');
const { execFile } = require('child_process');
const util = require('util');
const execFilePromise = util.promisify(execFile);

/**
 * OFFLINE TTS: Converts text to speech using local Piper model
 * Fallback: pyttsx3 system voices
 */
async function convertTextToAudio(text, language = 'auto') {
    const timestamp = Date.now();
    const outputAudioPath = path.join(__dirname, `../uploads/response_${timestamp}.wav`);
    const normalizedLang = String(language || '').toLowerCase();
    
    // Keep shell-safe content for argument passing.
    const safeText = text.replace(/"/g, "'").replace(/\n/g, ' ').trim();

    try {
        console.log(`[TTS] Generating audio: "${safeText.substring(0, 50)}..."`);
        
        const scriptPath = path.join(__dirname, '../offline_tts_bridge.py');
        await execFilePromise('python', [scriptPath, safeText, outputAudioPath, normalizedLang || 'auto'], { timeout: 120000 });
        
        if (fs.existsSync(outputAudioPath)) {
            console.log(`[TTS] ✅ Audio saved: ${outputAudioPath}`);
            return outputAudioPath;
        } else {
            console.warn(`[TTS] ⚠️ Output file not created`);
            return null;
        }

    } catch (error) {
        console.warn(`[TTS] ❌ Failed (${error.message.substring(0, 80)})`);
        if (error.stderr) console.warn(`[TTS stderr] ${String(error.stderr).trim()}`);
        console.warn(`[TTS] Install: pip install piper-tts pyttsx3`);
        return null;
    }
}

module.exports = {
    convertTextToAudio
};
