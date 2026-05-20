@echo off
cd /d "%~dp0"
echo =======================================
echo Trimma OS: Installing Next.js Packages
echo =======================================
echo This will delete Vite and install Next.js. This may take a minute...
echo.

call npm install

echo.
echo =======================================
echo Installation Complete!
echo =======================================
pause
