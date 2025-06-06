@echo off
echo ========================================
echo    FIX CHAT AND APPOINTMENTS
echo ========================================
echo.
echo This script will:
echo - Update passwords to plain text (12345678)
echo - Ensure conversation exists between coach and member
echo - Add sample chat messages
echo - Create appointment notification messages
echo - Fix database for frontend testing
echo.
pause

echo.
echo Running comprehensive fix...
node fix-chat-and-appointments.js

echo.
echo ========================================
echo Fix completed!
echo ========================================
echo.
echo You can now:
echo 1. Login as member@example.com / 12345678
echo 2. Login as coach@example.com / 12345678
echo 3. Test chat functionality
echo 4. Test appointment creation
echo.
pause 