# User Management System - Quick Setup Guide

## ⚡ Quick Start (5 minutes)

### Backend Setup

1. **Run Migrations**
   ```bash
   cd config
   python manage.py migrate
   ```

2. **Initialize Default Data**
   ```bash
   python manage.py shell
   ```
   
   Then paste this:
   ```python
   from django.contrib.auth.models import User
   from permits.models import Role, Feature, UserRole

   # Create features
   features_data = [
       ('permit_view', 'View Permits'),
       ('permit_create', 'Create Permits'),
       ('permit_edit', 'Edit Permits'),
       ('permit_delete', 'Delete Permits'),
       ('permit_check', 'Check Permits'),
       ('permit_submit', 'Submit Permits'),
       ('permit_share', 'Share Permits'),
       ('permit_renew', 'Renew Permits'),
       ('permit_cancel', 'Cancel Permits'),
       ('user_manage', 'Manage Users'),
       ('role_manage', 'Manage Roles'),
       ('report_view', 'View Reports'),
       ('dashboard_view', 'View Dashboard'),
   ]

   for feature_name, feature_display in features_data:
       Feature.objects.get_or_create(name=feature_name, defaults={'description': feature_display})

   # Create roles with features
   roles_config = {
       'admin': {'description': 'Administrator with full access', 'features': Feature.objects.all()},
       'user': {'description': 'End user with basic permit access', 'features': Feature.objects.filter(name__in=['permit_check', 'permit_submit', 'permit_share', 'dashboard_view'])},
       'operator': {'description': 'Operator with permit management', 'features': Feature.objects.exclude(name__in=['user_manage', 'role_manage', 'report_view'])},
       'supervisor': {'description': 'Supervisor with approval access', 'features': Feature.objects.filter(name__in=['permit_view', 'permit_edit', 'permit_cancel', 'permit_check', 'report_view', 'dashboard_view'])},
   }

   for role_name, config in roles_config.items():
       role, _ = Role.objects.get_or_create(name=role_name, defaults={'description': config['description'], 'is_active': True})
       role.features.set(config['features'])

   # Create admin user
   admin = User.objects.create_user(username='admin', email='admin@transport.local', password='Admin@123', first_name='System', last_name='Administrator', is_staff=True, is_superuser=True)
   admin_role = Role.objects.get(name='admin')
   UserRole.objects.create(user=admin, role=admin_role, is_active=True)

   exit()
   ```

3. **Run Django Admin**
   ```bash
   python manage.py runserver
   ```

### Frontend Setup

1. **Update App.js** (Already done ✓)
   - UserManagement and RoleManagement pages added
   - Admin-only navigation links
   - Role display in header

2. **No additional setup needed** - Components are ready to use

## 🎯 Default Admin Credentials

```
Username: admin
Password: Admin@123
Email: admin@transport-authority.local
```

⚠️ **Change password after first login!**

## 📝 Usage Examples

### Login as Admin
1. Go to `/login`
2. Enter: `admin` / `Admin@123`
3. You'll see admin menu (Users, Roles)

### Create New User
1. Login as admin
2. Click "👥 Users" in navbar
3. Click "+ Add New User"
4. Fill form with:
   - Username: `john_operator`
   - Email: `john@example.com`
   - Password: `SecurePass123!`
   - Role: `Operator`
5. Submit

### Assign Roles via API
```bash
curl -X POST http://localhost:8001/api/users/2/assign-role/ \
  -H "Authorization: Token YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"role_id": 2}'
```

### Create User via API
```bash
curl -X POST http://localhost:8001/api/users/create-user/ \
  -H "Authorization: Token ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "jane_user",
    "email": "jane@example.com",
    "password": "SecurePass123!",
    "first_name": "Jane",
    "last_name": "Doe",
    "role_id": 4
  }'
```

## 🔐 Default Roles

| Role | Access | Users |
|------|--------|-------|
| **Admin** | All features + User/Role management | 1 (default) |
| **Operator** | Create/Edit permits, Submit, Share | 0 |
| **Supervisor** | View, Edit, Cancel permits, Reports | 0 |
| **End User** | Check, Submit, Share permits only | 0 |

## 📊 Available Features

### Permit Management
- ✓ permit_view
- ✓ permit_create
- ✓ permit_edit
- ✓ permit_delete
- ✓ permit_check
- ✓ permit_submit
- ✓ permit_share
- ✓ permit_renew
- ✓ permit_cancel

### Administration
- ✓ user_manage
- ✓ role_manage
- ✓ report_view
- ✓ dashboard_view

## 🛠️ Admin Panel Features

### Manage Users
- View all users
- Create new users
- Deactivate/Activate users
- Assign roles

### Manage Roles
- View all roles
- Assign features to roles
- Remove features from roles
- View feature count per role

### Manage Features
- View all available features
- Feature descriptions
- Feature assignments

## ✅ Verification Checklist

After setup, verify:

- [ ] Default admin user exists
- [ ] Admin can login
- [ ] Users page accessible in admin navbar
- [ ] Roles page accessible in admin navbar
- [ ] Can create new user
- [ ] Can assign roles to users
- [ ] Can view features per role
- [ ] Login includes role information
- [ ] Frontend shows role in header

## 🐛 Troubleshooting

### Migrations failed?
```bash
python manage.py showmigrations
python manage.py migrate --plan
python manage.py migrate permits
```

### Default admin not created?
```bash
python manage.py shell < permits/init_data.py
```

### Can't access /users endpoint?
- Verify you're logged in as admin
- Check user role is assigned
- Verify role has user_manage feature

### API returns 403 Forbidden?
- Login and get token from response
- Add to request: `Authorization: Token YOUR_TOKEN`
- Verify user is admin role

## 📚 Documentation

See [USER_MANAGEMENT_GUIDE.md](USER_MANAGEMENT_GUIDE.md) for detailed documentation.

## 🚀 Next Steps

1. ✅ Setup complete
2. Change default admin password
3. Create additional users/roles as needed
4. Configure specific features per role
5. Train team on new user management system

---

**Need help?** Check the full documentation or API examples in USER_MANAGEMENT_GUIDE.md
