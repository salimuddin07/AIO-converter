@echo off
REM ============================================================
REM  CLEANUP.bat - Run ONCE to delete stale files from old
REM  iterations of the project. Safe to re-run.
REM ============================================================
setlocal
cd /d "%~dp0"

echo Removing stale documentation files...
del /Q "ALL_FIXES_COMPLETE.md" 2>nul
del /Q "COMPLETE_ELECTRON_FIX.md" 2>nul
del /Q "ELECTRON_BACKEND_FIX.md" 2>nul
del /Q "ELECTRON_INTEGRATION_TEST.md" 2>nul
del /Q "HOW-TO-RUN-CORRECTLY.md" 2>nul
del /Q "INTEGRATED_BACKEND_SUMMARY.md" 2>nul
del /Q "README-DESKTOP.md" 2>nul
del /Q "README-old.md" 2>nul

echo Removing stale build/run scripts...
del /Q "RUN-DESKTOP-APP.bat" 2>nul
del /Q "START-FIXED-APP.bat" 2>nul
del /Q "build-production.bat" 2>nul
del /Q "build-production.ps1" 2>nul
del /Q "build-windows.bat" 2>nul
del /Q "BUILD-FOR-GUMROAD.bat" 2>nul

echo Removing old electron-builder config...
del /Q "electron-builder.yml" 2>nul

echo Removing dev test files...
del /Q "test-electron-integration.js" 2>nul
del /Q "test-ipc.js" 2>nul
del /Q "frontend\src\components\ApiTest.jsx" 2>nul
del /Q "package.json.new" 2>nul

echo Clearing old build artifacts...
if exist "dist" rmdir /S /Q "dist" 2>nul
if exist "dist-packager" rmdir /S /Q "dist-packager" 2>nul

echo.
echo Cleanup complete. You can delete this CLEANUP.bat now.
echo.
pause
