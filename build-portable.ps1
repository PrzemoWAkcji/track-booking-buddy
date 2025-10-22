$ErrorActionPreference = "Stop"

$appName = "System-Rezerwacji-Torow"
$releaseDir = "$PSScriptRoot\release\$appName"

if (Test-Path $releaseDir) {
    Remove-Item $releaseDir -Recurse -Force
}

New-Item -ItemType Directory -Path $releaseDir -Force | Out-Null

# Copy essential files
Copy-Item "$PSScriptRoot\dist" -Destination "$releaseDir\dist" -Recurse
Copy-Item "$PSScriptRoot\public\main.js" -Destination "$releaseDir\main.js"
Copy-Item "$PSScriptRoot\public\preload.js" -Destination "$releaseDir\preload.js"
Copy-Item "$PSScriptRoot\package.json" -Destination "$releaseDir\package.json"

# Create start script
$startScript = @'
@echo off
setlocal enabledelayedexpansion

set BASEDIR=%~dp0
cd /d "%BASEDIR%"

REM Check if node_modules exists
if not exist "node_modules\" (
    echo Installing dependencies...
    call npm install --production
)

REM Start application
echo Launching System Rezerwacji Torow...
set NODE_ENV=production
call npx electron .

endlocal
'@

$startScript | Out-File "$releaseDir\run.bat" -Encoding ASCII

Write-Host "✓ Portable app created at: $releaseDir"
Write-Host "✓ To run: double-click run.bat"
Write-Host ""
Write-Host "Creating archive..."

# Create ZIP archive
$zipPath = "$PSScriptRoot\release\$appName.zip"
if (Test-Path $zipPath) {
    Remove-Item $zipPath -Force
}

Add-Type -AssemblyName System.IO.Compression.FileSystem
[System.IO.Compression.ZipFile]::CreateFromDirectory($releaseDir, $zipPath)

Write-Host "✓ Archive created: $zipPath"
