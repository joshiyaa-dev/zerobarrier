@echo off
setlocal
echo.
echo ============================================
echo Zero Barrier - Starting Ollama LLM Service
echo ============================================
echo.

echo Checking if Ollama is installed...

set "OLLAMA_CMD=ollama"
where ollama >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    if exist "%LocalAppData%\Programs\Ollama\ollama.exe" (
        set "OLLAMA_CMD=%LocalAppData%\Programs\Ollama\ollama.exe"
    ) else (
    echo.
        echo [ERROR] Ollama not found in PATH.
    echo.
    echo Download from: https://ollama.ai
        echo After installing, restart this terminal and try again.
    echo.
    pause
    exit /b 1
    )
)

echo.
echo [OK] Found Ollama. Downloading model (one-time)...
echo.

"%OLLAMA_CMD%" pull gemma3:1b

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Failed to pull gemma3:1b model.
    pause
    exit /b 1
)

echo.
echo [OK] Model ready. Starting Ollama server...
echo.
echo The LLM will be available at: http://localhost:11434
echo.

"%OLLAMA_CMD%" serve
