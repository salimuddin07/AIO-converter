@echo off
echo ========================================
echo AIO Converter - Production Build Script
echo ========================================

echo.
echo [1/4] Cleaning previous builds...
if exist "dist-packager" (
    echo Killing any running app processes...
    taskkill /f /im "AIO Converter.exe" >nul 2>&1
    timeout /t 2 /nobreak >nul
    
    echo Removing old build directory...
    rmdir /s /q "dist-packager" >nul 2>&1
)

echo.
echo [2/4] Building frontend...
cd frontend
call npm run build
if %errorlevel% neq 0 (
    echo ERROR: Frontend build failed!
    pause
    exit /b 1
)
cd ..

echo.
echo [3/4] Packaging Electron app...
npx electron-packager . "AIO Converter" --platform=win32 --arch=x64 --out=dist-packager --ignore="frontend/src|frontend/node_modules|temp|logs|\.git" --overwrite --no-asar
if %errorlevel% neq 0 (
    echo ERROR: Electron packaging failed!
    pause
    exit /b 1
)

echo.
echo [4/4] Verifying build...
if exist "dist-packager\AIO Converter-win32-x64\AIO Converter.exe" (
    echo ✅ SUCCESS: Build completed successfully!
    echo.
    echo Build location: dist-packager\AIO Converter-win32-x64\
    echo Executable: AIO Converter.exe
    echo.
    echo Key features in this build:
    echo - FFmpeg available for video processing
    echo - Sharp available for image processing  
    echo - All tools work without terminal
    echo - Direct Downloads folder saving
    echo - No asar packaging (FFmpeg accessible)
    echo.
    
    set /p choice="Start the app now? (y/n): "
    if /i "%choice%"=="y" (
        echo Starting AIO Converter...
        cd "dist-packager\AIO Converter-win32-x64"
        start "AIO Converter" "AIO Converter.exe"
        cd ..\..
    )
) else (
    echo ❌ ERROR: Build verification failed!
    echo Expected executable not found.
)

echo.
echo Build script completed.
pause