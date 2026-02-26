# Backend Deployment Guide - Dokploy with Nixpacks

## Overview
This guide walks you through deploying the Django backend to Dokploy using Nixpacks native engine.

---

## Prerequisites

- Dokploy account and project created
- GitHub repository pushed with the latest code
- Remote MySQL database already configured (31.97.208.55)

---

## Step 1: Prepare Your Repository

### 1.1 Update requirements.txt
Ensure `gunicorn` is included (it's been added to support production):

```bash
Django==4.2.27
djangorestframework==3.14.0
django-cors-headers==4.3.1
mysqlclient==2.2.0
python-dotenv==1.0.0
Pillow==10.1.0
gunicorn>=21.0.0
```

### 1.2 Files Already Created
- ✅ `config/Procfile` - Specifies the web process
- ✅ `config/nixpacks.toml` - Nixpacks configuration
- ✅ `config/.env.production` - Production environment template

---

## Step 2: Create Dokploy Application

### 2.1 In Dokploy Dashboard:
1. Go to your Dokploy project
2. Click **"New Application"**
3. Select **"GitHub Repository"**
4. Choose your `pta-rta` repository
5. Set repository root to `config/` (since Django app is in this directory)

### 2.2 Build Configuration:
- **Builder:** Nixpacks
- **Build Command:** (leave empty - Nixpacks will auto-detect)
- **Start Command:** (leave empty - Procfile will be used)

### 2.3 Port Configuration:
- **Internal Port:** 8000
- **Public Port:** 80 (or 443 for HTTPS)

---

## Step 3: Configure Environment Variables

In Dokploy Dashboard, add these environment variables:

```env
DEBUG=False
SECRET_KEY=<generate-a-new-secret-key>
ALLOWED_HOSTS=<your-backend-domain>.traefik.me,localhost
CORS_ALLOWED_ORIGINS=http://<your-frontend-domain>.traefik.me,https://<your-frontend-domain>.traefik.me
DB_ENGINE=django.db.backends.mysql
DB_NAME=u607560680_transport_db
DB_USER=u607560680_pta_rta
DB_PASSWORD=Uzehcazdr-409
DB_HOST=31.97.208.55
DB_PORT=3306
USE_MYSQL=true
```

**Important:** Replace the following:
- `<your-backend-domain>` - Your Dokploy backend domain (e.g., `ptarta-backend`)
- `<your-frontend-domain>` - Your deployed frontend domain

---

## Step 4: Deploy

### 4.1 Trigger Deployment:
1. Click **"Deploy"** in Dokploy dashboard
2. Monitor the build logs

### 4.2 What Happens:
1. Dokploy pulls from GitHub
2. Nixpacks detects Python project
3. Installs dependencies from `requirements.txt`
4. Runs migrations via Procfile
5. Collects static files
6. Starts Gunicorn server

---

## Step 5: Verify Deployment

### 5.1 Check Backend Health:
```bash
curl https://<your-backend-domain>.traefik.me/api/health/
```

### 5.2 Update Frontend Configuration:
After backend is deployed, update frontend `.env`:

```env
REACT_APP_API_URL=https://<your-backend-domain>.traefik.me
```

Then redeploy frontend.

---

## Step 6: Post-Deployment Tasks

### 6.1 Create Superuser (if needed):
In Dokploy, use the CLI or connect to database:
```bash
python manage.py createsuperuser
```

### 6.2 Fix CORS Issues (if any):
If frontend can't access backend, verify:
1. `CORS_ALLOWED_ORIGINS` is set correctly
2. Frontend URL matches exactly (including protocol)
3. Check backend logs in Dokploy for CORS errors

### 6.3 Enable HTTPS:
Dokploy typically provides automatic SSL via Let's Encrypt.

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| **Build fails** | Check build logs in Dokploy; ensure Python 3.10 is used |
| **Port already in use** | Dokploy manages ports automatically; check internal port is 8000 |
| **Database connection error** | Verify DB credentials in environment variables; test connection |
| **CORS errors** | Check `CORS_ALLOWED_ORIGINS` matches frontend URL exactly |
| **Static files not loading** | Ensure `collectstatic` runs during build |
| **502 Bad Gateway** | Check Gunicorn logs; may need to increase workers or timeout |

---

## Environment File Reference

The `.env.production` file contains all required variables. Update these before deployment:

```env
# Security
DEBUG=False (CRITICAL: Set to False in production)
SECRET_KEY=<generate-new-random-key>

# Hosting
ALLOWED_HOSTS=your-domain.traefik.me
CORS_ALLOWED_ORIGINS=https://frontend-domain.traefik.me

# Database
DB_HOST=31.97.208.55
DB_NAME=u607560680_transport_db
DB_USER=u607560680_pta_rta
DB_PASSWORD=Uzehcazdr-409
```

---

## Useful Dokploy Commands

| Action | Steps |
|--------|-------|
| **View Logs** | Dashboard → Application → Logs |
| **Restart App** | Dashboard → Application → Restart |
| **Rollback** | Dashboard → Deployments → Select previous version |
| **Scale App** | Dashboard → Application → Scale (set workers) |
| **Set Custom Domain** | Dashboard → Domains → Add custom domain |

---

## Backend API Base URL

Once deployed, your API will be accessible at:

```
https://<your-backend-domain>.traefik.me/api/
```

Common endpoints:
- Login: `POST /api/auth/login/`
- Permits: `GET /api/permits/`
- Chalans: `GET /api/chalans/`
- etc.

---

## Notes

- Migrations run automatically on each deployment (see Procfile)
- Static files are collected during build
- Gunicorn is configured with 4 workers by default
- Connection pooling is handled by mysqlclient
- CSRF protection requires `ALLOWED_HOSTS` to be set correctly

---

## Next Steps

After successful deployment:
1. ✅ Update frontend `.env` to point to backend
2. ✅ Run integration tests
3. ✅ Monitor logs for any issues
4. ✅ Set up automated backups for database
5. ✅ Configure monitoring/alerting

---

**Deployment Date:** February 26, 2026
**Backend Framework:** Django 4.2.27
**Database:** Remote MySQL (31.97.208.55)
