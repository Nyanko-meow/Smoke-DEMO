@echo off
echo ================================
echo    FIXING COACH LOGIN ACCOUNT
echo ================================
echo.

echo Running coach account check...
node check-coach-account.js

echo.
echo ================================
echo    SCRIPT COMPLETED
echo ================================
echo.
echo If successful, try logging in with:
echo Email: coach@example.com
echo Password: password
echo.
pause 