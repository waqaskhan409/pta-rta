#!/usr/bin/env python
import os
import sys
import django
from datetime import datetime, timedelta

sys.path.insert(0, '/Users/waqaskhan/Documents/PTA_RTA/config')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth.models import User
from permits.models import Role, UserRole, Permit

# Create admin user
admin, _ = User.objects.get_or_create(
    username='admin',
    defaults={'email': 'admin@test.com', 'is_superuser': True, 'is_staff': True}
)
admin.set_password('admin123')
admin.save()
print('✓ Admin user: admin / admin123')

# Create test end_user
testuser, _ = User.objects.get_or_create(
    username='testuser_end',
    defaults={'email': 'testuser@test.com'}
)
testuser.set_password('test123')
testuser.save()
print('✓ Test user: testuser_end / test123')

# Create roles
admin_role, _ = Role.objects.get_or_create(name='admin')
end_user_role, _ = Role.objects.get_or_create(name='end_user')

# Assign admin role to admin
admin_user_role, _ = UserRole.objects.get_or_create(
    user=admin,
    role=admin_role
)

# Assign end_user role to testuser
testuser_role, _ = UserRole.objects.get_or_create(
    user=testuser,
    role=end_user_role
)
print('✓ Roles assigned')

# Create test permits - one for testuser, others without created_by
today = datetime.now().date()
valid_from = today
valid_to = today + timedelta(days=365)

permit1, _ = Permit.objects.get_or_create(
    permit_number='TEST-001',
    defaults={
        'authority': 'PTA',
        'vehicle_number': 'ABC-001',
        'owner_name': 'Test Owner 1',
        'owner_email': 'owner1@test.com',
        'owner_phone': '03001234567',
        'created_by': 'testuser_end',
        'status': 'active',
        'valid_from': valid_from,
        'valid_to': valid_to
    }
)

permit2, _ = Permit.objects.get_or_create(
    permit_number='TEST-002',
    defaults={
        'authority': 'RTA',
        'vehicle_number': 'ABC-002',
        'owner_name': 'Test Owner 2',
        'owner_email': 'owner2@test.com',
        'owner_phone': '03001234568',
        'created_by': None,
        'status': 'active',
        'valid_from': valid_from,
        'valid_to': valid_to
    }
)

permit3, _ = Permit.objects.get_or_create(
    permit_number='TEST-003',
    defaults={
        'authority': 'PTA',
        'vehicle_number': 'ABC-003',
        'owner_name': 'Test Owner 3',
        'owner_email': 'owner3@test.com',
        'owner_phone': '03001234569',
        'created_by': None,
        'status': 'active',
        'valid_from': valid_from,
        'valid_to': valid_to
    }
)

print(f'✓ Test permits created')
print(f'✓ Total permits: {Permit.objects.count()}')
