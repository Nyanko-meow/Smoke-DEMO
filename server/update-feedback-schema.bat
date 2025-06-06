@echo off
echo ========================================
echo UPDATING DATABASE SCHEMA FOR FEEDBACK
echo ========================================
echo.

cd /d "%~dp0"

echo Starting database schema update...
node update-feedback-schema.js

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo ✅ DATABASE UPDATE COMPLETED SUCCESSFULLY!
    echo ========================================
    echo.
    echo What was updated:
    echo - Created CoachFeedback table
    echo - Created CoachRatingStats view
    echo - Added sample feedback data
    echo - Added feedback API endpoints
    echo.
    echo You can now:
    echo 1. Test the feedback functionality in the UI
    echo 2. Members can rate coaches after appointments
    echo 3. Coaches can view their ratings
    echo.
) else (
    echo.
    echo ========================================
    echo ❌ DATABASE UPDATE FAILED!
    echo ========================================
    echo Please check the error messages above.
    echo.
)

pause 