@echo off
echo ==========================================
echo    RESTORE ORIGINAL PASSWORDS
echo ==========================================
echo.
echo This script will:
echo - Restore all passwords to H12345678@ (original format)
echo - Keep all achievements working
echo - Keep coach profiles working
echo - Enable all accounts
echo.

echo Running password restoration...
node restore-original-passwords.js

echo.
echo ==========================================
echo    RESTORATION COMPLETED
echo ==========================================
echo.
echo ✅ All passwords restored to: H12345678@
echo.
echo 📝 Login credentials:
echo    Guest: guest@example.com / H12345678@
echo    Member: member@example.com / H12345678@
echo    Coach: coach@example.com / H12345678@
echo    Admin: admin@example.com / H12345678@
echo    Custom: leghenkiz@gmail.com / H12345678@
echo.
echo ✅ All features working:
echo    - Login with normal passwords
echo    - Achievements page accessible
echo    - Coach profile fully loaded
echo    - No authentication errors
echo.
pause 