from django.core.management.base import BaseCommand
from permits.models import PermitType, VehicleType


class Command(BaseCommand):
    help = 'Populate initial permit types and vehicle types'

    def handle(self, *args, **options):
        # Permit Types
        permit_types = [
            {'name': 'Transport', 'code': 'TRN', 'description': 'Transport permit for commercial vehicles'},
            {'name': 'Goods', 'code': 'GDS', 'description': 'Goods transportation permit'},
            {'name': 'Passenger', 'code': 'PSN', 'description': 'Passenger transport permit'},
            {'name': 'Commercial', 'code': 'CMC', 'description': 'Commercial permit'},
        ]

        for pt in permit_types:
            permit_type, created = PermitType.objects.get_or_create(
                code=pt['code'],
                defaults={'name': pt['name'], 'description': pt['description']}
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f'Created permit type: {permit_type.name}'))
            else:
                self.stdout.write(f'Permit type already exists: {permit_type.name}')

        # Vehicle Types
        vehicle_types = [
            {'name': 'Rickshaw', 'description': 'Three-wheeler auto rickshaw', 'icon': '🛺'},
            {'name': 'Truck', 'description': 'Heavy truck for goods transportation', 'icon': '🚛'},
            {'name': 'Bus', 'description': 'Passenger bus', 'icon': '🚌'},
            {'name': 'Car', 'description': 'Personal/commercial car', 'icon': '🚗'},
            {'name': 'Motorcycle', 'description': 'Motorcycle/Bike', 'icon': '🏍️'},
            {'name': 'Van', 'description': 'Commercial van', 'icon': '🚐'},
            {'name': 'Minibus', 'description': 'Mini passenger bus', 'icon': '🚐'},
            {'name': 'Wagon', 'description': 'Utility wagon', 'icon': '🚙'},
        ]

        for vt in vehicle_types:
            vehicle_type, created = VehicleType.objects.get_or_create(
                name=vt['name'],
                defaults={'description': vt['description'], 'icon': vt['icon']}
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f'Created vehicle type: {vehicle_type.name}'))
            else:
                self.stdout.write(f'Vehicle type already exists: {vehicle_type.name}')

        self.stdout.write(self.style.SUCCESS('Successfully populated types'))
