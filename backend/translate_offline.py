#!/usr/bin/env python3
"""
Offline translation using Argos Translate packages.
Requires language packages to be installed locally.
"""

import sys


def translate_text(text, source_lang, target_lang):
    try:
        from argostranslate import translate

        installed = translate.get_installed_languages()
        from_lang = next((l for l in installed if l.code == source_lang), None)
        to_lang = next((l for l in installed if l.code == target_lang), None)

        if not from_lang or not to_lang:
            return text

        translator = from_lang.get_translation(to_lang)
        return translator.translate(text)
    except Exception:
        return text


if __name__ == "__main__":
    if len(sys.argv) < 4:
        print("Usage: python translate_offline.py 'text' <source:en|ta> <target:en|ta>")
        sys.exit(1)

    text_arg = sys.argv[1]
    source_arg = sys.argv[2]
    target_arg = sys.argv[3]

    print(translate_text(text_arg, source_arg, target_arg), flush=True)
