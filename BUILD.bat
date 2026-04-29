@echo off
REM ============================================================
REM  AIO Converter - One-click build for Gumroad
REM ============================================================
setlocal
cd /d "%~dp0"

echo === Building AIO Converter ===
call npm run dist
if errorlevel 1 (
    echo.
    echo *** Build FAILED. See messages above. ***
    pause
    exit /b 1
)

echo.
echo ============================================================
echo  SUCCESS! Upload this file to Gumroad:
dir /B "dist\AIO-Converter-*-win-x64.zip"
echo ============================================================
echo.
explorer dist
pause
