@echo off
echo ================================
echo   Member Details Feature Test
echo ================================

echo.
echo Step 1: Creating test data...
node create-member-details-data.js

echo.
echo Step 2: Testing API endpoint...  
node quick-test-member-details.js

echo.
echo ================================
echo   Test Complete!
echo ================================
pause 