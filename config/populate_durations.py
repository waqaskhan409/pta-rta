from permits.models import VehicleType

VEHICLE_DURATION_MAPPING = {
    'Motorcycle': 90,
    'Rickshaw': 1095,
    'Car': 365,
    'Taxi': 365,
    'Truck': 730,
    'Bus': 730,
    'Van': 365,
    'Commercial Vehicle': 730,
    'Passenger Vehicle': 365,
    'Goods Vehicle': 730,
}

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

print("Updating vehicle types with default permit durations...")
updated_count = 0

for vehicle_name, duration_days in VEHICLE_DURATION_MAPPING.items():
    vehicle = VehicleType.objects.filter(name=vehicle_name).first()
    if vehicle:
        vehicle.permit_duration_days = duration_days
        vehicle.save()
        updated_count += 1
        print(f"✓ {vehicle_name}: {duration_days} days ({format_duration(duration_days)})")
    else:
        print(f"✗ {vehicle_name}: Not found in database")

print(f"\n✅ Successfully updated {updated_count} vehicle types!")
