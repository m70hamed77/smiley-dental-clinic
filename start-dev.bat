@echo off
echo ========================================
echo Starting Smiley Dental Clinic Server
echo ========================================
echo.
echo Setting TURBOPACK=0 to disable Turbopack...
set TURBOPACK=0
set NEXT_PRIVATE_SKIP_VALIDATION=1
echo Environment variables set successfully
echo.
echo Starting Next.js dev server...
echo.
npm run dev

pause
