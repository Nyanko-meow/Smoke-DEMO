@echo off
echo ==========================================
echo    REMOVE PASSWORD HASH - USE PLAIN TEXT  
echo ==========================================
echo.
echo This script will:
echo - Remove all password hashing
echo - Set all passwords to "password"
echo - Enable all accounts
echo - Fix login for all roles
echo.

echo Running plain text password fix...
node fix-password-plain-text.js

echo.
echo ==========================================
echo    PASSWORD FIX COMPLETED
echo ==========================================
echo.
echo All accounts now use plain text passwords!
echo.
echo Login credentials:
echo - Guest: guest@example.com / password
echo - Member: member@example.com / password  
echo - Coach: coach@example.com / password
echo - Admin: admin@example.com / password
echo.
echo Try logging in now!
echo.
pause 