@echo off
cd /d "%~dp0"
echo =======================================
echo Syncing Monorepo Workspaces...
echo =======================================
echo Running npm install to update the package-lock.json with the new @trimma packages...
echo.

call npm install

echo.
echo =======================================
echo Now booting the servers...
echo =======================================
call npm run dev
pause
