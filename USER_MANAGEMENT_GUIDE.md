# User Management System Documentation

## Overview

The PTA/RTA Permit Management System now includes a comprehensive user management and role-based access control (RBAC) system. This allows administrators to manage users, assign roles, and control feature access through a flexible permission system.

## Features

### 1. **User Management**
- Create new users with automatic role assignment
- Activate/Deactivate user accounts
- Assign or change user roles
- View all users and their roles
- Search and filter users

### 2. **Role-Based Access Control (RBAC)**
- 4 Default Roles:
  - **Admin**: Full access to all features
  - **Operator**: Can create and manage permits
  - **Supervisor**: Can approve/cancel permits, view reports
  - **End User**: Basic permit access (check, submit, share)

### 3. **Features/Permissions**
Each role can be assigned specific features:

#### Permit Features
- `permit_view` - View all permits
- `permit_create` - Create new permits
- `permit_edit` - Edit existing permits
- `permit_delete` - Delete permits
- `permit_check` - Check permit status
- `permit_submit` - Submit permits
- `permit_share` - Share permits with others
- `permit_renew` - Renew permits
- `permit_cancel` - Cancel permits

#### Administrative Features
- `user_manage` - Manage users
- `role_manage` - Manage roles
- `report_view` - View reports
- `dashboard_view` - View dashboard

## Default Admin User

The system creates a default admin user on initialization:

```
Username: admin
Email: admin@transport-authority.local
Password: Admin@123
```

⚠️ **IMPORTANT**: Change this password after first login!

## Backend Setup

### 1. Run Migrations

```bash
cd config
python manage.py migrate
```

### 2. Initialize Default Data

```bash
python manage.py shell < permits/init_data.py
```

Or manually in Django shell:

```bash
python manage.py shell
>>> from permits.models import Feature, Role, UserRole
>>> from django.contrib.auth.models import User
>>> # Create features
>>> # Create roles
>>> # Assign to admin
```

## API Endpoints

### Authentication
- `POST /api/auth/register/` - Register new user
- `POST /api/auth/login/` - Login (returns user with role info)
- `GET /api/auth/user/` - Get current user profile with role
- `POST /api/auth/logout/` - Logout

### User Management (Admin Only)
- `GET /api/users/` - List all users
- `GET /api/users/{id}/` - Get user details
- `POST /api/users/create-user/` - Create new user with role
- `POST /api/users/{id}/assign-role/` - Assign role to user
- `POST /api/users/{id}/remove-role/` - Remove role from user
- `POST /api/users/{id}/activate/` - Activate user
- `POST /api/users/{id}/deactivate/` - Deactivate user
- `GET /api/users/inactive-users/` - List inactive users

### Role Management (Admin Only)
- `GET /api/roles/` - List all roles
- `GET /api/roles/{id}/` - Get role details
- `POST /api/roles/{id}/add-feature/` - Add feature to role
- `POST /api/roles/{id}/remove-feature/` - Remove feature from role

### Features (Admin Only)
- `GET /api/features/` - List all features
- `GET /api/features/{id}/` - Get feature details

## API Request Examples

### Create User with Role

```bash
POST /api/users/create-user/
Content-Type: application/json

{
  "username": "john_operator",
  "email": "john@example.com",
  "password": "SecurePassword123!",
  "first_name": "John",
  "last_name": "Doe",
  "role_id": 2
}
```

Response:
```json
{
  "status": "success",
  "message": "User created successfully",
  "data": {
    "id": 5,
    "username": "john_operator",
    "email": "john@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "is_staff": false,
    "is_active": true,
    "role": {
      "id": 2,
      "name": "operator",
      "display_name": "Operator",
      "description": "Operator with permit management access",
      "features": [
        {"id": 1, "name": "permit_view", "display_name": "View Permits"},
        {"id": 3, "name": "permit_create", "display_name": "Create Permits"},
        ...
      ]
    },
    "features": [
      {"name": "permit_view", "display_name": "View Permits"},
      {"name": "permit_create", "display_name": "Create Permits"},
      ...
    ]
  }
}
```

### Login (with Role Information)

```bash
POST /api/auth/login/
Content-Type: application/json

{
  "username": "admin",
  "password": "Admin@123"
}
```

Response includes user role and accessible features:
```json
{
  "status": "success",
  "message": "Login successful",
  "user": {
    "id": 1,
    "username": "admin",
    "email": "admin@transport-authority.local",
    "first_name": "System",
    "last_name": "Administrator",
    "is_staff": true,
    "is_active": true,
    "role": {
      "id": 1,
      "name": "admin",
      "display_name": "Administrator",
      "features": [...]
    },
    "features": [...]
  },
  "token": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

### Assign Role to User

```bash
POST /api/users/5/assign-role/
Content-Type: application/json

{
  "role_id": 3,
  "notes": "Promoted to Supervisor"
}
```

## Frontend Components

### User Management Page
Location: `frontend/src/pages/UserManagement.js`

Features:
- Create new users
- Assign/change user roles
- Activate/deactivate users
- Search users
- View user details with role information

### Role Management Page
Location: `frontend/src/pages/RoleManagement.js`

Features:
- View all roles with feature assignments
- Add features to roles
- Remove features from roles
- View user count per role
- Role information and legend

## Permission Checking

### Backend
Use the custom permission classes:

```python
from permits.authentication import IsAdmin, HasFeature

class MyViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated, IsAdmin]
    
    # Or for specific feature:
    required_feature = 'permit_create'
    permission_classes = [IsAuthenticated, HasFeature]
```

### Frontend
Check user role and features:

```javascript
// From login response or auth context
const userRole = user.role.name;
const features = user.features.map(f => f.name);

// Check if user can perform action
const canEditPermit = features.includes('permit_edit');
const isAdmin = userRole === 'admin';
```

## Database Schema

### Models
1. **Feature** - Defines available features/permissions
2. **Role** - Groups features together (many-to-many with Feature)
3. **UserRole** - Assigns a role to a user (OneToOne with User)
4. **User** - Django's built-in User model (extended via UserRole)

### Key Relationships
```
User (1) ──→ (1) UserRole ──→ (1) Role ──→ (M) Feature
```

## Admin Panel

Access Django admin at `/admin/` with admin credentials:
- Manage users, roles, and features
- Assign features to roles
- View user role assignments
- Filter and search across all models

## Security Notes

1. ✅ All user management endpoints require admin role
2. ✅ Default admin user password should be changed immediately
3. ✅ Token-based authentication with secure token generation
4. ✅ Role-based access control at API level
5. ✅ User status tracking (active/inactive)
6. ✅ Audit trail for role assignments

## Workflow Examples

### Creating an Operator User
1. Admin logs in
2. Navigate to User Management
3. Click "Add New User"
4. Fill form: username, email, password
5. Select "Operator" role
6. Submit
7. User can now create and manage permits

### Changing User Role
1. Admin opens User Management
2. Find user in list
3. Click role dropdown or use "Assign Role" button
4. Select new role
5. Role updated immediately

### Adding New Feature to Role
1. Admin opens Role Management
2. Click on a role to expand
3. Select feature from "Add Feature" dropdown
4. Feature instantly added to role
5. All users with that role gain the new permission

## Troubleshooting

### User Can't Login
- Check if user account is active (not deactivated)
- Verify user has a role assigned
- Check if role is active

### User Can't Access Feature
- Verify user's role is assigned and active
- Check if the feature is assigned to the user's role
- Check role is active (is_active = True)

### Default Admin Not Created
Run the init script:
```bash
python manage.py shell < permits/init_data.py
```

## Migration Files

The following migration file sets up the user management system:
- `0003_user_management.py` - Creates Feature, Role, and UserRole models

## Next Steps

1. ✅ Run migrations: `python manage.py migrate`
2. ✅ Initialize data: `python manage.py shell < permits/init_data.py`
3. ✅ Change default admin password
4. ✅ Import UserManagement and RoleManagement components in your app
5. ✅ Add routes to user/role management pages
6. ✅ Test user creation and role assignment
