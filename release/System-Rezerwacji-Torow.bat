@echo off
setlocal
set BASEDIR=%~dp0
cd /d "%BASEDIR%.."
set NODE_ENV=production
npx electron . %*
