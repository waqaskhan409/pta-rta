# PTA & RTA Permit Management System - Setup Guide

## Project Overview

This is a full-stack application for managing permits for Provincial Transport Authority (PTA) and Regional Transport Authority (RTA). It consists of:

- **Frontend**: React-based single-page application (port 3000)
- **Backend**: Django REST API (port 8000)
- **Database**: MySQL

## Project Structure

```
PTA_RTA/
├── frontend/              # React application
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── styles/
│   │   └── App.js
│   ├── package.json
│   └── .env
│
├── config/                # Django backend
│   ├── permits/          # Permits app
│   │   ├── models.py
│   │   ├── views.py
│   │   ├── serializers.py
│   │   ├── urls.py
│   │   └── admin.py
│   ├── config/           # Project settings
│   │   ├── settings.py
│   │   ├── urls.py
│   │   └── wsgi.py
│   ├── manage.py
│   ├── requirements.txt
│   └── .env
│
└── venv/                  # Virtual environment
```

## Prerequisites

- Python 3.8 or higher
- Node.js 14+ and npm
- MySQL 5.7 or higher
- Git

## Installation Steps

### 1. Backend Setup

#### Create and Activate Virtual Environment

```bash
cd config
python -m venv ../venv
source ../venv/bin/activate  # On Windows: ..\venv\Scripts\activate
```

#### Install Dependencies

```bash
pip install -r requirements.txt
```

#### Database Configuration

1. Create MySQL database:
```sql
CREATE DATABASE transport_db;
CREATE USER 'root'@'localhost' IDENTIFIED BY 'root';
GRANT ALL PRIVILEGES ON transport_db.* TO 'root'@'localhost';
FLUSH PRIVILEGES;
```

2. Update `.env` file with your database credentials:
```
DB_ENGINE=django.db.backends.mysql
DB_NAME=transport_db
DB_USER=root
DB_PASSWORD=root
DB_HOST=localhost
DB_PORT=3306
```

#### Run Migrations

```bash
python manage.py migrate
```

#### Create Superuser

```bash
python manage.py createsuperuser
```

#### Start Backend Server

```bash
python manage.py runserver
```

Backend will be available at `http://localhost:8000`

### 2. Frontend Setup

#### Install Dependencies

```bash
cd frontend
npm install
```

#### Configure Environment Variables

Create/update `.env` file:
```
REACT_APP_API_URL=http://localhost:8000
```

#### Start Frontend Development Server

```bash
npm start
```

Frontend will open at `http://localhost:3000`

## API Endpoints

### Permits Management

- `GET /api/permits/` - List all permits
- `POST /api/permits/` - Create new permit
- `GET /api/permits/{id}/` - Get permit details
- `PUT /api/permits/{id}/` - Update permit
- `PATCH /api/permits/{id}/` - Partial update
- `DELETE /api/permits/{id}/` - Delete permit

### Permit Actions

- `POST /api/permits/{id}/activate/` - Activate permit
- `POST /api/permits/{id}/deactivate/` - Deactivate permit
- `POST /api/permits/{id}/cancel/` - Cancel permit
- `POST /api/permits/{id}/renew/` - Renew permit
- `GET /api/permits/stats/` - Get statistics
- `GET /api/permits/expiring_soon/` - Get expiring permits

### Query Parameters

- `status=active|inactive|cancelled|expired|pending` - Filter by status
- `authority=PTA|RTA` - Filter by authority
- `permit_type=transport|goods|passenger|commercial` - Filter by type
- `search=query` - Search by vehicle number, owner name, email
- `from_date=YYYY-MM-DD` - Filter from date
- `to_date=YYYY-MM-DD` - Filter to date
- `ordering=-issued_date` - Order results

## Features

### Dashboard
- View permit statistics
- Quick overview of active, inactive, and cancelled permits
- Expiring permits alerts

### Permit Management
- Create new permits with complete details
- List and filter permits
- Edit permit information
- Cancel permits
- Activate/Deactivate permits
- Renew permits
- View permit history and changes

### Admin Panel
- Full admin interface at `/admin`
- Manage permits and users
- View permit history and changes
- Advanced filtering and search

## Database Models

### Permit
- Basic permit information (number, type, authority)
- Vehicle details (number, make, model, capacity)
- Owner information (name, email, phone, address)
- Validity dates and status
- Routes and restrictions
- Documents storage

### PermitHistory
- Track all changes to permits
- Record of who made changes and when
- Audit trail for compliance

## Security Features

- CORS enabled for frontend
- SQL injection prevention through ORM
- CSRF protection
- Input validation and sanitization
- Secure password handling

## Development

### Running Tests

#### Backend
```bash
cd config
python manage.py test permits
```

#### Frontend
```bash
cd frontend
npm test
```

## Deployment

### Using Docker

Create `docker-compose.yml`:
```yaml
version: '3.8'
services:
  mysql:
    image: mysql:5.7
    environment:
      MYSQL_DATABASE: transport_db
      MYSQL_USER: root
      MYSQL_PASSWORD: root
    ports:
      - "3306:3306"

  backend:
    build: ./config
    ports:
      - "8000:8000"
    depends_on:
      - mysql

  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
```

Run: `docker-compose up`

### Production Deployment

1. Set `DEBUG=False` in settings.py
2. Configure `SECRET_KEY` with a strong value
3. Update `ALLOWED_HOSTS`
4. Configure `CORS_ALLOWED_ORIGINS`
5. Use a production database connection
6. Deploy with gunicorn and nginx
7. Set up SSL/TLS certificate

## Troubleshooting

### Database Connection Issues
- Ensure MySQL is running
- Verify credentials in .env
- Check MySQL user privileges

### CORS Errors
- Verify `CORS_ALLOWED_ORIGINS` in settings.py
- Check proxy configuration in frontend package.json
- Ensure frontend and backend are on correct ports

### Port Already in Use
```bash
# Kill process on port 8000
lsof -ti:8000 | xargs kill -9

# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

## Support

For issues or questions, contact the development team.

## License

Copyright © 2024. All rights reserved.
