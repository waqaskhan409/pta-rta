#!/usr/bin/env python
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth.models import User
from permits.models import Role, Feature, UserRole

# Create superuser
if not User.objects.filter(username='admin').exists():
    User.objects.create_superuser('admin', 'admin@test.com', 'admin123')
    print('✓ Admin user created')
else:
    print('✓ Admin user already exists')

# Create roles
roles = ['admin', 'reporter', 'end_user', 'vehicle_owner']
for role_name in roles:
    Role.objects.get_or_create(name=role_name)
print(f'✓ {len(roles)} roles created/confirmed')

# Create features
features = [
    'permit_create', 'permit_edit', 'permit_delete', 
    'permit_view_all', 'vehicle_manage', 'report_view'
]
for feat in features:
    Feature.objects.get_or_create(name=feat)
print(f'✓ {len(features)} features created/confirmed')

# Assign features to admin role
admin_role = Role.objects.get(name='admin')
for feat in features:
    feature = Feature.objects.get(name=feat)
    UserRole.objects.get_or_create(role=admin_role, feature=feature)
print('✓ Features assigned to admin role')

# Create test end_user
if not User.objects.filter(username='testuser').exists():
    test_user = User.objects.create_user('testuser', 'test@test.com', 'test123')
    end_user_role = Role.objects.get(name='end_user')
    
    # Assign permit_create and permit_edit features
    for feat_name in ['permit_create', 'permit_edit']:
        feature = Feature.objects.get(name=feat_name)
        UserRole.objects.get_or_create(role=end_user_role, feature=feature)
    
    print('✓ Test user created and end_user role assigned')
else:
    print('✓ Test user already exists')

print('\n=== Setup Complete ===')
