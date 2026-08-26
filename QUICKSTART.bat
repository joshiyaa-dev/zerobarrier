@echo off
setlocal enabledelayedexpansion
set "QUICKSTART_MODE=1"
set "ROOT_DIR=%~dp0"

echo.
echo =============================================================
echo   Zero Barrier Voice Bot - Offline Quickstart Setup
echo =============================================================
echo.

echo This script will guide you through setup in the correct order.
echo.
echo Prerequisites:
echo   - Python 3.11+ (3.13 OK)
echo   - Node.js (16+ recommended)
echo   - Ollama (download from https://ollama.ai)
echo.

pause

cd /d "%ROOT_DIR%backend"

echo.
echo STEP 1: Installing Python Dependencies
echo ========================================
echo.
call setup-dependencies.bat
if %ERRORLEVEL% NEQ 0 exit /b 1

echo.
echo STEP 2: Downloading Offline Models
echo ===================================
echo.
call setup-models.bat
if %ERRORLEVEL% NEQ 0 goto skip_models

echo.
echo STEP 3: Installing Translation Models
echo ======================================
echo.
call setup-translation.bat

:skip_models

echo.
echo =============================================================
echo Setup Complete. Start the services in 3 terminals:
echo -------------------------------------------------------------
echo Terminal 1 (Ollama LLM):
echo   cd backend
echo   start-ollama.bat
echo.
echo Terminal 2 (Backend API):
echo   cd backend
echo   start-backend.bat
echo.
echo Terminal 3 (Frontend):
echo   cd ..
echo   start-frontend.bat
echo.
echo Then open: http://localhost:5173
echo Click "Start OS" and speak.
echo =============================================================
echo.

echo Stopping old local services (if running)...
taskkill /F /IM node.exe >nul 2>&1
taskkill /F /IM ollama.exe >nul 2>&1

echo.
echo Launching Ollama in a new terminal...
start "ZeroBarrier-Ollama" cmd /k "cd /d ""%ROOT_DIR%backend"" && call start-ollama.bat"

echo Launching Backend API in a new terminal...
start "ZeroBarrier-Backend" cmd /k "cd /d ""%ROOT_DIR%backend"" && call start-backend.bat"

echo Launching Frontend in a new terminal...
start "ZeroBarrier-Frontend" cmd /k "cd /d ""%ROOT_DIR%"" && call start-frontend.bat"

echo.
echo Opening app in browser...
start "" "chrome.exe" "http://localhost:5173"
if %ERRORLEVEL% NEQ 0 start "" "http://localhost:5173"

echo.
echo [OK] All services launched.
echo If any terminal shows an error, share that output.
echo.

pause
