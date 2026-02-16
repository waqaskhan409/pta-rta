#!/bin/bash
# Setup script to add vehicle permit durations

echo "🔄 Running Django migrations..."
python manage.py migrate permits

echo ""
echo "📝 Populating vehicle types with default permit durations..."
python manage.py shell << EOF
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from config.permits.models import VehicleType

# Define vehicle types with their default permit durations (in days)
VEHICLE_DURATIONS = {
    'Motorcycle': 90,           # 3 months
    'Rickshaw': 1095,           # 3 years
    'Car': 365,                 # 1 year
    'Truck': 730,               # 2 years
    'Bus': 730,                 # 2 years
    'Taxi': 365,                # 1 year
    'Van': 365,                 # 1 year
    'Commercial Vehicle': 730,  # 2 years
    'Passenger Vehicle': 365,   # 1 year
    'Goods Vehicle': 730,       # 2 years
}

print("Updating vehicle types with default permit durations...\n")

updated_count = 0
for vehicle_name, duration_days in VEHICLE_DURATIONS.items():
    try:
        vehicle_type = VehicleType.objects.get(name__iexact=vehicle_name)
        vehicle_type.permit_duration_days = duration_days
        vehicle_type.save()
        
        # Convert days to months for display
        months = duration_days // 30
        days_remainder = duration_days % 30
        duration_str = f"{months} months" if days_remainder == 0 else f"{months} months {days_remainder} days"
        
        print(f"✓ {vehicle_name}: {duration_days} days ({duration_str})")
        updated_count += 1
    except VehicleType.DoesNotExist:
        print(f"✗ {vehicle_name}: Not found in database")

print(f"\n✅ Successfully updated {updated_count} vehicle types!")

# Display all vehicle types with their durations
print("\n📋 Current vehicle types and their permit durations:")
print("-" * 60)
for vehicle_type in VehicleType.objects.all().order_by('name'):
    days = vehicle_type.permit_duration_days
    months = days // 30
    years = days // 365
    
    if years > 0:
        duration_str = f"{years} year(s)" if days % 365 == 0 else f"{days} days"
    elif months > 0:
        duration_str = f"{months} month(s)" if days % 30 == 0 else f"{days} days"
    else:
        duration_str = f"{days} day(s)"
    
    print(f"  {vehicle_type.name:<25} → {duration_str} ({days} days)")
EOF

echo ""
echo "✅ Setup complete! Vehicle permit durations have been configured."
