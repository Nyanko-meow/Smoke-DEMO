@echo off
echo ========================================
echo   FIX CHAT WITH REAL COACHES
echo ========================================
echo.

echo 🔧 Connecting member with existing coaches in database...
echo.

node fix-chat-with-real-coaches.js

echo.
echo ========================================
echo              RESULT
echo ========================================
echo.
echo ✅ Chat system fixed with real coaches!
echo.
echo 🚀 Now test:
echo 1. Member: http://localhost:3000 (leghenkiz@gmail.com / H12345678@)
echo 2. Coach: http://localhost:3000/coach/dashboard (use your coach account)
echo 3. Both can chat with each other now!
echo.
pause 