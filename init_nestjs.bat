@echo off
cd /d "%~dp0"
echo =======================================
echo Initializing NestJS API Gateway
echo =======================================
echo Downloading NestJS CLI and generating backend architecture...
call npx -y @nestjs/cli new api-gateway --directory services/api-gateway --package-manager npm --skip-git

echo.
echo =======================================
echo Patching NestJS for Turborepo Workspaces
echo =======================================
node patch_nestjs_monorepo.js

echo.
echo =======================================
echo Backend Initialization Complete!
echo =======================================
pause
