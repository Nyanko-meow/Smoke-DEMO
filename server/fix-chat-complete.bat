@echo off
echo ========================================
echo       COMPLETE CHAT SYSTEM FIX
echo ========================================
echo.

echo Step 1: Setting up database and test data...
node fix-chat-error.js

echo.
echo Step 2: Testing complete chat system...
node test-complete-chat-fix.js

echo.
echo ========================================
echo              FINAL SUMMARY
echo ========================================
echo.
echo Chat system has been fixed and tested!
echo.
echo To use the chat:
echo 1. Make sure server is running: npm start
echo 2. Open browser: http://localhost:3000
echo 3. Login as: member@example.com / 12345678@
echo 4. Click "Chat với Coach" button
echo 5. Chat should work perfectly now!
echo.
echo If you see any errors above, please:
echo 1. Check SQL Server is running
echo 2. Check database connection
echo 3. Restart server: npm start
echo.
pause 