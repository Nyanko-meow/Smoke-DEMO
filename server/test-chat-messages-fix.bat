@echo off
echo ========================================
echo    TESTING CHAT MESSAGES FIX
echo ========================================
echo.
echo This script will test the chat messages API
echo to ensure it works correctly with the frontend
echo.
pause

echo.
echo Running chat messages test...
node test-chat-messages-fix.js

echo.
echo ========================================
echo Test completed!
echo ========================================
pause 