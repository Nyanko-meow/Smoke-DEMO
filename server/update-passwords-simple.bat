@echo off
echo ========================================
echo    UPDATE PASSWORDS TO PLAIN TEXT
echo ========================================
echo.
echo This script will update all user passwords to plain text format
echo Password will be: 12345678
echo.
pause

echo.
echo Running password update script...
node update-passwords-simple.js

echo.
echo ========================================
echo Script completed!
echo ========================================
pause 