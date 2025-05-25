@echo off
echo ========================================
echo Testing Member Progress API
echo ========================================
echo.

echo Starting server in background (if not already running)...
start /min cmd /c "npm start"

echo Waiting for server to be ready...
timeout /t 5 /nobreak >nul

echo.
echo Running member progress API tests...
echo.

node test-member-progress.js

echo.
echo ========================================
echo Test completed. Check output above.
echo ========================================
pause 