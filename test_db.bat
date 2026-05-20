@echo off
cd /d "%~dp0"
echo Testing Supabase Database Connection...
node test_db.js
pause
