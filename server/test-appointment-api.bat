@echo off
echo ========================================
echo Testing Appointment API
echo ========================================
echo.

echo Starting server check...
timeout /t 2 /nobreak > nul

echo Running appointment API tests...
node test-appointment-api.js

echo.
echo ========================================
echo Test completed!
echo ========================================
pause 