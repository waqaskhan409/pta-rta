# Testing Guide - Material Design Implementation

## Quick Start Instructions

### 1. Start the Backend Server
```bash
cd /Users/waqaskhan/Documents/PTA_RTA/config
source ../venv/bin/activate
python manage.py runserver 0.0.0.0:8001
```

### 2. Start the Frontend Development Server
```bash
cd /Users/waqaskhan/Documents/PTA_RTA/frontend
npm start
```

The app will open at `http://localhost:3000`

---

## Feature Testing Checklist

### ✅ Test 1: Material Design Navigation Drawer

**Objective:** Verify the new navigation drawer is working correctly

**Steps:**
1. Login to the application
2. Observe the left sidebar with navigation items
3. **Desktop view:** Should see permanent drawer on left
4. **Mobile view (< 768px):** Should see hamburger menu
5. Click hamburger menu on mobile - drawer should slide in
6. Click outside drawer - should close
7. Verify all navigation items are visible:
   - 📊 Dashboard
   - 📋 View Permits
   - ➕ New Permit
   - 👥 Users (Admin only)
   - 🔐 Roles (Admin only)

**Expected Result:** ✅ Responsive drawer navigation with proper styling

---

### ✅ Test 2: Create New Role Feature

**Objective:** Verify admin can create custom roles

**Prerequisites:**
- Login as admin user
- Have admin role assigned

**Steps:**
1. Navigate to "🔐 Roles" in left drawer
2. Look for "Create New Role" button in top right
3. Click the button
4. A dialog should appear with:
   - "Role Name" text field
   - "Description" text area
   - "Select Features" chip selector
5. Fill in:
   - Role Name: `reviewer`
   - Description: `Can review and approve permits`
6. Select some features (e.g., "View Permits", "Edit Permits")
7. Click "Create Role" button
8. Success message should appear
9. New role should appear in the roles grid

**Expected Result:** ✅ New custom role created with selected features

---

### ✅ Test 3: View Permit Details

**Objective:** Verify permit viewing functionality

**Prerequisites:**
- At least one permit exists in the system
- Login with appropriate permissions

**Steps:**
1. Navigate to "📋 View Permits"
2. See table with all permits
3. Locate a permit and click "View" button
4. Modal should open showing:
   - Read-only permit information
   - Multiple tabs: Basic Info, Vehicle, Owner, Additional
   - "Cancel" button (closes without saving)
5. Examine different tabs:
   - **Tab 1:** Permit #, Authority, Type, Status, Dates
   - **Tab 2:** Vehicle details (Make, Model, Year, Capacity)
   - **Tab 3:** Owner info (Name, Email, Phone, CNIC, Address)
   - **Tab 4:** Description, Routes, Restrictions, Remarks
6. Click Cancel to close

**Expected Result:** ✅ Permit details displayed in organized tabbed interface

---

### ✅ Test 4: Edit Permit

**Objective:** Verify permit editing functionality

**Prerequisites:**
- At least one permit exists
- Admin or appropriate role

**Steps:**
1. Navigate to "📋 View Permits"
2. Click "Edit" button on any permit
3. Modal opens in edit mode
4. Fields should be editable (except Permit #)
5. Change some values:
   - Change status from "pending" to "active"
   - Update owner phone number
   - Add remarks
6. Click "Update" button
7. Success message appears
8. Modal closes automatically
9. Return to permits list
10. Verify changes are persisted (refresh page)

**Expected Result:** ✅ Permit updated successfully with all changes saved

---

### ✅ Test 5: Dashboard Statistics

**Objective:** Verify dashboard displays enhanced statistics

**Steps:**
1. Navigate to "📊 Dashboard"
2. Verify you see four stat cards:
   - Total Permits (blue icon)
   - Active Permits (green icon)
   - Pending Permits (orange icon)
   - Cancelled Permits (red icon)
3. Each card shows:
   - Count number
   - Icon
   - Progress bar for Active/Pending/Cancelled
   - Percentage of total
4. Below stats, see "Status Breakdown" section:
   - Progress bars for: Active, Inactive, Pending, Cancelled, Expired
   - Color-coded bars
   - Numbers on right
5. See "Key Metrics" section:
   - Completion Rate %
   - Pending Rate %
   - System Status chip
6. At bottom, see "Recently Added Permits" table:
   - Shows last 5 permits
   - Permit number, vehicle, owner, status, date added

**Expected Result:** ✅ Comprehensive dashboard with all statistics visible

---

### ✅ Test 6: Add Feature to Role

**Objective:** Verify admin can add features to existing roles

**Prerequisites:**
- Login as admin
- At least one custom role exists

**Steps:**
1. Navigate to "🔐 Roles"
2. Click on any role card to expand it
3. Card expands showing:
   - List of assigned features with delete buttons
   - "Add Feature" dropdown
4. Select a feature from dropdown that's not yet assigned
5. Feature should be added immediately
6. Success message appears
7. Feature appears in the expanded list
8. Delete button works for removing features

**Expected Result:** ✅ Features can be added/removed from roles dynamically

---

### ✅ Test 7: Filter Permits by Status

**Objective:** Verify permit filtering works

**Steps:**
1. Navigate to "📋 View Permits"
2. See filter dropdown at top
3. Change filter from "All" to "Active"
4. Table updates showing only active permits
5. Try other filters:
   - "Pending"
   - "Inactive"
   - "Cancelled"
   - "Expired"
6. Return to "All" - all permits should show

**Expected Result:** ✅ Permits filtered correctly by status

---

### ✅ Test 8: User Profile Menu

**Objective:** Verify user profile menu in top right

**Steps:**
1. Look at top-right corner of app bar
2. Should see username with account icon
3. Click on it
4. Dropdown menu appears showing:
   - Current role/position (disabled)
   - Divider
   - Logout button
5. Click Logout
6. Redirected to login page

**Expected Result:** ✅ User menu functions correctly

---

## API Testing (Backend Endpoints)

### Test Create Role API
```bash
curl -X POST http://localhost:8001/api/roles/ \
  -H "Authorization: Token YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "test_role",
    "description": "Test role description"
  }'
```

### Test Edit Permit API
```bash
curl -X PUT http://localhost:8001/api/permits/1/ \
  -H "Authorization: Token YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "active",
    "remarks": "Updated via API"
  }'
```

### Test Get Dashboard Stats
```bash
curl -X GET http://localhost:8001/api/permits/stats/ \
  -H "Authorization: Token YOUR_TOKEN"
```

---

## Browser Compatibility Testing

Test in these browsers:
- ✅ Chrome/Chromium (Latest)
- ✅ Firefox (Latest)
- ✅ Safari (Latest)
- ✅ Edge (Latest)

### Responsive Design Testing

Test at these breakpoints:
- **Desktop:** 1920x1080
- **Tablet:** 768x1024
- **Mobile:** 375x667

---

## Error Handling Testing

### Test 1: Invalid Permit Edit
1. Try to submit a form with invalid email
2. Should show error message
3. Modal should not close

### Test 2: Network Error Simulation
1. Disconnect internet while loading permits
2. Should show error message
3. Retry button should work

### Test 3: Permission Denied
1. Login as non-admin user
2. Try to access /users or /roles
3. Should be redirected to dashboard

---

## Performance Testing

### Check Build Size
```
Current build size: ~175 KB (gzipped)
```

### Check Page Load Times
- Dashboard: Should load in < 1 second
- Permits List: Should load in < 1 second
- Create Role Dialog: Should open instantly

---

## Accessibility Testing

### Keyboard Navigation
1. Tab through form fields
2. Enter and Space should activate buttons
3. Escape key closes modals

### Screen Reader Testing
- ARIA labels present
- Form labels associated with inputs
- Semantic HTML structure

---

## Known Limitations & To-Do

- [ ] Implement pagination for large datasets
- [ ] Add export to PDF/Excel
- [ ] Real-time notifications
- [ ] Advanced search filters
- [ ] Audit logging

---

## Troubleshooting

### Issue: Build fails with Material-UI imports
**Solution:** Ensure all Material-UI packages are installed
```bash
cd frontend
npm install @mui/material @emotion/react @emotion/styled @mui/icons-material
```

### Issue: Drawer not visible
**Solution:** Check browser window width - drawer hides on mobile
**Fix:** Test on desktop or use browser dev tools to set desktop size

### Issue: API calls fail
**Solution:** Verify backend is running on port 8001
```bash
cd config
python manage.py runserver 0.0.0.0:8001
```

### Issue: Styles not loading
**Solution:** Clear browser cache and rebuild
```bash
cd frontend
rm -rf build node_modules/.cache
npm start
```

---

## Test Report Template

```
Test Date: _______________
Tester: _______________
Browser: _______________
OS: _______________

✅ Feature 1: Create Role
✅ Feature 2: Edit Permit
✅ Feature 3: View Permit
✅ Feature 4: Dashboard Stats
✅ Feature 5: Navigation Drawer
✅ Feature 6: Filter Permits
✅ Feature 7: User Menu
✅ Feature 8: Material Design Responsive

Issues Found:
1. _______________
2. _______________
3. _______________

Recommendations:
1. _______________
2. _______________
```

---

## Support

For issues or questions, check:
- [Material-UI Documentation](https://mui.com/)
- [Django REST Framework Docs](https://www.django-rest-framework.org/)
- [React Documentation](https://react.dev/)

**Last Updated:** 6 January 2026
