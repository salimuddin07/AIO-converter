@echo off
echo.
echo ================================================
echo  AIO CONVERTER - DEVELOPMENT MODE WITH DEVTOOLS
echo ================================================
echo.
echo This will:
echo  1. Start the app in development mode
echo  2. Open DevTools automatically
echo  3. Show all console logs
echo.
echo Press Ctrl+C to stop
echo ================================================
echo.

cd /d "%~dp0"
set NODE_ENV=development
npx electron .

pause
