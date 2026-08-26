#!/usr/bin/env python3
"""
Quick test script to verify the voice bot is working
Run: python3 test_voice_bot.py
"""

import sys
import subprocess
import os

def check_python_packages():
    """Check if required Python packages are installed"""
    print("\n📦 Checking Python packages...")
    required = ['faster_whisper', 'noisereduce', 'soundfile', 'pyttsx3', 'argostranslate']
    missing = []
    
    for pkg in required:
        try:
            __import__(pkg.replace('-', '_'))
            print(f"  ✅ {pkg}")
        except ImportError:
            print(f"  ❌ {pkg} - MISSING")
            missing.append(pkg)
    
    if missing:
        print(f"\n⚠️ Install missing packages:")
        print(f"  pip install {' '.join(missing)}")
        return False
    return True

def check_ollama():
    """Check if Ollama is running"""
    print("\n🤖 Checking Ollama LLM...")
    try:
        result = subprocess.run(
            ['curl', '-s', 'http://localhost:11434/api/tags'],
            capture_output=True,
            timeout=3
        )
        if result.returncode == 0 and b'gemma3' in result.stdout:
            print("  ✅ Ollama running with gemma3 model")
            return True
        else:
            print("  ⚠️ Ollama not responding or gemma3 not found")
            print("  Run: ollama serve (in another terminal)")
            print("  Then: ollama pull gemma3:1b")
            return False
    except Exception as e:
        print(f"  ❌ Ollama check failed: {e}")
        print("  Make sure Ollama is running: ollama serve")
        return False

def check_backend():
    """Check if backend server is running"""
    print("\n🔗 Checking Backend Server...")
    try:
        result = subprocess.run(
            ['curl', '-s', '-o', '/dev/null', '-w', '%{http_code}', 'http://localhost:3000/voice'],
            capture_output=True,
            timeout=3
        )
        # /voice expects POST with audio, so 400/405 is OK (means server is running)
        if result.stdout in [b'400', b'405', b'200']:
            print("  ✅ Backend running on localhost:3000")
            return True
        else:
            print(f"  ❌ Backend not responding (HTTP {result.stdout.decode()})")
            print("  Run: cd backend && node server.js")
            return False
    except Exception as e:
        print(f"  ⚠️ Backend check failed: {e}")
        print("  Run: cd backend && node server.js")
        return False

def test_stt():
    """Test offline speech-to-text functionality"""
    print("\n🎤 Testing STT (Offline Whisper)...")
    
    # Check if test audio exists
    if not os.path.exists('backend/test_hello.mp3'):
        print("  ⚠️ No test audio found (backend/test_hello.mp3)")
        print("  Create a small audio file with 'hello' for testing")
        return False
    
    try:
        result = subprocess.run(
            ['python', 'backend/transcribe_stt.py', 'backend/test_hello.mp3', 'en-IN'],
            capture_output=True,
            timeout=45,
            text=True
        )
        output = result.stdout.strip()
        
        if output and not output.startswith('[STT]'):
            print(f"  ✅ STT Working: '{output}'")
            return True
        else:
            print(f"  ⚠️ STT returned: {output}")
            return False
    except subprocess.TimeoutExpired:
        print("  ⚠️ STT timeout (model may still be downloading/loading)")
        return False
    except Exception as e:
        print(f"  ❌ STT test failed: {e}")
        return False

def main():
    print("=" * 50)
    print("🚀 Zero Barrier Voice Bot - Verification Test")
    print("=" * 50)
    
    results = {
        "Python Packages": check_python_packages(),
        "Ollama LLM": check_ollama(),
        "Backend Server": check_backend(),
        "STT Service": test_stt(),
    }
    
    print("\n" + "=" * 50)
    print("📊 Test Summary")
    print("=" * 50)
    
    for name, passed in results.items():
        status = "✅ PASS" if passed else "❌ FAIL/WARN"
        print(f"{status} - {name}")
    
    all_pass = all(results.values())
    
    print("\n" + "=" * 50)
    if all_pass:
        print("✅ All systems ready! Open http://localhost:5173")
    else:
        print("⚠️ Some systems need configuration (see above)")
        print("See SETUP.md for detailed instructions")
    print("=" * 50)

if __name__ == "__main__":
    main()
