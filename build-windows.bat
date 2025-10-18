@echo off
REM ========================================
REM Build AIO Converter for Windows
REM ========================================

echo.
echo ========================================
echo   Building AIO Converter for Windows
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

echo [1/6] Checking Node.js version...
node --version
echo.

echo [2/6] Checking dependencies...
if not exist "node_modules\" (
    echo Installing root dependencies...
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo [ERROR] Failed to install root dependencies!
        pause
        exit /b 1
    )
)

if not exist "frontend\node_modules\" (
    echo Installing frontend dependencies...
    cd frontend
    call npm install
    cd ..
    if %ERRORLEVEL% NEQ 0 (
        echo [ERROR] Failed to install frontend dependencies!
        pause
        exit /b 1
    )
)

if not exist "backend\node_modules\" (
    echo Installing backend dependencies...
    cd backend
    call npm install
    cd ..
    if %ERRORLEVEL% NEQ 0 (
        echo [ERROR] Failed to install backend dependencies!
        pause
        exit /b 1
    )
)

echo [3/6] Building frontend...
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

echo [4/6] Running prepare-build script...
node scripts\prepare-build.js
if %ERRORLEVEL% NEQ 0 (
    echo [WARNING] prepare-build script failed, but continuing...
)
echo.

echo [5/6] Building Windows application...
echo.
echo Choose build type:
echo   1. 64-bit Installer (Recommended)
echo   2. 32-bit Installer
echo   3. Portable Executable (no installation)
echo   4. All (64-bit, 32-bit, and Portable)
echo.
set /p choice="Enter your choice (1-4): "

if "%choice%"=="1" (
    echo Building 64-bit installer...
    call npm run build:win
) else if "%choice%"=="2" (
    echo Building 32-bit installer...
    call npm run build:win32
) else if "%choice%"=="3" (
    echo Building portable executable...
    call npm run build:win-portable
) else if "%choice%"=="4" (
    echo Building all versions...
    call npm run build:all
) else (
    echo Invalid choice! Building 64-bit installer by default...
    call npm run build:win
)

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Build failed!
    echo.
    echo Common issues:
    echo   - Missing icon files (check build\icon.ico)
    echo   - Insufficient disk space
    echo   - Antivirus blocking electron-builder
    echo.
    echo Check the error messages above for details.
    pause
    exit /b 1
)

echo.
echo ========================================
echo [6/6] Build completed successfully!
echo ========================================
echo.
echo Your installer(s) can be found in the 'dist' folder:
echo.
dir dist\*.exe /b 2>nul
echo.
echo ========================================
echo.
echo Next steps:
echo   1. Test the installer on a clean Windows machine
echo   2. Verify all features work correctly
echo   3. Distribute to users!
echo.
echo For more information, see ELECTRON_SETUP.md
echo ========================================
echo.

pause
