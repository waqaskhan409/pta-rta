# User Management System Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React)                        │
│  ┌──────────────────────┐  ┌──────────────────────────────────┐ │
│  │  UserManagement.js   │  │  RoleManagement.js               │ │
│  │  - Create Users      │  │  - Manage Roles                  │ │
│  │  - Assign Roles      │  │  - Add/Remove Features           │ │
│  │  - Activate/Deact    │  │  - View Feature Assignments      │ │
│  │  - Search Users      │  │  - Role Statistics               │ │
│  └──────────────────────┘  └──────────────────────────────────┘ │
│            │                          │                           │
│            └──────────┬───────────────┘                           │
│                       │                                           │
│                  apiClient                                        │
│                  (axios)                                          │
│                       │                                           │
└───────────────────────┼───────────────────────────────────────────┘
                        │
                   HTTP/REST
                        │
┌───────────────────────┼───────────────────────────────────────────┐
│                       ▼                                            │
│                  BACKEND (Django)                                 │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                    URL Router                               │ │
│  │  /api/users/        -> UserViewSet                          │ │
│  │  /api/roles/        -> RoleViewSet                          │ │
│  │  /api/features/     -> FeatureViewSet                       │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                           │                                       │
│         ┌─────────────────┼─────────────────┐                    │
│         ▼                 ▼                 ▼                     │
│  ┌────────────┐  ┌────────────┐  ┌──────────────┐               │
│  │ UserViewSet│  │RoleViewSet │  │FeatureViewSet│               │
│  ├────────────┤  ├────────────┤  ├──────────────┤               │
│  │ list()     │  │ list()     │  │ list()       │               │
│  │ create()   │  │ add_feat() │  │ retrieve()   │               │
│  │ retrieve() │  │ remove_f() │  │              │               │
│  │ assign_role│  │            │  │              │               │
│  │ remove_role│  │            │  │              │               │
│  │ activate() │  │            │  │              │               │
│  │ deactivate │  │            │  │              │               │
│  └────────────┘  └────────────┘  └──────────────┘               │
│         │                 │                │                    │
│         └─────────────────┼────────────────┘                    │
│                           │                                     │
│  ┌─────────────────────────────────────────────────────────────┐
│  │              Permission Classes                             │
│  │  - IsAuthenticated: User must be logged in                  │
│  │  - IsAdmin: User must have admin role                       │
│  │  - HasFeature: Check specific feature access               │
│  │  - HasAnyFeature: Check multiple feature access            │
│  └─────────────────────────────────────────────────────────────┘
│                           │                                     │
└───────────────────────────┼─────────────────────────────────────┘
                            │
                      Serializers
                            │
┌───────────────────────────┼─────────────────────────────────────┐
│                           ▼                                      │
│                    DATABASE (SQLite)                             │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                     User (Django)                           │ │
│  │  id | username | email | password_hash | is_active | ...  │ │
│  └──────────────────────────────┬──────────────────────────────┘ │
│                                 │                                │
│  ┌──────────────────────────────▼──────────────────────────────┐ │
│  │                     UserRole (NEW)                          │ │
│  │  id | user_id | role_id | assigned_at | assigned_by | ... │ │
│  └──────────────────────────────┬──────────────────────────────┘ │
│                                 │                                │
│  ┌──────────────────────────────▼──────────────────────────────┐ │
│  │                       Role (NEW)                            │ │
│  │  id | name | description | is_active | created_at | ...   │ │
│  └──────────────────────────────┬──────────────────────────────┘ │
│                                 │                                │
│  ┌──────────────────────────────▼──────────────────────────────┐ │
│  │                     Feature (NEW)                           │ │
│  │  id | name | description | created_at                      │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  Many-to-Many: Role ←──────→ Feature                            │
│  One-to-One:   User ←──────→ UserRole                           │
│  Foreign Key:  UserRole ─────→ Role                             │
└──────────────────────────────────────────────────────────────────┘
```

## Data Flow Diagram

### Create User Flow
```
Frontend                        Backend                    Database
   │                              │                           │
   ├─ POST /users/create-user ──→ UserViewSet.create_user()  │
   │                              │                           │
   │                              ├─ Validate Input           │
   │                              │                           │
   │                              ├─ Create User ───────────→ CREATE User
   │                              │                           │
   │                              ├─ Get Role ──────────────→ READ Role
   │                              │                           │
   │                              ├─ Create UserRole ───────→ CREATE UserRole
   │                              │                           │
   │ ← Response (user + role) ──── │                           │
   │                              │                           │
```

### Login Flow
```
Frontend                        Backend                    Database
   │                              │                           │
   ├─ POST /auth/login ────────→  AuthViewSet.login()        │
   │                              │                           │
   │                              ├─ Authenticate User        │
   │                              │                           │
   │                              ├─ Create Token ───────────→ CREATE Token
   │                              │                           │
   │                              ├─ Fetch UserRole ────────→ READ UserRole
   │                              │                           │
   │                              ├─ Fetch Role ────────────→ READ Role
   │                              │                           │
   │                              ├─ Fetch Features ────────→ READ Features
   │                              │                           │
   │ ← Response (user with role, ─│                           │
   │    features, token)          │                           │
   │                              │                           │
   └─ Store token + user data     │                           │
```

### Feature Access Check Flow
```
Frontend                        Backend                    Database
   │                              │                           │
   ├─ GET /permits/ ───────────→  PermitViewSet.list()       │
   │  (with token)                │                           │
   │                              ├─ Authenticate ────────────→ READ Token
   │                              │                           │
   │                              ├─ Check Permission:        │
   │                              │  - IsAuthenticated ✓      │
   │                              │  - HasFeature('permit_view')
   │                              │                           │
   │                              ├─ Get User Role ──────────→ READ UserRole
   │                              │                           │
   │                              ├─ Get Role Features ──────→ READ Role
   │                              │    & Features             │
   │                              │                           │
   │                              ├─ Check if has feature ✓   │
   │                              │                           │
   │                              ├─ Fetch Permits ──────────→ READ Permits
   │                              │                           │
   │ ← Permits data ─────────────  │                           │
   │                              │                           │
```

## Role-Based Access Control (RBAC) Model

```
        ┌──────────────────────────────────────┐
        │          User (Django)               │
        │  - username                          │
        │  - email                             │
        │  - password                          │
        │  - is_active                         │
        └──────────┬───────────────────────────┘
                   │
                   │ OneToOne
                   │
        ┌──────────▼───────────────────────────┐
        │        UserRole (NEW)                │
        │  - user_id (FK)                      │
        │  - role_id (FK)                      │
        │  - assigned_at                       │
        │  - assigned_by                       │
        │  - is_active                         │
        │  - notes                             │
        └──────────┬───────────────────────────┘
                   │
                   │ ForeignKey
                   │
        ┌──────────▼───────────────────────────┐
        │          Role (NEW)                  │
        │  - name (admin, operator, ...)       │
        │  - description                       │
        │  - is_active                         │
        │  - created_at                        │
        └──────────┬───────────────────────────┘
                   │
                   │ ManyToMany
                   │
        ┌──────────▼───────────────────────────┐
        │        Feature (NEW)                 │
        │  - name (permit_create, etc)         │
        │  - description                       │
        │  - created_at                        │
        └──────────────────────────────────────┘
```

## Permission Checking Pipeline

```
Request arrives
    │
    ▼
Is Authentication Header Valid?
    │
    ├─ NO  → 401 Unauthorized
    │
    └─ YES ▼
        Is User Active?
            │
            ├─ NO  → 403 Forbidden
            │
            └─ YES ▼
                Does User have User Role?
                    │
                    ├─ NO  → 403 Forbidden
                    │
                    └─ YES ▼
                        Is User Role Active?
                            │
                            ├─ NO  → 403 Forbidden
                            │
                            └─ YES ▼
                                Does Role have Required Feature?
                                    │
                                    ├─ NO  → 403 Forbidden
                                    │
                                    └─ YES ▼
                                        ✓ Allow Access
```

## Default Roles & Features Matrix

```
┌────────────┬──────────────┬───────────┬────────────┬─────────────┐
│ Feature    │ Admin (13)   │ Operator  │Supervisor  │ End User    │
│            │              │ (8)       │ (6)        │ (4)         │
├────────────┼──────────────┼───────────┼────────────┼─────────────┤
│permit_view │      ✓       │     ✓     │     ✓      │      -      │
│permit_creat│      ✓       │     ✓     │     -      │      -      │
│permit_edit │      ✓       │     ✓     │     ✓      │      -      │
│permit_delet│      ✓       │     -     │     -      │      -      │
│permit_check│      ✓       │     ✓     │     ✓      │      ✓      │
│permit_subm │      ✓       │     ✓     │     -      │      ✓      │
│permit_share│      ✓       │     ✓     │     -      │      ✓      │
│permit_renew│      ✓       │     ✓     │     -      │      -      │
│permit_canc │      ✓       │     -     │     ✓      │      -      │
│user_manage │      ✓       │     -     │     -      │      -      │
│role_manage │      ✓       │     -     │     -      │      -      │
│report_view │      ✓       │     -     │     ✓      │      -      │
│dashbrd_vew│      ✓       │     ✓     │     ✓      │      ✓      │
└────────────┴──────────────┴───────────┴────────────┴─────────────┘
```

## API Endpoint Structure

```
/api/
├── auth/
│   ├── register/          (POST) - Public registration
│   ├── login/             (POST) - Public login
│   ├── logout/            (POST) - Logout (requires auth)
│   └── user/              (GET)  - Get current user (requires auth)
│
├── users/                 (ADMIN ONLY)
│   ├── (GET)              - List all users
│   ├── (POST) create-user/ - Create new user with role
│   ├── {id}/ (GET)        - Get user details
│   ├── {id}/assign-role/  (POST) - Assign role to user
│   ├── {id}/remove-role/  (POST) - Remove role from user
│   ├── {id}/activate/     (POST) - Activate user
│   ├── {id}/deactivate/   (POST) - Deactivate user
│   └── inactive-users/    (GET)  - List inactive users
│
├── roles/                 (ADMIN ONLY)
│   ├── (GET)              - List all roles
│   ├── {id}/ (GET)        - Get role details
│   ├── {id}/add-feature/  (POST) - Add feature to role
│   └── {id}/remove-feature/(POST) - Remove feature from role
│
├── features/              (ADMIN ONLY)
│   ├── (GET)              - List all features
│   └── {id}/ (GET)        - Get feature details
│
└── permits/
    ├── (GET)              - List permits (requires permit_view)
    ├── (POST)             - Create permit (requires permit_create)
    ├── {id}/ (GET)        - Get permit (requires permit_view)
    ├── {id}/ (PUT/PATCH)  - Update permit (requires permit_edit)
    ├── {id}/ (DELETE)     - Delete permit (requires permit_delete)
    ├── stats/             - Permit statistics
    └── ... other actions
```

## Frontend Component Hierarchy

```
App (with Router)
├── Header
│   ├── Logo/Title
│   └── User Info (with role badge)
│
├── Navigation Bar
│   ├── Dashboard
│   ├── Permits
│   ├── New Permit
│   └── [ADMIN ONLY]
│       ├── Users       → UserManagement.js
│       └── Roles       → RoleManagement.js
│
├── Main Content (Routes)
│   ├── /         → Dashboard
│   ├── /permits  → PermitList
│   ├── /new-permit → NewPermit
│   ├── /users    → UserManagement (admin only)
│   ├── /roles    → RoleManagement (admin only)
│   ├── /login    → Login
│   └── /register → Register
│
└── AuthContext
    ├── user (with role & features)
    ├── token
    ├── isAuthenticated
    └── login/logout/register methods
```

## Security Layers

```
┌─────────────────────────────────────────────────────────────┐
│ Layer 1: HTTPS/SSL                                          │
│ All communication encrypted                                 │
└─────────────────────────────────────────────────────────────┘
         ▼
┌─────────────────────────────────────────────────────────────┐
│ Layer 2: Authentication                                     │
│ Token-based authentication for each request                 │
└─────────────────────────────────────────────────────────────┘
         ▼
┌─────────────────────────────────────────────────────────────┐
│ Layer 3: Authorization (RBAC)                               │
│ Check if user has role & role is active                     │
└─────────────────────────────────────────────────────────────┘
         ▼
┌─────────────────────────────────────────────────────────────┐
│ Layer 4: Permission (Feature-level)                         │
│ Check if user's role has required feature                   │
└─────────────────────────────────────────────────────────────┘
         ▼
┌─────────────────────────────────────────────────────────────┐
│ Layer 5: Resource Access                                    │
│ Return only data user is allowed to see                     │
└─────────────────────────────────────────────────────────────┘
```

## Typical User Journey

```
1. Registration
   User → Register page → Backend creates User → Show login

2. Login
   User → Login page → Backend creates Token, loads Role/Features
        → Frontend stores token → Show Dashboard

3. Feature Access
   User requests resource → Backend checks token
   → Checks user active → Checks role active
   → Checks feature access → Returns resource OR 403

4. Admin creates user
   Admin → User Management → Fill form → POST /api/users/create-user/
        → Backend creates User, UserRole → Show in list

5. Admin assigns role
   Admin → User list → Select role → Backend updates UserRole
        → User gets new features immediately on next request
```

---

**This architecture provides:**
- ✅ Enterprise-grade RBAC
- ✅ Feature-level access control
- ✅ Audit trail for assignments
- ✅ Flexible role/feature management
- ✅ Easy to scale and extend
- ✅ Secure by default
