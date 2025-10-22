@echo off
setlocal enabledelayedexpansion

set BASEDIR=%~dp0
set APPNAME=System-Rezerwacji-Torow
set RELEASEDIR=%BASEDIR%release\%APPNAME%

echo Creating portable package...

REM Remove old release
if exist "%RELEASEDIR%" (
    rmdir /s /q "%RELEASEDIR%"
)

REM Create directories
mkdir "%RELEASEDIR%"
mkdir "%RELEASEDIR%\dist"

REM Copy files
echo Copying application files...
xcopy /E /I /Y "%BASEDIR%dist" "%RELEASEDIR%\dist"
copy /Y "%BASEDIR%public\main.js" "%RELEASEDIR%\main.js"
copy /Y "%BASEDIR%public\preload.js" "%RELEASEDIR%\preload.js"
copy /Y "%BASEDIR%package.json" "%RELEASEDIR%\package.json"

REM Create run script
echo Creating launcher...
(
    echo @echo off
    echo setlocal enabledelayedexpansion
    echo set BASEDIR=%%~dp0
    echo cd /d "%%BASEDIR%%"
    echo if not exist "node_modules\" (
    echo     echo Installing dependencies...
    echo     call npm install --production
    echo )
    echo echo Launching System Rezerwacji Torow...
    echo set NODE_ENV=production
    echo call npx electron .
) > "%RELEASEDIR%\run.bat"

echo.
echo ========================================
echo Package created successfully!
echo ========================================
echo Location: %RELEASEDIR%
echo.
echo To use:
echo 1. Copy folder to your computer
echo 2. Double-click run.bat
echo.
echo First run will download dependencies (~200MB)
echo ========================================

pause
