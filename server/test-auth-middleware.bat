@echo off
echo 🔐 Testing Auth Middleware...
cd /d "%~dp0"
node test-auth-middleware.js
pause 