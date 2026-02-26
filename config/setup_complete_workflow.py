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
# 1. CHECK FEATURE CHOICES AVAILABLE
# ============================================================================
print("\n[1] AVAILABLE FEATURES...")
for choice_name, choice_display in Feature.FEATURE_CHOICES:
    feature, created = Feature.objects.get_or_create(name=choice_name)
    status = "Created" if created else "Exists"
    print(f"  ✓ {choice_name}: {status}")

print(f"\n  Total Features: {Feature.objects.count()}")

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

# Map available features to roles
role_features = {
    'admin': [
        'permit_view', 'permit_create', 'permit_edit', 'permit_delete',
        'permit_check', 'permit_submit', 'permit_share', 'permit_renew',
        'permit_cancel', 'user_manage', 'role_manage', 'report_view', 'dashboard_view'
    ],
    'end_user': [
        'permit_view', 'permit_create', 'permit_edit', 'permit_submit', 'dashboard_view'
    ],
    'junior_clerk': [
        'permit_view', 'permit_check', 'permit_submit', 'dashboard_view'
    ],
    'senior_clerk': [
        'permit_view', 'permit_check', 'permit_edit', 'permit_submit', 'dashboard_view'
    ],
    'assistant': [
        'permit_view', 'permit_check', 'permit_submit', 'dashboard_view'
    ],
}

for role_name, feature_names in role_features.items():
    role = role_objects[role_name]
    # Clear existing features
    role.features.clear()
    # Add new features
    assigned = 0
    for feat_name in feature_names:
        try:
            feature = Feature.objects.get(name=feat_name)
            role.features.add(feature)
            assigned += 1
        except Feature.DoesNotExist:
            print(f"     ✗ Feature '{feat_name}' not found!")
    
    print(f"  ✓ {role_name}: {assigned} features assigned")

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
    user_role, _ = UserRole.objects.get_or_create(user=user, defaults={'role': role})
    if user_role.role != role:
        user_role.role = role
        user_role.save()
    
    status = "Created" if created else "Updated"
    print(f"  ✓ {username} ({role_name}): {status}")
    print(f"     └─ Email: {email}")
    print(f"     └─ Password: {password}")

print(f"\n  Total Users: {User.objects.count()}")

# ============================================================================
# 5. SUMMARY
# ============================================================================
print("\n" + "="*60)
print("PERMIT ISSUANCE WORKFLOW PROCESS")
print("="*60)
print("""
STEP 1: END_USER Creates Permit
   └─ Creates a new permit application
   └─ Features: permit_create, permit_edit

STEP 2: JUNIOR_CLERK Reviews Details
   └─ Reviews permit information and basic details
   └─ Checks if all required info is provided
   └─ Forwards to Senior Clerk
   └─ Features: permit_view, permit_check

STEP 3: SENIOR_CLERK Verifies Documents & Fees
   └─ Verifies all documents are attached
   └─ Verifies fees are paid correctly
   └─ Checks document validity
   └─ Forwards to Assistant for approval
   └─ Features: permit_view, permit_check, permit_edit

STEP 4: ASSISTANT Approves Permit
   └─ Final approval after verification
   └─ Generates permit certificate
   └─ Marks permit as approved/active
   └─ Features: permit_view, permit_check, permit_submit

STEP 5: ADMIN Can Do Everything
   └─ Full access to all features
   └─ Can manage system, users, roles
   └─ Can override any decision
   └─ Features: ALL
""")

print("\n" + "="*60)
print("LOGIN CREDENTIALS")
print("="*60)
print("""
┌─ ADMIN (Full Access)
│  Username: admin
│  Password: admin123
│  
├─ END_USER (Permit Creator)
│  Username: user_end
│  Password: end123
│  
├─ JUNIOR_CLERK (Details Reviewer)
│  Username: clerk_jr
│  Password: jr123
│  
├─ SENIOR_CLERK (Document Verifier)
│  Username: clerk_sr
│  Password: sr123
│  
└─ ASSISTANT (Approval Officer)
   Username: assist
   Password: assist123
""")

print("="*60)
print("✅ SETUP COMPLETE!")
print("="*60)
print("\nNext Steps:")
print("1. Frontend should fetch roles and features from /api/roles/")
print("2. Dashboard should show workflow status based on user role")
print("3. Permit creation form should guide users through the workflow")
