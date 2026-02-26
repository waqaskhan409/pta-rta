#!/usr/bin/env python
import os
import sys
import django

sys.path.insert(0, '/Users/waqaskhan/Documents/PTA_RTA/config')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth.models import User
from permits.models import Role, Feature, UserRole

print("="*70)
print("PERMISSION SYSTEM VERIFICATION REPORT")
print("="*70)

# ============================================================================
# 1. FEATURES VERIFICATION
# ============================================================================
print("\n[1] FEATURES VERIFICATION")
print("-" * 70)
features = Feature.objects.all()
print(f"Total Features: {features.count()}")
for feature in features.order_by('name'):
    print(f"  ✓ {feature.name}")

# ============================================================================
# 2. ROLES VERIFICATION
# ============================================================================
print("\n[2] ROLES VERIFICATION")
print("-" * 70)
roles = Role.objects.all()
print(f"Total Roles: {roles.count()}\n")

for role in roles.order_by('name'):
    features_list = role.features.all()
    print(f"Role: {role.name.upper()}")
    print(f"  Description: {role.description}")
    print(f"  Features ({features_list.count()}):")
    for feature in features_list:
        print(f"    • {feature.name}")
    print()

# ============================================================================
# 3. USERS VERIFICATION
# ============================================================================
print("[3] USERS VERIFICATION")
print("-" * 70)
users = User.objects.all()
print(f"Total Users: {users.count()}\n")

for user in users.order_by('username'):
    try:
        user_role = user.user_role
        role = user_role.role
        role_features = role.features.all()
        print(f"User: {user.username}")
        print(f"  Email: {user.email}")
        print(f"  Role: {role.name}")
        print(f"  Role Features ({role_features.count()}):")
        for feature in role_features:
            print(f"    • {feature.name}")
    except Exception as e:
        print(f"User: {user.username} - ERROR: {str(e)}")
    print()

# ============================================================================
# 4. WORKFLOW SUMMARY
# ============================================================================
print("[4] WORKFLOW PERMISSIONS SUMMARY")
print("-" * 70)
workflow_roles = ['end_user', 'junior_clerk', 'senior_clerk', 'assistant', 'admin']
for role_name in workflow_roles:
    role = Role.objects.filter(name=role_name).first()
    if role:
        features_list = [f.name for f in role.features.all()]
        user_count = role.users.count()
        print(f"\n{role_name.upper()}")
        print(f"  Users assigned: {user_count}")
        print(f"  Permissions: {', '.join(features_list)}")

print("\n" + "="*70)
print("✅ VERIFICATION COMPLETE")
print("="*70)
