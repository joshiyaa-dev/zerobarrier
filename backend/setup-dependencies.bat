@echo off
echo.
echo ============================================
echo Zero Barrier - Installing Python Dependencies
echo ============================================
echo.

python -c "import faster_whisper, noisereduce, soundfile, numpy, scipy, pyttsx3, datasets" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [OK] Core Python dependencies already installed.
    echo.
    echo Next step: Run setup-models.bat
    if not defined QUICKSTART_MODE pause
    exit /b 0
)

echo.
echo Installing required packages...
python -m pip install --disable-pip-version-check --trusted-host pypi.org --trusted-host files.pythonhosted.org --upgrade faster-whisper noisereduce soundfile numpy scipy pyttsx3 datasets

if %ERRORLEVEL% EQU 0 (
    echo.
    echo [OK] Dependencies installed successfully.
    echo.
) else (
    echo.
    echo [ERROR] Failed to install dependencies. Check the errors above.
    pause
    exit /b 1
)

echo.
echo Next step: Run setup-models.bat
if not defined QUICKSTART_MODE pause
