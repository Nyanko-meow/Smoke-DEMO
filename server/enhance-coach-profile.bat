@echo off
echo ========================================
echo    Enhancing Coach Profile with 
echo      Professional Information
echo ========================================
echo.
echo This script will:
echo - Create CoachProfiles table
echo - Add professional data for coach
echo - Create CoachReviews table  
echo - Add sample client reviews
echo - Update coach basic information
echo.
echo Press any key to continue...
pause >nul
echo.
echo Running enhancement script...
echo.
node create-coach-profile-enhancement.js
echo.
echo ========================================
echo Enhancement completed!
echo Now restart your frontend to see changes
echo ========================================
echo Press any key to exit...
pause >nul 