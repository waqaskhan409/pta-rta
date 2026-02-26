#!/usr/bin/env python
import os
import sys
import django

sys.path.insert(0, '/Users/waqaskhan/Documents/PTA_RTA/config')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from permits.models import Role, Feature

print("="*60)
print("UPDATING EDIT PERMISSIONS FOR WORKFLOW ROLES")
print("="*60)

# Get the permit_edit feature
try:
    permit_edit = Feature.objects.get(name='permit_edit')
except Feature.DoesNotExist:
    print("✗ permit_edit feature not found!")
    sys.exit(1)

# Roles that should have edit permissions
edit_roles = ['admin', 'junior_clerk', 'senior_clerk', 'assistant']

print("\nAdding 'permit_edit' feature to roles...\n")

for role_name in edit_roles:
    role = Role.objects.filter(name=role_name).first()
    if not role:
        print(f"✗ Role '{role_name}' not found!")
        continue
    
    # Check if role already has the permit_edit feature
    if role.features.filter(name='permit_edit').exists():
        status = "Already has"
        print(f"  ✓ {role_name}: {status} permit_edit")
    else:
        # Add the feature
        role.features.add(permit_edit)
        print(f"  ✓ {role_name}: Added permit_edit")

print("\n" + "="*60)
print("Updated Role Permissions:")
print("="*60 + "\n")

for role_name in edit_roles:
    role = Role.objects.filter(name=role_name).first()
    if role:
        features = list(role.features.values_list('name', flat=True).order_by('name'))
        print(f"{role_name.upper()}:")
        print(f"  Features ({len(features)}):")
        for feat in features:
            print(f"    • {feat}")
        print()

print("="*60)
print("✅ EDIT PERMISSIONS UPDATED!")
print("="*60)
print("\nAll clerks and assistant can now edit permits in the workflow!")
