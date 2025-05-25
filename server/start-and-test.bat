@echo off
echo Starting server and running tests...

echo.
echo ========================================
echo Starting Node.js server...
echo ========================================
start "SmokeKing Server" cmd /k "npm start"

echo.
echo Waiting for server to start...
timeout /t 5 /nobreak > nul

echo.
echo ========================================
echo Running simple tests...
echo ========================================
node test-simple.js

echo.
echo ========================================
echo Running direct endpoint tests...
echo ========================================
node test-direct-endpoint.js

echo.
echo Tests completed!
pause 