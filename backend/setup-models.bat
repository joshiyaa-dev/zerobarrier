@echo off
echo.
echo ============================================
echo Zero Barrier - Downloading Offline Models
echo ============================================
echo.
echo This will download:
echo   - Whisper STT model (small: ~500MB)
echo   - Piper voice models (English + Tamil, optional)
echo.
echo Total time: 2-10 minutes depending on internet speed
echo.

python download_offline_models.py

if %ERRORLEVEL% EQU 0 (
    echo.
    echo [OK] Models downloaded successfully.
    echo.
) else (
    echo.
    echo [WARN] Model download had issues. Check the output above.
    echo The app will still work with fallback system voices.
    echo.
)

echo Next step: Run setup-translation.bat
if not defined QUICKSTART_MODE pause
