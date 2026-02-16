# Vehicle Permit Duration - Testing & Verification Guide

## Pre-Deployment Testing

### Step 1: Setup Verification

**Prerequisite**: Ensure you can access the workspace terminal

```bash
# 1.1 Check project structure
cd /Users/waqaskhan/Documents/PTA_RTA
ls -la | grep -E "config|frontend|populate|setup"

# Expected output:
# config/ ✓
# frontend/ ✓
# populate_vehicle_durations.py ✓
# setup_vehicle_durations.sh ✓
```

**Verification Point**: All required files exist ✓

### Step 2: Database Migration Testing

```bash
# 2.1 Navigate to config directory
cd config

# 2.2 Check Django setup
python manage.py --version
# Expected: Django version 4.2.x

# 2.3 Run the migration
python manage.py migrate permits

# Expected output:
# Operations to perform:
#   Apply 1 migration: permits.0012_vehicletype_permit_duration
# Running migrations:
#   Applying permits.0012_vehicletype_permit_duration... OK

# 2.4 Verify migration was applied
python manage.py showmigrations permits | grep 0012

# Expected: [X] 0012_vehicletype_permit_duration ✓
```

**Verification Point**: Migration successful ✓

### Step 3: Database Schema Verification

```bash
# 3.1 Check the schema change
python manage.py shell

# 3.2 In Django shell:
>>> from config.permits.models import VehicleType
>>> from django.db import connection
>>> with connection.cursor() as cursor:
...     cursor.execute("PRAGMA table_info(permits_vehicletype);")
...     columns = cursor.fetchall()
...     for col in columns:
...         print(f"{col[1]} ({col[2]})")

# Expected output includes:
# permit_duration_days (integer)  ✓
```

**Verification Point**: Schema updated correctly ✓

### Step 4: Data Population Testing

```bash
# 4.1 Populate vehicle durations
cd ..
python manage.py shell < populate_vehicle_durations.py

# Expected output:
# Updating vehicle types with default permit durations...
# ✓ Motorcycle: 90 days (3 months)
# ✓ Rickshaw: 1095 days (3 years)
# ✓ Car: 365 days (1 year)
# ... (more vehicle types)
# ✅ Successfully updated X vehicle types!

# 4.2 Verify data was populated
python manage.py shell
>>> from config.permits.models import VehicleType
>>> VehicleType.objects.all().values('name', 'permit_duration_days')
# Expected: All types show permit_duration_days > 0
```

**Verification Point**: Data populated successfully ✓

### Step 5: API Testing

```bash
# 5.1 Start development server
python manage.py runserver

# 5.2 In another terminal, test API
curl http://localhost:8000/api/vehicle-types/

# Expected JSON response includes:
# {
#   "id": 1,
#   "name": "Motorcycle",
#   "permit_duration_days": 90,
#   "is_active": true,
#   ...
# }

# 5.3 Verify all vehicle types have permit_duration_days
python manage.py shell
>>> from config.permits.models import VehicleType
>>> missing = VehicleType.objects.filter(permit_duration_days__isnull=True)
>>> print(f"Vehicle types without duration: {missing.count()}")
# Expected: 0 (all have duration)
```

**Verification Point**: API returns permit_duration_days ✓

## Frontend Testing

### Step 6: Frontend Build & Load

```bash
# 6.1 Ensure frontend is running
cd frontend

# 6.2 Check for build (dev/prod)
npm run build  # Only if needed for prod

# 6.3 Start dev server if not running
npm start

# Expected: Frontend runs on localhost:3000
```

**Verification Point**: Frontend loads ✓

### Step 7: Manual UI Testing

#### Test 7.1: Permit Modal Loads
1. **Navigate to**: Permits → List page
2. **Click**: Edit button on any permit
3. **Check**: PermitModal dialog opens
4. **Expected**: No console errors ✓

#### Test 7.2: Vehicle Type Dropdown Shows Duration
1. **In Modal**: Scroll to "Vehicle Type" field
2. **Click**: Vehicle Type dropdown
3. **Check**: Options show duration
   - ✓ "Motorcycle (3 months)"
   - ✓ "Rickshaw (3 years)"
   - ✓ "Car (1 year)"
4. **Expected**: All vehicle types show duration format ✓

#### Test 7.3: Auto-Calculation Trigger 1 (Vehicle Type Selection)
1. **In Modal**: Select "Motorcycle" from dropdown
2. **Check**: Green info card appears
   - ✓ Shows "Motorcycle: 90 days"
3. **Set Valid From**: Today's date (e.g., Feb 1, 2025)
4. **Verify Valid To**: Auto-fills to 90 days later (May 1, 2025)
5. **Info Card Update**: Shows "Expires: May 01, 2025"
6. **Expected**: All fields updated in sync ✓

#### Test 7.4: Auto-Calculation Trigger 2 (Date Change)
1. **In Modal**: With vehicle type already selected
2. **Change Valid From**: To different date (e.g., Feb 15, 2025)
3. **Verify Valid To**: Updates to new_date + 90 days (May 17, 2025)
4. **Info Card Update**: Shows new expiry date
5. **Expected**: Valid To recalculates instantly ✓

#### Test 7.5: Different Vehicle Types
Repeat the following for each vehicle type:

```
Motorcycle:  Set valid_from = Feb 01 → expect valid_to = May 01 (90 days)
Rickshaw:    Set valid_from = Feb 01 → expect valid_to = Feb 01 (1095 days = 3y)
Car:         Set valid_from = Feb 01 → expect valid_to = Feb 01 (365 days = 1y)
Truck:       Set valid_from = Feb 01 → expect valid_to = Jan 01 (730 days = 2y)
```

**Verification Point**: All vehicle types calculate correctly ✓

#### Test 7.6: Manual Override
1. **In Modal**: Set vehicle type and valid_from
2. **Verify**: valid_to auto-fills
3. **Change valid_to**: Manually click and edit date to different value
4. **Verify**: Manual date is accepted
5. **Save**: Click Save button
6. **Expected**: Manual date is persisted ✓

#### Test 7.7: Info Card Styling
1. **In Modal**: With vehicle type and dates set
2. **Check Info Card**:
   - ✓ Green background (#e8f5e9)
   - ✓ Green border
   - ✓ 📅 Calendar icon visible
   - ✓ "Permit Validity" header shown
   - ✓ Vehicle name and duration displayed
   - ✓ Expiry date formatted nicely
3. **Responsive**: Check on different screen sizes
4. **Expected**: Card is visually appealing and readable ✓

### Step 8: Edge Cases Testing

#### Test 8.1: Empty Vehicle Type
1. **In Modal**: Don't select vehicle type
2. **Set Valid From**: Any date
3. **Verify Valid To**: Stays empty (no auto-fill)
4. **Expected**: Manual entry still required ✓

#### Test 8.2: Empty Valid From
1. **In Modal**: Select vehicle type
2. **Don't Set Valid From**: Leave empty
3. **Verify Valid To**: Stays empty (no auto-fill)
4. **Expected**: Both dates required for calculation ✓

#### Test 8.3: Date Picking (Calendar)
1. **Use Date Picker**: Instead of typing
2. **Select Valid From**: Using calendar widget
3. **Verify Valid To**: Auto-calculates from picked date
4. **Expected**: Both picker and typed dates work ✓

#### Test 8.4: Leap Year Handling
1. **Set Valid From**: Feb 29, 2024 (leap year)
2. **Select 365-day vehicle**: Car
3. **Verify Valid To**: Feb 28 or 29, 2025?
4. **Expected**: JavaScript date handles leap years correctly ✓

## Admin Panel Testing

### Step 9: Django Admin Interface

#### Test 9.1: Vehicle Type List View
1. **Navigate to**: `/admin/permits/vehicletype/`
2. **Check Columns**:
   - ✓ Name column visible
   - ✓ Permit Duration column visible (shows "3 months", "1 year", etc.)
   - ✓ Is Active column visible
3. **Check Sorting**: Click "Permit Duration" header
4. **Expected**: List shows all vehicle types with formatted durations ✓

#### Test 9.2: Vehicle Type Detail View
1. **Click Any Vehicle Type**: E.g., "Motorcycle"
2. **Check Fieldsets**:
   - ✓ "Basic Information" section (name, description, icon)
   - ✓ "Permit Duration" section (permit_duration_days field)
   - ✓ "Status" section (is_active checkbox)
3. **Expected**: Sections organize fields logically ✓

#### Test 9.3: Edit Permit Duration
1. **In Detail View**: Locate "Permit Duration" section
2. **Edit Value**: Change from 90 to 120 (for Motorcycle)
3. **Click Save**: Save changes
4. **Verify Database**: Check value was updated
   ```bash
   python manage.py shell
   >>> from config.permits.models import VehicleType
   >>> VehicleType.objects.get(name="Motorcycle").permit_duration_days
   # Expected: 120
   ```
5. **Check Modal**: In frontend modal, Motorcycle dropdown should show "(4 months)"
6. **Expected**: Admin changes reflect in frontend immediately ✓

#### Test 9.4: Add New Vehicle Type
1. **Click "Add Vehicle Type"** button
2. **Fill Form**:
   - Name: "E-Scooter"
   - Description: "Electric scooter"
   - Icon: "⚡"
   - Permit Duration Days: 180
   - Is Active: Yes
3. **Click Save**
4. **Verify List**: New type appears in list showing "6 month(s)"
5. **Check Modal**: Dropdown shows "E-Scooter (6 months)"
6. **Expected**: New vehicle type available immediately ✓

## Role-Based Testing

### Step 10: Multi-User Testing

#### Test 10.1: Admin User
```
User: Admin
Role: Has all permissions
Expected:
- Can see all permits
- Can edit any permit
- Can change vehicle type
- Valid To auto-calculates
- Can manually override dates
✓ Status: Working
```

#### Test 10.2: Standard User (with feature permission)
```
User: Operator
Role: Has specific permissions
Expected:
- Can only see assigned permits
- Can edit own permits
- Can change vehicle type (if assigned role matches)
- Valid To auto-calculates
✓ Status: Working
```

#### Test 10.3: Limited User (no feature)
```
User: Viewer
Role: No permit feature access
Expected:
- Cannot see permits page
- Cannot access modal
- Feature completely disabled
✓ Status: Access denied (expected)
```

## Integration Testing

### Step 11: Create New Permit with Auto-Duration

**Scenario**: Create a permit for a new motorcycle registration

1. **Navigate to**: Permits → Create New
2. **Fill Form**:
   - Applicant Name: "Test User"
   - Vehicle Type: "Motorcycle" (shows "3 months")
   - Valid From: Today (Feb 01, 2025)
3. **Verify**: Valid To auto-fills to May 01, 2025
4. **Check Info Card**: Shows "Motorcycle: 90 days • Expires: May 01, 2025"
5. **Click Save**
6. **Verify Saved**:
   - Check permit list shows both dates
   - Check API response has both dates
   - Check permit details modal shows dates
7. **Expected**: Permit created with auto-calculated duration ✓

### Step 12: Edit Existing Permit

**Scenario**: Edit a permit created before this feature

1. **Navigate to**: Permits → List
2. **Find Old Permit**: One created before auto-duration feature
3. **Click Edit**: Open modal
4. **Change Vehicle Type**: To any vehicle
5. **Verify**: Valid To auto-calculates based on new vehicle type
6. **Expected**: Feature works on old and new permits ✓

## Performance Testing

### Step 13: Performance Benchmarks

#### Test 13.1: Auto-Calculation Speed
```bash
# Measure time between vehicle selection and auto-fill
# Expected: < 50ms (basically instant)

Setup:
1. Open PermitModal
2. Use browser DevTools → Performance tab
3. Select vehicle type
4. Stop recording

Check: Time from click to valid_to update < 50ms ✓
```

#### Test 13.2: API Response Time
```bash
# Measure vehicle types API response
time curl http://localhost:8000/api/vehicle-types/

Expected: < 200ms
```

#### Test 13.3: Modal Load Time
```bash
# Measure time to open modal with 10+ vehicle types
# Expected: < 500ms
```

**Verification Point**: All operations complete instantly ✓

## Regression Testing

### Step 14: Existing Features Still Work

#### Test 14.1: Permit CRUD Operations
- [ ] Create new permit
- [ ] Read/view permit details
- [ ] Update permit (without vehicle change)
- [ ] Delete permit
- [ ] Filter permits by type/status
- [ ] Paginate permit list

#### Test 14.2: Role-Based Access Control
- [ ] Admin sees all permits
- [ ] Standard user sees only assigned
- [ ] Role-based edit restrictions work
- [ ] Permission system unchanged

#### Test 14.3: PermitHistory
- [ ] Changes logged correctly
- [ ] History shows vehicle type changes
- [ ] History timestamps accurate
- [ ] Audit trail complete

#### Test 14.4: API Functionality
- [ ] List endpoint works
- [ ] Create endpoint works
- [ ] Update endpoint works
- [ ] Delete endpoint works
- [ ] Filter parameters work
- [ ] Pagination works

**Verification Point**: No regression in existing features ✓

## Browser Compatibility Testing

### Step 15: Multi-Browser Testing

Test on:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

For each browser:
1. Open PermitModal
2. Select vehicle type from dropdown
3. Verify dropdown shows duration
4. Set valid_from date
5. Verify valid_to auto-calculates
6. Check info card displays correctly
7. Check no console errors

**Verification Point**: Works on all major browsers ✓

## Final Verification Checklist

```
DATABASE LAYER:
  ✓ Migration applied successfully
  ✓ Schema includes permit_duration_days
  ✓ All vehicle types have duration value
  ✓ Can update duration values

API LAYER:
  ✓ `/api/vehicle-types/` returns permit_duration_days
  ✓ Existing endpoints still work
  ✓ No breaking changes

ADMIN INTERFACE:
  ✓ List view shows duration column
  ✓ Detail view shows duration fieldset
  ✓ Can edit duration values
  ✓ Can add new vehicle types with duration
  ✓ Formatting works (years, months, days)

FRONTEND UI:
  ✓ Modal loads without errors
  ✓ Dropdown shows duration format
  ✓ Auto-calculation works on vehicle selection
  ✓ Auto-calculation works on valid_from change
  ✓ Info card displays with correct styling
  ✓ Manual override works
  ✓ All vehicle types calculate correctly
  ✓ Edge cases handled (empty fields, etc.)

CROSS-BROWSER:
  ✓ Chrome works
  ✓ Firefox works
  ✓ Safari works
  ✓ Edge works

PERFORMANCE:
  ✓ Auto-calculation < 50ms
  ✓ Modal load < 500ms
  ✓ No UI lag or delays
  ✓ No memory leaks

INTEGRATION:
  ✓ Create new permit works
  ✓ Edit existing permit works
  ✓ Permission system works
  ✓ History logging works

REGRESSION:
  ✓ Existing CRUD operations work
  ✓ Filters work
  ✓ Pagination works
  ✓ Role-based access works
  ✓ No console errors
```

## Issue Resolution

If any test fails, refer to [TROUBLESHOOTING_GUIDE.md] (see below for common issues):

### Common Issues & Solutions

| Issue | Check | Solution |
|---|---|---|
| Dropdown doesn't show duration | Browser cache | Clear cache: Cmd+Shift+R |
| Valid To doesn't auto-calculate | formData state | Check vehicle_type object has permit_duration_days |
| Admin shows no duration column | Migration applied? | Run: `python manage.py migrate permits` |
| API doesn't return duration | Serializer field | Verify permit_duration_days in VehicleTypeSerializer.fields |
| Math wrong on dates | Timezone settings | Check system timezone, JavaScript Date handling |
| Info card doesn't appear | CSS loading | Check Material-UI Box component renders |

## Sign-Off

After completing all tests:

```
Testing Completed: [ ] YES [ ] NO

Tested By: _________________
Test Date: _________________

All Critical Tests Pass: [ ] YES [ ] NO
No Regressions Found: [ ] YES [ ] NO
Ready for Production: [ ] YES [ ] NO

Notes:
_________________________________________________
_________________________________________________
_________________________________________________
```

## Next Steps

Once all tests pass:
1. ✅ Push code to version control
2. ✅ Update documentation
3. ✅ Deploy to production
4. ✅ Monitor for errors
5. ✅ Gather user feedback
6. ✅ Plan enhancements
