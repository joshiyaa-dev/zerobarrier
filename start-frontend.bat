@echo off
echo.
echo ============================================
echo Zero Barrier - Starting Frontend
echo ============================================
echo.

echo Checking Node.js...
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js not found
    pause
    exit /b 1
)

echo [OK] Node.js found
echo.
echo Installing frontend dependencies (one-time)...
npm install

echo.
echo [OK] Starting frontend on http://localhost:5173
echo.
echo Make sure backend and Ollama are running!
echo.

npm run dev -- --host localhost --port 5173 --strictPort
