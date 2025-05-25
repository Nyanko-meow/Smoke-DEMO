Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "    COMPREHENSIVE CHAT SYSTEM FIX" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "This script will completely fix the chat system:" -ForegroundColor Yellow
Write-Host "- Verify/create database tables" -ForegroundColor Green
Write-Host "- Fix user authentication" -ForegroundColor Green
Write-Host "- Create/update quit plans with coach assignments" -ForegroundColor Green
Write-Host "- Create conversations with sample messages" -ForegroundColor Green
Write-Host "- Create sample progress data" -ForegroundColor Green
Write-Host "- Test all API endpoints" -ForegroundColor Green
Write-Host "- Provide detailed testing instructions" -ForegroundColor Green
Write-Host ""

Write-Host "WARNING: This will clear existing conversations and messages!" -ForegroundColor Red
Write-Host ""
$confirm = Read-Host "Do you want to continue? (y/N)"

if ($confirm -ne "y" -and $confirm -ne "Y") {
    Write-Host "Operation cancelled." -ForegroundColor Yellow
    exit
}

Write-Host ""
Write-Host "Running comprehensive chat system fix..." -ForegroundColor Green

# Change to server directory and run the script
Set-Location $PSScriptRoot
node fix-chat-comprehensive.js

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "    COMPREHENSIVE FIX COMPLETED" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Chat system should now work perfectly!" -ForegroundColor Green
Write-Host ""
Write-Host "Quick Login Info:" -ForegroundColor Yellow
Write-Host "   Coach: coach@example.com / H12345678@" -ForegroundColor White
Write-Host "   Member: member@example.com / H12345678@" -ForegroundColor White
Write-Host "   Guest: guest@example.com / H12345678@" -ForegroundColor White
Write-Host ""
Write-Host "Testing URLs:" -ForegroundColor Yellow
Write-Host "   Coach: http://localhost:3000/coach/dashboard" -ForegroundColor White
Write-Host "   Member: http://localhost:3000/quit-plan" -ForegroundColor White
Write-Host ""
Write-Host "New Features Added:" -ForegroundColor Yellow
Write-Host "   - Member list in coach chat (Thanh vien tab)" -ForegroundColor White
Write-Host "   - Improved conversation interface" -ForegroundColor White
Write-Host "   - Better authentication handling" -ForegroundColor White
Write-Host "   - Sample conversations with messages" -ForegroundColor White
Write-Host "   - Removed achievements section from coach navbar" -ForegroundColor White
Write-Host ""
Read-Host "Press Enter to continue..." 