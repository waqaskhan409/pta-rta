#!/usr/bin/env python
import os
import sys
import django

sys.path.insert(0, '/Users/waqaskhan/Documents/PTA_RTA/config')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth.models import User
from permits.models import Role, Feature, UserRole

print("="*60)
print("SETTING UP COMPREHENSIVE ROLE-BASED PERMISSION SYSTEM")
print("="*60)

# ============================================================================
# 1. CREATE/UPDATE FEATURES
# ============================================================================
print("\n[1] CREATING/UPDATING FEATURES...")

# Features mapped to FEATURE_CHOICES in the model
features_data = {
    'permit_create': 'Create Permits',
    'permit_edit': 'Edit Permits',
    'permit_delete': 'Delete Permits',
    'permit_view_all': 'View All Permits',
    'permit_review': 'Review Permits',
    'permit_verify_docs': 'Verify Documents',
    'permit_approve': 'Approve Permits',
    'permit_assign': 'Assign Permits',
    'report_view': 'View Reports',
    'vehicle_manage': 'Manage Vehicles',
    'user_manage': 'Manage Users',
}

created_count = 0
for feat_name, feat_desc in features_data.items():
    try:
        feature, created = Feature.objects.get_or_create(
            name=feat_name,
            defaults={'description': feat_desc}
        )
        if created:
            created_count += 1
        status = "Created" if created else "Exists"
        print(f"  ✓ {feat_name}: {status}")
    except Exception as e:
        print(f"  ✗ {feat_name}: {str(e)}")

print(f"\n  Total Features: {Feature.objects.count()} ({created_count} new)")

# ============================================================================
# 2. CREATE/UPDATE ROLES
# ============================================================================
print("\n[2] CREATING/UPDATING ROLES...")
roles_data = {
    'admin': 'Administrator - Full access',
    'end_user': 'End User - Can create and manage own permits',
    'junior_clerk': 'Junior Clerk - Reviews permit details',
    'senior_clerk': 'Senior Clerk - Verifies documents and fees',
    'assistant': 'Assistant - Approves and finalizes permits',
}

role_objects = {}
for role_name, role_desc in roles_data.items():
    role, created = Role.objects.get_or_create(
        name=role_name,
        defaults={'description': role_desc}
    )
    role_objects[role_name] = role
    status = "Created" if created else "Exists"
    print(f"  ✓ {role_name}: {status}")

print(f"\n  Total Roles: {Role.objects.count()}")

# ============================================================================
# 3. ASSIGN FEATURES TO ROLES
# ============================================================================
print("\n[3] ASSIGNING FEATURES TO ROLES...")

role_features = {
    'admin': [
        'permit_create', 'permit_edit', 'permit_delete',
        'permit_view_all', 'permit_review', 'permit_verify_docs',
        'permit_approve', 'permit_assign', 'report_view',
        'vehicle_manage', 'user_manage'
    ],
    'end_user': [
        'permit_create', 'permit_edit', 'permit_view_all'
    ],
    'junior_clerk': [
        'permit_view_all', 'permit_review', 'permit_assign'
    ],
    'senior_clerk': [
        'permit_view_all', 'permit_review', 'permit_verify_docs', 'permit_assign'
    ],
    'assistant': [
        'permit_view_all', 'permit_review', 'permit_approve'
    ],
}

for role_name, feature_names in role_features.items():
    role = role_objects[role_name]
    # Clear existing features
    role.features.clear()
    # Add new features
    for feat_name in feature_names:
        try:
            feature = Feature.objects.get(name=feat_name)
            role.features.add(feature)
        except Feature.DoesNotExist:
            print(f"  ✗ Feature '{feat_name}' not found!")
    
    print(f"  ✓ {role_name}: {role.features.count()} features assigned")

# ============================================================================
# 4. CREATE TEST USERS
# ============================================================================
print("\n[4] CREATING TEST USERS...")

users_data = {
    'admin': ('admin@test.com', 'admin123', 'admin'),
    'user_end': ('end@test.com', 'end123', 'end_user'),
    'clerk_jr': ('jr@test.com', 'jr123', 'junior_clerk'),
    'clerk_sr': ('sr@test.com', 'sr123', 'senior_clerk'),
    'assist': ('assist@test.com', 'assist123', 'assistant'),
}

for username, (email, password, role_name) in users_data.items():
    user, created = User.objects.get_or_create(
        username=username,
        defaults={'email': email}
    )
    user.set_password(password)
    user.save()
    
    role = role_objects[role_name]
    user_role, _ = UserRole.objects.get_or_create(user=user, role=role)
    
    status = "Created" if created else "Updated"
    print(f"  ✓ {username} ({role_name}): {status}")
    print(f"     └─ Password: {password}")

print(f"\n  Total Users: {User.objects.count()}")

# ============================================================================
# 5. SUMMARY
# ============================================================================
print("\n" + "="*60)
print("WORKFLOW PROCESS")
print("="*60)
print("""
1. END_USER: Creates a new permit (permit_create)
   
2. JUNIOR_CLERK: Reviews the permit details (permit_review)
   - Reviews permit information
   - Forwards to Senior Clerk for documentation verification
   
3. SENIOR_CLERK: Verifies documents and fees (permit_verify_docs)
   - Checks all documents are attached
   - Verifies fees are paid
   - Forwards to Assistant for approval
   
4. ASSISTANT: Approves and finalizes permit (permit_approve)
   - Final approval
   - Generates permit certificate
   
5. ADMIN: Can do everything + manage system
   - Full access to all features
   - User management
""")

print("\n" + "="*60)
print("LOGIN CREDENTIALS")
print("="*60)
print("""
ADMIN:
  Username: admin
  Password: admin123

END_USER:
  Username: user_end
  Password: end123

JUNIOR_CLERK:
  Username: clerk_jr
  Password: jr123

SENIOR_CLERK:
  Username: clerk_sr
  Password: sr123

ASSISTANT:
  Username: assist
  Password: assist123
""")

print("="*60)
print("✅ SETUP COMPLETE!")
print("="*60)
