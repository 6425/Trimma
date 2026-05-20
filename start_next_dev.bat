@echo off
cd /d "%~dp0"
echo =======================================
echo Starting Trimma OS Next.js Dev Server
echo =======================================
set PORT=3000 && call npm run dev
pause
