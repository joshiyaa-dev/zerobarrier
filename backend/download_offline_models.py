#!/usr/bin/env python3
"""
Download offline models used by Zero Barrier backend.

Downloads:
- Faster-Whisper model cache (default: small)
- Piper English voice model (required)
- SpeechT5 Tamil TTS model (downloaded on warmup)
- Argos Translate package indexes (optional)
"""

import os
import urllib.request


BASE_DIR = os.path.dirname(__file__)
PIPER_DIR = os.path.join(BASE_DIR, "models", "piper")
WHISPER_DIR = os.path.join(BASE_DIR, "models", "whisper")

EN_MODEL_URLS = {
    "en_US-lessac-medium.onnx": "https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/en/en_US/lessac/medium/en_US-lessac-medium.onnx",
    "en_US-lessac-medium.onnx.json": "https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/en/en_US/lessac/medium/en_US-lessac-medium.onnx.json",
}

def download(url, destination):
    os.makedirs(os.path.dirname(destination), exist_ok=True)
    if os.path.exists(destination):
        print(f"[skip] {destination}")
        return
    print(f"[download] {url}")
    urllib.request.urlretrieve(url, destination)
    print(f"[saved] {destination}")


def download_piper_models():
    print("\n== Piper models (English) ==")
    for name, url in EN_MODEL_URLS.items():
        download(url, os.path.join(PIPER_DIR, name))

    print("[note] Tamil voice is provided by SpeechT5 warmup below (not Piper).")


def warmup_whisper():
    print("\n== Whisper model ==")
    model_name = os.getenv("WHISPER_MODEL", "small")
    os.makedirs(WHISPER_DIR, exist_ok=True)

    from faster_whisper import WhisperModel

    # Initializes and downloads model to local cache once.
    WhisperModel(model_name, device="cpu", compute_type="int8", download_root=WHISPER_DIR)
    print(f"[ok] Whisper model ready: {model_name}")


def prepare_argos_index():
    print("\n== Argos index ==")
    try:
        from argostranslate import package
        package.update_package_index()
        print("[ok] Argos package index refreshed")
        print("[note] Install language packs offline with install_offline_translation.py")
    except Exception as e:
        print(f"[warn] Argos index refresh failed: {e}")


def warmup_tamil_tts():
    print("\n== Tamil TTS warmup ==")
    try:
        from offline_tts_bridge import synthesize_with_speecht5_tamil

        temp_output = os.path.join(BASE_DIR, "uploads", "_tamil_tts_warmup.wav")
        os.makedirs(os.path.dirname(temp_output), exist_ok=True)
        synthesize_with_speecht5_tamil("வணக்கம்", temp_output)
        if os.path.exists(temp_output):
            os.remove(temp_output)
        print("[ok] Tamil SpeechT5 model ready")
    except BaseException as e:
        print(f"[warn] Tamil SpeechT5 warmup failed: {e}")


if __name__ == "__main__":
    download_piper_models()
    warmup_whisper()
    warmup_tamil_tts()
    prepare_argos_index()
    print("\nAll possible offline assets prepared.")
