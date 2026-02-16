# Vehicle Permit Duration - Troubleshooting Guide

## Quick Diagnostics

### Issue: Auto-calculation not working

**Symptoms**: 
- Set vehicle type → Valid To doesn't auto-fill
- Set valid_from date → Valid To doesn't update

**Root Causes & Solutions**:

#### 1. Browser Cache
```bash
# Clear browser cache and hard refresh
# macOS: Cmd + Shift + R
# Windows/Linux: Ctrl + Shift + R
```

#### 2. Database Migration Not Applied
```bash
# Check migration status
cd config
python manage.py showmigrations permits | grep 0012

# If not applied (no [X]):
python manage.py migrate permits

# Verify
python manage.py showmigrations permits | grep 0012
# Should show: [X] 0012_vehicletype_permit_duration
```

#### 3. Vehicle Types Don't Have Duration Values
```bash
# Check if vehicle types populated
python manage.py shell
>>> from config.permits.models import VehicleType
>>> list(VehicleType.objects.values('name', 'permit_duration_days'))

# If permit_duration_days is None or 365 for all:
# Exit shell (Ctrl+D) and run populate script
python manage.py shell < populate_vehicle_durations.py
```

#### 4. API Not Returning Duration
```bash
# Check API response
curl http://localhost:8000/api/vehicle-types/

# Should include "permit_duration_days": XX in each object
# If missing:
# - Verify serializer includes field (see below)
# - Restart backend server
```

**Fix**: Update VehicleTypeSerializer in [config/permits/serializers.py](config/permits/serializers.py):

```python
class VehicleTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = VehicleType
        fields = ['id', 'name', 'description', 'icon', 'permit_duration_days', 'is_active']
        # Make sure 'permit_duration_days' is in the fields list
```

---

### Issue: Admin doesn't show duration column

**Symptoms**:
- VehicleType list view looks the same as before
- Can't see duration column
- Can't edit permit duration

**Root Causes & Solutions**:

#### 1. Migration Not Applied
```bash
python manage.py migrate permits
# Then refresh browser
```

#### 2. Django Admin Cache
```bash
# Restart Django development server
# Kill terminal: Ctrl+C
# Restart: python manage.py runserver
```

#### 3. Admin Code Not Updated
**Fix**: Verify [config/permits/admin.py](config/permits/admin.py) has:

```python
class VehicleTypeAdmin(admin.ModelAdmin):
    list_display = ['name', 'get_permit_duration_display', 'is_active']
    fieldsets = (
        ('Basic Information', {'fields': ('name', 'description', 'icon')}),
        ('Permit Duration', {'fields': ('permit_duration_days',)}),
        ('Status', {'fields': ('is_active',)}),
    )
    
    def get_permit_duration_display(self, obj):
        """Convert days to human-readable format"""
        days = obj.permit_duration_days
        years = days // 365
        remaining = days % 365
        months = remaining // 30
        
        if years > 0 and months > 0:
            return f"{years}y {months}m"
        elif years > 0:
            return f"{years} year(s)"
        elif months > 0:
            return f"{months} month(s)"
        else:
            return f"{days} days"
    
    get_permit_duration_display.short_description = "Permit Duration"
```

---

### Issue: Dropdown doesn't show duration format

**Symptoms**:
- Vehicle type dropdown shows just names: "Motorcycle", "Rickshaw"
- Not showing: "Motorcycle (3 months)", "Rickshaw (3 years)"

**Root Causes & Solutions**:

#### 1. Frontend Not Rebuilt
```bash
cd frontend
npm run build
# Or if using dev server, hard refresh: Cmd+Shift+R
```

#### 2. API Not Returning Duration to Frontend
```bash
# Check API response includes permit_duration_days
curl http://localhost:8000/api/vehicle-types/ | grep permit_duration_days
```

#### 3. Modal Code Not Updated
**Fix**: Verify [frontend/src/components/PermitModal.js](frontend/src/components/PermitModal.js) renders dropdown with duration:

```javascript
<MenuItem value={type}>
    {type.name} ({Math.floor(type.permit_duration_days / 30)} months)
</MenuItem>
```

---

### Issue: Info card not appearing

**Symptoms**:
- Green permit validity card doesn't show
- No "Expires: [date]" display
- Only see the form fields

**Root Causes & Solutions**:

#### 1. CSS Not Loaded
```bash
# Check Material-UI styles are available
# In browser DevTools → Elements tab
# Look for Material-UI stylesheet links
```

#### 2. JavaScript Error Preventing Render
```bash
# Check browser console for errors
# Press F12 → Console tab
# Look for red errors

# If errors, check:
# 1. formData.vehicle_type is defined
# 2. formData.valid_from is set
# 3. formData.valid_to is calculated
```

#### 3. Conditional Rendering Issue
**Fix**: Verify PermitModal.js has the info card code:

```javascript
{formData.vehicle_type && formData.valid_from && (
    <Box sx={{
        backgroundColor: '#e8f5e9',
        border: '1px solid #4caf50',
        borderRadius: '8px',
        padding: '16px',
        marginBottom: '16px'
    }}>
        {/* ... card content ... */}
    </Box>
)}
```

---

### Issue: Date calculations seem wrong

**Symptoms**:
- Motorcycle (90 days) adds 89 or 91 days instead of 90
- Leap year dates not handled correctly
- Wrong calendar dates

**Root Causes & Solutions**:

#### 1. Timezone Issue
```bash
# Check system timezone
date  # macOS/Linux
date /t  # Windows

# Python datetime handling
python manage.py shell
>>> from datetime import datetime, timedelta
>>> from_date = datetime(2025, 2, 1)
>>> to_date = from_date + timedelta(days=90)
>>> print(f"{from_date.date()} + 90 days = {to_date.date()}")
# Expected: 2025-02-01 + 90 days = 2025-05-02
```

#### 2. JavaScript Date Handling
```javascript
// Test the calculation in browser console
const fromDate = new Date('2025-02-01');
const durationDays = 90;
const toDate = new Date(fromDate);
toDate.setDate(toDate.getDate() + durationDays);
console.log(toDate); // Should be 2025-05-02
```

#### 3. Off-by-One Error in Code
**Fix**: Verify the calculation in PermitModal.js:

```javascript
if (name === 'valid_from' && formData.vehicle_type?.permit_duration_days) {
    const durationDays = formData.vehicle_type.permit_duration_days;
    const fromDate = new Date(value);  // Use exact value date
    const toDate = new Date(fromDate);  // Create copy
    toDate.setDate(toDate.getDate() + durationDays);  // Add days
    updatedData.valid_to = toDate.toISOString().split('T')[0];  // Format YYYY-MM-DD
}
```

---

## Advanced Troubleshooting

### Check: Database Schema

```bash
python manage.py shell
>>> from django.db import connection
>>> with connection.cursor() as cursor:
...     cursor.execute("PRAGMA table_info(permits_vehicletype);")
...     for col in cursor.fetchall():
...         print(f"{col[1]}: {col[2]}")

# Should include:
# permit_duration_days: integer
```

### Check: Model Definition

```bash
python manage.py shell
>>> from config.permits.models import VehicleType
>>> VehicleType._meta.get_field('permit_duration_days')
<django.db.models.fields.IntegerField: permit_duration_days>
```

### Check: Serializer Definition

```bash
python manage.py shell
>>> from config.permits.serializers import VehicleTypeSerializer
>>> s = VehicleTypeSerializer()
>>> print(s.fields.keys())
# Should include 'permit_duration_days'
```

### Check: Frontend Fetch

Open browser console (F12) and run:

```javascript
// Test vehicle types API call
fetch('/api/vehicle-types/')
  .then(r => r.json())
  .then(data => {
    console.log("API Response:", data);
    console.log("First type:", data[0]);
    console.log("Has permit_duration_days?", 'permit_duration_days' in data[0]);
  })
  .catch(err => console.error("API Error:", err));
```

### Check: React Component State

In browser console while PermitModal is open:

```javascript
// Check if React DevTools is available
// React DevTools → Select PermitModal component
// Check props.formData includes vehicle_type with permit_duration_days
```

---

## Step-by-Step Recovery

### Complete Reset & Reinstall

If nothing works, do a complete reset:

#### Backend Recovery
```bash
# 1. Stop dev server (Ctrl+C)

# 2. Reset database (WARNING: deletes all data)
cd config
rm db.sqlite3  # If using SQLite
python manage.py migrate  # Creates fresh DB
python manage.py createsuperuser  # New admin account

# 3. Populate test data
cd ..
python populate_vehicle_durations.py

# 4. Start server
cd config
python manage.py runserver
```

#### Frontend Recovery
```bash
# 1. Clear cache and dependencies
cd frontend
rm -rf node_modules
rm package-lock.json
npm install

# 2. Clear browser cache
# Chrome: Settings → Clear browsing data
# Or: Cmd+Shift+R hard refresh

# 3. Restart dev server
npm start
```

---

## Common Error Messages

### Error: "No such column: permits_vehicletype.permit_duration_days"

**Cause**: Migration not applied

**Fix**:
```bash
cd config
python manage.py migrate permits
```

### Error: "Field 'permit_duration_days' does not exist on model VehicleType"

**Cause**: Model file not saved or migration not applied

**Fix**:
1. Check [config/permits/models.py](config/permits/models.py) has the field
2. Run migration: `python manage.py migrate permits`

### Error: "get_permit_duration_display() missing 1 required positional argument: 'obj'"

**Cause**: Admin method decorator missing

**Fix**: In [config/permits/admin.py](config/permits/admin.py), add method to `VehicleTypeAdmin` class:

```python
def get_permit_duration_display(self, obj):
    # ... method implementation ...
    pass
```

### Error: "'NoneType' object is not subscriptable" (in JavaScript)

**Cause**: `permit_duration_days` is `None` or undefined

**Fix**:
1. Verify database populated: `python manage.py shell < populate_vehicle_durations.py`
2. Check API returns duration: `curl /api/vehicle-types/`
3. Add null check in code: `formData.vehicle_type?.permit_duration_days`

### Warning: "Infinite loop in useEffect"

**Cause**: Missing dependency array or circular state updates

**Fix**: Check PermitModal.js `useEffect` hooks have proper dependency arrays:

```javascript
useEffect(() => {
    // effect code
}, [dependencies]);  // Make sure dependency array exists
```

---

## Performance Troubleshooting

### Issue: Modal is slow to open

```bash
# 1. Check API response time
time curl http://localhost:8000/api/vehicle-types/

# 2. Check React rendering
# DevTools → Performance tab → Record modal open
# Look for long rendering times

# 3. Optimize if needed:
# - Add React.memo to PermitModal
# - Memoize vehicle types list
# - Check for unnecessary re-renders
```

### Issue: Calculation is slow

```javascript
// The calculation should be instant (<1ms)
// If not, check for:
// 1. Heavy computations in handleChange
// 2. Synchronous API calls
// 3. Large dataset processing
```

---

## Still Not Working?

### Debug Information Dump

Collect this info and include in issue report:

```bash
# 1. Django Version
python --version

# 2. Migration Status
python manage.py showmigrations permits | grep 0012

# 3. Database Schema
python manage.py shell -c "from django.db import connection; list(connection.introspection.get_table_list())"

# 4. Vehicle Types Count & Duration
python manage.py shell << 'EOF'
from config.permits.models import VehicleType
for v in VehicleType.objects.all():
    print(f"{v.name}: {v.permit_duration_days} days")
EOF

# 5. API Response Sample
curl http://localhost:8000/api/vehicle-types/ | python -m json.tool | head -50

# 6. Browser Console Logs
# F12 → Console tab → Screenshot or copy logs
```

### Get Support

1. Check this troubleshooting guide first
2. Review [VEHICLE_DURATION_IMPLEMENTATION.md](VEHICLE_DURATION_IMPLEMENTATION.md)
3. Check browser console (F12) for JavaScript errors
4. Run diagnostic commands above and collect output
5. Contact development team with collected information

---

## Checklist: Before Contacting Support

- [ ] Migration applied: `python manage.py migrate permits`
- [ ] Vehicle types populated: `python manage.py shell < populate_vehicle_durations.py`
- [ ] Browser cache cleared: Cmd+Shift+R
- [ ] Development server restarted
- [ ] Database verified has data: `python manage.py shell`
- [ ] API verified returns durations: `curl /api/vehicle-types/`
- [ ] No console errors: F12 → Console tab
- [ ] Tried on different browser
- [ ] Follow-up step actions attempted above

If all above done and still not working:
1. Collect debug info (see above)
2. Note exact steps to reproduce
3. Share error messages
4. Include browser/OS info
5. Include Django/React versions
6. Contact team with full details

---

## Quick Commands Reference

```bash
# Apply migration
python manage.py migrate permits

# Populate vehicle durations
python manage.py shell < populate_vehicle_durations.py

# Or use automation script
bash setup_vehicle_durations.sh

# Check migration status
python manage.py showmigrations permits | grep 0012

# Verify data
python manage.py shell
>>> from config.permits.models import VehicleType
>>> VehicleType.objects.all().values('name', 'permit_duration_days')

# Test API
curl http://localhost:8000/api/vehicle-types/

# Reset everything (nuclear option)
rm config/db.sqlite3
python manage.py migrate
python manage.py createsuperuser
python populate_vehicle_durations.py
```

## Need More Help?

- 📚 [VEHICLE_DURATION_SETUP.md](VEHICLE_DURATION_SETUP.md) - Setup guide
- 📖 [VEHICLE_DURATION_IMPLEMENTATION.md](VEHICLE_DURATION_IMPLEMENTATION.md) - Technical details
- ✅ [VEHICLE_DURATION_TESTING_GUIDE.md](VEHICLE_DURATION_TESTING_GUIDE.md) - Testing procedures
- ⚡ [VEHICLE_DURATION_QUICK_REFERENCE.md](VEHICLE_DURATION_QUICK_REFERENCE.md) - Quick reference
