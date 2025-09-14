@echo off
echo Starting GIF Converter Backend Locally...
echo.
echo Backend will run on: http://localhost:5000
echo Press Ctrl+C to stop the server
echo.

cd /d "%~dp0backend"
npm start

pause