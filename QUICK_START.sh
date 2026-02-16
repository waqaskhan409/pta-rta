#!/bin/bash
# PTA/RTA Permit Management System - Quick Start Commands

## 📋 Copy these commands to get started quickly

### ✅ Start the Full Application

# Step 1: Start Django Backend (Terminal 1)
cd /Users/waqaskhan/Documents/PTA_RTA && \
source venv/bin/activate && \
cd config && \
python manage.py runserver 0.0.0.0:8001

# Step 2: Start React Frontend (Terminal 2)
cd /Users/waqaskhan/Documents/PTA_RTA/frontend && \
npm start

# Step 3: Open Application in Browser
# Frontend: http://localhost:3000
# API: http://localhost:8001/api/
# Admin: http://localhost:8001/admin/


### 🧪 API Testing Commands

# Create a new permit
curl -X POST http://localhost:8001/api/permits/ \
  -H "Content-Type: application/json" \
  -d '{
    "vehicle_number": "DL-01-AB-1234",
    "owner_name": "John Doe",
    "owner_email": "john@example.com",
    "owner_phone": "9876543210",
    "authority": "PTA",
    "permit_type": "transport",
    "valid_from": "2025-01-01",
    "valid_to": "2026-01-01",
    "description": "Test permit"
  }'

# List all permits
curl http://localhost:8001/api/permits/ | jq .

# Get a specific permit (replace {id} with actual permit ID)
curl http://localhost:8001/api/permits/1/ | jq .

# Get permit statistics
curl http://localhost:8001/api/permits/stats/ | jq .

# Get expiring permits
curl http://localhost:8001/api/permits/expiring_soon/ | jq .

# Filter permits by status
curl "http://localhost:8001/api/permits/?status=active" | jq .

# Filter permits by authority
curl "http://localhost:8001/api/permits/?authority=PTA" | jq .

# Filter permits by type
curl "http://localhost:8001/api/permits/?permit_type=transport" | jq .


### 🔧 Database Management

# Reset SQLite database (deletes all data)
cd /Users/waqaskhan/Documents/PTA_RTA/config && \
rm db.sqlite3 && \
python manage.py migrate && \
python manage.py createsuperuser

# Access Django admin panel
# URL: http://localhost:8001/admin/
# Username: admin
# Password: (set during creation)

# Create new superuser
cd /Users/waqaskhan/Documents/PTA_RTA/config && \
python manage.py createsuperuser


### 📦 Dependency Management

# Install Python dependencies
cd /Users/waqaskhan/Documents/PTA_RTA/config && \
pip install -r requirements.txt

# Install npm dependencies
cd /Users/waqaskhan/Documents/PTA_RTA/frontend && \
npm install

# Update npm packages
cd /Users/waqaskhan/Documents/PTA_RTA/frontend && \
npm update


### 🐛 Troubleshooting Commands

# Check Django is running
curl http://localhost:8001/api/permits/

# Check React is running
curl http://localhost:3000

# View Django logs
cd /Users/waqaskhan/Documents/PTA_RTA/config && \
python manage.py runserver 0.0.0.0:8001

# Check Python version
python --version

# Check Node version
node --version

# Check npm version
npm --version

# Check if MySQL is running
mysql -u root -p -e "SELECT 1"

# Activate virtual environment
source /Users/waqaskhan/Documents/PTA_RTA/venv/bin/activate

# Deactivate virtual environment
deactivate


### 🚀 Production Setup

# Configure MySQL
mysql -u root -p -e "CREATE DATABASE transport_db;"

# Update .env for MySQL
cd /Users/waqaskhan/Documents/PTA_RTA/config
# Edit .env and set:
# USE_MYSQL=true
# DB_PASSWORD=<your_mysql_password>

# Run migrations against MySQL
cd /Users/waqaskhan/Documents/PTA_RTA/config && \
python manage.py migrate

# Build React for production
cd /Users/waqaskhan/Documents/PTA_RTA/frontend && \
npm run build

# Start Django with Gunicorn
cd /Users/waqaskhan/Documents/PTA_RTA/config && \
gunicorn config.wsgi:application --bind 0.0.0.0:8000


### 📊 Key Files

# Main Configuration
/Users/waqaskhan/Documents/PTA_RTA/config/.env
/Users/waqaskhan/Documents/PTA_RTA/config/config/settings.py

# API Endpoints
/Users/waqaskhan/Documents/PTA_RTA/config/permits/urls.py
/Users/waqaskhan/Documents/PTA_RTA/config/permits/views.py

# React Components
/Users/waqaskhan/Documents/PTA_RTA/frontend/src/pages/PermitList.js
/Users/waqaskhan/Documents/PTA_RTA/frontend/src/pages/NewPermit.js
/Users/waqaskhan/Documents/PTA_RTA/frontend/src/services/apiClient.js

# Documentation
/Users/waqaskhan/Documents/PTA_RTA/SETUP_COMPLETE.md
/Users/waqaskhan/Documents/PTA_RTA/INTEGRATION_TEST_RESULTS.md


### 💾 Sample Data

# John Doe - Transport Permit
{
  "vehicle_number": "DL-01-AB-1234",
  "owner_name": "John Doe",
  "owner_email": "john@example.com",
  "owner_phone": "9876543210",
  "authority": "PTA",
  "permit_type": "transport",
  "valid_from": "2025-01-01",
  "valid_to": "2026-01-01",
  "description": "Transport permit for goods"
}

# Jane Smith - Goods Permit
{
  "vehicle_number": "HR-26-CD-5678",
  "owner_name": "Jane Smith",
  "owner_email": "jane@example.com",
  "owner_phone": "9876543211",
  "authority": "RTA",
  "permit_type": "goods",
  "valid_from": "2025-01-15",
  "valid_to": "2025-12-31",
  "description": "Goods transport permit"
}


### 🔐 Admin Credentials

# Django Admin
URL: http://localhost:8001/admin/
Username: admin
Password: (set during setup)


### 📞 Getting Help

# Check if a port is in use
lsof -i :3000
lsof -i :8001

# Kill a process using a port
kill -9 $(lsof -t -i:3000)
kill -9 $(lsof -t -i:8001)

# View Django error logs
# Check the terminal where Django is running

# View React error logs
# Check the browser console: F12 → Console

# View Network requests
# Check the browser: F12 → Network


### ✨ Next Steps

1. Copy any command above and paste in terminal
2. Visit http://localhost:3000 to use the application
3. Create permits using the "New Permit" page
4. View all permits in the "Permits" page
5. Access admin panel at http://localhost:8001/admin/

---

Last Updated: December 29, 2025
System Status: ✅ Ready for Use
