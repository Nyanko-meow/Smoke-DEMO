@echo off
echo ========================================
echo       FIX AND TEST CHAT SYSTEM
echo ========================================
echo.

echo Step 1: Fixing database setup...
node fix-chat-error.js

echo.
echo Step 2: Testing chat functionality...
node test-chat-fix.js

echo.
echo ========================================
echo                SUMMARY
echo ========================================
echo.
echo If all tests passed:
echo 1. Make sure server is running: npm start
echo 2. Login to frontend as: member@example.com / 12345678@
echo 3. Click "Chat với Coach" button
echo 4. Chat should work now!
echo.
echo If tests failed:
echo 1. Check if SQL Server is running
echo 2. Check database connection settings
echo 3. Make sure server is started: npm start
echo.
pause 