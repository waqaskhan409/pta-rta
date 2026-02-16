# Vehicle Permit Duration - Quick Reference

## TL;DR - Get Started Now

```bash
# 1. Apply migration
cd config && python manage.py migrate permits

# 2. Populate vehicle durations
cd .. && bash setup_vehicle_durations.sh

# 3. Reload browser
# Cmd+Shift+R (or Ctrl+Shift+R on Windows/Linux)
```

Done! ✅

## What Changed?

| Component | What's New |
|---|---|
| **Database** | VehicleType now has `permit_duration_days` field |
| **API** | `/vehicle-types/` returns `permit_duration_days` |
| **Modal Dialog** | Shows vehicle duration, auto-calculates expiry dates |
| **Info Card** | Green card displays "Expires: [date]" |
| **Admin Panel** | Dedicated section to manage vehicle durations |

## Feature in Action

### Before (Manual Entry)
```
[Select Vehicle Type] → Motorcycle selected
[Set Valid From] → 2025-02-01
[Set Valid To] → ??? (User had to manually calculate and enter: 2025-05-02)
```

### After (Auto-Calculation)
```
[Select Vehicle Type] → Motorcycle (3 months) selected
[Set Valid From] → 2025-02-01
[Valid To Auto-populates] → 2025-05-02 ✨
[Green Info Card] → "Motorcycle: 90 days • Expires: May 02, 2025"
```

## Vehicle Durations at a Glance

```
🏍️ Motorcycle    → 3 months  (90 days)
🛺 Rickshaw      → 3 years   (1095 days)
🚗 Car/Taxi      → 1 year    (365 days)
🚚 Truck         → 2 years   (730 days)
🚌 Bus           → 2 years   (730 days)
```

## How to Change a Duration

### Quick Way (Admin Panel)
1. Go to `/admin/permits/vehicletype/`
2. Click vehicle type → Edit "Permit Duration" field
3. Save

### Command Line Way
```bash
python manage.py shell
>>> from config.permits.models import VehicleType
>>> v = VehicleType.objects.get(name="Motorcycle")
>>> v.permit_duration_days = 120  # Change to 120 days
>>> v.save()
```

## Add New Vehicle Type

```bash
python manage.py shell
>>> from config.permits.models import VehicleType
>>> VehicleType.objects.create(
...     name="E-Bike",
...     description="Electric Bicycle",
...     icon="⚡",
...     permit_duration_days=180,  # 6 months
...     is_active=True
... )
```

## Testing Checklist

- [ ] Migration applied: `python manage.py migrate`
- [ ] Populate script ran: `bash setup_vehicle_durations.sh`
- [ ] Browser hard refreshed: Cmd+Shift+R
- [ ] Dropdown shows duration: "Motorcycle (3 months)"
- [ ] Valid From date set → Valid To auto-fills
- [ ] Green info card shows expiry date
- [ ] Can override Valid To manually if needed
- [ ] Admin panel shows durations column
- [ ] Can edit duration in admin

## Troubleshooting

| Problem | Solution |
|---|---|
| Dropdown doesn't show duration | Hard refresh: Cmd+Shift+R |
| Valid To not auto-calculating | Ensure vehicle type is selected AND valid_from date is set |
| Admin doesn't show duration column | Run migration: `python manage.py migrate permits` |
| Vehicle types missing from DB | Run populate script: `bash setup_vehicle_durations.sh` |

## Files to Know

- **Backend Model**: `config/permits/models.py`
- **API Serializer**: `config/permits/serializers.py`
- **Admin UI**: `config/permits/admin.py`
- **Frontend Logic**: `frontend/src/components/PermitModal.js`
- **Setup Script**: `setup_vehicle_durations.sh`
- **Data Population**: `populate_vehicle_durations.py`

## Code Examples

### Get vehicle duration from API
```javascript
const response = await fetch('/api/vehicle-types/');
const vehicles = await response.json();
const motorcycle = vehicles.find(v => v.name === 'Motorcycle');
console.log(`${motorcycle.name}: ${motorcycle.permit_duration_days} days`);
```

### Manual date calculation (if needed)
```javascript
const durationDays = 90; // Motorcycle
const fromDate = new Date('2025-02-01');
const toDate = new Date(fromDate);
toDate.setDate(toDate.getDate() + durationDays);
console.log(toDate); // 2025-05-02
```

### Format duration to readable text
```python
def format_duration(days):
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
```

## API Response Example

```json
GET /api/vehicle-types/

[
  {
    "id": 1,
    "name": "Motorcycle",
    "description": "Two-wheeler vehicle (motorcycle, scooter)",
    "icon": "🏍️",
    "permit_duration_days": 90,  ← NEW FIELD
    "is_active": true
  },
  {
    "id": 3,
    "name": "Rickshaw",
    "description": "Three-wheeler auto-rickshaw",
    "icon": "🛺",
    "permit_duration_days": 1095,  ← NEW FIELD (3 years)
    "is_active": true
  }
]
```

## Performance Notes

- ✅ Auto-calculation happens **instantly** (client-side, no server call)
- ✅ No additional API calls required
- ✅ Vehicle type dropdown already loads durations
- ✅ Scales to any number of vehicle types
- ✅ Zero impact on page load time

## Version Info

- **Features**: Vehicle-based permit duration + auto-calculation
- **Backend**: Django 4.2 + DRF
- **Frontend**: React 18 + Material-UI
- **Database**: SQLite/PostgreSQL compatible
- **Status**: ✅ Production Ready
