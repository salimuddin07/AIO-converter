# PowerShell Script to Convert PNG to ICO using .NET
# This creates a Windows icon file from PNG

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "   Converting PNG to ICO" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

$pngPath = Join-Path $PSScriptRoot "..\build\icon.png"
$icoPath = Join-Path $PSScriptRoot "..\build\icon.ico"

if (-not (Test-Path $pngPath)) {
    Write-Host "[ERROR] PNG file not found: $pngPath" -ForegroundColor Red
    Write-Host "`nPlease ensure build/icon.png exists first." -ForegroundColor Yellow
    exit 1
}

Write-Host "[1/3] Loading PNG image..." -ForegroundColor Yellow

try {
    # Load the PNG image
    Add-Type -AssemblyName System.Drawing
    $img = [System.Drawing.Image]::FromFile($pngPath)
    
    Write-Host "[2/3] Creating ICO format..." -ForegroundColor Yellow
    
    # Create a memory stream
    $ms = New-Object System.IO.MemoryStream
    
    # Save as icon
    $img.Save($ms, [System.Drawing.Imaging.ImageFormat]::Icon)
    
    Write-Host "[3/3] Saving ICO file..." -ForegroundColor Yellow
    
    # Write to file
    [System.IO.File]::WriteAllBytes($icoPath, $ms.ToArray())
    
    # Cleanup
    $ms.Close()
    $img.Dispose()
    
    Write-Host "`n[SUCCESS] ICO file created: $icoPath" -ForegroundColor Green
    
    # Show file info
    $icoFile = Get-Item $icoPath
    Write-Host "`nFile Size: $($icoFile.Length) bytes" -ForegroundColor Cyan
    Write-Host "Location: $($icoFile.FullName)" -ForegroundColor Cyan
    
} catch {
    Write-Host "`n[ERROR] Failed to convert PNG to ICO" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host "`n[ALTERNATIVE] Use an online converter:" -ForegroundColor Yellow
    Write-Host "   1. Visit: https://icoconvert.com/" -ForegroundColor White
    Write-Host "   2. Upload: build\icon.png" -ForegroundColor White
    Write-Host "   3. Download and save as: build\icon.ico" -ForegroundColor White
    exit 1
}

Write-Host "`n========================================" -ForegroundColor Green
Write-Host "   ICO Conversion Complete!" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Green
