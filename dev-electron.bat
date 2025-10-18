@echo off
REM ========================================
REM Run AIO Converter in Electron Dev Mode
REM ========================================

echo.
echo ========================================
echo   AIO Converter - Electron Dev Mode
echo ========================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js is not installed!
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo [Step 1/4] Checking dependencies...
echo.

if not exist "node_modules\" (
    echo Installing root dependencies...
    call npm install
)

if not exist "frontend\node_modules\" (
    echo Installing frontend dependencies...
    cd frontend
    call npm install
    cd ..
)

if not exist "backend\node_modules\" (
    echo Installing backend dependencies...
    cd backend
    call npm install
    cd ..
)

echo [Step 2/4] Building frontend...
echo.
cd frontend
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Frontend build failed!
    cd ..
    pause
    exit /b 1
)
cd ..
echo Frontend built successfully!
echo.

echo [Step 3/4] Starting backend server...
echo.
echo Starting backend on port 3003...
echo Backend will run in a new window.
echo.
start "AIO Converter Backend" cmd /k "cd backend && npm run dev"

REM Wait a few seconds for backend to start
echo Waiting for backend to initialize...
timeout /t 5 /nobreak >nul

echo [Step 4/4] Starting Electron application...
echo.
echo Starting Electron app...
echo.

REM Set environment variable for development
set NODE_ENV=development

call npm run dev:electron

REM If Electron closes, this will run
echo.
echo ========================================
echo   Electron app closed
echo ========================================
echo.
echo The backend server is still running in another window.
echo Close that window to stop the backend server.
echo.

pause
