# 🚀 Getting Started - PTA & RTA Permit Management System

## ✅ Setup Status

Your application is **now ready to run**! All dependencies have been installed and the database is configured.

---

## 📋 What's Been Done

- ✅ Virtual environment created
- ✅ All Python dependencies installed (Django, DRF, CORS, etc.)
- ✅ All frontend dependencies installed (React, Axios, Router, etc.)
- ✅ Database migrations created and applied
- ✅ Superuser account created (username: `admin`)
- ✅ Django system check passed - no issues!

---

## 🎯 Running the Application

### Step 1: Start the Backend Server

Open **Terminal 1** and run:

```bash
cd /Users/waqaskhan/Documents/PTA_RTA
source venv/bin/activate
cd config
python manage.py runserver
```

You should see output like:
```
Starting development server at http://127.0.0.1:8000/
```

### Step 2: Start the Frontend Server

Open **Terminal 2** and run:

```bash
cd /Users/waqaskhan/Documents/PTA_RTA/frontend
npm start
```

The browser will automatically open at `http://localhost:3000`

---

## 🌐 Access Your Application

Once both servers are running:

| Component | URL | Credentials |
|-----------|-----|-------------|
| **Frontend** | http://localhost:3000 | No login required for now |
| **Backend API** | http://localhost:8000/api | RESTful endpoints |
| **Admin Panel** | http://localhost:8000/admin | Username: `admin` |
| **API Docs** | http://localhost:8000/api | Browse all endpoints |

---

## 🔑 Admin Credentials

- **Username:** `admin`
- **Password:** *(set during superuser creation)*

**Note:** If you need to reset the password, use:
```bash
cd config
source ../venv/bin/activate
python manage.py changepassword admin
```

---

## 📱 Testing the API

### Test with cURL

```bash
# List all permits
curl http://localhost:8000/api/permits/

# Get statistics
curl http://localhost:8000/api/permits/stats/

# Create a permit
curl -X POST http://localhost:8000/api/permits/ \
  -H "Content-Type: application/json" \
  -d '{
    "vehicle_number": "ABC-1234",
    "owner_name": "John Doe",
    "owner_email": "john@example.com",
    "owner_phone": "+92300000000",
    "authority": "PTA",
    "permit_type": "transport",
    "valid_from": "2024-01-01",
    "valid_to": "2025-01-01",
    "description": "Transport permit"
  }'
```

### Test in Frontend

1. Navigate to **http://localhost:3000**
2. Go to **"New Permit"** page
3. Fill in the form and submit
4. View created permits in **"Permits"** page

---

## 🗄️ Database Information

The application is using **SQLite** for local development (easier setup, no MySQL required):

- **Location:** `/Users/waqaskhan/Documents/PTA_RTA/config/db.sqlite3`
- **Browser:** Install [DB Browser for SQLite](https://sqlitebrowser.org/) to view data
- **Reset:** Delete `db.sqlite3` and re-run migrations to start fresh

### To Switch to MySQL (Production)

Update `.env` file:
```
USE_MYSQL=true
DB_NAME=transport_db
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_HOST=localhost
DB_PORT=3306
```

Then create the database:
```sql
CREATE DATABASE transport_db;
```

---

## 🛠️ Common Commands

### Backend Commands

```bash
# Activate virtual environment
source venv/bin/activate

# Run server
cd config
python manage.py runserver

# Run migrations
python manage.py migrate

# Create migrations
python manage.py makemigrations permits

# Access Django shell
python manage.py shell

# Create superuser
python manage.py createsuperuser

# Check system
python manage.py check
```

### Frontend Commands

```bash
cd frontend

# Start development server
npm start

# Build for production
npm build

# Run tests
npm test

# Clean cache
npm cache clean --force
```

---

## 🔗 API Endpoints

All endpoints are at `http://localhost:8000/api`

### Permit Operations
- `GET /permits/` - List all permits
- `POST /permits/` - Create new permit
- `GET /permits/{id}/` - Get permit details
- `PUT /permits/{id}/` - Update permit
- `DELETE /permits/{id}/` - Delete permit

### Permit Actions
- `POST /permits/{id}/activate/` - Activate permit
- `POST /permits/{id}/deactivate/` - Deactivate permit
- `POST /permits/{id}/cancel/` - Cancel permit
- `POST /permits/{id}/renew/` - Renew permit

### Analytics
- `GET /permits/stats/` - Get statistics
- `GET /permits/expiring_soon/` - Get expiring permits

### Query Parameters
```
?status=active          # Filter by status
?authority=PTA          # Filter by authority
?permit_type=transport  # Filter by type
?search=ABC-1234       # Search permits
```

---

## 📊 Example: Create Your First Permit

### Via Frontend (Easy)
1. Open http://localhost:3000
2. Click "New Permit"
3. Fill in the form:
   - Vehicle Number: ABC-1234
   - Owner Name: John Doe
   - Owner Email: john@example.com
   - Owner Phone: +92300000000
   - Authority: PTA
   - Permit Type: Transport
   - Valid From: 2024-01-01
   - Valid To: 2025-01-01
4. Click "Create Permit"

### Via Admin Panel
1. Open http://localhost:8000/admin
2. Login with username: `admin`
3. Go to "Permits"
4. Click "Add Permit"
5. Fill in the form and save

### Via API (Advanced)
```bash
curl -X POST http://localhost:8000/api/permits/ \
  -H "Content-Type: application/json" \
  -d '{
    "vehicle_number": "ABC-1234",
    "owner_name": "John Doe",
    "owner_email": "john@example.com",
    "owner_phone": "+92300000000",
    "authority": "PTA",
    "permit_type": "transport",
    "valid_from": "2024-01-01",
    "valid_to": "2025-01-01"
  }'
```

---

## ⚠️ Troubleshooting

### Port 8000 Already in Use
```bash
# Find process using port 8000
lsof -i :8000

# Kill the process
kill -9 <PID>
```

### Port 3000 Already in Use
```bash
# Find process using port 3000
lsof -i :3000

# Kill the process
kill -9 <PID>
```

### Module Not Found Error
```bash
# Reinstall dependencies
pip install -r requirements.txt
npm install
```

### Database Issues
```bash
# Reset database (SQLite)
cd config
rm db.sqlite3
python manage.py migrate
python manage.py createsuperuser
```

### CORS Errors
The CORS configuration allows:
- Frontend: `http://localhost:3000`
- Backend: `http://localhost:8000`

These are configured in `config/config/settings.py`

---

## 📚 Next Steps

1. **Explore the Admin Panel**
   - Go to http://localhost:8000/admin
   - Create some test permits
   - View the database structure

2. **Test the API**
   - Use cURL or Postman to test endpoints
   - See [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md) for full API docs

3. **Build Features**
   - Frontend components in `frontend/src/`
   - Backend views in `config/permits/`
   - Follow [DEVELOPMENT.md](DEVELOPMENT.md) for guidelines

4. **Database Customization**
   - Modify models in `config/permits/models.py`
   - Run `makemigrations` and `migrate`
   - Update serializers in `config/permits/serializers.py`

5. **Deployment**
   - See [DEVELOPMENT.md](DEVELOPMENT.md) deployment section
   - Use Docker: `docker-compose build && docker-compose up`

---

## 🎓 Learning Resources

### Frontend
- [React Docs](https://react.dev/)
- [React Router](https://reactrouter.com/)
- [Axios](https://axios-http.com/)

### Backend
- [Django Docs](https://docs.djangoproject.com/)
- [Django REST Framework](https://www.django-rest-framework.org/)
- [Database Models](https://docs.djangoproject.com/en/4.2/topics/db/models/)

### Database
- [SQLite Docs](https://www.sqlite.org/docs.html)
- [MySQL Docs](https://dev.mysql.com/doc/)

---

## 📞 Quick Help

### Check if servers are running
```bash
# Test backend
curl http://localhost:8000/api/permits/

# Test frontend
curl http://localhost:3000
```

### View logs
- **Backend logs:** Terminal where you ran `python manage.py runserver`
- **Frontend logs:** Terminal where you ran `npm start`
- **Browser console:** Press F12 in browser

### Clear cache
```bash
# Frontend
cd frontend
npm cache clean --force

# Backend
cd config
find . -type d -name __pycache__ -exec rm -r {} +
```

---

## 🎉 You're Ready!

Both servers should now be running and your application is fully functional!

**Next:** Open http://localhost:3000 and start creating permits! 🚀

For more information, see:
- [README.md](README.md) - Project overview
- [DEVELOPMENT.md](DEVELOPMENT.md) - Development guide
- [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md) - Technical details
