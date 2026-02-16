# Quick Reference Guide

## Starting the Application

### Terminal 1: Start Backend
```bash
cd /Users/waqaskhan/Documents/PTA_RTA/config
source ../venv/bin/activate
python manage.py runserver 0.0.0.0:8001
```

### Terminal 2: Start Frontend
```bash
cd /Users/waqaskhan/Documents/PTA_RTA/frontend
npm start
```

**App URL:** `http://localhost:3000`

---

## Main Features at a Glance

### 📊 Dashboard
- View overall permit statistics
- See status breakdown with progress bars
- Check key metrics (completion rate, pending rate)
- View recently added permits

### 📋 View Permits
- Browse all permits in a table
- Filter by status (All, Active, Pending, Inactive, Cancelled, Expired)
- **View** - Click to see permit details (read-only)
- **Edit** - Click to modify permit (with save)

### ➕ New Permit
- Create new permit with all required information
- Fill in vehicle details, owner info, etc.

### 👥 Users (Admin Only)
- Manage user accounts
- Assign roles to users
- Activate/deactivate users

### 🔐 Roles (Admin Only)
- **Create New Role** button - Add custom roles
- Expand role cards - See assigned features
- Add/Remove features - Manage permissions
- Features dialog - Select during role creation

---

## Navigation

**Left Drawer Menu:**
- Desktop: Always visible on left
- Mobile: Click hamburger menu to open

**Top Right User Menu:**
- Click username/avatar
- See your role
- Click Logout

---

## Common Tasks

### Create a New Role
1. Go to "🔐 Roles"
2. Click "Create New Role"
3. Enter name and description
4. Select features to assign
5. Click "Create Role"

### Edit a Permit
1. Go to "📋 View Permits"
2. Find permit in table
3. Click "Edit" button
4. Modify fields in tabs
5. Click "Update"

### View Permit Details
1. Go to "📋 View Permits"
2. Click "View" button
3. Read-only modal opens
4. Browse tabs for all info
5. Click "Cancel" to close

### Add Feature to Role
1. Go to "🔐 Roles"
2. Click on role card to expand
3. Find "Add Feature" dropdown
4. Select feature
5. Feature added automatically

### Filter Permits
1. Go to "📋 View Permits"
2. Change status filter dropdown
3. Table updates instantly

---

## API Endpoints Quick Reference

```
GET    /api/permits/              - List all permits
POST   /api/permits/              - Create permit
GET    /api/permits/{id}/         - Get permit details
PUT    /api/permits/{id}/         - Update permit
GET    /api/permits/stats/        - Dashboard stats

GET    /api/roles/                - List roles
POST   /api/roles/                - Create role
POST   /api/roles/{id}/add-feature/ - Add feature
POST   /api/roles/{id}/remove-feature/ - Remove feature

GET    /api/features/             - List features

GET    /api/users/                - List users (admin)
POST   /api/users/{id}/assign-role/ - Assign role
```

---

## Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Open search | Ctrl/Cmd + K |
| Close modal | Esc |
| Navigate drawer | Arrow keys |
| Logout | (Menu → Logout) |

---

## Troubleshooting

### App won't start
```bash
# Kill any existing processes
lsof -ti:3000 | xargs kill -9
lsof -ti:8001 | xargs kill -9

# Try again
npm start  # Frontend
python manage.py runserver 0.0.0.0:8001  # Backend
```

### Drawer not showing
- Check window width (< 768px = mobile mode)
- On mobile, use hamburger menu
- Desktop should always show drawer

### Modal not opening
- Check browser console for errors (F12)
- Ensure permit exists in database
- Try refreshing page

### API errors
- Verify backend is running on port 8001
- Check network tab in DevTools
- Ensure you're logged in
- Check token/authentication

---

## Responsive Sizes

| Device | Width | Drawer |
|--------|-------|--------|
| Mobile | <768px | Temporary (hamburger) |
| Tablet | 768-1024px | Collapsible |
| Desktop | >1024px | Permanent |

---

## Color Scheme

| Color | Use | Code |
|-------|-----|------|
| Blue | Primary actions | #1976d2 |
| Green | Success/Active | #4caf50 |
| Orange | Warning/Pending | #ff9800 |
| Red | Error/Cancelled | #f44336 |
| Gray | Inactive/Disabled | #9e9e9e |

---

## File Locations

| File | Purpose |
|------|---------|
| `frontend/src/App.js` | Main app layout |
| `frontend/src/pages/` | Page components |
| `frontend/src/components/PermitModal.js` | Permit form modal |
| `config/permits/models.py` | Database models |
| `config/permits/views.py` | API endpoints |

---

## Important Files

### Modified
- ✅ `frontend/src/App.js` - Navigation drawer
- ✅ `frontend/src/pages/Dashboard.js` - Statistics
- ✅ `frontend/src/pages/PermitList.js` - View/Edit
- ✅ `frontend/src/pages/RoleManagement.js` - Create roles

### New
- ✅ `frontend/src/components/PermitModal.js` - Modal form
- ✅ `config/permits/migrations/0004_alter_role_name.py` - DB migration

---

## Quick Stats

- **Total Permits API:** GET `/api/permits/stats/`
- **Recent Permits:** GET `/api/permits/?limit=5&ordering=-issued_date`
- **Active Permits:** GET `/api/permits/?status=active`
- **Roles List:** GET `/api/roles/`

---

## Dependencies

### Frontend (New)
```
@mui/material
@mui/icons-material
@emotion/react
@emotion/styled
@mui/lab
```

### Backend (No new dependencies)
All required packages in `requirements.txt`

---

## Development Mode

**Frontend in Dev Mode:**
- Hot reload enabled
- Source maps available
- Redux DevTools if installed

**Backend in Dev Mode:**
- Debug mode on
- SQL queries logged
- Auto-reload on file changes

---

## Building for Production

```bash
cd frontend
npm run build

# Build output in frontend/build/
# Ready for deployment to any static host
```

---

## Testing Features

See `TESTING_GUIDE.md` for:
- Complete test cases
- API testing examples
- Browser compatibility
- Performance testing
- Accessibility checks

---

## Getting Help

1. Check **PROJECT_COMPLETION_SUMMARY.md** - Full feature list
2. Check **TESTING_GUIDE.md** - Detailed test cases
3. Check **MATERIAL_DESIGN_IMPLEMENTATION.md** - Technical details
4. Check code comments - All files documented

---

## Last Updated
6 January 2026

## Quick Links
- [Material-UI](https://mui.com/)
- [Django REST](https://www.django-rest-framework.org/)
- [React Docs](https://react.dev/)
