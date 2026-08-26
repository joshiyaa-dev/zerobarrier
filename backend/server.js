const express = require('express');
const multer = require('multer');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Import services
const sttService = require('./services/stt');
const llmService = require('./services/llm');
const ttsService = require('./services/tts');
const jobsService = require('./services/jobs');

const app = express();
app.use(cors());
app.use(express.json());

// Set up multer for audio uploads
const upload = multer({ dest: 'uploads/' });

// Create uploads directory if it doesn't exist
if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads');
}

app.post('/voice', upload.single('audio'), async (req, res) => {
    try {
        const audioPath = req.file ? req.file.path : null;
        const userId = req.body.userId || 'user_2';
        const language = req.body.lang || 'ta-IN';
        
        // 1. Check for manual greeting (Auto-wake flow)
        if (req.body.greetOnly && req.body.text) {
            console.log(`\n[GREETING] ${req.body.text}`);
            return res.json({
                emotion: 'HAPPY',
                text: req.body.text,
                audio: "",
                status: 'ok'
            });
        }

        if (!audioPath) {
            return res.status(400).json({ error: 'No audio file or greeting text provided' });
        }

        console.log(`\n━━━━━━━━━━━ VOICE PROCESSING ━━━━━━━━━━━`);
        console.log(`[1/4] 🎤 Audio received from ${userId}`);

        // 2. Audio to Text (REAL STT)
        const textFromAudio = await sttService.convertAudioToText(audioPath, language);
        console.log(`[2/4] 📝 User: "${textFromAudio}"`);

        const invalidTranscription = !textFromAudio || /didn't catch|trouble hearing|try again/i.test(textFromAudio);
        if (invalidTranscription) {
            console.warn(`[2/4] ⚠️ STT failed, waiting for next utterance`);
            if (fs.existsSync(audioPath)) fs.unlinkSync(audioPath);
            return res.json({
                emotion: 'NEUTRAL',
                text: '',
                audio: '',
                status: 'no_input'
            });
        }

        // 3. Text to Emotional Response
        const llmResult = await llmService.generateResponse(textFromAudio, userId, language);
        const { emotion, text, collectField, jobOptions } = llmResult;
        console.log(`[3/4] 🤖 LLM [${emotion}]: "${text}"`);

        let audioBase64 = '';
        if (text) {
            const outputAudioPath = await ttsService.convertTextToAudio(text, language);
            if (outputAudioPath && fs.existsSync(outputAudioPath)) {
                audioBase64 = fs.readFileSync(outputAudioPath).toString('base64');
                fs.unlinkSync(outputAudioPath);
            }
        }

        console.log(`[4/4] 🔊 Offline TTS ${audioBase64 ? 'generated' : 'fallback'}`);
        console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

        // Clean up
        if (fs.existsSync(audioPath)) fs.unlinkSync(audioPath);

        res.json({
            emotion,
            text,
            audio: audioBase64,
            status: 'ok',
            collectField: collectField || '',
            jobOptions: jobOptions || []
        });

    } catch (error) {
        console.error("❌ Critical Error:", error);
        res.status(500).json({ error: 'Failed to process voice request' });
    }
});

app.post('/voice/reset', async (req, res) => {
    try {
        const userId = String(req.body.userId || 'user_2');
        llmService.resetUserConversation(userId);
        return res.json({ status: 'ok' });
    } catch (error) {
        console.error('❌ Reset Error:', error);
        res.status(500).json({ error: 'Failed to reset conversation' });
    }
});

app.post('/voice/text', async (req, res) => {
    try {
        const userId = req.body.userId || 'user_2';
        const text = String(req.body.text || '').trim();
        const language = req.body.lang || 'ta-IN';

        if (!text) {
            return res.json({
                emotion: 'NEUTRAL',
                text: '',
                audio: '',
                status: 'no_input',
                collectField: '',
                jobOptions: []
            });
        }

        console.log(`\n[TEXT INPUT] ${userId}: ${text}`);
        const llmResult = await llmService.generateResponse(text, userId, language);
        const { emotion, collectField, jobOptions } = llmResult;
        const reply = String(llmResult.text || '');
        console.log(`[TEXT OUTPUT] [${emotion}] ${reply}`);

        let audioBase64 = '';
        if (reply) {
            const outputAudioPath = await ttsService.convertTextToAudio(reply, language);
            if (outputAudioPath && fs.existsSync(outputAudioPath)) {
                audioBase64 = fs.readFileSync(outputAudioPath).toString('base64');
                fs.unlinkSync(outputAudioPath);
            }
        }

        return res.json({
            emotion,
            text: reply,
            audio: audioBase64,
            status: reply ? 'ok' : 'no_input',
            collectField: collectField || '',
            jobOptions: jobOptions || []
        });
    } catch (error) {
        console.error('❌ Text Processing Error:', error);
        res.status(500).json({ error: 'Failed to process text request' });
    }
});

app.post('/voice/speak', async (req, res) => {
    try {
        const text = String(req.body.text || '').trim();
        const language = req.body.lang || 'ta-IN';

        if (!text) {
            return res.json({
                emotion: 'NEUTRAL',
                text: '',
                audio: '',
                status: 'no_input'
            });
        }

        let audioBase64 = '';
        const outputAudioPath = await ttsService.convertTextToAudio(text, language);
        if (outputAudioPath && fs.existsSync(outputAudioPath)) {
            audioBase64 = fs.readFileSync(outputAudioPath).toString('base64');
            fs.unlinkSync(outputAudioPath);
        }

        return res.json({
            emotion: 'HAPPY',
            text,
            audio: audioBase64,
            status: 'ok'
        });
    } catch (error) {
        console.error('❌ Speak Processing Error:', error);
        res.status(500).json({ error: 'Failed to synthesize speech' });
    }
});

app.get('/jobs', async (_req, res) => {
    try {
        const jobs = jobsService.getJobs();
        return res.json({ status: 'ok', total: jobs.length, jobs });
    } catch (error) {
        console.error('❌ Jobs Read Error:', error);
        return res.status(500).json({ status: 'error', error: 'Failed to load jobs' });
    }
});

app.post('/jobs/sync', async (_req, res) => {
    try {
        const result = await jobsService.syncJobsFromInternet();
        return res.json({ status: 'ok', ...result });
    } catch (error) {
        console.error('❌ Jobs Sync Error:', error);
        return res.status(500).json({ status: 'error', error: 'Failed to sync jobs' });
    }
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Zero Barrier Resilient API running on http://localhost:${PORT}`);
    jobsService.syncJobsFromInternet()
        .then((result) => {
            console.log(`[JOBS] Loaded ${result.total} jobs (${result.source})`);
        })
        .catch((error) => {
            console.warn('[JOBS] Startup sync failed, local jobs will be used:', error.message);
        });
});
