@echo off
REM ========================================
REM Pre-Flight Check for Electron App
REM ========================================

echo.
echo ========================================
echo   AIO Converter - Pre-Flight Check
echo ========================================
echo.

set ERROR_COUNT=0

REM Check Node.js
echo [1/8] Checking Node.js...
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [FAIL] Node.js not found
    set /a ERROR_COUNT+=1
) else (
    node --version
    echo [PASS] Node.js is installed
)
echo.

REM Check npm
echo [2/8] Checking npm...
where npm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [FAIL] npm not found
    set /a ERROR_COUNT+=1
) else (
    npm --version
    echo [PASS] npm is installed
)
echo.

REM Check root node_modules
echo [3/8] Checking root dependencies...
if exist "node_modules\" (
    echo [PASS] Root dependencies installed
) else (
    echo [FAIL] Root dependencies missing
    echo Run: npm install
    set /a ERROR_COUNT+=1
)
echo.

REM Check backend node_modules
echo [4/8] Checking backend dependencies...
if exist "backend\node_modules\" (
    echo [PASS] Backend dependencies installed
) else (
    echo [FAIL] Backend dependencies missing
    echo Run: cd backend ^&^& npm install
    set /a ERROR_COUNT+=1
)
echo.

REM Check frontend node_modules
echo [5/8] Checking frontend dependencies...
if exist "frontend\node_modules\" (
    echo [PASS] Frontend dependencies installed
) else (
    echo [FAIL] Frontend dependencies missing
    echo Run: cd frontend ^&^& npm install
    set /a ERROR_COUNT+=1
)
echo.

REM Check frontend build
echo [6/8] Checking frontend build...
if exist "frontend\dist\index.html" (
    echo [PASS] Frontend is built
) else (
    echo [FAIL] Frontend not built
    echo Run: cd frontend ^&^& npm run build
    set /a ERROR_COUNT+=1
)
echo.

REM Check icons
echo [7/8] Checking icons...
set ICON_MISSING=0
if not exist "build\icon.ico" (
    echo [FAIL] build\icon.ico missing
    set ICON_MISSING=1
)
if not exist "build\icon.png" (
    echo [FAIL] build\icon.png missing
    set ICON_MISSING=1
)
if not exist "public\icon.png" (
    echo [FAIL] public\icon.png missing
    set ICON_MISSING=1
)
if %ICON_MISSING% EQU 0 (
    echo [PASS] All icons present
) else (
    echo Run: node scripts\create-ico.js
    set /a ERROR_COUNT+=1
)
echo.

REM Check port availability
echo [8/8] Checking port 3003...
netstat -ano | findstr :3003 >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo [WARN] Port 3003 is already in use
    echo Close any running backend servers first
) else (
    echo [PASS] Port 3003 is available
)
echo.

REM Summary
echo ========================================
if %ERROR_COUNT% EQU 0 (
    echo [SUCCESS] All checks passed!
    echo ========================================
    echo.
    echo You are ready to:
    echo   1. Test in dev mode: .\dev-electron.bat
    echo   2. Build installer:  .\build-windows.bat
    echo.
) else (
    echo [FAILED] %ERROR_COUNT% check(s) failed
    echo ========================================
    echo.
    echo Please fix the issues above before proceeding.
    echo.
)

pause
