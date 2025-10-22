@echo off
setlocal enabledelayedexpansion

set BASEDIR=%~dp0
cd /d "%BASEDIR%"

if not exist "node_modules\" (
    echo Installing dependencies...
    call npm install --production --legacy-peer-deps
)

echo Launching System Rezerwacji Torow...
set NODE_ENV=production
call npx electron .

endlocal
