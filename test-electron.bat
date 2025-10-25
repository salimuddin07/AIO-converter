@echo off
REM ========================================
REM Quick Electron Test
REM ========================================

echo.
echo ========================================
echo   Starting Electron App (Test Mode)
echo ========================================
echo.

echo This will:
echo   1. Start the backend server in background
echo   2. Launch the Electron app
echo.
echo Press Ctrl+C to stop
echo.

REM Start backend in a new window
echo [1/2] Starting backend server...
start "AIO Backend" /MIN cmd /c "cd backend && npm run dev"

REM Wait for backend to start
echo [2/2] Waiting for backend to initialize (5 seconds)...
timeout /t 5 /nobreak >nul

echo.
echo [3/2] Launching Electron app...
echo.

REM Start Electron
set NODE_ENV=development
call npm run dev:electron

echo.
echo Electron app closed.
echo Remember to close the backend window if it's still running.
echo.
pause
