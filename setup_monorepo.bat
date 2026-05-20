@echo off
cd /d "%~dp0"
echo =======================================
echo Transforming to Turborepo Monorepo...
echo =======================================
node setup_monorepo.js
echo.
echo Installing Monorepo Dependencies...
npm install
pause
