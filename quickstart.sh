#!/bin/bash

# PTA & RTA Permit Management System - Quick Start Script

set -e

echo "============================================"
echo "PTA & RTA Permit Management System Setup"
echo "============================================"
echo ""

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.8 or higher."
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 14 or higher."
    exit 1
fi

echo "✅ Python and Node.js are installed"
echo ""

# Backend Setup
echo "Setting up Backend..."
cd config

# Create virtual environment
if [ ! -d "../venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv ../venv
fi

# Activate virtual environment
source ../venv/bin/activate

# Install dependencies
echo "Installing backend dependencies..."
pip install -r requirements.txt

# Run migrations
echo "Running database migrations..."
python manage.py migrate

echo "✅ Backend setup complete!"
echo ""

# Frontend Setup
echo "Setting up Frontend..."
cd ../frontend

# Install dependencies
echo "Installing frontend dependencies..."
npm install

echo "✅ Frontend setup complete!"
echo ""

echo "============================================"
echo "Setup Complete!"
echo "============================================"
echo ""
echo "To start the application:"
echo ""
echo "1. Start Backend:"
echo "   cd config"
echo "   source ../venv/bin/activate  (or ..\venv\Scripts\activate on Windows)"
echo "   python manage.py runserver"
echo ""
echo "2. Start Frontend (in another terminal):"
echo "   cd frontend"
echo "   npm start"
echo ""
echo "Backend will be available at: http://localhost:8000"
echo "Frontend will be available at: http://localhost:3000"
echo "Admin panel: http://localhost:8000/admin"
echo ""





# cd /Users/waqaskhan/Documents/PTA_RTA/config
# python manage.py migrate
# python manage.py shell < ../permits/init_data.py
# python manage.py runserver