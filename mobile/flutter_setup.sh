#!/bin/bash

# Flutter App Quick Start Script
# This script helps you get the Flutter app running quickly

set -e

echo "================================"
echo "PTA/RTA Flutter App Setup"
echo "================================"
echo ""

# Check if Flutter is installed
if ! command -v flutter &> /dev/null; then
    echo "❌ Flutter is not installed!"
    echo "Please install Flutter from: https://flutter.dev/docs/get-started/install"
    exit 1
fi

echo "✅ Flutter is installed"
flutter --version
echo ""

# Database the app directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
APP_DIR="$SCRIPT_DIR/flutter_app"

if [ ! -d "$APP_DIR" ]; then
    echo "❌ Flutter app not found at: $APP_DIR"
    exit 1
fi

echo "📂 App directory: $APP_DIR"
echo ""

# Change to app directory
cd "$APP_DIR"

echo "1️⃣  Getting dependencies..."
flutter pub get

echo ""
echo "2️⃣  Checking code quality..."
flutter analyze

echo ""
echo "================================"
echo "Setup Complete! ✅"
echo "================================"
echo ""
echo "Next steps:"
echo ""
echo "For Android/Emulator:"
echo "  flutter run"
echo ""
echo "For iOS:"
echo "  flutter run -d ios"
echo ""
echo "For Web:"
echo "  flutter run -d chrome"
echo ""
echo "Before running, make sure to:"
echo "1. Update API URL in: lib/constants/app_config.dart"
echo "2. Ensure Django backend is running"
echo ""
echo "For detailed setup guide, see:"
echo "  README.md or FLUTTER_APP_SETUP.md"
echo ""
