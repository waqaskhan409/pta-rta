# Development & Deployment Guide

## 🛠️ Development Workflow

### 1. Local Development Setup

#### Backend Development
```bash
cd config

# Activate virtual environment
source ../venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create/migrate database
python manage.py migrate

# Create superuser for admin access
python manage.py createsuperuser

# Start development server
python manage.py runserver

# In another terminal, you can create test data
python manage.py shell
```

#### Frontend Development
```bash
cd frontend

# Install dependencies
npm install

# Start development server (auto-reload on file changes)
npm start

# Build for production
npm build

# Run tests
npm test
```

### 2. Database Management

#### Create Database
```sql
CREATE DATABASE transport_db;
CREATE USER 'transport'@'localhost' IDENTIFIED BY 'transport123';
GRANT ALL PRIVILEGES ON transport_db.* TO 'transport'@'localhost';
FLUSH PRIVILEGES;
```

#### Backup Database
```bash
mysqldump -u root -p transport_db > backup.sql
```

#### Restore Database
```bash
mysql -u root -p transport_db < backup.sql
```

### 3. Creating Django Migrations

When you modify models:
```bash
cd config
python manage.py makemigrations permits
python manage.py migrate
```

## 🐳 Docker Development

### Build Images
```bash
docker-compose build
```

### Start Services
```bash
docker-compose up

# Or run in background
docker-compose up -d
```

### Stop Services
```bash
docker-compose down

# Stop and remove volumes
docker-compose down -v
```

### View Logs
```bash
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f mysql
```

## 🔧 Troubleshooting

### Database Connection Issues

**Error:** `django.db.utils.ProgrammingError: (2003, "Can't connect to MySQL server")`

**Solution:**
1. Ensure MySQL is running: `brew services start mysql` (macOS)
2. Check credentials in `.env`
3. Verify database exists: `mysql -u root -p -e "SHOW DATABASES;"`
4. Verify user privileges: `SHOW GRANTS FOR 'transport'@'localhost';`

### Port Conflicts

**Error:** `Address already in use`

**Solution:**
```bash
# Find process using port 8000
lsof -i :8000

# Kill process
kill -9 <PID>

# Or for macOS/Linux
fuser -k 8000/tcp
```

### CORS Errors

**Error:** `Access to XMLHttpRequest blocked by CORS policy`

**Solution:**
1. Check `CORS_ALLOWED_ORIGINS` in `config/settings.py`
2. Verify frontend URL is listed
3. Ensure `corsheaders` is in `INSTALLED_APPS`
4. Ensure CORS middleware is enabled

### Module Import Errors

**Solution:**
```bash
# Reinstall dependencies
pip install -r requirements.txt

# For frontend
npm install
```

## 📊 Testing

### Backend Tests
```bash
cd config
python manage.py test permits

# Run specific test
python manage.py test permits.tests.PermitTestCase

# With verbose output
python manage.py test permits -v 2
```

### Frontend Tests
```bash
cd frontend
npm test

# Run with coverage
npm test -- --coverage
```

## 🚀 Production Deployment

### Preparation Checklist
- [ ] Set `DEBUG=False` in settings.py
- [ ] Update `SECRET_KEY` with a secure value
- [ ] Configure `ALLOWED_HOSTS`
- [ ] Update `CORS_ALLOWED_ORIGINS`
- [ ] Configure email backend
- [ ] Set up database backups
- [ ] Configure static files serving
- [ ] Set up HTTPS/SSL
- [ ] Configure logging
- [ ] Set up monitoring

### Using Gunicorn

```bash
# Install gunicorn
pip install gunicorn

# Run with gunicorn
cd config
gunicorn config.wsgi:application --bind 0.0.0.0:8000 --workers 4
```

### Using Heroku

1. Create Procfile:
```
web: gunicorn config.wsgi
release: python config/manage.py migrate
```

2. Create .gitignore for environment variables

3. Deploy:
```bash
heroku create your-app-name
heroku config:set DEBUG=False
heroku config:set SECRET_KEY=your-secret-key
heroku addons:create cleardb:ignite  # MySQL addon
git push heroku main
heroku run python config/manage.py migrate
```

### Using AWS Elastic Beanstalk

1. Install EB CLI: `pip install awsebcli`

2. Initialize EB:
```bash
eb init -p python-3.10 pta-rta
```

3. Create environment:
```bash
eb create production
```

4. Deploy:
```bash
eb deploy
```

### Using Docker

1. Build images:
```bash
docker-compose build
```

2. Push to registry (Docker Hub):
```bash
docker tag pta-rta-frontend your-username/pta-rta-frontend
docker push your-username/pta-rta-frontend

docker tag pta-rta-backend your-username/pta-rta-backend
docker push your-username/pta-rta-backend
```

3. Pull and run on production server:
```bash
docker pull your-username/pta-rta-frontend
docker pull your-username/pta-rta-backend
docker-compose up -d
```

## 📈 Performance Optimization

### Database Optimization
- Indexes are already created for:
  - vehicle_number + status
  - owner_email
  - valid_from + valid_to
  - permit_number

### Backend Optimization
```python
# Use select_related for foreign keys
queryset = Permit.objects.select_related('user').all()

# Use prefetch_related for reverse relations
queryset = Permit.objects.prefetch_related('history').all()

# Enable pagination (already configured)
# Use filtering to reduce query results
```

### Frontend Optimization
- Code splitting with React lazy loading
- Production build minification
- Browser caching
- CDN for static files

## 🔍 Monitoring

### Django Debug Toolbar
```bash
pip install django-debug-toolbar
```

Add to settings:
```python
INSTALLED_APPS = [
    'debug_toolbar',
]

MIDDLEWARE = [
    'debug_toolbar.middleware.DebugToolbarMiddleware',
]
```

### Logging Configuration

```python
# In settings.py
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'file': {
            'level': 'ERROR',
            'class': 'logging.FileHandler',
            'filename': 'errors.log',
        },
    },
    'loggers': {
        'django': {
            'handlers': ['file'],
            'level': 'ERROR',
            'propagate': True,
        },
    },
}
```

## 📦 Dependencies Update

### Backend
```bash
pip list --outdated
pip install --upgrade package-name
```

### Frontend
```bash
npm outdated
npm update
```

## 🔐 Security Best Practices

1. **Environment Variables:**
   - Never commit `.env` files
   - Use `.env.example` for documentation
   - Rotate secrets regularly

2. **Database:**
   - Use strong passwords
   - Restrict database user permissions
   - Regular backups
   - Enable SSL for database connections

3. **API Security:**
   - Use HTTPS only
   - Implement rate limiting
   - Validate all inputs
   - Use CSRF tokens
   - Implement authentication/authorization

4. **Frontend:**
   - Sanitize user input
   - Use HTTPS
   - Implement Content Security Policy
   - Regular dependency updates

## 📞 Support Commands

### Useful Django Commands
```bash
python manage.py help
python manage.py shell  # Interactive shell
python manage.py dbshell  # Database shell
python manage.py check  # Check for issues
python manage.py showmigrations  # Show migration status
python manage.py flush  # Clear database (dev only)
```

### Useful Frontend Commands
```bash
npm list  # Show installed packages
npm audit  # Check vulnerabilities
npm cache clean --force  # Clear npm cache
```

## 🎯 Common Tasks

### Add New Permit Status
1. Update `STATUS_CHOICES` in models.py
2. Run `makemigrations` and `migrate`
3. Update API validation if needed

### Add New API Endpoint
1. Add method to ViewSet in views.py
2. Use `@action` decorator for custom actions
3. Update serializers if needed
4. Test with API client

### Add Frontend Page
1. Create component in `pages/` folder
2. Import in App.js
3. Add route to Routes
4. Add navigation link

## 📚 Additional Resources

- Django Documentation: https://docs.djangoproject.com/
- Django REST Framework: https://www.django-rest-framework.org/
- React Documentation: https://react.dev/
- Docker Documentation: https://docs.docker.com/

---

**Last Updated:** December 29, 2024
