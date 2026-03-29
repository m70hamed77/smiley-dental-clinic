@echo off
chcp 65001 > nul
echo.
echo Starting Smiley Dental Clinic (SQLite)...
echo.
if not exist db mkdir db
echo.
npm run dev
pause
