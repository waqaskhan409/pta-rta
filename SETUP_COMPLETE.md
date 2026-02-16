# PTA/RTA Permit Management System - Setup Complete

## ✅ Integration Status

The frontend-backend API integration is **fully functional**. You can now:
- ✅ Create permits through the React form
- ✅ Permits are saved to SQLite database (development)
- ✅ Permits appear in the Permit List immediately
- ✅ Filter permits by status
- ✅ View permit details with full audit history

---

## 🚀 Quick Start

### Prerequisites
- Python 3.8+ with virtual environment activated
- Node.js 14+ and npm
- MySQL (optional, configured for production)

### Step 1: Start the Django Backend
```bash
cd /Users/waqaskhan/Documents/PTA_RTA
source venv/bin/activate
cd config
python manage.py runserver 0.0.0.0:8001
```
The backend will start at `http://localhost:8001`

### Step 2: Start the React Frontend (in new terminal)
```bash
cd /Users/waqaskhan/Documents/PTA_RTA/frontend
npm start
```
The frontend will start at `http://localhost:3000`

### Step 3: Access the Application
Open your browser and navigate to `http://localhost:3000`

---

## 📁 Project Structure

```
PTA_RTA/
├── config/                 # Django backend
│   ├── manage.py
│   ├── db.sqlite3         # Development database
│   ├── requirements.txt    # Python dependencies
│   ├── .env               # Environment variables
│   ├── config/            # Django settings
│   │   ├── settings.py
│   │   ├── urls.py
│   │   └── wsgi.py
│   └── permits/           # Django app
│       ├── models.py      # Database models
│       ├── views.py       # API views
│       ├── serializers.py # DRF serializers
│       ├── urls.py        # API routes
│       └── migrations/    # Database migrations
│
├── frontend/              # React application
│   ├── package.json
│   ├── public/
│   └── src/
│       ├── pages/         # React pages
│       │   ├── Dashboard.js
│       │   ├── PermitList.js
│       │   └── NewPermit.js
│       ├── services/
│       │   └── apiClient.js    # Axios API client
│       ├── styles/
│       │   └── page.css
│       └── App.js
│
└── venv/                  # Python virtual environment
```

---

## 🔗 API Integration Details

### Frontend API Client
**File**: [frontend/src/services/apiClient.js](frontend/src/services/apiClient.js)

The Axios client automatically:
- Targets `http://localhost:8001` (configurable via `REACT_APP_API_URL`)
- Includes Bearer token authentication if available
- Handles 401 responses by clearing auth and redirecting

### API Endpoints

#### Create Permit
```
POST /api/permits/
Content-Type: application/json

{
  "vehicle_number": "DL-01-AB-1234",
  "owner_name": "John Doe",
  "owner_email": "john@example.com",
  "owner_phone": "9876543210",
  "authority": "PTA",  // or "RTA"
  "permit_type": "transport",  // transport|goods|passenger|commercial
  "valid_from": "2025-01-01",
  "valid_to": "2026-01-01",
  "description": "Optional description"
}
```

#### List Permits
```
GET /api/permits/

Optional filters:
- ?status=active|inactive|cancelled|expired|pending
- ?authority=PTA|RTA
- ?permit_type=transport|goods|passenger|commercial
```

#### Get Permit Details
```
GET /api/permits/{id}/
```

#### Update Permit
```
PATCH /api/permits/{id}/
Content-Type: application/json

{
  "field_name": "new_value"
}
```

#### Delete Permit
```
DELETE /api/permits/{id}/
```

### Custom Actions

#### Change Permit Status
```
POST /api/permits/{id}/activate/     # Activate a permit
POST /api/permits/{id}/deactivate/   # Deactivate a permit
POST /api/permits/{id}/cancel/       # Cancel a permit
POST /api/permits/{id}/renew/        # Renew a permit
```

#### Get Statistics
```
GET /api/permits/stats/
```

#### Get Expiring Permits
```
GET /api/permits/expiring_soon/
```

---

## 📊 Data Models

### Permit Model
- **permit_number** (auto-generated): Format `{AUTHORITY}-{TYPE[:3]}-{UUID}`
- **authority**: PTA or RTA
- **permit_type**: transport, goods, passenger, commercial
- **vehicle_number**: Vehicle registration number
- **owner_info**: name, email, phone, address, CNIC
- **validity**: valid_from, valid_to dates
- **status**: active, inactive, cancelled, expired, pending
- **audit_fields**: issued_date, last_modified, created_by, updated_by

### PermitHistory Model
Automatically tracks all changes:
- **action**: created, updated, deleted, activated, deactivated, cancelled, renewed
- **performed_by**: User who made the change
- **timestamp**: When the change was made
- **changes**: JSON diff of what changed
- **notes**: Additional notes about the change

---

## 🔧 Configuration

### Database Configuration
**File**: [config/.env](config/.env)

```bash
# Development (SQLite)
USE_MYSQL=false

# Production (MySQL)
USE_MYSQL=true
DB_ENGINE=django.db.backends.mysql
DB_NAME=transport_db
DB_USER=root
DB_PASSWORD=<your_password>
DB_HOST=localhost
DB_PORT=3306
```

### Django Settings
**File**: [config/config/settings.py](config/config/settings.py)

Key settings:
- `DEBUG=True` (development)
- `CORS_ALLOWED_ORIGINS` includes `http://localhost:3000`
- Database backend switches based on `USE_MYSQL` environment variable

### React Configuration
**File**: [frontend/package.json](frontend/package.json)

```json
{
  "proxy": "http://localhost:8001"
}
```

This tells the development server to forward API requests to the Django backend.

---

## 🧪 Testing the Integration

### Test 1: Create Permit via API
```bash
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
```

### Test 2: List Permits via API
```bash
curl http://localhost:8001/api/permits/ | jq .
```

### Test 3: Create Permit via React UI
1. Open http://localhost:3000
2. Click "New Permit"
3. Fill in the form
4. Click "Create Permit"
5. Check "Permits" page to see the new permit

---

## 📝 React Components

### Dashboard.js
Shows high-level statistics:
- Total permits
- Active permits
- Inactive permits
- Cancelled permits

### PermitList.js
Displays all permits with:
- Search functionality
- Status filtering
- Sorting by columns
- Quick status badges

### NewPermit.js
Form for creating new permits with:
- Input validation
- Error messages
- Success confirmation
- Auto-redirect after creation

---

## 🐛 Troubleshooting

### Port Already in Use
If port 8001 is already in use, start Django on a different port:
```bash
python manage.py runserver 0.0.0.0:8002
```
Then update the frontend proxy in [package.json](frontend/package.json)

### Database Issues

#### Reset SQLite Database
```bash
cd config
rm db.sqlite3
python manage.py migrate
python manage.py createsuperuser
```

#### Enable MySQL
1. Create database:
   ```bash
   mysql -u root -p
   CREATE DATABASE transport_db;
   ```

2. Update [.env](config/.env):
   ```bash
   USE_MYSQL=true
   DB_PASSWORD=<your_mysql_password>
   ```

3. Run migrations:
   ```bash
   python manage.py migrate
   ```

### API Not Responding
1. Check Django server is running: `http://localhost:8001/api/permits/`
2. Check React is using correct proxy in [package.json](frontend/package.json)
3. Check CORS is enabled in Django settings

### React Not Loading Data
1. Open browser console (F12)
2. Check Network tab for API request errors
3. Verify apiClient.js has correct backend URL
4. Check Django error logs in terminal

---

## 🔐 Admin Panel

Access the Django admin panel to manage permits:
- URL: `http://localhost:8001/admin/`
- Username: `admin`
- Password: (set during setup)

Admin features:
- View all permits and their history
- Filter by status, authority, type
- Export data
- Batch actions

---

## 📦 Dependencies

### Backend (Python)
- Django 4.2.27
- Django REST Framework 3.14.0
- django-cors-headers 4.3.1
- mysqlclient 2.2.0 (for MySQL support)
- python-dotenv 1.0.0

### Frontend (Node.js)
- React 18.2.0
- React Router DOM 6.20.0
- Axios 1.6.0
- CSS (no build system required)

Install all dependencies:
```bash
# Backend
cd config
pip install -r requirements.txt

# Frontend
cd frontend
npm install
```

---

## 🚀 Deployment

### Development
Uses SQLite and development servers:
```bash
# Terminal 1
cd config
python manage.py runserver

# Terminal 2
cd frontend
npm start
```

### Production

#### Using MySQL
1. Update [.env](config/.env) to use MySQL
2. Update Django DEBUG setting to False
3. Use a production WSGI server (Gunicorn, uWSGI)
4. Use a production HTTP server (Nginx, Apache)

#### Using Docker
Docker configuration files are included:
- [config/Dockerfile](config/Dockerfile) - Django backend
- [frontend/Dockerfile](frontend/Dockerfile) - React frontend

Build and run:
```bash
docker-compose up --build
```

---

## ✨ Features Implemented

- ✅ Create permits with auto-generated permit numbers
- ✅ Full CRUD operations via REST API
- ✅ Permit status management (active, inactive, cancelled, expired)
- ✅ Audit trail with change history
- ✅ Advanced filtering and search
- ✅ Admin panel
- ✅ Role-based access control (ready for implementation)
- ✅ Pagination and sorting
- ✅ CORS support for frontend
- ✅ Error handling and validation

---

## 📋 Next Steps

1. **Implement Authentication**: Add JWT or session-based auth
2. **Add More Fields**: Expand permit model with additional information
3. **File Uploads**: Allow uploading permit documents
4. **Notifications**: Add email/SMS notifications for permit renewal
5. **Advanced Reports**: Add reporting and analytics
6. **Mobile App**: Create mobile version with React Native

---

## 📞 Support

For issues or questions:
1. Check the troubleshooting section above
2. Review Django error logs in the terminal
3. Check React console (F12 → Console)
4. Check API responses in Network tab (F12 → Network)

---

**System Status**: ✅ **Ready for Use**

Last Updated: December 29, 2025
