@echo off
chcp 65001 > nul
echo.
echo ═══════════════════════════════════════════════════════
echo        Smiley Dental Clinic - Full Check
echo ═══════════════════════════════════════════════════════
echo.
echo Step 1: Testing database connection...
echo.
call npm run test-db
if %errorlevel% neq 0 (
    echo.
    echo ❌ Database test failed!
    pause
    exit /b 1
)
echo.
echo Step 2: Checking Admin user...
echo.
call npm run create-admin:js
echo.
echo Step 3: Starting development server...
echo.
call npm run dev
pause
