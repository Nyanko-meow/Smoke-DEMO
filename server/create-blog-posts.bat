@echo off
echo ========================================
echo    Creating Sample Blog Posts
echo ========================================
echo.

echo Starting blog posts creation...
node create-sample-blog-posts.js

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo    Blog Posts Created Successfully!
    echo ========================================
    echo.
    echo You can now view the blog posts at:
    echo http://localhost:3000/blog
    echo.
    echo Images are available at:
    echo - http://localhost:4000/api/images/smoking-cessation-1.svg
    echo - http://localhost:4000/api/images/smoking-tips.svg
    echo - http://localhost:4000/api/images/health-timeline.svg
    echo - http://localhost:4000/api/images/default-blog.jpg
    echo.
) else (
    echo.
    echo ========================================
    echo    Error Creating Blog Posts
    echo ========================================
    echo Please check the error messages above.
    echo.
)

pause 