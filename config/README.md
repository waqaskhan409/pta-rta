# Backend - Django Application

This is the backend API for the PTA & RTA Permit Management System built with Django and Django REST Framework.

## Installation

1. Navigate to the config directory:
```bash
cd config
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

## Environment Setup

Create a `.env` file in the config directory with your database and other configurations (see `.env.example`).

## Database Setup

### Using MySQL

1. Create a MySQL database:
```sql
CREATE DATABASE transport_db;
```

2. Run migrations:
```bash
python manage.py migrate
```

3. Create a superuser:
```bash
python manage.py createsuperuser
```

## Running the Development Server

```bash
python manage.py runserver
```

The API will be available at `http://localhost:8000`

## Project Structure

- `config/` - Project settings and configuration
  - `settings.py` - Django settings
  - `urls.py` - Main URL configuration
  - `wsgi.py` - WSGI configuration
- `permits/` - Permits app (create this with `python manage.py startapp permits`)
  - `models.py` - Database models
  - `serializers.py` - DRF serializers
  - `views.py` - API views
  - `urls.py` - App URL configuration

## API Endpoints

- `GET /api/permits/` - List all permits
- `POST /api/permits/` - Create new permit
- `GET /api/permits/{id}/` - Get permit details
- `PUT /api/permits/{id}/` - Update permit
- `DELETE /api/permits/{id}/` - Delete permit
- `GET /api/permits/stats/` - Get permit statistics
- `POST /api/permits/{id}/cancel/` - Cancel permit
- `POST /api/permits/{id}/activate/` - Activate permit
- `POST /api/permits/{id}/deactivate/` - Deactivate permit

## Admin Panel

Access Django admin at `http://localhost:8000/admin`

## Technologies

- Django 4.2
- Django REST Framework
- MySQL
- Python 3.8+

## Dependencies

See `requirements.txt` for complete list.
