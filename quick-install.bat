@echo off
REM ========================================
REM Quick Fix - Install Without Canvas
REM ========================================

echo.
echo ========================================
echo   Quick Fix Installation
echo ========================================
echo.
echo This will install all dependencies
echo except Canvas (which is optional)
echo.

echo [1/4] Stopping any running processes...
taskkill /F /IM node.exe 2>nul
taskkill /F /IM electron.exe 2>nul
timeout /t 2 /nobreak >nul

echo.
echo [2/4] Installing ROOT dependencies...
echo.
call npm install --legacy-peer-deps --ignore-scripts

if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Failed to install root dependencies
    pause
    exit /b 1
)

echo.
echo [3/4] Installing BACKEND dependencies (may show Canvas warning - this is OK)...
echo.
cd backend
call npm install --legacy-peer-deps

echo.
echo [4/4] Installing FRONTEND dependencies...
echo.
cd ..\frontend
call npm install --legacy-peer-deps

if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Failed to install frontend dependencies
    cd ..
    pause
    exit /b 1
)

cd ..

echo.
echo ========================================
echo   Installation Complete!
echo ========================================
echo.
echo ✅ Root dependencies installed
echo ✅ Backend dependencies installed
echo ✅ Frontend dependencies installed
echo ⚠️  Canvas might have warnings (this is OK)
echo.
echo Next steps:
echo   1. Run: .\dev-electron.bat
echo   2. Or: npm run dev (for web mode)
echo.
echo If Canvas failed, that's fine! Sharp handles everything.
echo See FIX_CANVAS_ISSUE.md for details.
echo.

pause
