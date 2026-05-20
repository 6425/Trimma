@echo off
cd /d "%~dp0"
echo Running Next.js Sprint 3 Dashboards Migration...
node migrate_sprint_3.js
pause
