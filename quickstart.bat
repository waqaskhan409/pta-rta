@echo off
REM PTA & RTA Permit Management System - Quick Start Script

echo.
echo ============================================
echo PTA ^& RTA Permit Management System Setup
echo ============================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: Python is not installed. Please install Python 3.8 or higher.
    exit /b 1
)

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: Node.js is not installed. Please install Node.js 14 or higher.
    exit /b 1
)

echo Python and Node.js are installed.
echo.

REM Backend Setup
echo Setting up Backend...
cd config

REM Create virtual environment
if not exist "..\venv" (
    echo Creating virtual environment...
    python -m venv ..\venv
)

REM Activate virtual environment
call ..\venv\Scripts\activate.bat

REM Install dependencies
echo Installing backend dependencies...
pip install -r requirements.txt

REM Run migrations
echo Running database migrations...
python manage.py migrate

echo Backend setup complete!
echo.

REM Frontend Setup
echo Setting up Frontend...
cd ..\frontend

REM Install dependencies
echo Installing frontend dependencies...
call npm install

echo Frontend setup complete!
echo.

echo ============================================
echo Setup Complete!
echo ============================================
echo.
echo To start the application:
echo.
echo 1. Start Backend:
echo    cd config
echo    ..\venv\Scripts\activate
echo    python manage.py runserver
echo.
echo 2. Start Frontend (in another terminal):
echo    cd frontend
echo    npm start
echo.
echo Backend will be available at: http://localhost:8000
echo Frontend will be available at: http://localhost:3000
echo Admin panel: http://localhost:8000/admin
echo.

pause
