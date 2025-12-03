# AIO Converter - Production Build Script (PowerShell)
# Builds the desktop app with all native dependencies properly included

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "AIO Converter - Production Build Script" -ForegroundColor Cyan  
Write-Host "========================================" -ForegroundColor Cyan

Write-Host ""
Write-Host "[1/4] Cleaning previous builds..." -ForegroundColor Yellow

if (Test-Path "dist-packager") {
    Write-Host "Killing any running app processes..." -ForegroundColor Gray
    try {
        Get-Process "AIO Converter" -ErrorAction SilentlyContinue | Stop-Process -Force
        Start-Sleep 2
    } catch {
        # Process not running, continue
    }
    
    Write-Host "Removing old build directory..." -ForegroundColor Gray
    Remove-Item -Recurse -Force "dist-packager" -ErrorAction SilentlyContinue
}

Write-Host ""
Write-Host "[2/4] Building frontend..." -ForegroundColor Yellow
Set-Location "frontend"
& npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Frontend build failed!" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}
Set-Location ".."

Write-Host ""
Write-Host "[3/4] Packaging Electron app..." -ForegroundColor Yellow
& npx electron-packager . "AIO Converter" --platform=win32 --arch=x64 --out=dist-packager --ignore="frontend/src|frontend/node_modules|temp|logs|\.git" --overwrite --no-asar
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Electron packaging failed!" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""
Write-Host "[4/4] Verifying build..." -ForegroundColor Yellow

if (Test-Path "dist-packager\AIO Converter-win32-x64\AIO Converter.exe") {
    Write-Host "✅ SUCCESS: Build completed successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Build location: dist-packager\AIO Converter-win32-x64\" -ForegroundColor White
    Write-Host "Executable: AIO Converter.exe" -ForegroundColor White
    Write-Host ""
    Write-Host "Key features in this build:" -ForegroundColor Cyan
    Write-Host "- FFmpeg available for video processing" -ForegroundColor Gray
    Write-Host "- Sharp available for image processing" -ForegroundColor Gray
    Write-Host "- All tools work without terminal" -ForegroundColor Gray
    Write-Host "- Direct Downloads folder saving" -ForegroundColor Gray
    Write-Host "- No asar packaging (FFmpeg accessible)" -ForegroundColor Gray
    Write-Host ""
    
    $choice = Read-Host "Start the app now? (y/n)"
    if ($choice -eq "y" -or $choice -eq "Y") {
        Write-Host "Starting AIO Converter..." -ForegroundColor Green
        Set-Location "dist-packager\AIO Converter-win32-x64"
        Start-Process "AIO Converter.exe"
        Set-Location "..\..\"
    }
} else {
    Write-Host "❌ ERROR: Build verification failed!" -ForegroundColor Red
    Write-Host "Expected executable not found." -ForegroundColor Red
}

Write-Host ""
Write-Host "Build script completed." -ForegroundColor Cyan
Read-Host "Press Enter to exit"