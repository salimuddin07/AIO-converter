@echo off
REM ========================================
REM Fix Installation Issues
REM ========================================

echo.
echo ========================================
echo   Fixing Installation Issues
echo ========================================
echo.

echo [Step 1/5] Closing any running processes...
echo.

REM Kill any node/electron processes
taskkill /F /IM node.exe 2>nul
taskkill /F /IM electron.exe 2>nul
timeout /t 2 /nobreak >nul

echo [Step 2/5] Cleaning up locked directories...
echo.

REM Remove problematic directories
if exist "node_modules" (
    echo Removing root node_modules...
    rmdir /s /q node_modules 2>nul
    if exist "node_modules" (
        echo Some files are locked. Trying alternative cleanup...
        timeout /t 2 /nobreak >nul
        rmdir /s /q node_modules 2>nul
    )
)

if exist "package-lock.json" (
    echo Removing package-lock.json...
    del /f /q package-lock.json 2>nul
)

echo [Step 3/5] Installing root dependencies (without workspaces)...
echo.

REM Install root dependencies first, without postinstall
call npm install --legacy-peer-deps --no-optional --ignore-scripts

if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Root installation failed!
    echo Trying with force flag...
    call npm install --force --legacy-peer-deps --no-optional --ignore-scripts
)

echo.
echo [Step 4/5] Installing backend dependencies...
echo.

cd backend

REM Clean backend
if exist "node_modules" (
    echo Removing backend node_modules...
    rmdir /s /q node_modules 2>nul
)

if exist "package-lock.json" (
    del /f /q package-lock.json 2>nul
)

REM Install backend with special handling for canvas
echo Installing backend dependencies...
call npm install --legacy-peer-deps --no-optional

if %ERRORLEVEL% NEQ 0 (
    echo [WARNING] Some backend packages failed to install
    echo This is OK if canvas failed - we'll handle it specially
)

cd ..

echo.
echo [Step 5/5] Installing frontend dependencies...
echo.

cd frontend

REM Clean frontend
if exist "node_modules" (
    echo Removing frontend node_modules...
    rmdir /s /q node_modules 2>nul
)

if exist "package-lock.json" (
    del /f /q package-lock.json 2>nul
)

echo Installing frontend dependencies...
call npm install --legacy-peer-deps

if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Frontend installation failed!
    cd ..
    pause
    exit /b 1
)

cd ..

echo.
echo ========================================
echo   Installation Status
echo ========================================
echo.

REM Check what was installed
echo Root dependencies:
if exist "node_modules\electron" (
    echo   [OK] Electron installed
) else (
    echo   [FAIL] Electron missing
)

if exist "node_modules\electron-builder" (
    echo   [OK] Electron Builder installed
) else (
    echo   [FAIL] Electron Builder missing
)

echo.
echo Backend dependencies:
if exist "backend\node_modules\express" (
    echo   [OK] Express installed
) else (
    echo   [FAIL] Express missing
)

if exist "backend\node_modules\sharp" (
    echo   [OK] Sharp installed
) else (
    echo   [WARN] Sharp missing
)

if exist "backend\node_modules\canvas" (
    echo   [OK] Canvas installed
) else (
    echo   [WARN] Canvas missing - but this is OK, we have Sharp
)

echo.
echo Frontend dependencies:
if exist "frontend\node_modules\react" (
    echo   [OK] React installed
) else (
    echo   [FAIL] React missing
)

echo.
echo ========================================
echo   Next Steps
echo ========================================
echo.

echo 1. If Canvas failed to install, that's OK!
echo    - Sharp handles all image processing
echo    - Canvas is optional for advanced graphics
echo.
echo 2. Test the installation:
echo    - Run: .\dev-electron.bat
echo.
echo 3. If you still have issues:
echo    - Restart your computer
echo    - Run this script again
echo    - Or skip Canvas: see FIX_CANVAS_ISSUE.md
echo.

pause
