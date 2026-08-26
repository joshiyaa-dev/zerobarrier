@echo off
echo.
echo ============================================
echo Zero Barrier - Starting Backend API
echo ============================================
echo.

echo Checking dependencies...
python -c "import faster_whisper, soundfile, pyttsx3" >nul 2>&1

if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Missing Python dependencies.
    echo.
    echo Run this first:
    echo   setup-dependencies.bat
    echo.
    pause
    exit /b 1
)

echo [OK] Dependencies OK
echo.

echo Checking Ollama...
curl -s http://localhost:11434/api/tags >nul 2>&1

if %ERRORLEVEL% NEQ 0 (
    echo [WARN] Ollama not responding at http://localhost:11434
    echo.
    echo Start Ollama in another terminal:
    echo   start-ollama.bat
    echo.
    pause
)

echo.
echo [OK] Starting backend on http://localhost:3000
echo.

node server.js
