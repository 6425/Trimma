@echo off
cd /d "%~dp0"
git add apps/web/src/app/login/page.tsx apps/web/src/components/SiteChrome.tsx apps/web/src/lib/auth-routes.ts apps/web/src/middleware.ts apps/web/src/app/api/auth/request-password-reset/route.ts apps/web/src/app/forgot-password/page.tsx apps/web/src/app/reset-password/page.tsx apps/web/src/lib/auth-admin-lookup.ts apps/web/src/lib/auth-providers.ts
git commit -m "Add self-service password reset for email/password accounts"
git push origin main
git log -1 --oneline
pause
