@echo off
echo ==========================================
echo    FIX COACH-MEMBER CHAT SYSTEM
echo ==========================================
echo.
echo This script will:
echo - Create quit plans with coach assignments
echo - Create conversations between coach and members  
echo - Add sample messages and progress data
echo - Fix authentication issues
echo - Setup complete chat system
echo.

echo Running chat system fix...
node fix-chat-system.js

echo.
echo ==========================================
echo    CHAT SYSTEM FIX COMPLETED
echo ==========================================
echo.
echo ✅ Chat system should now work properly!
echo.
echo 🔑 Login credentials:
echo    Coach: coach@example.com / H12345678@
echo    Member: member@example.com / H12345678@
echo.
echo 📝 Testing steps:
echo    1. Login as coach at localhost:3000/coach/dashboard
echo    2. Click on "Chat" in the sidebar
echo    3. You should see member conversations on the left
echo    4. Click on a member to start chatting
echo    5. Login as member to test the other side
echo.
pause 