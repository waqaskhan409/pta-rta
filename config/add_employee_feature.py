#!/usr/bin/env python
"""
Script to add 'employee' feature to the system
and assign it to employee roles
"""
import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from permits.models import Feature, Role

print("\n" + "="*60)
print("ADDING EMPLOYEE FEATURE")
print("="*60)

# Create the employee feature
feature, created = Feature.objects.get_or_create(
    name='employee',
    defaults={
        'description': 'Is Employee - Indicates user is an employee of the organization'
    }
)

if created:
    print(f"✅ Created new feature: {feature.name} - {feature.get_name_display()}")
else:
    print(f"ℹ️  Feature already exists: {feature.name}")

# Roles that should have employee feature (internal employees)
employee_roles = [
    'admin',
    'assistant',
    'junior_clerk',
    'senior_clerk',
    'operator',
    'supervisor',
]

print("\n" + "-"*60)
print("ASSIGNING EMPLOYEE FEATURE TO ROLES")
print("-"*60)

for role_name in employee_roles:
    try:
        role = Role.objects.get(name=role_name)
        role.features.add(feature)
        print(f"✅ Added 'employee' feature to '{role_name}' role")
    except Role.DoesNotExist:
        print(f"⚠️  Role '{role_name}' not found, skipping")

print("\n" + "-"*60)
print("CURRENT ROLE ASSIGNMENTS")
print("-"*60)

all_roles = Role.objects.all()
for role in all_roles:
    has_employee = role.features.filter(name='employee').exists()
    status = "✅ HAS" if has_employee else "❌ NO"
    feature_count = role.features.count()
    print(f"{status} | {role.name:20} | {feature_count} features")

print("\n" + "="*60)
print("DONE!")
print("="*60)
