# PTA & RTA System - Visual Design Diagrams

This document contains all architectural diagrams for the Permit Management System.

## 1. System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     USER PRESENTATION LAYER                     │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Browser    │  │   Mobile App │  │  API Client  │          │
│  │  (React SPA) │  │  (Future)    │  │  (External)  │          │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │
│         │                 │                  │                   │
│         └─────────────────┼──────────────────┘                   │
│                           │                                      │
│                    HTTP/REST (JSON)                             │
│                           │                                      │
└───────────────────────────┼──────────────────────────────────────┘
                            │
         ┌──────────────────┼──────────────────┐
         │                  │                  │
         ▼                  ▼                  ▼
    ┌─────────┐        ┌─────────┐       ┌─────────┐
    │  CORS   │        │ CSRF    │       │ Rate    │
    │ Handler │        │ Token   │       │ Limit   │
    └──┬──────┘        └──┬──────┘       └──┬──────┘
       │                  │                  │
       └──────────────────┼──────────────────┘
                          │
         ┌────────────────▼─────────────────┐
         │ Django REST Framework            │
         │ ┌────────────────────────────┐  │
         │ │ URL Routing & Middleware   │  │
         │ └────────────────────────────┘  │
         │ ┌────────────────────────────┐  │
         │ │ Authentication & AuthN     │  │
         │ │ • Token Authentication     │  │
         │ │ • API Key Validation       │  │
         │ └────────────────────────────┘  │
         │ ┌────────────────────────────┐  │
         │ │ Authorization & AuthZ      │  │
         │ │ • Permission Classes       │  │
         │ │ • Role-Based Access        │  │
         │ └────────────────────────────┘  │
         │ ┌────────────────────────────┐  │
         │ │ ViewSets & Serializers     │  │
         │ │ • Data Validation          │  │
         │ │ • Transformation           │  │
         │ └────────────────────────────┘  │
         │ ┌────────────────────────────┐  │
         │ │ Business Logic Layer       │  │
         │ │ • Event Logging            │  │
         │ │ • Permit Management        │  │
         │ │ • User Management          │  │
         │ └────────────────────────────┘  │
         └────────┬───────────────────────┘
                  │
         ┌────────┼────────┬──────────┐
         ▼        ▼        ▼          ▼
    ┌────────┐ ┌─────────┐ ┌──────┐ ┌─────────┐
    │ MySQL  │ │ Cache   │ │ File │ │ Logging │
    │Database│ │ (Redis) │ │Store │ │System   │
    └────────┘ └─────────┘ └──────┘ └─────────┘
```

---

## 2. Three-Tier Architecture Detail

```
PRESENTATION LAYER (React Frontend)
═══════════════════════════════════════════════════════════════
┌─────────────────────────────────────────────────────────────┐
│ User Interface Components                                   │
├─────────────────────────────────────────────────────────────┤
│ Pages:     Dashboard, PermitList, PermitDetails, UserMgmt  │
│ Components: Modal, Forms, Tables, Charts                   │
│ State:     AuthContext, Redux (future)                     │
│ Services:  API Client (Axios wrapper)                      │
│ Utils:     Permissions, Validators, Formatters            │
└─────────────────────────────────────────────────────────────┘
                        │
                   HTTP/REST
                        ▼

APPLICATION LAYER (Django REST Framework)
═══════════════════════════════════════════════════════════════
┌─────────────────────────────────────────────────────────────┐
│ Request Pipeline                                            │
├─────────────────────────────────────────────────────────────┤
│ 1. URL Router ─> Find ViewSet & Action                     │
│ 2. Authentication ─> Validate credentials                  │
│ 3. Authorization ─> Check permissions                      │
│ 4. Validation ─> Serializer validation                     │
│ 5. Business Logic ─> ViewSet method execution             │
│ 6. Transformation ─> Serialize response                    │
│ 7. Response ─> HTTP response with data                     │
│                                                             │
│ Key Components:                                             │
│ • PermitViewSet: CRUD + custom actions                     │
│ • UserViewSet: User management                             │
│ • RoleViewSet: Role/permission management                  │
│ • Serializers: Data validation & transformation            │
│ • Token Auth: Authentication mechanism                     │
│ • Permission Classes: Authorization rules                  │
│ • Event Logger: Audit trail recording                      │
│ • Middleware: Cross-cutting concerns                       │
└─────────────────────────────────────────────────────────────┘
                        │
                    ORM Queries
                        ▼

DATA LAYER (Database & Storage)
═══════════════════════════════════════════════════════════════
┌─────────────────────────────────────────────────────────────┐
│ Storage & Persistence                                       │
├─────────────────────────────────────────────────────────────┤
│ MySQL Database:                                             │
│ • Permits (core entity)                                     │
│ • PermitHistory (audit trail)                              │
│ • PermitDocuments (supporting docs)                        │
│ • Users, Roles, Features (access control)                  │
│ • Events, EventLogs (event logging)                        │
│ • PermitTypes, VehicleTypes (reference data)              │
│                                                             │
│ File Storage:                                               │
│ • /media/permit_documents/ (uploaded files)               │
│ • Organized by date (YYYY/MM/DD)                           │
│                                                             │
│ Cache (Redis - optional):                                   │
│ • Rate limiting counters                                    │
│ • Session data                                              │
│ • Query result caching                                      │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. User Authentication & Authorization Flow

```
AUTHENTICATION FLOW
═══════════════════════════════════════════════════════════════

   1. User Submits Credentials
           │
           ▼
   ┌───────────────┐
   │ Login Form    │
   │ Username      │
   │ Password      │
   └───────┬───────┘
           │
           │ POST /api/auth/login/
           ▼
   ┌───────────────────────────────────┐
   │ Backend Validation                │
   │ • Check username exists           │
   │ • Hash & compare password         │
   │ • Verify user is active           │
   └───────┬───────────────────────────┘
           │
      ┌────┴────┐
      │          │
      ▼          ▼
   Success    Failed → Error 401
      │
      ▼
   ┌──────────────────────┐
   │ Load User Metadata   │
   │ • User ID            │
   │ • Username           │
   │ • Email              │
   │ • First/Last name    │
   └──────┬───────────────┘
          │
          ▼
   ┌──────────────────────┐
   │ Load User Role       │
   │ (from UserRole table)│
   └──────┬───────────────┘
          │
          ▼
   ┌──────────────────────┐
   │ Load Role Features   │
   │ (from M2M table)     │
   └──────┬───────────────┘
          │
          ▼
   ┌──────────────────────┐
   │ Generate Token       │
   │ • Create random key  │
   │ • Store in DB        │
   │ • Set expiration     │
   └──────┬───────────────┘
          │
          ▼
   ┌──────────────────────┐
   │ Log Event            │
   │ Event: user_login    │
   │ User: [username]     │
   │ Status: success      │
   │ IP: [IP address]     │
   └──────┬───────────────┘
          │
          ▼
   ┌──────────────────────────────────────┐
   │ Return Response                      │
   │ {                                    │
   │   "token": "<token_string>",         │
   │   "user": { ... },                   │
   │   "role": { ... },                   │
   │   "features": [...]                  │
   │ }                                    │
   └──────┬───────────────────────────────┘
          │
          │ 200 OK
          ▼
   ┌──────────────────────────────────────┐
   │ Frontend: Store Token                │
   │ • localStorage.setItem('token')      │
   │ • Store user data in AuthContext     │
   └──────┬───────────────────────────────┘
          │
          ▼
   User Authenticated ✓


AUTHORIZATION FLOW (Per Request)
═══════════════════════════════════════════════════════════════

   API Request with Token
           │
           ▼
   ┌──────────────────────┐
   │ Extract Token        │
   │ From Authorization   │
   │ Header               │
   └──────┬───────────────┘
          │
          ▼
   ┌──────────────────────┐
   │ Validate Token       │
   │ • Is token in DB?    │
   │ • Is token valid?    │
   │ • Not expired?       │
   └──────┬───────────────┘
          │
      ┌───┴────┐
      │         │
      ▼         ▼
   Valid    Invalid → 401 Unauthorized
      │
      ▼
   ┌──────────────────────┐
   │ Get Associated User  │
   │ from Token           │
   └──────┬───────────────┘
          │
          ▼
   ┌──────────────────────────┐
   │ Check User is Active     │
   └──────┬───────────────────┘
          │
      ┌───┴────┐
      │         │
      ▼         ▼
   Active   Inactive → 403 Forbidden
      │
      ▼
   ┌──────────────────────────────┐
   │ Get User Role & Features     │
   │ (possibly from cache)        │
   └──────┬───────────────────────┘
          │
          ▼
   ┌──────────────────────────────┐
   │ Check Permission             │
   │ Does user have feature?      │
   │                              │
   │ e.g., permit_view            │
   └──────┬───────────────────────┘
          │
      ┌───┴──────┐
      │          │
      ▼          ▼
   Has Feature  No Feature → 403 Forbidden
      │
      ▼
   Authorization OK ✓
      │
      ▼
   Proceed with Request
```

---

## 4. Database Schema Diagram

```
DATA MODEL RELATIONSHIPS
═══════════════════════════════════════════════════════════════

CORE PERMIT MODEL
┌──────────────────────┐
│     Permit           │
├──────────────────────┤
│ id (PK)              │
│ permit_number (UQ)   │◄──────────────┐
│ authority            │               │
│ status               │               │
│ vehicle_number       │               │
│ permit_type_id (FK)  ├─┐            │
│ vehicle_type_id (FK) ├─┼─┐          │
│ owner_name           │ │ │          │
│ owner_email          │ │ │          │
│ assigned_to_id (FK)  ├─┼─┼──┐       │
│ valid_from           │ │ │  │       │
│ valid_to             │ │ │  │       │
│ prev_permits_ids[]   │ │ │  │       │
└──────────────────────┘ │ │  │       │
        │ 1:M            │ │  │       │
        ├─ PermitHistory ├──┘  │       │
        └─ PermitDoc     ├──┐  │       │
                         │  │  │       │
      ┌──────────────────┘  │  │       │
      │                     │  │       │
      ▼                     ▼  │       │
┌──────────────────┐   ┌────────────┐ │
│ PermitType       │   │VehicleType │ │
├──────────────────┤   ├────────────┤ │
│ id (PK)          │   │id (PK)     │ │
│ name (UQ)        │   │name (UQ)   │ │
│ code (UQ)        │   │permit_     │ │
│ description      │   │duration_   │ │
└──────────────────┘   │days        │ │
                       └────────────┘ │

ACCESS CONTROL MODELS         └────┐
                                   ▼
┌──────────────────┐        ┌──────────────┐
│   auth_user      │        │  assigned_to │
│  (Django Auth)   │        │   (via FK)   │
├──────────────────┤        └──────────────┘
│ id (PK)          │
│ username (UQ)    │
│ email            │
│ password_hash    │        Most users won't
│ is_active        │        have permits
│ first_name       │        assigned to them
│ last_name        │
└────────┬─────────┘
         │ 1:1
         │
    ┌────▼──────────────┐
    │    UserRole       │
    ├───────────────────┤
    │ user_id (FK/UQ)   │
    │ role_id (FK)      │
    │ assigned_at       │
    └────┬──────┬───────┘
         │      │
         │      └─────────────┐
         │                    │ M:1
         │                    ▼
         │              ┌──────────────┐
         │              │     Role     │
         │              ├──────────────┤
         │              │ id (PK)      │
         │              │ name (UQ)    │
         │              │ description  │
         │              │ is_active    │
         │              └────┬─────────┘
         │                   │ M:M
         │                   │
         │              ┌────▼──────────┐
         │              │ role_features │
         │              │ (junction)    │
         │              └────┬──────────┘
         │                   │
         │              ┌────▼──────────┐
         │              │   Feature     │
         │              ├───────────────┤
         │              │ id (PK)       │
         │              │ name (UQ)     │
         │              │ description   │
         │              └───────────────┘

EVENT LOGGING MODELS

┌──────────────┐
│    Event     │
├──────────────┤
│ id (PK)      │
│ code (UQ)    │ permit_created
│ name         │ permit_updated
│ category     │ user_login
│ is_active    │ etc...
└────┬─────────┘
     │ 1:M
     │
     ▼
┌──────────────────────┐
│    EventLog          │
├──────────────────────┤
│ id (PK)              │
│ event_id (FK)        │
│ user_id (FK, null)   │
│ timestamp            │
│ content_type         │
│ object_id            │
│ object_description   │
│ changes (JSON)       │
│ status               │
│ error_message        │
│ ip_address           │
│ user_agent           │
│ request_method       │
│ endpoint             │
└──────────────────────┘

DOCUMENT STORAGE

┌────────────────────────┐
│  PermitDocument        │
├────────────────────────┤
│ id (PK)                │
│ permit_id (FK)         │
│ document_type          │
│ file (path)            │
│ filename               │
│ file_size              │
│ uploaded_at            │
│ uploaded_by            │
│ is_verified            │
│ verified_by            │
│ verified_at            │
└────────────────────────┘
         │
         │ Media storage
         ▼
    /media/permit_documents/
    ├── 2026/01/25/file1.pdf
    ├── 2026/01/26/file2.pdf
    └── 2026/02/15/file3.pdf
```

---

## 5. API Request-Response Flow

```
CREATE PERMIT REQUEST-RESPONSE
═══════════════════════════════════════════════════════════════

REQUEST:
┌──────────────────────────────────────────────────────────┐
│ POST /api/permits/                                        │
│ Authorization: Token abc123def456ghi789                   │
│ Content-Type: application/json                            │
│                                                           │
│ {                                                         │
│   "authority": "PTA",                                    │
│   "permit_type": 1,                                      │
│   "vehicle_number": "ABC-123",                           │
│   "vehicle_type": 1,                                     │
│   "owner_name": "John Doe",                              │
│   "owner_email": "john@example.com",                     │
│   "owner_phone": "+923001234567",                        │
│   "valid_from": "2026-02-17",                            │
│   "valid_to": "2027-02-17"                               │
│ }                                                         │
└──────────────────────────────────────────────────────────┘
         │
         ▼ Processing Steps
┌─────────────────────────────────┐
│ 1. Extract token from header    │
│ 2. Validate token               │
│ 3. Get user from token          │
│ 4. Load user role & features    │
│ 5. Check 'permit_create' feature│
│ 6. Validate JSON body           │
│ 7. Create PermitSerializer      │
│ 8. Check data validity          │
│ 9. Check uniqueness (perm_num)  │
│ 10. Generate permit_number      │
│ 11. INSERT into database        │
│ 12. Auto-assign to junior clerk │
│ 13. Create PermitHistory entry  │
│ 14. Log event 'permit_created'  │
│ 15. Serialize response data     │
└─────────────────────────────────┘
         │
         ▼ Response

RESPONSE (201 CREATED):
┌──────────────────────────────────────────────────────────┐
│ HTTP/1.1 201 Created                                      │
│ Content-Type: application/json                            │
│                                                           │
│ {                                                         │
│   "id": 1,                                                │
│   "permit_number": "PTA-2026-00001",                      │
│   "authority": "PTA",                                     │
│   "status": "pending",                                    │
│   "vehicle_number": "ABC-123",                            │
│   "vehicle_type": {                                       │
│     "id": 1,                                              │
│     "name": "Truck",                                      │
│     "permit_duration_days": 365                           │
│   },                                                      │
│   "permit_type": {                                        │
│     "id": 1,                                              │
│     "name": "Transport",                                  │
│     "code": "TRN"                                         │
│   },                                                      │
│   "owner_name": "John Doe",                               │
│   "owner_email": "john@example.com",                      │
│   "assigned_to_username": "clerk_001",                    │
│   "assigned_at": "2026-02-17T10:30:00Z",                  │
│   "valid_from": "2026-02-17",                             │
│   "valid_to": "2027-02-17",                               │
│   "issued_date": "2026-02-17T10:30:00Z",                  │
│   "created_by": "admin_user",                             │
│   "is_valid": true,                                       │
│   "days_remaining": 365,                                  │
│   "permit_documents": [],                                 │
│   "history": []                                           │
│ }                                                         │
└──────────────────────────────────────────────────────────┘


ERROR RESPONSE (400 BAD REQUEST):
┌──────────────────────────────────────────────────────────┐
│ HTTP/1.1 400 Bad Request                                  │
│ Content-Type: application/json                            │
│                                                           │
│ {                                                         │
│   "error": "Validation failed",                           │
│   "code": "VALIDATION_ERROR",                             │
│   "status": 400,                                          │
│   "details": {                                            │
│     "owner_email": [                                      │
│       "Enter a valid email address."                      │
│     ],                                                    │
│     "valid_to": [                                         │
│       "valid_to must be after valid_from"                │
│     ]                                                    │
│   },                                                      │
│   "timestamp": "2026-02-17T10:30:00Z"                     │
│ }                                                         │
└──────────────────────────────────────────────────────────┘
```

---

## 6. Deployment Architecture

```
CONTAINERIZED DEPLOYMENT ARCHITECTURE
═══════════════════════════════════════════════════════════════

Development Environment (Docker Compose)
┌─────────────────────────────────────────────────────────┐
│                   docker-compose.yml                    │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────────────┐   ┌─────────────────┐            │
│  │   MySQL 5.7     │   │   Django App    │            │
│  │  (port 3306)    │───│  (port 8000)    │            │
│  │  transport_db   │   │  runserver      │            │
│  └─────────────────┘   └────────┬────────┘            │
│                                 │                      │
│                        ┌────────┴────────┐            │
│                        │                 │            │
│                        ▼                 ▼            │
│                   ┌──────────┐   ┌──────────────┐     │
│                   │ React    │   │ Media Files  │     │
│                   │ (port    │   │ Permits Docs │     │
│                   │  3000)   │   └──────────────┘     │
│                   │ npm start│                         │
│                   └──────────┘                         │
│                                                         │
│  Network: pta_rta_network (bridge)                    │
│                                                         │
└─────────────────────────────────────────────────────────┘

Production Architecture (Kubernetes/AWS)
┌─────────────────────────────────────────────────────────┐
│                    Internet                              │
│                       │                                  │
│                       ▼                                  │
│            ┌──────────────────────┐                     │
│            │   Load Balancer      │                     │
│            │  (Nginx / AWS ALB)   │                     │
│            └──────────┬───────────┘                     │
│                       │                                  │
│         ┌─────────────┼─────────────┐                   │
│         │             │             │                   │
│         ▼             ▼             ▼                   │
│    ┌─────────┐  ┌─────────┐  ┌─────────┐              │
│    │ Django  │  │ Django  │  │ Django  │  (replicas)  │
│    │ Pod 1   │  │ Pod 2   │  │ Pod 3   │              │
│    └─────────┘  └─────────┘  └─────────┘              │
│         │             │             │                   │
│         └─────────────┼─────────────┘                   │
│                       │                                  │
│            ┌──────────▼──────────┐                      │
│            │   RDS MySQL         │                      │
│            │  (Primary + Replicas)                      │
│            └─────────────────────┘                      │
│                       │                                  │
│         ┌─────────────┴──────────┐                      │
│         │                        │                      │
│         ▼                        ▼                      │
│    ┌──────────┐          ┌──────────────┐             │
│    │ S3       │          │ CloudFront   │             │
│    │ (Media)  │          │ CDN          │             │
│    └──────────┘          └──────────────┘             │
│                                                         │
└─────────────────────────────────────────────────────────┘

Frontend Deployment (React)
┌─────────────────────────────────────────────────────────┐
│              npm build output                            │
│                                                         │
│  build/                                                 │
│  ├── index.html      (entry point)                     │
│  └── static/                                            │
│      ├── css/
│      │   └── main.css (bundled CSS)                    │
│      ├── js/
│      │   └── main.js (bundled React)                   │
│      └── images/                                        │
│          └── (optimized images)                         │
│                                                         │
│  Deployment:                                            │
│  → CloudFront CDN or Firebase Hosting                  │
│  → Served from nearest edge location                   │
│  → Cache headers for optimal performance              │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 7. Security Layers

```
SECURITY ARCHITECTURE
═══════════════════════════════════════════════════════════════

LAYER 1: NETWORK SECURITY
┌─────────────────────────┐
│ TLS 1.3 / HTTPS         │
│ Certificate Pinning     │
│ Strong Cipher Suites    │
│ Perfect Forward Secret  │
└─────────────────────────┘
         │
         ▼

LAYER 2: API GATEWAY
┌─────────────────────────────────────┐
│ Rate Limiting                       │
│ • 100 req/min per IP                │
│ • Different limits by endpoint      │
│ • Throttle on abuse                 │
└─────────────────────────────────────┘
         │
         ▼

LAYER 3: CORS VALIDATION
┌─────────────────────────────────────┐
│ Check Origin                        │
│ Whitelist allowed origins           │
│ Restrict methods (GET, POST, etc)   │
│ Validate headers                    │
└─────────────────────────────────────┘
         │
         ▼

LAYER 4: CSRF PROTECTION
┌─────────────────────────────────────┐
│ CSRF Token Validation               │
│ Token in session                    │
│ Token in request body               │
│ Mismatch → 403 Forbidden            │
└─────────────────────────────────────┘
         │
         ▼

LAYER 5: AUTHENTICATION
┌─────────────────────────────────────┐
│ Token Validation                    │
│ • Extract from header               │
│ • Lookup in database                │
│ • Check expiration                  │
│ • Get user object                   │
└─────────────────────────────────────┘
         │
         ▼

LAYER 6: AUTHORIZATION
┌─────────────────────────────────────┐
│ Permission Checking                 │
│ • Load user role                    │
│ • Load role features                │
│ • Check required feature            │
│ • Check object ownership (optional) │
└─────────────────────────────────────┘
         │
         ▼

LAYER 7: INPUT VALIDATION
┌─────────────────────────────────────┐
│ Serializer Validation               │
│ • Type checking                     │
│ • Length validation                 │
│ • Format validation                 │
│ • Business logic validation         │
└─────────────────────────────────────┘
         │
         ▼

LAYER 8: DATA PROTECTION
┌─────────────────────────────────────┐
│ At Rest:                            │
│ • Passwords hashed (PBKDF2)         │
│ • Sensitive fields encrypted        │
│ • No credentials in logs            │
│                                     │
│ During Processing:                  │
│ • Memory protection                 │
│ • No sensitive data in debug info   │
│ • Secure random generation          │
│                                     │
│ During Transmission:                │
│ • TLS encryption                    │
│ • No sensitive data in URLs         │
│ • HTTPS only                        │
└─────────────────────────────────────┘
         │
         ▼

LAYER 9: AUDIT & LOGGING
┌─────────────────────────────────────┐
│ Event Logging                       │
│ • All operations logged             │
│ • Immutable audit trail             │
│ • User tracking                     │
│ • Failed attempts recorded          │
│ • Security events captured          │
└─────────────────────────────────────┘

THREAT MODEL COVERAGE:
✓ SQL Injection → ORM prevents
✓ XSS Attack → Output encoding + CSP
✓ CSRF → CSRF token validation
✓ Authentication Bypass → Token validation
✓ Authorization Bypass → Permission checks
✓ Rate Limiting Bypass → API gateway limits
✓ DDoS → Load balancer + rate limiting
✓ Credential Theft → HTTPS + secure storage
✓ Data Breach → Encryption + access control
```

---

## 8. Event Logging Flow

```
EVENT LOGGING & AUDIT TRAIL
═══════════════════════════════════════════════════════════════

System Action
    │
    ├─ Permit Created
    ├─ Permit Status Changed
    ├─ User Login
    ├─ User Logout
    ├─ Permission Changed
    ├─ Document Uploaded
    └─ System Error
    │
    ▼

EventLogger.log_event(
    event_code='permit_created',
    user=request.user,
    content_type='permit',
    object_id=permit.id,
    object_description=f'Permit {permit.permit_number}',
    changes={
        'status': {'old': None, 'new': 'pending'},
        'authority': {'old': None, 'new': 'PTA'}
    },
    status='success'
)
    │
    ▼

┌────────────────────────────────────────┐
│ EventLogger.log_event()                │
├────────────────────────────────────────┤
│ 1. Get Event from database by code     │
│ 2. Check if event is active            │
│ 3. Create EventLog record:             │
│    • Event: permit_created             │
│    • User: admin_user                  │
│    • Timestamp: 2026-02-17 10:30:00    │
│    • Object: Permit ID 1               │
│    • Changes: {...}                    │
│    • Status: success                   │
│    • IP: 192.168.1.100                 │
│    • Endpoint: /api/permits/           │
│ 4. Return EventLog object              │
└────────────────────────────────────────┘
    │
    ▼

┌────────────────────────────────────────┐
│ Event Logged Successfully              │
│                                        │
│ EventLog Record:                       │
│ ├── id: 1001                           │
│ ├── event: permit_created              │
│ ├── user: admin_user                   │
│ ├── timestamp: 2026-02-17T10:30:00Z    │
│ ├── object_description: Permit PTA-1   │
│ ├── changes: {...}                     │
│ ├── status: success                    │
│ ├── ip_address: 192.168.1.100          │
│ └── endpoint: /api/permits/            │
│                                        │
│ Stored in: permits_eventlog table      │
└────────────────────────────────────────┘
    │
    ▼

Query Examples:
├─ Get all logins by user in last 7 days
│  SELECT * FROM eventlog
│  WHERE event='user_login'
│  AND user_id=5
│  AND timestamp >= NOW() - INTERVAL 7 DAY
│
├─ Get all changes to permit #1
│  SELECT * FROM eventlog
│  WHERE object_id=1
│  AND content_type='permit'
│  ORDER BY timestamp DESC
│
├─ Get failed operations
│  SELECT * FROM eventlog
│  WHERE status='failed'
│  AND timestamp >= NOW() - INTERVAL 1 DAY
│
└─ Get suspicious activities
   SELECT * FROM eventlog
   WHERE status='failed'
   AND request_method='POST'
   AND event LIKE '%delete%'
```

---

## 9. Permit Lifecycle State Machine

```
PERMIT STATUS TRANSITIONS
═══════════════════════════════════════════════════════════════

              ┌──────────────┐
              │ PENDING      │ (Initial state)
              │              │
              │ Awaiting     │
              │ Review       │
              └────┬─────────┘
                   │
        ┌──────────┼──────────┐
        │          │          │
        █          ▼          ▼
    Reject    APPROVE    ADDITIONAL
               │          INFO
               │          NEEDED
               ├──────────│
               │          │
        ┌──────▼──────┐   │
        │ ACTIVE      │◄──┘
        │             │
        │ Valid &     │
        │ Operational │
        └──────┬──────┘
               │
         ┌─────┴──────┬────────┬──────────┐
         │            │        │          │
         ▼            ▼        ▼          ▼
    ┌────────┐   ┌────────┐  └──────┐    └──────┐
    │SUSPEND │   │RENEW   │         │           │
    │(hold)  │   │(extend)│         ▼           ▼
    │        │   │        │    ┌────────┐  ┌────────┐
    └─┬──────┘   └──┬─────┘    │REVOKED │  │EXPIRED │
      │             │          │(refused)  │(auto)  │
      │        ┌────▼───┐      └────────┘  └────────┘
      │        │ ACTIVE │
      │        │(renewed)│
      │        └────────┘
      │             │
      └─────┬───────┘
            │
            ▼
        ┌────────┐
        │INACTIVE│
        │(ended) │
        └────────┘


Manual Transitions (User Actions):
├─ pending → active      (Approve)
├─ pending → cancelled   (Reject)
├─ active → suspended    (Suspend)
├─ suspended → active    (Reactivate)
├─ active → renewed      (Renew)
├─ active → revoked      (Revoke)
└─ * → inactive          (Deactivate)

Automatic Transitions (System):
├─ active → expired      (Date check: valid_to < today)
├─ suspended → expired   (After limit)
└─ pending → auto-archived (After 90 days)
```

---

## 10. Component Integration Sequence

```
END-TO-END FEATURE REQUEST SEQUENCE
═══════════════════════════════════════════════════════════════

1. USER INITIATES ACTION

   User
    │
    ├─ Clicks "Create Permit"
    │
    ▼
   React Component (PermitForm)
    │
    ├─ onSubmit handler
    │
    ├─ Client-side validation
    │
    ├─ Format data
    │
    ├─ Call apiClient.post()
    │
    ▼

2. FRONTEND MAKES REQUEST

   Frontend (apiClient.js)
    │
    ├─ Add Authorization header (token)
    │
    ├─ Add API key header
    │
    ├─ Set Content-Type: application/json
    │
    ├─ POST to /api/permits/
    │
    ▼

3. BACKEND RECEIVES REQUEST

   Middleware Chain:
    │
    ├─ CORS Check
    │  └─ Validate origin
    │
    ├─ CSRF Check
    │  └─ Validate CSRF token
    │
    ├─ Rate Limit Check
    │  └─ Check request count
    │
    ├─ API Key Check
    │  └─ Validate X-API-Key header
    │
    ├─ Request Logging
    │  └─ Log incoming request
    │
    ▼

4. URL ROUTING

   URL Router
    │
    ├─ Match POST /api/permits/
    │
    ├─ Route to PermitViewSet.create()
    │
    ▼

5. AUTHENTICATION

   Authentication Chain:
    │
    ├─ TokenAuthentication.authenticate()
    │  ├─ Extract token from Authorization header
    │  ├─ Look up token in Token table
    │  ├─ Get associated user
    │  └─ Return (user, token)
    │
    ├─ Check user is not None
    │
    ├─ Check user.is_active == True
    │
    ▼

6. AUTHORIZATION

   Permission Classes:
    │
    ├─ IsAuthenticated.has_permission()
    │  └─ Check user is not anonymous
    │
    ├─ CanCreatePermit.has_permission()
    │  ├─ Get user role
    │  ├─ Get role features
    │  ├─ Check 'permit_create' in features
    │  └─ Return True/False
    │
    ├─ If permission denied → 403 Forbidden
    │
    ▼

7. VIEWSET HANDLING

   PermitViewSet.create()
    │
    ├─ Get serializer class
    │  └─ PermitSerializer
    │
    ├─ Initialize serializer with request data
    │
    ├─ Call serializer.is_valid()
    │  ├─ Type checking
    │  ├─ Required fields
    │  ├─ Custom validators
    │  └─ Return valid/invalid
    │
    ├─ If not valid → 400 Bad Request
    │
    ├─ Call serializer.save()
    │
    ▼

8. SERIALIZER HANDLING

   PermitSerializer.create()
    │
    ├─ Get validated data
    │
    ├─ Set created_by = request.user.username
    │
    ├─ Set assigned_to = available junior clerk
    │  ├─ Get all junior clerks
    │  ├─ Count assigned permits
    │  └─ Assign to least loaded
    │
    ├─ Call Permit.objects.create()
    │
    ▼

9. MODEL SAVE

   Permit.save()
    │
    ├─ Pre-save signal handlers
    │  ├─ Generate permit_number if needed
    │  └─ Validate states
    │
    ├─ INSERT into database
    │  └─ MySQL: INSERT INTO permits_permit (...)
    │
    ├─ Get auto-generated ID
    │
    ├─ Post-save signal handlers
    │  ├─ Log the creation
    │  └─ Trigger notifications
    │
    ▼

10. EVENT LOGGING

    EventLogger.log_event()
     │
     ├─ event_code = 'permit_created'
     ├─ user = request.user
     ├─ object_id = permit.id
     ├─ status = 'success'
     │
     ├─ Get Event object
     │  └─ Event.objects.get(code='permit_created')
     │
     ├─ Create EventLog
     │  └─ EventLog.objects.create(...)
     │
     ├─ INSERT into permits_eventlog
     │
     ▼

11. RESPONSE OUTPUT

    Serializer.to_representation()
     │
     ├─ Convert Permit object to dictionary
     │
     ├─ Include related objects
     │  ├─ PermitType details
     │  ├─ VehicleType details
     │  └─ Assigned user info
     │
     ├─ Add calculated fields
     │  ├─ is_valid
     │  ├─ days_remaining
     │  └─ assigned_to_role
     │
     ▼

12. HTTP RESPONSE

    Return Response(data, status=201)
     │
     ├─ Convert to JSON
     │
     ├─ Add headers
     │  ├─ Content-Type: application/json
     │  ├─ Cache-Control: no-cache
     │  └─ Security headers
     │
     ├─ HTTP 201 Created
     │
     ▼

13. FRONTEND RECEIVES RESPONSE

    Frontend Response Handler
     │
     ├─ Check status 201
     │
     ├─ Parse JSON response
     │
     ├─ Update state/context
     │  ├─ Add permit to list
     │  └─ Update AuthContext if needed
     │
     ├─ Show success message
     │
     ├─ Navigate to permit details
     │
     ▼

14. USER SEES RESULT

    User Interface
     │
     ├─ Permit appears in list
     │
     ├─ Success notification shown
     │
     ├─ Form cleared
     │
     ├─ Redirect to permit details
     │
     ▼

    ✓ Feature Complete
```

---

## Key Metrics

```
PERFORMANCE TARGETS
═══════════════════════════════════════════════════════════════

API Response Times (95th percentile):
├─ GET /permits/ (list)            < 300ms
├─ GET /permits/{id}/ (retrieve)   < 150ms
├─ POST /permits/                  < 500ms (create)
├─ PATCH /permits/{id}/            < 400ms (update)
├─ DELETE /permits/{id}/           < 300ms
├─ POST /auth/login/               < 200ms
└─ General API operations          < 500ms

Frontend Performance:
├─ First Contentful Paint          < 2.0s
├─ Largest Contentful Paint        < 2.5s
├─ Cumulative Layout Shift         < 0.1
├─ Time to Interactive             < 4.0s
└─ Total Page Load                 < 5.0s

Database Metrics:
├─ Average Query Time              < 100ms
├─ Slow Query Threshold            > 1.0s
├─ Connection Pool Size            20-50
└─ Max Connections                 > 100

System Capacity:
├─ Minimum Throughput              100 req/sec
├─ Peak Throughput                 500 req/sec
├─ Concurrent Users                100+
├─ Max Response Time (99th %ile)   < 1.0s
└─ Error Rate                      < 0.1%

Availability:
├─ Target Uptime                   99.5%
├─ Allowed Downtime/Month          43.2 minutes
├─ Mean Time Between Failures      > 30 days
├─ Mean Time To Recovery           < 15 minutes
└─ Recovery Point Objective        < 1 hour
```

---

**Generated:** System Design Documentation with Mermaid Diagrams
**Version:** 1.0
**Date:** February 2026
