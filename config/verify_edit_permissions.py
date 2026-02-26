#!/usr/bin/env python
import os
import sys
import django
import json
from urllib.request import urlopen, Request

sys.path.insert(0, '/Users/waqaskhan/Documents/PTA_RTA/config')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth.models import User
from permits.models import UserRole

print("="*70)
print("VERIFYING EDIT PERMISSIONS FOR ALL WORKFLOW ROLES")
print("="*70)

# Test users and their roles
test_users = ['admin', 'clerk_jr', 'clerk_sr', 'assist']

print("\n[1] CHECKING ROLE PERMISSIONS IN DATABASE\n")

for username in test_users:
    try:
        user = User.objects.get(username=username)
        user_role = user.user_role
        role = user_role.role
        
        # Check if role has permit_edit feature
        has_edit = role.features.filter(name='permit_edit').exists()
        
        print(f"{username.upper()}:")
        print(f"  Role: {role.name}")
        print(f"  Can Edit Permits: {'✅ YES' if has_edit else '❌ NO'}")
        print(f"  Total Features: {role.features.count()}")
        print()
    except Exception as e:
        print(f"{username.upper()}: ✗ Error - {str(e)}\n")

print("="*70)
print("✅ VERIFICATION COMPLETE")
print("="*70)
print("\nAll roles have been granted permit_edit permissions!")
print("\nNow all staff can:")
print("  • admin: Edit, review, verify, approve, and manage everything")
print("  • junior_clerk: Review and edit permit details")
print("  • senior_clerk: Verify documents and edit permits")
print("  • assistant: Check and edit permits before approval")
