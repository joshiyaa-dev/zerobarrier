# Zero Barrier Voice Agent Setup (Tamil + English)

## What Works Now

✅ **Voice jobseeker flow only** (no employer flow in VoiceUI)  
✅ **Tamil + English switching** from the top-right language toggle in voice screen  
✅ **Online-first STT** when `OPENAI_API_KEY` or `GROQ_API_KEY` is set  
✅ **Offline STT fallback** (Faster-Whisper) when cloud STT is unavailable  
✅ **Online job sync endpoint** (`POST /jobs/sync`) with local fallback

## Optional Environment Variables

Create a `.env` file in `backend` and set what you have:

```env
# Cloud STT (use either one)
OPENAI_API_KEY=
OPENAI_STT_MODEL=gpt-4o-mini-transcribe

GROQ_API_KEY=
GROQ_STT_MODEL=whisper-large-v3-turbo

# Online jobs providers (use what you have)
ADZUNA_APP_ID=
ADZUNA_APP_KEY=
RAPIDAPI_KEY=
```

If these are not set, the app still works with local fallback jobs and offline STT.

## Quickstart (Windows)

Simply run from the project root:

```batch
QUICKSTART.bat
```

This will guide you through all setup steps in order.

## Manual Setup (All Platforms)

1. Backend Python packages:

```bash
cd backend
pip install -r requirements.txt
```

2. Download offline speech models:

```bash
python download_offline_models.py
```

3. **(Optional)** Install offline translation packages:

```bash
python install_offline_translation.py
```

(Requires C++ compiler; skip if it fails - app works fine without it)

4. Ollama local model (in separate terminal):

```bash
ollama serve
ollama pull gemma3:1b
```

5. Start backend:

```bash
cd backend
node server.js
```

6. Start frontend (in separate terminal):

```bash
npm run dev
```

## Voice Pipeline

1. Frontend records audio → uploads wav to `/voice`
2. Backend tries cloud STT first (if key exists), else uses local Whisper
3. Backend generates response from local Ollama
4. Backend auto-detects if response should be Tamil or English
5. Backend generates speech audio locally and returns it
6. Frontend plays audio, then resumes listening

For Android APK builds, set `VITE_BACKEND_URL` in frontend environment to your deployed backend URL.

## Notes

- **TTS**: Uses pyttsx3 (system voice) offline by default. High-quality Tamil/English requires Python <3.13 for Piper (optional).
- **STT**: First inference ~20-30s (model loads into memory). Subsequent calls are faster.
- **Language control**: Request language comes from UI toggle (`ta-IN` / `en-IN`) and is passed through each voice request.
- **Python 3.13+**: Fully supported. Downgrades to Python 3.11 if you want optional Piper voices.

