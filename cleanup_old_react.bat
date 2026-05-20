@echo off
cd /d "%~dp0\src"
echo =======================================
echo Archiving old React Router files...
echo =======================================

if exist pages (ren pages pages_backup)
if exist layouts (ren layouts layouts_backup)
if exist App.tsx (ren App.tsx App_backup.tsx)
if exist main.tsx (ren main.tsx main_backup.tsx)

echo Cleanup complete! Your src directory is now pure Next.js.
pause
