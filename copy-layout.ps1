# Script to copy layout files from server to client and then delete them from server

# Ensure destination directories exist
if (!(Test-Path -Path "client\public\css")) {
    New-Item -ItemType Directory -Path "client\public\css" -Force
}
if (!(Test-Path -Path "client\public\js")) {
    New-Item -ItemType Directory -Path "client\public\js" -Force
}

# Copy CSS files
Copy-Item -Path "server\public\css\styles.css" -Destination "client\public\css\" -Force

# Copy JavaScript files
Copy-Item -Path "server\public\js\common.js" -Destination "client\public\js\" -Force
Copy-Item -Path "server\public\js\plans.js" -Destination "client\public\js\" -Force

# Copy HTML files
Copy-Item -Path "server\public\index.html" -Destination "client\public\" -Force
Copy-Item -Path "server\public\plans.html" -Destination "client\public\" -Force

Write-Host "Layout files copied from server to client"

# Delete layout files from server after copying
Remove-Item -Path "server\public\css\styles.css" -Force
Remove-Item -Path "server\public\js\common.js" -Force
Remove-Item -Path "server\public\js\plans.js" -Force
Remove-Item -Path "server\public\index.html" -Force
Remove-Item -Path "server\public\plans.html" -Force

Write-Host "Layout files removed from server" 