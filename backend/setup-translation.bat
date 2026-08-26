@echo off
echo.
echo ============================================
echo Zero Barrier - Translation (Optional Setup)
echo ============================================
echo.
echo Installing offline translation for English <-> Tamil
echo (Requires C++ compiler; if it fails, that's OK - translation is optional)
echo.

python install_offline_translation.py

if %ERRORLEVEL% EQU 0 (
    echo.
    echo [OK] Translation models installed.
    echo.
) else (
    echo.
    echo [INFO] Translation setup skipped (requires C++ compiler)
    echo The app will work fine without it!
    echo.
)

echo.
echo Setup complete! You're ready to go.
echo.
if not defined QUICKSTART_MODE pause
