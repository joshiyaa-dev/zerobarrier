#!/usr/bin/env python3
"""
Offline STT with noise reduction.

- Denoises the input audio using spectral gating
- Runs local Faster-Whisper model inference (no cloud API)
"""

import os
import sys
import tempfile

import noisereduce as nr
import numpy as np
import soundfile as sf
from faster_whisper import WhisperModel


if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")


def whisper_language(language):
    l = (language or "").lower()
    if l in ("auto", "", "und"):
        return None
    if l.startswith("ta"):
        return "ta"
    if l.startswith("en"):
        return "en"
    return "en"


def get_model():
    model_size = os.getenv("WHISPER_MODEL", "small")
    model_root = os.getenv("WHISPER_MODEL_DIR", os.path.join(os.path.dirname(__file__), "models", "whisper"))
    os.makedirs(model_root, exist_ok=True)
    return WhisperModel(model_size, device="cpu", compute_type="int8", download_root=model_root)


def reduce_background_noise(audio_path):
    audio, sr = sf.read(audio_path)

    if audio.ndim > 1:
        audio = np.mean(audio, axis=1)

    # Keep level stable before denoising.
    peak = np.max(np.abs(audio)) if len(audio) else 0
    if peak > 0:
        audio = audio / peak

    noise_clip_len = min(len(audio), int(sr * 0.5))
    noise_clip = audio[:noise_clip_len] if noise_clip_len > 0 else None

    cleaned = nr.reduce_noise(
        y=audio,
        sr=sr,
        y_noise=noise_clip,
        stationary=True,
        prop_decrease=0.9,
    )

    fd, denoised_path = tempfile.mkstemp(suffix="_denoised.wav")
    os.close(fd)
    sf.write(denoised_path, cleaned, sr)
    return denoised_path


def transcribe_audio(audio_path, language="ta-IN"):
    denoised_path = None
    try:
        denoised_path = reduce_background_noise(audio_path)
        model = get_model()
        lang = whisper_language(language)

        segments, _ = model.transcribe(
            denoised_path,
            language=lang,
            beam_size=1,
            vad_filter=True,
            condition_on_previous_text=False,
            temperature=0.0,
        )

        parts = [seg.text.strip() for seg in segments if seg.text and seg.text.strip()]
        return " ".join(parts).strip()
    except Exception as e:
        print(f"[STT] Error: {e}", file=sys.stderr, flush=True)
        return ""
    finally:
        if denoised_path and os.path.exists(denoised_path):
            try:
                os.remove(denoised_path)
            except OSError:
                pass


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python transcribe_stt.py <audio_path> [language]")
        sys.exit(1)

    audio_path = sys.argv[1]
    language = sys.argv[2] if len(sys.argv) > 2 else "ta-IN"

    if not os.path.exists(audio_path):
        print(f"[STT] File not found: {audio_path}", file=sys.stderr, flush=True)
        sys.exit(1)

    result = transcribe_audio(audio_path, language).strip()
    if result:
        sys.stdout.write(result + "\n")
        sys.stdout.flush()
