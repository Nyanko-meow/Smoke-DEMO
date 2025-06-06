@echo off
echo ========================================
echo          FIXING CHAT ERROR
echo ========================================
echo.

echo 1. Running chat error fix script...
node fix-chat-error.js

echo.
echo 2. Fix completed! 
echo.
echo Next steps:
echo - Make sure server is running: npm start
echo - Login as member@example.com / 12345678@
echo - Try the chat functionality
echo.
pause 