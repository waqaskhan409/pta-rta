# React Integration Guide - Adding Chalan Pages to App.js

## Quick Integration Steps

### 1. Import the Components

Add these imports to your `App.js`:

```javascript
// Add these with your other imports
import ChalanList from './pages/ChalanList';
import CreateChalan from './pages/CreateChalan';
import ChalanDetail from './pages/ChalanDetail';
import FeeManagement from './pages/FeeManagement';
```

### 2. Add Routes

Add these routes in your `<Routes>` section (usually inside `ProtectedRoute` or main `Routes`):

```javascript
<Routes>
  {/* ... existing routes ... */}
  
  {/* Chalan Management Routes */}
  <Route path="/chalans" element={<ChalanList />} />
  <Route path="/chalans/create" element={<CreateChalan />} />
  <Route path="/chalans/:id" element={<ChalanDetail />} />
  
  {/* Fee Management Route */}
  <Route path="/fee-management" element={<FeeManagement />} />
  
  {/* ... rest of routes ... */}
</Routes>
```

### 3. Add Navigation Links

Add menu items to your navigation/sidebar component:

```javascript
// In your Navbar/Menu component, add these links:

{/* Chalan Section */}
<NavItem 
  to="/chalans" 
  icon={<ReceiptIcon />}
  label="Chalans"
/>

<NavItem 
  to="/fee-management" 
  icon={<AttachMoneyIcon />}
  label="Fee Management"
/>

// Or as menu items:
<MenuItem onClick={() => navigate('/chalans')}>
  <ListItemIcon>📋</ListItemIcon>
  <ListItemText>View Chalans</ListItemText>
</MenuItem>

<MenuItem onClick={() => navigate('/chalans/create')}>
  <ListItemIcon>➕</ListItemIcon>
  <ListItemText>Create Chalan</ListItemText>
</MenuItem>

<MenuItem onClick={() => navigate('/fee-management')}>
  <ListItemIcon>💰</ListItemIcon>
  <ListItemText>Manage Fees</ListItemText>
</MenuItem>
```

### 4. Optional: Add Icons

If you want nice icons, install Material-UI icons (already in project):

```javascript
import {
  Receipt as ReceiptIcon,
  AttachMoney as MoneyIcon,
  Edit as EditIcon,
  Add as AddIcon,
} from '@mui/icons-material';
```

### 5. Test the Integration

1. **ChalanList page:**
   - Navigate to `/chalans`
   - Should show table of chalans
   - Shows statistics cards

2. **CreateChalan page:**
   - Click "Create Chalan" button or navigate to `/chalans/create`
   - Should show form with auto-fee calculation

3. **ChalanDetail page:**
   - Click on any chalan in list
   - Should show detailed view with edit options

4. **FeeManagement page:**
   - Navigate to `/fee-management`
   - Should show fee structures table
   - Need `chalan_vehicle_fee_manage` permission to create/edit

---

## Complete App.js Example

Here's a minimal but complete example of how to integrate:

```javascript
// App.js

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Box } from '@mui/material';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import PermitList from './pages/PermitList';
import PermitDetails from './pages/PermitDetails';
import TypesManagement from './pages/TypesManagement';
import UserManagement from './pages/UserManagement';
import RoleManagement from './pages/RoleManagement';
import Reports from './pages/Reports';

// Chalan Pages (NEW)
import ChalanList from './pages/ChalanList';
import CreateChalan from './pages/CreateChalan';
import ChalanDetail from './pages/ChalanDetail';
import FeeManagement from './pages/FeeManagement';

// Components
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

// Context
import { useAuth } from './context/AuthContext';

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <Router>
      <Box className="app-container">
        {user && <Navbar />}
        <Box className="main-content">
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/" element={user ? <Navigate to="/dashboard" /> : <Navigate to="/login" />} />

            {/* Protected Routes */}
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<Dashboard />} />
              
              {/* Permit Management */}
              <Route path="/permits" element={<PermitList />} />
              <Route path="/permits/:id" element={<PermitDetails />} />
              
              {/* Chalan Management (NEW) */}
              <Route path="/chalans" element={<ChalanList />} />
              <Route path="/chalans/create" element={<CreateChalan />} />
              <Route path="/chalans/:id" element={<ChalanDetail />} />
              
              {/* Fee Management (NEW) */}
              <Route path="/fee-management" element={<FeeManagement />} />
              
              {/* Admin Routes */}
              <Route path="/types" element={<TypesManagement />} />
              <Route path="/users" element={<UserManagement />} />
              <Route path="/roles" element={<RoleManagement />} />
              <Route path="/reports" element={<Reports />} />
              
              {/* Catch all */}
              <Route path="*" element={<Navigate to="/dashboard" />} />
            </Route>
          </Routes>
        </Box>
      </Box>
    </Router>
  );
}

export default App;
```

---

## Navigation Component Example

If you're using a sidebar menu, here's how to add Chalan items:

```javascript
// components/Navbar.js or Sidebar.js

import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Assignment as PermitIcon,
  Receipt as ChalanIcon,
  AttachMoney as FeeIcon,
  People as UserIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';

function Navbar() {
  const navigate = useNavigate();

  return (
    <Menu>
      <MenuItem onClick={() => navigate('/dashboard')}>
        <ListItemIcon><DashboardIcon /></ListItemIcon>
        <ListItemText>Dashboard</ListItemText>
      </MenuItem>

      {/* Permits Section */}
      <MenuItem onClick={() => navigate('/permits')}>
        <ListItemIcon><PermitIcon /></ListItemIcon>
        <ListItemText>Permits</ListItemText>
      </MenuItem>

      {/* Chalan Section (NEW) */}
      <MenuItem onClick={() => navigate('/chalans')}>
        <ListItemIcon><ChalanIcon /></ListItemIcon>
        <ListItemText>View Chalans</ListItemText>
      </MenuItem>
      <MenuItem onClick={() => navigate('/chalans/create')}>
        <ListItemIcon><ChalanIcon /></ListItemIcon>
        <ListItemText>Create Chalan</ListItemText>
      </MenuItem>
      
      {/* Fee Management (NEW) */}
      <MenuItem onClick={() => navigate('/fee-management')}>
        <ListItemIcon><FeeIcon /></ListItemIcon>
        <ListItemText>Fee Management</ListItemText>
      </MenuItem>

      {/* Admin Section */}
      <MenuItem onClick={() => navigate('/users')}>
        <ListItemIcon><UserIcon /></ListItemIcon>
        <ListItemText>Users</ListItemText>
      </MenuItem>
      <MenuItem onClick={() => navigate('/roles')}>
        <ListItemIcon><SettingsIcon /></ListItemIcon>
        <ListItemText>Roles & Permissions</ListItemText>
      </MenuItem>
    </Menu>
  );
}

export default Navbar;
```

---

## Error Handling

Make sure your API client handles common errors:

```javascript
// Already configured in chalanService.js, but here's the pattern:

try {
  const response = await chalanAPI.getChalans();
  // Handle success
} catch (error) {
  // Check for permission errors
  if (error.response?.status === 403) {
    setError('You do not have permission to access this resource');
  }
  // Check for validation errors
  else if (error.response?.status === 400) {
    setError(error.response.data.detail || 'Invalid request');
  }
  // Check for not found
  else if (error.response?.status === 404) {
    setError('Resource not found');
  }
  // Generic error
  else {
    setError('An error occurred');
  }
}
```

---

## Environment Configuration

Make sure your `.env` file has:

```
REACT_APP_API_URL=http://localhost:8000/api
REACT_APP_API_KEY=sk-dev-12345678901234567890
```

---

## Common Issues & Solutions

### Issue: Components not rendering
**Solution:** Check that routes are inside `<Routes>` and `<Router>` tags

### Issue: API calls failing with 401
**Solution:** Check that `ProtectedRoute` is passing auth token correctly

### Issue: Styles not applied
**Solution:** Make sure `../styles/page.css` exists and Material-UI is installed

### Issue: Permission denied on fee management
**Solution:** Ensure user's role has `chalan_vehicle_fee_manage` feature assigned

---

## Testing Checklist

- [ ] Routes load without errors
- [ ] ChalanList page displays
- [ ] Can create a new chalan
- [ ] Can view chalan details
- [ ] Fee auto-calculation works
- [ ] Fee management page accessible (with required permissions)
- [ ] Can update fees (with required permissions)
- [ ] Navigation links work correctly
- [ ] No console errors

---

## Performance Tips

1. **Lazy Load Components:**
```javascript
import { lazy, Suspense } from 'react';

const ChalanList = lazy(() => import('./pages/ChalanList'));
const CreateChalan = lazy(() => import('./pages/CreateChalan'));

// In Routes:
<Suspense fallback={<LoadingSpinner />}>
  <Route path="/chalans" element={<ChalanList />} />
</Suspense>
```

2. **Memoize Components:**
```javascript
export default React.memo(ChalanList);
```

3. **Use Pagination:**
- Already implemented in ChalanList.js
- Fetches only limited records at a time

---

**Ready to integrate! 🚀**
