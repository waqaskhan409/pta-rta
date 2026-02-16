# Vehicle Permit Duration Management

## Overview

This feature automatically calculates and sets default permit validity periods (expiry dates) based on vehicle type. Different vehicle types have different standard permit durations.

## Default Permit Durations

The system comes with the following default permit durations for common vehicle types:

| Vehicle Type | Duration | Days |
|---|---|---|
| 🏍️ Motorcycle | 3 months | 90 |
| 🛺 Rickshaw | 3 years | 1095 |
| 🚗 Car | 1 year | 365 |
| 🚚 Truck | 2 years | 730 |
| 🚌 Bus | 2 years | 730 |
| 🚕 Taxi | 1 year | 365 |
| 🚐 Van | 1 year | 365 |
| 🏭 Commercial Vehicle | 2 years | 730 |
| 👥 Passenger Vehicle | 1 year | 365 |
| 📦 Goods Vehicle | 2 years | 730 |

## Setup Instructions

### Step 1: Run Database Migration

First, apply the database migration to add the `permit_duration_days` field to the VehicleType model:

```bash
cd config
python manage.py migrate permits
```

### Step 2: Populate Vehicle Types

Run the script to populate existing vehicle types with default permit durations:

```bash
# Option 1: Using the setup script (macOS/Linux)
chmod +x setup_vehicle_durations.sh
./setup_vehicle_durations.sh

# Option 2: Using Python directly
python manage.py shell < populate_vehicle_durations.py

# Option 3: Manual in Django shell
python manage.py shell
# Then run the populate_vehicle_durations.py code
```

### Step 3: Verify Setup

After running the migration and population script:

1. Check Django admin: Visit `/admin/permits/vehicletype/`
2. Each vehicle type should show its permit duration in the list view
3. Edit any vehicle type to see the "Permit Duration" section with days

## How It Works

### Auto-Calculation Logic

When editing a permit in the modal:

1. **Select Vehicle Type**: When you choose a vehicle type, the system detects its `permit_duration_days`
2. **Valid From Date**: Set the permit's start date
3. **Auto-Calculate Valid To**: The system automatically sets `valid_to = valid_from + permit_duration_days`
4. **Info Card**: A green info card displays the calculated expiry date and duration

### User Experience

**In PermitModal (Frontend):**
- Vehicle type dropdown shows duration in months: `Motorcycle (3 months)`
- When vehicle type is selected and valid_from is set, valid_to auto-populates
- Green info card confirms: "Motorcycle: 90 days • Expires: Mar 15, 2026"
- Users can still manually override valid_to if needed

**In Admin Panel (Backend):**
- Vehicle type list displays "Permit Duration" column: "3 year(s)", "1 month(s)", "90 days", etc.
- VehicleType edit form has dedicated "Permit Duration" section
- Input field accepts number of days (e.g., 90, 365, 1095)

## Features

✅ **Automatic Calculation**: No manual date calculation needed  
✅ **Vehicle Type Specific**: Each vehicle type has its own default duration  
✅ **Override Capability**: Users can manually adjust expiry dates if needed  
✅ **Admin Management**: Easy to modify durations in Django admin  
✅ **Visual Feedback**: Green info card shows calculated expiry date  
✅ **Backend Support**: API returns both duration and calculated dates  

## API Changes

### VehicleTypeSerializer

Now includes `permit_duration_days` field:

```json
{
  "id": 1,
  "name": "Motorcycle",
  "description": "...",
  "icon": "🏍️",
  "permit_duration_days": 90,
  "is_active": true
}
```

## Database Changes

**New Field Added to VehicleType Model:**

```python
permit_duration_days = models.IntegerField(
    default=365,
    help_text="Default permit validity in days (365 = 1 year)"
)
```

**Migration File:** `0012_vehicletype_permit_duration.py`

## Customization

### Modify Duration for a Vehicle Type

#### Option 1: Django Admin
1. Go to `/admin/permits/vehicletype/`
2. Click on a vehicle type
3. Update "Permit Duration" field (in days)
4. Click Save

#### Option 2: Django Shell
```bash
python manage.py shell
from config.permits.models import VehicleType

vehicle = VehicleType.objects.get(name="Motorcycle")
vehicle.permit_duration_days = 120  # Change from 90 to 120 days
vehicle.save()
```

#### Option 3: Direct Database Update
```sql
UPDATE permits_vehicletype SET permit_duration_days = 120 WHERE name = 'Motorcycle';
```

### Add New Vehicle Type with Duration

```bash
python manage.py shell
from config.permits.models import VehicleType

VehicleType.objects.create(
    name="Electric Scooter",
    description="Electric two-wheeler",
    icon="⚡",
    permit_duration_days=180,  # 6 months
    is_active=True
)
```

## Testing

### Test Auto-Calculation

1. Open Permit Modal in Edit mode
2. Select vehicle type from dropdown
3. Set a "Valid From" date
4. Verify "Valid To" is automatically calculated
5. Check the green info card shows correct duration and expiry date

### Test Override

1. After auto-calculation, manually edit "Valid To" date
2. The custom date should be respected
3. Info card updates to show the new expiry date

## Notes

- If vehicle_type is not selected, the Valid To field won't auto-populate
- Default duration (365 days) is used if `permit_duration_days` is not set
- All calculations are done in the frontend for better UX (no server round-trip needed)
- Backend API validates that dates match the expected format

## Troubleshooting

### Vehicle types not showing duration
- Ensure migration is applied: `python manage.py migrate`
- Run the populate script: `python manage.py shell < populate_vehicle_durations.py`
- Verify in Django admin: `/admin/permits/vehicletype/`

### Duration not auto-calculating
- Ensure both "Vehicle Type" and "Valid From" date are set
- Check browser console for JavaScript errors
- Try a hard browser refresh (Cmd+Shift+R or Ctrl+Shift+R)

### Dates not calculating correctly
- Verify the vehicle type has the correct `permit_duration_days` value
- Check system timezone settings
- Ensure JavaScript date handling is correct in browser

## Files Modified

- `config/permits/models.py` - Added `permit_duration_days` field
- `config/permits/serializers.py` - Updated VehicleTypeSerializer
- `config/permits/admin.py` - Enhanced VehicleTypeAdmin UI
- `config/permits/migrations/0012_vehicletype_permit_duration.py` - Database migration
- `frontend/src/components/PermitModal.js` - Auto-calculation logic and UI
- `populate_vehicle_durations.py` - Data population script
- `setup_vehicle_durations.sh` - Setup automation script
