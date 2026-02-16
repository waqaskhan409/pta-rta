# PTA & RTA Permit Management System

A comprehensive full-stack web application for managing transport permits for Provincial Transport Authority (PTA) and Regional Transport Authority (RTA).

## Features

### 🎯 Core Features
- **Permit Management**: Create, read, update, and delete permits
- **Status Management**: Active, Inactive, Cancelled, Expired, and Pending statuses
- **Authority Support**: Separate handling for PTA and RTA permits
- **Permit Types**: Transport, Goods, Passenger, and Commercial permits
- **Advanced Search & Filtering**: Filter by status, authority, type, and date range
- **Dashboard Analytics**: Real-time statistics and insights
- **Expiring Soon Alerts**: Get notified about permits expiring in the next 30 days

### 🔒 Security
- CORS protection for frontend-backend communication
- CSRF token validation
- Input validation and sanitization
- SQL injection prevention through ORM
- Secure password hashing

### 📊 Admin Features
- Full Django admin panel
- Advanced permit filtering and search
- User and permission management
- Audit trail and history tracking
- Batch operations support

### 🎨 User Interface
- Modern, responsive React-based frontend
- Intuitive navigation and user experience
- Real-time form validation
- Status indicators and color coding
- Mobile-friendly design

## Technology Stack

### Frontend
- **React 18** - UI library
- **React Router DOM** - Client-side routing
- **Axios** - HTTP client for API calls
- **CSS3** - Responsive styling

### Backend
- **Django 4.2** - Web framework
- **Django REST Framework** - API development
- **Django CORS Headers** - CORS handling
- **MySQL** - Database

### DevOps
- **Docker** - Containerization
- **Docker Compose** - Multi-container orchestration

## Project Structure

```
PTA_RTA/
├── frontend/                          # React frontend application
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/               # Reusable components
│   │   ├── pages/                    # Page components
│   │   │   ├── Dashboard.js
│   │   │   ├── PermitList.js
│   │   │   └── NewPermit.js
│   │   ├── services/
│   │   │   └── apiClient.js          # API integration
│   │   ├── styles/
│   │   ├── App.js
│   │   ├── App.css
│   │   ├── index.js
│   │   └── index.css
│   ├── package.json
│   ├── .env
│   ├── .env.example
│   ├── Dockerfile
│   └── README.md
│
├── config/                            # Django backend
│   ├── permits/                      # Main permits application
│   │   ├── migrations/
│   │   ├── models.py                 # Database models
│   │   ├── views.py                  # API views
│   │   ├── serializers.py            # DRF serializers
│   │   ├── urls.py                   # App URLs
│   │   ├── admin.py                  # Admin configuration
│   │   └── apps.py
│   ├── config/                       # Project configuration
│   │   ├── settings.py              # Django settings
│   │   ├── urls.py                  # Main URLs
│   │   ├── wsgi.py
│   │   └── asgi.py
│   ├── manage.py
│   ├── requirements.txt
│   ├── .env
│   ├── .env.example
│   ├── Dockerfile
│   └── README.md
│
├── .gitignore
├── docker-compose.yml
├── SETUP.md                          # Detailed setup guide
├── quickstart.sh                     # Quick setup script (Linux/Mac)
├── quickstart.bat                    # Quick setup script (Windows)
└── README.md                         # This file
```

## Quick Start

### Option 1: Quick Setup Script

#### On macOS/Linux:
```bash
chmod +x quickstart.sh
./quickstart.sh
```

#### On Windows:
```cmd
quickstart.bat
```

### Option 2: Manual Setup

#### Prerequisites
- Python 3.8+
- Node.js 14+
- MySQL 5.7+
- Git

#### Backend Setup
```bash
cd config
python -m venv ../venv
source ../venv/bin/activate  # On Windows: ..\venv\Scripts\activate
pip install -r requirements.txt

# Create database
# mysql> CREATE DATABASE transport_db;

python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

#### Frontend Setup (in another terminal)
```bash
cd frontend
npm install
npm start
```

### Option 3: Docker Setup
```bash
docker-compose up
```

## Usage

### Access the Application

1. **Frontend**: http://localhost:3000
2. **Backend API**: http://localhost:8000
3. **Admin Panel**: http://localhost:8000/admin

### Create a Superuser
```bash
cd config
python manage.py createsuperuser
```

### Running Migrations
```bash
cd config
python manage.py migrate
```

## API Documentation

### Base URL
```
http://localhost:8000/api
```

### Permit Endpoints

#### List Permits
```
GET /permits/
Query Parameters:
  - status: active|inactive|cancelled|expired|pending
  - authority: PTA|RTA
  - permit_type: transport|goods|passenger|commercial
  - search: search query
  - from_date: YYYY-MM-DD
  - to_date: YYYY-MM-DD
  - ordering: -issued_date (descending)
```

#### Create Permit
```
POST /permits/
Content-Type: application/json

{
  "vehicle_number": "ABC-1234",
  "owner_name": "John Doe",
  "owner_email": "john@example.com",
  "owner_phone": "+92300000000",
  "authority": "PTA",
  "permit_type": "transport",
  "valid_from": "2024-01-01",
  "valid_to": "2025-01-01",
  "description": "Transport permit"
}
```

#### Get Permit
```
GET /permits/{id}/
```

#### Update Permit
```
PUT /permits/{id}/
```

#### Delete Permit
```
DELETE /permits/{id}/
```

#### Cancel Permit
```
POST /permits/{id}/cancel/
{
  "notes": "Reason for cancellation"
}
```

#### Activate Permit
```
POST /permits/{id}/activate/
{
  "notes": "Reason for activation"
}
```

#### Deactivate Permit
```
POST /permits/{id}/deactivate/
{
  "notes": "Reason for deactivation"
}
```

#### Renew Permit
```
POST /permits/{id}/renew/
{
  "new_valid_to": "2026-01-01"
}
```

#### Get Statistics
```
GET /permits/stats/

Response:
{
  "totalPermits": 100,
  "activePermits": 80,
  "inactivePermits": 10,
  "cancelledPermits": 5,
  "expiredPermits": 4,
  "pendingPermits": 1
}
```

#### Get Expiring Soon
```
GET /permits/expiring_soon/
```

## Configuration

### Environment Variables

#### Backend (.env)
```
DEBUG=True
SECRET_KEY=your-secret-key
ALLOWED_HOSTS=localhost,127.0.0.1

DB_ENGINE=django.db.backends.mysql
DB_NAME=transport_db
DB_USER=root
DB_PASSWORD=root
DB_HOST=localhost
DB_PORT=3306

CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:8000
```

#### Frontend (.env)
```
REACT_APP_API_URL=http://localhost:8000
NODE_ENV=development
```

## Database Schema

### Permit Model
- `permit_number` - Unique permit identifier
- `authority` - PTA or RTA
- `permit_type` - Type of permit
- `vehicle_number` - Registration number
- `vehicle_make` - Manufacturer
- `vehicle_model` - Model name
- `vehicle_year` - Manufacturing year
- `vehicle_capacity` - Passenger/cargo capacity
- `owner_name` - Owner full name
- `owner_email` - Owner email
- `owner_phone` - Contact number
- `owner_address` - Residential address
- `owner_cnic` - National ID number
- `status` - Current status
- `valid_from` - Start date
- `valid_to` - End date
- `description` - Permit description
- `remarks` - Additional remarks
- `approved_routes` - Approved routes
- `restrictions` - Route restrictions

### PermitHistory Model
- `permit` - Foreign key to Permit
- `action` - Type of action
- `performed_by` - User who performed action
- `timestamp` - When action was performed
- `changes` - JSON of changes
- `notes` - Additional notes

## Development

### Backend Development
```bash
cd config
python manage.py runserver --settings=config.settings
```

### Frontend Development
```bash
cd frontend
npm start
```

### Run Tests

Backend:
```bash
cd config
python manage.py test permits
```

Frontend:
```bash
cd frontend
npm test
```

## Deployment

### Production Checklist
- [ ] Set `DEBUG=False`
- [ ] Update `SECRET_KEY` with secure value
- [ ] Configure `ALLOWED_HOSTS`
- [ ] Update `CORS_ALLOWED_ORIGINS`
- [ ] Use production database
- [ ] Set up HTTPS/SSL
- [ ] Configure email backend
- [ ] Set up logging
- [ ] Configure static files serving
- [ ] Set up database backups

### Using Heroku
1. Create `Procfile`:
```
web: gunicorn config.wsgi
```

2. Deploy:
```bash
heroku create
git push heroku main
```

### Using AWS
Use AWS Elastic Beanstalk with RDS MySQL database.

## Troubleshooting

### Database Connection Error
```bash
# Check MySQL is running
mysql -u root -p

# Verify .env credentials
# Ensure database exists: CREATE DATABASE transport_db;
```

### Port Already in Use
```bash
# Kill process on port 8000
lsof -ti:8000 | xargs kill -9

# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

### CORS Errors
1. Check `CORS_ALLOWED_ORIGINS` in settings.py
2. Verify frontend proxy in package.json
3. Ensure correct API URL in .env

### Module Not Found
```bash
cd config
pip install -r requirements.txt

cd ../frontend
npm install
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## Version History

### v1.0.0 (2024)
- Initial release
- Basic permit management
- Dashboard and analytics
- Admin panel

## License

© 2024 Provincial Transport Authority & Regional Transport Authority. All rights reserved.

## Support

For support and questions:
- Email: support@ptatrta.gov
- Issue Tracker: GitHub Issues
- Documentation: See [SETUP.md](SETUP.md)

## Future Enhancements

- [ ] Advanced reporting and analytics
- [ ] SMS/Email notifications
- [ ] Mobile app
- [ ] Payment gateway integration
- [ ] Document upload and verification
- [ ] Multi-language support
- [ ] Offline mode
- [ ] API rate limiting
- [ ] Advanced permission system
- [ ] Two-factor authentication
