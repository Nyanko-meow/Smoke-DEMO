@echo off
echo ==========================================
echo    SIMPLE CHAT SYSTEM FIX
echo ==========================================
echo.
echo This script will:
echo - Create quit plans with coach assignments
echo - Create conversations between coach and members  
echo - Add welcome messages
echo - WITHOUT deleting existing data
echo.

echo Running simple chat system fix...
node fix-chat-simple.js

echo.
echo ==========================================
echo    SIMPLE FIX COMPLETED
echo ==========================================
echo.
echo ✅ Chat system should now work!
echo.
echo 🔑 Login Info:
echo    Coach: coach@example.com / H12345678@
echo    Members: member@example.com, guest@example.com, etc. / H12345678@
echo.
echo 📝 Testing:
echo    1. Login as coach at localhost:3000/coach/dashboard
echo    2. Go to Chat section
echo    3. You should see conversations and member list
echo    4. Test chatting functionality
echo.
pause 