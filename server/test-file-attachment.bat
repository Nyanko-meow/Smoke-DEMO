@echo off
echo ========================================
echo Testing File Attachment Functionality
echo ========================================
echo.

echo Installing required dependencies...
npm install form-data
echo.

echo Starting file attachment test...
echo.
node test-file-attachment-simple.js

echo.
echo ========================================
echo Test completed!
echo ========================================
pause 