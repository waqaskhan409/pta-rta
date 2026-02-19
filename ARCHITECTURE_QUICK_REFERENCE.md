# Quick Reference Guide - Architecture & Design

**Version:** 1.0  |  **Date:** February 2026  |  **Status:** Quick Reference

---

## 📋 Architecture Overview

**Pattern:** Three-Tier Architecture (REST API)  
**Frontend:** React 18 (SPA)  
**Backend:** Django 4.2 + DRF  
**Database:** MySQL 5.7  
**Deployment:** Docker + Docker Compose  

---

## 🏗️ System Components

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Presentation** | React 18 | User Interface, Routing, State Management |
| **Business Logic** | Django REST Framework | API Endpoints, Authorization, Validation |
| **Data Access** | Django ORM | Database abstraction, Query generation |
| **Database** | MySQL 5.7 | Persistent data storage |
| **File Storage** | File System | Permit documents and media |
| **Caching** | Redis (optional) | Rate limiting, session storage |
| **Container** | Docker | Application packaging |

---

## 🔐 Security Layers

```
TLS/HTTPS → CORS → Rate Limiting → API Gateway → 
Authentication → Authorization → Input Validation → 
Data Protection → Audit Logging
```

**Key Features:**
- ✓ Token-based authentication
- ✓ Role-based access control (RBAC)
- ✓ Immutable audit trails
- ✓ Input validation & sanitization
- ✓ HTTPS enforced
- ✓ Rate limiting (100 req/min per IP)

---

## 📊 Data Model Core Entities

**Permit (Central Entity)**
- permit_number (PK, unique)
- status (active, inactive, cancelled, expired, pending)
- vehicle_number, owner_name, owner_email
- assigned_to (FK to User)
- valid_from, valid_to dates
- permit_type (FK)
- vehicle_type (FK)

**Related Entities:**
- PermitHistory: Audit trail of changes
- PermitDocument: Supporting documentation
- PermitType: Types of permits
- VehicleType: Categories of vehicles
- User, Role, Feature: Access control
- Event, EventLog: System events & logging

---

## 🔌 API Endpoints Summary

### Permits
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/permits/` | List permits (paginated) |
| POST | `/api/permits/` | Create permit |
| GET | `/api/permits/{id}/` | Get permit details |
| PATCH | `/api/permits/{id}/` | Update permit |
| DELETE | `/api/permits/{id}/` | Delete permit |
| POST | `/api/permits/{id}/renew/` | Renew permit |
| POST | `/api/permits/{id}/cancel/` | Cancel permit |
| POST | `/api/permits/{id}/assign/` | Assign to user |

### Authentication
| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/auth/login/` | User login |
| POST | `/api/auth/logout/` | User logout |
| POST | `/api/auth/register/` | New registration |
| POST | `/api/auth/verify-token/` | Validate token |

### Users & Roles
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/users/` | List users |
| POST | `/api/users/` | Create user |
| GET | `/api/roles/` | List roles |
| POST | `/api/roles/` | Create role |
| GET | `/api/features/` | List features |

---

## 🧬 Request/Response Example

**Create Permit Request:**
```bash
POST /api/permits/
Authorization: Token abc123def456...
Content-Type: application/json

{
  "authority": "PTA",
  "vehicle_number": "ABC-123",
  "owner_name": "John Doe",
  "owner_email": "john@example.com",
  "permit_type": 1,
  "vehicle_type": 1,
  "valid_from": "2026-02-17",
  "valid_to": "2027-02-17"
}
```

**Success Response (201 Created):**
```json
{
  "id": 1,
  "permit_number": "PTA-2026-00001",
  "status": "pending",
  "assigned_to_username": "junior_clerk_1",
  "created_by": "admin_user",
  "issued_date": "2026-02-17T10:30:00Z"
}
```

---

## 👥 User Roles & Permissions

| Role | Features |
|------|----------|
| **Admin** | All features, system management |
| **Senior Clerk** | Approve permits, manage juniors |
| **Junior Clerk** | Create & process permits |
| **Assistant** | Data entry support |
| **Operator/Supervisor** | Limited permit access |
| **End User** | View own permits |

**Feature Permissions:**
- permit_view: Read permits
- permit_create: Create permits
- permit_edit: Modify permits
- permit_delete: Delete permits
- permit_renew: Extend validity
- permit_cancel: Cancel permits
- user_manage: Manage users
- role_manage: Manage roles
- report_view: Access reports
- dashboard_view: View dashboard

---

## 🔄 Workflow: Create Permit

```
1. User fills form
   ↓
2. Frontend validates input
   ↓
3. POST /api/permits/ with data
   ↓
4. Backend validates token & permission (permit_create)
   ↓
5. Validate permit data (serializer)
   ↓
6. Generate unique permit_number
   ↓
7. Auto-assign to available junior clerk (load balancing)
   ↓
8. INSERT into database
   ↓
9. Create PermitHistory record
   ↓
10. Log event 'permit_created'
    ↓
11. Return 201 Created with permit data
    ↓
12. Frontend shows success & displays permit
```

---

## 🔒 Authentication Flow

```
Username + Password
    ↓
Hash & validate against stored hash
    ↓
Load user role & features
    ↓
Generate Token
    ↓
Return token to client
    ↓
Client stores in localStorage
    ↓
Include in Authorization header on requests
    ↓
Backend validates token on each request
    ↓
Proceed if valid → 401 if invalid
```

---

## 📈 Event Logging System

**Events Captured:**
- User logins/logouts
- Permit create/update/delete
- Status changes
- Document uploads
- Permission assignments
- Failed operations
- API errors
- Security events

**Log Details:**
- Event code (e.g., permit_created)
- User performing action
- Timestamp (immutable)
- Object affected (permit ID)
- Changes (before/after)
- IP address & user agent
- HTTP method & endpoint
- Success/failure status

---

## 🚀 Deployment Instructions

### Development
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Access services:
# Backend: http://localhost:8000
# Frontend: http://localhost:3000
# MySQL: localhost:3306
```

### Production
```bash
# Build images
docker-compose -f docker-compose.prod.yml build

# Start services
docker-compose -f docker-compose.prod.yml up -d

# Check health
curl http://api.example.com/api/health/
```

---

## ⚙️ Configuration

### Backend (.env)
```
DEBUG=False
SECRET_KEY=your-secret-key
ALLOWED_HOSTS=localhost,127.0.0.1

# MySQL
USE_MYSQL=True
DB_ENGINE=django.db.backends.mysql
DB_NAME=transport_db
DB_USER=transport
DB_PASSWORD=your-password
DB_HOST=localhost
DB_PORT=3306

# CORS
CORS_ALLOWED_ORIGINS=http://localhost:3000,https://app.example.com

# API Keys
VALID_API_KEYS=sk-dev-12345,sk-dev-67890
```

### Frontend (.env)
```
REACT_APP_API_URL=http://localhost:8000/api
REACT_APP_API_KEY=sk-dev-12345
```

---

## 🧪 Testing Checklist

### Unit Tests
- [ ] Model validation
- [ ] Serializer validation
- [ ] Permission checks
- [ ] Business logic methods

### Integration Tests
- [ ] API endpoints
- [ ] Database transactions
- [ ] Authentication flow
- [ ] Event logging

### System Tests
- [ ] End-to-end workflows
- [ ] Error handling
- [ ] Rate limiting
- [ ] CORS validation

### Security Tests
- [ ] SQL injection prevention
- [ ] XSS protection
- [ ] CSRF validation
- [ ] Authentication bypass attempts
- [ ] Authorization checks
- [ ] Rate limit enforcement

---

## 📊 Performance Target Metrics

| Metric | Target |
|--------|--------|
| API Response Time (95%) | < 500ms |
| First Contentful Paint | < 2.0s |
| Database Query Time (avg) | < 100ms |
| System Throughput | > 100 req/sec |
| Uptime | 99.5% |
| Error Rate | < 0.1% |

---

## 🔍 Troubleshooting Guide

### API Returns 401 Unauthorized
**Check:**
- Token is in Authorization header
- Token format: `Authorization: Token <token>`
- Token not expired
- User account is active

### API Returns 403 Forbidden
**Check:**
- User has required feature/permission
- User role is assigned correctly
- Check EventLog for denied attempts

### Database Connection Failed
**Check:**
- MySQL is running
- DB credentials in .env are correct
- DB_HOST matches container/service name
- Port 3306 is accessible

### Frontend Can't Reach Backend
**Check:**
- Backend container is running
- CORS_ALLOWED_ORIGINS includes frontend URL
- REACT_APP_API_URL points to correct backend
- Network connectivity (DNS, firewall)

---

## 📚 Related Documentation

- **[SYSTEM_DESIGN_DOCUMENT.md](./SYSTEM_DESIGN_DOCUMENT.md)** - Complete design specification
- **[SYSTEM_DESIGN_VISUAL_DIAGRAMS.md](./SYSTEM_DESIGN_VISUAL_DIAGRAMS.md)** - Architecture diagrams
- **[DEVELOPMENT.md](./DEVELOPMENT.md)** - Development setup
- **[README.md](./README.md)** - Project overview

---

## 🎯 Key Design Principles

✓ **Separation of Concerns** - Clear layer boundaries  
✓ **DRY** - Don't repeat yourself  
✓ **SOLID** - Single responsibility, etc.  
✓ **Security First** - Multiple layers of protection  
✓ **Scalable** - Horizontal scaling support  
✓ **Maintainable** - Clear patterns and conventions  
✓ **Testable** - Easy to write unit & integration tests  
✓ **Documented** - Comprehensive documentation  

---

## 📞 Common Commands

```bash
# Backend Commands
python manage.py runserver
python manage.py migrate
python manage.py makemigrations
python manage.py createsuperuser
python manage.py shell
python manage.py collectstatic

# Database
mysql -u root -p transport_db
mysqldump -u root -p transport_db > backup.sql
mysql -u root -p transport_db < backup.sql

# Frontend
npm install
npm start
npm build
npm test

# Docker
docker-compose up -d
docker-compose down
docker-compose logs -f
docker-compose ps
```

---

## 📝 Code Examples

### Creating a Permit Programmatically
```python
from permits.models import Permit, PermitType, VehicleType

permit = Permit.objects.create(
    permit_number="PTA-2026-00001",
    authority="PTA",
    permit_type=PermitType.objects.first(),
    vehicle_type=VehicleType.objects.first(),
    vehicle_number="ABC-123",
    owner_name="John Doe",
    owner_email="john@example.com",
    owner_phone="+923001234567",
    valid_from="2026-02-17",
    valid_to="2027-02-17",
    status="active"
)
```

### Querying Permits
```python
# Active permits
active_permits = Permit.objects.filter(status='active')

# Expiring soon (next 30 days)
from datetime import timedelta
from django.utils import timezone
threshold = timezone.now().date() + timedelta(days=30)
expiring = Permit.objects.filter(
    valid_to__lte=threshold,
    status='active'
)

# By authority
pta_permits = Permit.objects.filter(authority='PTA')

# Search
results = Permit.objects.filter(
    Q(vehicle_number__contains='ABC') |
    Q(owner_name__contains='John')
)
```

### Making API Requests
```javascript
// Login
const response = await apiClient.post('/auth/login/', {
  username: 'user',
  password: 'pass'
});
localStorage.setItem('token', response.data.access);

// Create permit
const permit = await apiClient.post('/permits/', {
  authority: 'PTA',
  vehicle_number: 'ABC-123',
  owner_name: 'John',
  // ... other fields
});

// Update permit
await apiClient.patch(`/permits/${permit.id}/`, {
  status: 'active'
});

// Search
const results = await apiClient.get('/permits/', {
  params: {
    search: 'ABC-123',
    status: 'active',
    page: 1,
    page_size: 20
  }
});
```

---

## 🎓 Learning Resources

**Django & DRF:**
- Django Documentation: https://docs.djangoproject.com
- DRF Documentation: https://www.django-rest-framework.org
- Django Best Practices: https://docs.djangoproject.com/en/stable/misc/gotchas/

**React:**
- React Documentation: https://react.dev
- React Router: https://reactrouter.com
- Axios: https://github.com/axios/axios

**REST API Design:**
- RESTful API Best Practices
- HTTP Status Codes Reference
- API Documentation (Swagger/OpenAPI)

**Security:**
- OWASP Top 10: https://owasp.org/www-project-top-ten/
- NIST Guidelines: https://www.nist.gov
- CWE Top 25: https://cwe.mitre.org

---

**Last Updated:** February 2026  
**Maintained By:** Architecture Team  
**Questions?** Contact: dev@example.com
