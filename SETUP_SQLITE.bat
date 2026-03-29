@echo off
chcp 65001 > nul
echo.
echo ╔══════════════════════════════════════════════════════╗
echo ║        Smiley Dental Clinic - SQLite Setup            ║
echo ╚══════════════════════════════════════════════════════╝
echo.
echo Step 1: Creating database folder...
if not exist db mkdir db
echo ✅ Database folder created
echo.
echo Step 2: Installing packages...
call npm install
echo.
echo Step 3: Creating SQLite database...
call npx prisma db push
echo.
echo Step 4: Creating Admin user...
call npm run create-admin:js
echo.
echo ╔══════════════════════════════════════════════════════╗
echo ║              Setup Complete!                            ║
echo ╚══════════════════════════════════════════════════════╝
echo.
echo Admin Login:
echo   Email: admin@smileydental.com
echo   Password: Admin@123456
echo.
echo Press any key to start the server...
pause > nul
call npm run dev
