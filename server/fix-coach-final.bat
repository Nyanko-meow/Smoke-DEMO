@echo off
echo =======================================
echo    FINAL COACH LOGIN FIX SCRIPT
echo =======================================
echo.
echo This script will:
echo - Check and fix coach account
echo - Set correct password from schema.sql 
echo - Enable account activation
echo - Create test quit plan for chat
echo.

echo Running final coach login fix...
node fix-coach-login-final.js

echo.
echo =======================================
echo    FIX COMPLETED
echo =======================================
echo.
echo If successful, use these credentials:
echo Email: coach@example.com
echo Password: password
echo.
echo Then visit: http://localhost:3000/coach/login
echo.
pause 