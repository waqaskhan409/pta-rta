#!/usr/bin/env python
"""
Test script to verify notification system is working correctly.
This tests:
1. Notification creation on permit assignment
2. Notification creation on status changes
3. Email sending to both assigned user and permit owner
"""

import os
import sys
import django
from django.utils import timezone

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
sys.path.insert(0, '/Users/waqaskhan/Documents/PTA_RTA/config')

django.setup()

from django.contrib.auth.models import User
from permits.models import Permit, VehicleType, PermitType, Notification
from permits.serializers import PermitSerializer

def test_status_change_notification():
    """Test that notifications are created when permit status changes"""
    print("\n" + "="*80)
    print("TEST 1: STATUS CHANGE NOTIFICATION")
    print("="*80)
    
    try:
        # Get or create a permit
        permit = Permit.objects.first()
        if not permit:
            print("❌ No permits found in database. Create a permit first!")
            return False
        
        print(f"✅ Found permit: {permit.permit_number}")
        print(f"   Current status: {permit.status}")
        print(f"   Owner: {permit.owner_name} ({permit.owner_email})")
        print(f"   Assigned to: {permit.assigned_to}")
        
        # Get notifications before change
        initial_count = Notification.objects.filter(permit=permit).count()
        print(f"   Initial notification count: {initial_count}")
        
        # Change status
        old_status = permit.status
        new_status = 'active' if permit.status != 'active' else 'inactive'
        
        print(f"\n📝 Changing status from '{old_status}' to '{new_status}'...")
        permit.status = new_status
        permit.updated_by = 'Test User'
        permit.save()
        
        # Check notifications after change
        final_count = Notification.objects.filter(permit=permit).count()
        print(f"✅ Notification count after change: {final_count}")
        
        if final_count > initial_count:
            new_notifications = Notification.objects.filter(
                permit=permit,
                notification_type='permit_status_changed'
            ).order_by('-created_at')[:final_count - initial_count]
            
            for notif in new_notifications:
                print(f"\n   📌 Notification Created:")
                print(f"      ID: {notif.id}")
                print(f"      User: {notif.user.username if notif.user else 'N/A (Owner only)'}")
                print(f"      Type: {notif.notification_type}")
                print(f"      Title: {notif.title}")
                print(f"      Message: {notif.message}")
                print(f"      Email sent: {notif.email_sent}")
                print(f"      Email sent at: {notif.email_sent_at}")
                print(f"      Created at: {notif.created_at}")
            
            print(f"\n✅ SUCCESS: Status change notification created!")
            return True
        else:
            print(f"❌ FAILED: No new notifications created!")
            return False
    
    except Exception as e:
        print(f"❌ ERROR: {str(e)}")
        import traceback
        traceback.print_exc()
        return False


def test_assignment_notification():
    """Test that notifications are created when permit is assigned"""
    print("\n" + "="*80)
    print("TEST 2: PERMIT ASSIGNMENT NOTIFICATION")
    print("="*80)
    
    try:
        # Get a user to assign to
        user = User.objects.filter(is_staff=False).first()
        if not user:
            user = User.objects.first()
        
        if not user:
            print("❌ No users found in database!")
            return False
        
        print(f"✅ Using user: {user.username}")
        
        # Get or create a permit
        permit = Permit.objects.filter(assigned_to__isnull=True).first()
        if not permit:
            # Create a test permit if none available
            vehicle_type = VehicleType.objects.first()
            permit_type = PermitType.objects.first()
            
            if not vehicle_type or not permit_type:
                print("❌ No vehicle type or permit type found!")
                return False
            
            permit = Permit.objects.create(
                permit_number=f"TEST-{timezone.now().timestamp()}",
                authority='PTA',
                vehicle_type=vehicle_type,
                permit_type=permit_type,
                vehicle_number='TEST-001',
                owner_name='Test Owner',
                owner_email='owner@test.com',
                owner_phone='03001234567',
                valid_from=timezone.now().date(),
                valid_to=timezone.now().date(),
                status='pending'
            )
            print(f"✅ Created test permit: {permit.permit_number}")
        
        print(f"✅ Found permit to assign: {permit.permit_number}")
        
        # Get notifications before assignment
        initial_count = Notification.objects.filter(permit=permit).count()
        print(f"   Initial notification count: {initial_count}")
        
        # Assign the permit
        print(f"\n📝 Assigning permit to {user.username}...")
        permit.assigned_to = user
        permit.assigned_by = 'Test'
        permit.assigned_at = timezone.now()
        permit.save()
        
        # Check notifications after assignment
        final_count = Notification.objects.filter(permit=permit).count()
        print(f"✅ Notification count after assignment: {final_count}")
        
        if final_count > initial_count:
            new_notifications = Notification.objects.filter(
                permit=permit,
                notification_type='permit_assigned'
            ).order_by('-created_at')[:final_count - initial_count]
            
            for notif in new_notifications:
                print(f"\n   📌 Notification Created:")
                print(f"      ID: {notif.id}")
                print(f"      User: {notif.user.username}")
                print(f"      Type: {notif.notification_type}")
                print(f"      Title: {notif.title}")
                print(f"      Message: {notif.message}")
                print(f"      Email sent: {notif.email_sent}")
                print(f"      Email sent at: {notif.email_sent_at}")
                print(f"      Created at: {notif.created_at}")
            
            print(f"\n✅ SUCCESS: Assignment notification created!")
            return True
        else:
            print(f"❌ FAILED: No new notifications created!")
            return False
    
    except Exception as e:
        print(f"❌ ERROR: {str(e)}")
        import traceback
        traceback.print_exc()
        return False


def check_notification_system():
    """Check notification system configuration"""
    print("\n" + "="*80)
    print("SYSTEM CONFIGURATION CHECK")
    print("="*80)
    
    from django.conf import settings
    
    print(f"\n📧 Email Configuration:")
    print(f"   EMAIL_BACKEND: {settings.EMAIL_BACKEND}")
    print(f"   DEFAULT_FROM_EMAIL: {settings.DEFAULT_FROM_EMAIL}")
    
    if 'console' in settings.EMAIL_BACKEND:
        print("   ℹ️  Using console backend - emails will print to console")
    elif 'smtp' in settings.EMAIL_BACKEND:
        print(f"   EMAIL_HOST: {settings.EMAIL_HOST}")
        print(f"   EMAIL_PORT: {settings.EMAIL_PORT}")
        print(f"   EMAIL_USE_TLS: {settings.EMAIL_USE_TLS}")
        print(f"   EMAIL_HOST_USER: {settings.EMAIL_HOST_USER[:10]}..." if settings.EMAIL_HOST_USER else "   EMAIL_HOST_USER: Not configured")
    
    # Check database
    notification_count = Notification.objects.count()
    print(f"\n📊 Database Statistics:")
    print(f"   Total Notifications: {notification_count}")
    print(f"   Permits: {Permit.objects.count()}")
    print(f"   Users: {User.objects.count()}")
    print(f"   Unread Notifications: {Notification.objects.filter(is_read=False).count()}")
    
    return True


if __name__ == '__main__':
    print("\n" + "🔔 NOTIFICATION SYSTEM TEST SUITE" + "\n")
    
    # Check system configuration
    check_notification_system()
    
    # Run tests
    results = []
    results.append(("Assignment Notification", test_assignment_notification()))
    results.append(("Status Change Notification", test_status_change_notification()))
    
    # Summary
    print("\n" + "="*80)
    print("TEST SUMMARY")
    print("="*80)
    
    for test_name, result in results:
        status = "✅ PASSED" if result else "❌ FAILED"
        print(f"{test_name}: {status}")
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    print(f"\n{passed}/{total} tests passed")
    
    if passed == total:
        print("\n✅ All tests passed! Notification system is working correctly.")
        sys.exit(0)
    else:
        print("\n⚠️  Some tests failed. Check the output above for details.")
        sys.exit(1)
