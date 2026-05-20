@echo off
cd /d "%~dp0"
echo =======================================
echo Fixing Monorepo Dependencies...
echo =======================================
call npm install @nestjs/config @supabase/supabase-js -w @trimma/api-gateway

echo.
echo =======================================
echo Dependencies Fixed!
echo =======================================
pause
