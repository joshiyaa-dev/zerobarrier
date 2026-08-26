"""
edge_tts_bridge.py
Converts text to speech using Microsoft Edge TTS (Tamil & English)
Usage: python edge_tts_bridge.py "text to speak" output.wav [ta-IN|en-US]
"""

import sys
import asyncio
import edge_tts

async def speak(text, output_path, lang="auto"):
    # Auto-detect Tamil vs English based on character range
    if lang == "auto":
        # Check if text contains Tamil Unicode chars (U+0B80–U+0BFF)
        has_tamil = any('\u0B80' <= ch <= '\u0BFF' for ch in text)
        voice = "ta-IN-PallaviNeural" if has_tamil else "en-IN-NeerjaNeural"
    elif lang == "ta-IN":
        voice = "ta-IN-PallaviNeural"
    else:
        voice = "en-IN-NeerjaNeural"

    print(f"[edge-tts] Voice: {voice}", flush=True)
    communicate = edge_tts.Communicate(text, voice)
    await communicate.save(output_path)

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python edge_tts_bridge.py 'text' output.wav [auto|ta-IN|en-US]")
        sys.exit(1)
    
    text_arg = sys.argv[1]
    output_arg = sys.argv[2]
    lang_arg = sys.argv[3] if len(sys.argv) > 3 else "auto"

    asyncio.run(speak(text_arg, output_arg, lang_arg))
    print(f"[edge-tts] Done: {output_arg}", flush=True)
