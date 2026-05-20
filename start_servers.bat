@echo off
cd /d "%~dp0"
echo =======================================
echo Starting Trimma Enterprise Monorepo...
echo =======================================
echo.
echo Turborepo will now start BOTH the Next.js Frontend and NestJS Backend.
echo.

call npm run dev

pause
