@echo off
cd /d "%~dp0"
echo =======================================
echo Preparing Trimma OS Production Build
echo =======================================

if not exist node_modules\ (
    echo [1/3] Installing dependencies...
    call npm install
) else (
    echo [1/3] Dependencies found.
)

echo [2/3] Compiling React application...
call npm run build

echo [3/3] Starting Node.js Production Server...
call npm start

pause
