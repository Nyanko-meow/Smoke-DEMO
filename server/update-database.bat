@echo off
echo 🔧 Updating database schema for file upload functionality...
echo.

echo 📁 Adding file columns to Messages table...
sqlcmd -S localhost -d SMOKEKING -i "src/database/add-file-columns.sql"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✅ Database update completed successfully!
    echo 📋 File columns added: FileUrl, FileName, FileSize, FileType
    echo 🔄 MessageType constraint updated to include 'file' type
) else (
    echo.
    echo ❌ Database update failed!
    echo Please check your SQL Server connection and try again.
)

echo.
echo 🧪 You can now test file upload functionality!
echo Run: node test-file-upload.js
echo.
pause 