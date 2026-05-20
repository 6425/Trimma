@echo off
cd /d "%~dp0"
echo =======================================
echo Extracting Trimma Shared Packages...
echo =======================================
node extract_packages.js
echo.
echo Linking Workspaces (npm install)...
npm install
pause
