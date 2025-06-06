@echo off
echo =====================================
echo  Testing Member Details Feature
echo =====================================
echo.

echo Step 1: Adding sample data...
node add-sample-progress-data.js
echo.

echo Step 2: Testing member details API...
node test-member-details.js
echo.

echo =====================================
echo  Testing completed!
echo =====================================
pause 