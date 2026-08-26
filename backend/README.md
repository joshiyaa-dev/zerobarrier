# Zero Barrier Voice Bot Backend (Offline First)

## Overview

This backend runs voice processing fully offline after one-time model downloads:

- **STT**: Faster-Whisper (local model) + noise reduction → fully offline
- **LLM**: Ollama local model (`gemma3:1b` by default) → fully offline
- **TTS**: System voice via pyttsx3 → fully offline (no internet needed)
- **Translation**: Optional; requires C++ compiler (not included by default)

## Key Files

- `server.js`: API routes (`/voice`, `/voice/text`)
- `services/stt.js`: Node wrapper for offline STT
- `transcribe_stt.py`: Denoise + Whisper transcription
- `services/llm.js`: Guided flow + language detection
- `services/translate.js`: Optional translation wrapper
- `services/tts.js`: Node wrapper for offline TTS
- `offline_tts_bridge.py`: pyttsx3 (system voice)
- `download_offline_models.py`: Download Whisper model
- `install_offline_translation.py`: Optional translation installer
- Setup batch files for Windows automation

## Quick Setup

### Windows
```batch
QUICKSTART.bat
```

### Manual (All Platforms)

1. Install core dependencies:
```bash
pip install -r requirements.txt
```

2. Download Whisper model:
```bash
python download_offline_models.py
```

3. Start Ollama (separate terminal):
```bash
ollama serve
ollama pull gemma3:1b
```

4. Start backend:
```bash
node server.js
```

## Runtime Behavior

`POST /voice`

1. Receives uploaded wav audio
2. Denoises and transcribes locally (no cloud API)
3. Generates response from local Ollama
4. Auto-detects response language (Tamil vs English)
5. Generates speech audio locally and returns base64

Response:
```json
{
  "emotion": "HAPPY",
  "text": "உங்கள் பெயரைச் சொல்லுங்கள்.",
  "audio": "<base64 wav>",
  "status": "ok"
}
```

## Fully Offline (No Internet After Setup)

After downloading models once:
- ✅ Speech-to-text works
- ✅ LLM inference works  
- ✅ Text-to-speech works
- ✅ Language detection works
- ☐ Translation is optional (skip if C++ compiler unavailable)

## Environment Variables

- `WHISPER_MODEL`: Model size (default: `small`)
- `WHISPER_MODEL_DIR`: Whisper cache directory

## Notes

- **Python 3.13+**: Fully supported. Core features need no compiler.
- **pyttsx3**: Works offline on all platforms. System voice is used.
- **Translation**: Optional; app works without it. Requires C++ compiler if desired.
- **Ollama**: Must run separately; required for LLM inference.
