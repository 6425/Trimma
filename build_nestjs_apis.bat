@echo off
cd /d "%~dp0\services\api-gateway"
echo =======================================
echo Installing NestJS Core Dependencies...
echo =======================================
call npm install @nestjs/config @supabase/supabase-js

cd /d "%~dp0"
echo.
echo =======================================
echo Generating NestJS Enterprise Architecture...
echo =======================================
node generate_nestjs_core.js

echo.
echo =======================================
echo API Engine Generated Successfully!
echo =======================================
pause
