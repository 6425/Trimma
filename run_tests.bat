@echo off
cd /d "%~dp0"
echo Running End-to-End API Tests against localhost:4000...
echo.
node test_apis.js
pause
