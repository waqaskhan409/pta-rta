#!/usr/bin/env python
import os
import sys
import django

sys.path.insert(0, '/Users/waqaskhan/Documents/PTA_RTA/config')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from permits.models import PermitType, VehicleType

# Create Permit Types
permit_types_data = [
    {'name': 'Transport', 'code': 'TRN', 'description': 'Transport Permit'},
    {'name': 'Goods', 'code': 'GDS', 'description': 'Goods Transport Permit'},
    {'name': 'Passenger', 'code': 'PSN', 'description': 'Passenger Transport Permit'},
    {'name': 'Commercial', 'code': 'COM', 'description': 'Commercial Transport Permit'},
]

for ptype in permit_types_data:
    pt, created = PermitType.objects.get_or_create(
        code=ptype['code'],
        defaults={
            'name': ptype['name'],
            'description': ptype['description'],
            'is_active': True
        }
    )
    if created:
        print(f'✓ Created PermitType: {ptype["name"]}')
    else:
        print(f'✓ PermitType exists: {ptype["name"]}')

print(f'\nTotal PermitTypes: {PermitType.objects.count()}')

# Create Vehicle Types
vehicle_types_data = [
    {'name': 'Rickshaw', 'description': 'Auto Rickshaw'},
    {'name': 'Truck', 'description': 'Truck/Lorry'},
    {'name': 'Bus', 'description': 'Bus/Minibus'},
    {'name': 'Car', 'description': 'Car/Taxi'},
    {'name': 'Motorcycle', 'description': 'Motorcycle/Bike'},
    {'name': 'Van', 'description': 'Van'},
    {'name': 'Wagon', 'description': 'Wagon'},
    {'name': 'Pickup', 'description': 'Pickup Truck'},
    {'name': 'Tractor', 'description': 'Tractor/Construction Vehicle'},
]

for vtype in vehicle_types_data:
    vt, created = VehicleType.objects.get_or_create(
        name=vtype['name'],
        defaults={
            'description': vtype['description'],
            'is_active': True
        }
    )
    if created:
        print(f'✓ Created VehicleType: {vtype["name"]}')
    else:
        print(f'✓ VehicleType exists: {vtype["name"]}')

print(f'\nTotal VehicleTypes: {VehicleType.objects.count()}')
print('\n✅ All types populated successfully!')
