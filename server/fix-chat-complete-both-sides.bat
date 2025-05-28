@echo off
echo ========================================
echo   CHAT SYSTEM - COMPLETE FIX (BOTH SIDES)
echo ========================================
echo.

echo 🔧 Fixing chat system for both members and coaches...
echo.

echo Step 1: Running comprehensive database fix...
node fix-chat-complete-final.js

echo.
echo Step 2: Testing both member and coach chat...
node test-chat-both-sides.js

echo.
echo ========================================
echo              FINAL RESULT
echo ========================================
echo.
echo ✅ Chat system fix completed for both sides!
echo.
echo 🚀 To test the chat:
echo.
echo 📱 MEMBER SIDE:
echo 1. Open browser: http://localhost:3000
echo 2. Login as: leghenkiz@gmail.com / H12345678@
echo 3. Click "Chat với Coach" button
echo 4. Chat should work perfectly!
echo.
echo 👨‍💼 COACH SIDE:
echo 1. Open browser: http://localhost:3000/coach/dashboard
echo 2. Login as: coach@example.com / 12345678@
echo 3. Go to Chat section
echo 4. View conversations and members list
echo 5. Start new conversations or continue existing ones
echo.
echo 📋 If you still see errors:
echo 1. Check server console for detailed logs
echo 2. Check browser console for frontend errors
echo 3. Verify SQL Server is running
echo 4. Run this script again
echo.
echo 🔍 For debugging, you can also run:
echo - node diagnose-chat-issue.js
echo - node test-chat-both-sides.js
echo.
pause 