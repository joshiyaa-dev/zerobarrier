#!/usr/bin/env python3
"""
Offline text-to-speech bridge.

Priority:
1) SpeechT5 Tamil model for Tamil audio
2) Piper with local English model
3) pyttsx3 fallback using installed system voice
"""

import os
import subprocess
import sys
import glob


def has_tamil(text):
    return any("\u0B80" <= ch <= "\u0BFF" for ch in text)


def choose_lang(text, lang):
    if lang == "auto":
        return "ta-IN" if has_tamil(text) else "en-IN"
    return lang


def piper_model_path(base, lang):
    pattern = "ta*.onnx" if lang.startswith("ta") else "en*.onnx"
    matches = sorted(glob.glob(os.path.join(base, pattern)))
    if matches:
        return matches[0]

    # Backward-compatible defaults.
    if lang.startswith("ta"):
        return os.path.join(base, "ta_IN-kani-medium.onnx")
    return os.path.join(base, "en_US-lessac-medium.onnx")


def synthesize_with_piper(text, output_path, lang):
    model_dir = os.getenv("PIPER_MODEL_DIR", os.path.join(os.path.dirname(__file__), "models", "piper"))
    model_path = piper_model_path(model_dir, lang)
    piper_bin = os.getenv("PIPER_BIN", "piper")

    if not os.path.exists(model_path):
        raise FileNotFoundError(f"Missing Piper model: {model_path}")

    subprocess.run(
        [piper_bin, "--model", model_path, "--output_file", output_path],
        input=text.encode("utf-8"),
        check=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
    )


def synthesize_with_pyttsx3(text, output_path, lang):
    import pyttsx3

    engine = pyttsx3.init()
    voices = engine.getProperty("voices")
    target = "ta" if lang.startswith("ta") else "en"

    for voice in voices:
        voice_blob = f"{voice.id} {voice.name}".lower()
        if target in voice_blob:
            engine.setProperty("voice", voice.id)
            break

    engine.setProperty("rate", 165)
    engine.save_to_file(text, output_path)
    engine.runAndWait()


def synthesize_with_speecht5_tamil(text, output_path):
    import torch
    import soundfile as sf
    from transformers import AutoTokenizer, VitsModel

    model_id = os.getenv("TAMIL_TTS_MODEL", "facebook/mms-tts-tam")

    tokenizer = AutoTokenizer.from_pretrained(model_id)
    model = VitsModel.from_pretrained(model_id)

    inputs = tokenizer(text=text, return_tensors="pt")
    with torch.no_grad():
        output = model(**inputs).waveform

    audio = output.squeeze().cpu().numpy()
    sample_rate = int(getattr(model.config, "sampling_rate", 16000))
    sf.write(output_path, audio, samplerate=sample_rate)


def speak(text, output_path, lang="auto"):
    resolved_lang = choose_lang(text, lang)

    try:
        if resolved_lang.startswith("ta"):
            synthesize_with_speecht5_tamil(text, output_path)
            print(f"[TTS] Engine: speecht5-tamil ({resolved_lang})", flush=True)
            return

        synthesize_with_piper(text, output_path, resolved_lang)
        print(f"[TTS] Engine: piper ({resolved_lang})", flush=True)
        return
    except Exception as piper_error:
        print(f"[TTS] Piper skipped: using pyttsx3", file=sys.stderr, flush=True)

    synthesize_with_pyttsx3(text, output_path, resolved_lang)
    print(f"[TTS] Engine: pyttsx3 ({resolved_lang})", flush=True)


if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python offline_tts_bridge.py 'text' output.wav [auto|ta-IN|en-IN]")
        sys.exit(1)

    text_arg = sys.argv[1]
    output_arg = sys.argv[2]
    lang_arg = sys.argv[3] if len(sys.argv) > 3 else "auto"

    speak(text_arg, output_arg, lang_arg)
    print(f"[TTS] Done: {output_arg}", flush=True)
