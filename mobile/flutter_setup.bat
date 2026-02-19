@echo off
REM Flutter App Quick Start Script for Windows
REM This script helps you get the Flutter app running quickly

setlocal enabledelayedexpansion

echo ================================
echo PTA/RTA Flutter App Setup
echo ================================
echo.

REM Check if Flutter is installed
where flutter >nul 2>nul
if %errorlevel% neq 0 (
    echo X Flutter is not installed!
    echo Please install Flutter from: https://flutter.dev/docs/get-started/install
    exit /b 1
)

echo * Flutter is installed
flutter --version
echo.

REM Get the app directory
set APP_DIR=%~dp0flutter_app

if not exist "%APP_DIR%" (
    echo X Flutter app not found at: %APP_DIR%
    exit /b 1
)

echo App directory: %APP_DIR%
echo.

REM Change to app directory
cd /d "%APP_DIR%"

echo 1. Getting dependencies...
call flutter pub get

echo.
echo 2. Checking code quality...
call flutter analyze

echo.
echo ================================
echo Setup Complete!
echo ================================
echo.
echo Next steps:
echo.
echo For Android/Emulator:
echo   flutter run
echo.
echo For iOS:
echo   flutter run -d ios
echo.
echo For Web:
echo   flutter run -d chrome
echo.
echo Before running, make sure to:
echo 1. Update API URL in: lib/constants/app_config.dart
echo 2. Ensure Django backend is running
echo.
echo For detailed setup guide, see:
echo   README.md or FLUTTER_APP_SETUP.md
echo.
pause
