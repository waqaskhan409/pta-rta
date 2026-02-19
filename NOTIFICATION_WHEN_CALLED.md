# Notification System - When Notifications Are Called - Complete Guide

## Overview

This document explains **exactly when notifications are called** in the PTA & RTA Permit Management System, with detailed examples and code flows.

---

## When Notifications Are Called

### 1. **PERMIT ASSIGNED** - When `assigned_to` field is set

```
Timeline:
┌─────────────────────────────────────────────────────────────┐
│ API CALL: PATCH /api/permits/1/                             │
│ Payload: { "assigned_to": 2 }                               │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ View: PermitViewSet.perform_update()                        │
│ • Detects: assigned_to changed from NULL to 2               │
│ • Sets: assigned_at = NOW                                   │
│ • Sets: assigned_by = request.user                          │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ Model: Permit.save(update_fields=['assigned_to', ...])      │
│ • update_fields tells signals what changed                  │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ Signal: post_save                                            │
│ Handler: send_notification_on_permit_assignment()           │
│ • Checks: 'assigned_to' in update_fields ✓                  │
│ • Checks: instance.assigned_to is not None ✓                │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ ACTION: Create In-App Notification                          │
│ Notification.objects.create(                                │
│   user=instance.assigned_to,           # User ID 2          │
│   notification_type='permit_assigned',                      │
│   title='Permit Assigned: TRN-001',                         │
│   message='A permit (TRN-001) for vehicle ABC-123...',      │
│   permit=instance,                                          │
│   action_url='/permits/1'                                   │
│ )                                                            │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ ACTION: Send Email Notification                             │
│ NotificationEmailService.send_permit_assigned_email(        │
│   user=assigned_user,                                       │
│   permit=permit_obj,                                        │
│   assigned_by='Admin User'                                  │
│ )                                                            │
│ • Email: To assigned user's email                           │
│ • Subject: "Permit Assigned: TRN-001"                       │
│ • Contains: Permit details, owner info, validity dates      │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ ACTION: Update Notification Status                          │
│ notification.email_sent = True/False                        │
│ notification.email_sent_at = NOW (if sent)                  │
│ notification.save()                                         │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ FRONTEND: User sees badge update                            │
│ • NotificationCenter polls every 30 sec                     │
│ • GET /api/notifications/unread_count/ → { count: 1 }      │
│ • Bell icon shows badge: "1"                                │
│ • Click bell to see "Permit Assigned: TRN-001"              │
└─────────────────────────────────────────────────────────────┘
```

**Code Location**: `config/permits/signals.py` line ~52

---

### 2. **STATUS CHANGED** - When `status` field changes to ANY new value

```
Timeline:
┌─────────────────────────────────────────────────────────────┐
│ API CALL: PATCH /api/permits/1/                             │
│ Payload: { "status": "active" }                             │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ Signal: pre_save                                             │
│ Handler: store_permit_initial_state()                       │
│ • Retrieves old permit from database                        │
│ • Stores: _permit_initial_state[pk] = {                     │
│     'status': 'draft',  # OLD STATUS                        │
│     'assigned_to': 2                                        │
│   }                                                          │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ Django: Saves the updated field to database                 │
│ Permit.status = 'active' (NEW STATUS)                       │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ Signal: post_save                                            │
│ Handler: send_notification_on_status_change()               │
│ • Retrieves: old_state = _permit_initial_state[id]          │
│ • Gets: old_status = 'draft'                                │
│ • Gets: new_status = 'active'                               │
│ • Checks: old_status != new_status  ✓ YES                   │
└────────────────┬────────────────────────────────────────────┘
                 │
        ┌────────┴─────────┐
        │                  │
        ▼                  ▼
  ┌─────────────┐    ┌─────────────────┐
  │ ASSIGNED     │    │ PERMIT OWNER    │
  │ USER EXISTS? │    │ EMAIL EXISTS?   │
  └──────┬───────┘    └────────┬────────┘
         │                     │
    YES  │                YES  │
         ▼                     ▼
    ┌──────────────────────────────────┐
    │ Send to BOTH users:              │
    │ 1. Assigned user (app + email)   │
    │ 2. Permit owner (email only)     │
    └───────────┬──────────────────────┘
                │
        ┌───────┴───────┐
        ▼               ▼
  ┌──────────────┐  ┌──────────────────┐
  │ ASSIGNED     │  │ PERMIT OWNER     │
  │ USER EMAIL   │  │ EMAIL            │
  ├──────────────┤  ├──────────────────┤
  │ Subject:     │  │ Subject:         │
  │ Permit       │  │ Permit           │
  │ Status       │  │ Status           │
  │ Changed      │  │ Changed          │
  │              │  │                  │
  │ To: api@     │  │ To: owner@       │
  │ transport    │  │ example.com      │
  │ .local       │  │                  │
  └──────────────┘  └──────────────────┘
         │                 │
         └─────────┬───────┘
                   │
                   ▼
        ┌──────────────────────────┐
        │ Results in:              │
        │ • 2 emails sent          │
        │ • 1 notification created │
        │  (for assigned user)     │
        │ • 1 email_sent=True      │
        │ • Both emails contain:   │
        │   - Old status: draft    │
        │   - New status: active   │
        │   - Permit details       │
        │   - Changed by: username │
        │   - Changed at: datetime │
        └──────────────────────────┘
```

**Code Location**: `config/permits/signals.py` line ~89

---

## All Status Changes That Trigger Notifications

```
Supported Status Changes:
┌────────────┬────────────┬──────────────────────────┐
│ Old Status │ New Status │ Notification Triggered   │
├────────────┼────────────┼──────────────────────────┤
│ pending    │ active     │ ✅ YES                   │
│ active     │ inactive   │ ✅ YES                   │
│ inactive   │ cancelled  │ ✅ YES                   │
│ cancelled  │ active     │ ✅ YES (Re-activation)   │
│ draft      │ active     │ ✅ YES                   │
│ draft      │ pending    │ ✅ YES                   │
│ expired    │ active     │ ✅ YES                   │
│ active     │ expired    │ ✅ YES                   │
│ ANY        │ ANY        │ ✅ YES (Any change)      │
│ draft      │ draft      │ ❌ NO (No change)        │
│ active     │ active     │ ❌ NO (No change)        │
└────────────┴────────────┴──────────────────────────┘
```

---

## Who Gets Notified?

### Notification Recipients by Scenario

```
SCENARIO 1: PERMIT ASSIGNED (assigned_to is set)
├─ Assigned User
│  ├─ In-App Notification: ✅ YES
│  │  └─ Type: permit_assigned
│  │  └─ Stored in: Notification table
│  │  └─ Visible in: Bell icon in header
│  │  └─ API: GET /api/notifications/
│  │
│  └─ Email: ✅ YES (if user has email)
│     └─ Subject: "Permit Assigned: [PERMIT_NUMBER]"
│     └─ Contains: Full permit details

SCENARIO 2: PERMIT STATUS CHANGES (status field updated)
├─ Assigned User (if assigned_to is set)
│  ├─ In-App Notification: ✅ YES
│  │  └─ Type: permit_status_changed
│  │  └─ Shows: Old status → New status
│  │
│  └─ Email: ✅ YES (if user has email)
│     └─ To: user@domain.com
│
├─ Permit Owner (if owner_email is set)
│  ├─ In-App Notification: ❌ NO (No user account)
│  │
│  └─ Email: ✅ YES
│     └─ To: owner@example.com
│     └─ Same content as assigned user

SCENARIO 3: PERMIT STATUS CHANGES (no assigned user)
├─ Assigned User: ❌ (None assigned)
└─ Permit Owner: ✅ YES (via email)
   └─ Receives email about status change
```

---

## Notification Details

### What Information Is Included?

**Permit Assignment Notification:**
```json
{
  "id": 1,
  "user": "john_doe",
  "notification_type": "permit_assigned",
  "title": "Permit Assigned: TRN-001",
  "message": "A permit (TRN-001) for vehicle ABC-123 has been assigned to you.",
  "permit_id": 42,
  "is_read": false,
  "email_sent": true,
  "email_sent_at": "2026-02-19T10:30:00Z",
  "action_url": "/permits/42",
  "created_at": "2026-02-19T10:30:00Z"
}
```

**Status Change Notification:**
```json
{
  "id": 2,
  "user": "john_doe",
  "notification_type": "permit_status_changed",
  "title": "Permit Status Changed: TRN-001",
  "message": "Permit TRN-001 status changed from draft to active.",
  "permit_id": 42,
  "is_read": false,
  "email_sent": true,
  "email_sent_at": "2026-02-19T10:35:00Z",
  "action_url": "/permits/42",
  "created_at": "2026-02-19T10:35:00Z"
}
```

---

## Step-by-Step: Change Permit Status and Get Notifications

### Step 1: Find a Permit

```bash
curl -X GET "http://localhost:8000/api/permits/" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response:**
```json
{
  "results": [
    {
      "id": 1,
      "permit_number": "TRN-001",
      "vehicle_number": "ABC-123",
      "owner_name": "Waqas Khan",
      "owner_email": "kwaqas40929@gmail.com",
      "assigned_to": 2,
      "status": "draft",
      "valid_from": "2024-01-01",
      "valid_to": "2025-01-01"
    }
  ]
}
```

### Step 2: Check Initial Notification Count

```bash
curl -X GET "http://localhost:8000/api/notifications/unread_count/" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response:**
```json
{
  "unread_count": 0
}
```

### Step 3: Change Permit Status

```bash
curl -X PATCH "http://localhost:8000/api/permits/1/" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "active"}'
```

**Behind the Scenes:**
1. ✅ pre_save signal stores old state
2. ✅ Status updated to "active"
3. ✅ post_save signal triggered
4. ✅ Detects: draft → active
5. ✅ Creates notification
6. ✅ Sends emails to:
   - api_user (assigned user)
   - kwaqas40929@gmail.com (owner)
7. ✅ Email marked as sent

### Step 4: Check Updated Notification Count

Now when you check:

```bash
curl -X GET "http://localhost:8000/api/notifications/unread_count/" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response:**
```json
{
  "unread_count": 1
}
```

**Bell icon now shows badge with "1"**

### Step 5: View the Notification

```bash
curl -X GET "http://localhost:8000/api/notifications/" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response:**
```json
{
  "count": 1,
  "results": [
    {
      "id": 1,
      "user": 2,
      "user_username": "api_user",
      "notification_type": "permit_status_changed",
      "title": "Permit Status Changed: TRN-001",
      "message": "Permit TRN-001 status changed from draft to active.",
      "permit": 1,
      "permit_number": "TRN-001",
      "is_read": false,
      "read_at": null,
      "email_sent": true,
      "email_sent_at": "2026-02-19T10:35:00.049446Z",
      "action_url": "/permits/1",
      "created_at": "2026-02-19T10:35:00.043704Z",
      "updated_at": "2026-02-19T10:35:00.043704Z"
    }
  ]
}
```

### Step 6: Frontend Shows Notification

In the React app:
1. Bell icon shows "1" badge (red circle)
2. Click bell to open dropdown
3. See "Permit Status Changed: TRN-001"
4. Click to mark as read
5. Badge disappears

### Step 7: Check Email Logs

In console (if using console backend):
```
Content-Type: text/plain; charset="utf-8"
Subject: Permit Status Updated: TRN-001
From: noreply@transportauthority.gov.pk
To: api@transport.local
Date: Thu, 19 Feb 2026 10:35:00 -0000

Hi api_user,

The status of your permit has been updated:

Permit Number: TRN-001
Vehicle Number: ABC-123
Previous Status: draft
New Status: active
Changed By: admin_user
Changed At: 2026-02-19 10:35:00.042186+00:00

---

Content-Type: text/plain; charset="utf-8"
Subject: Permit Status Updated: TRN-001
From: noreply@transportauthority.gov.pk
To: kwaqas40929@gmail.com
Date: Thu, 19 Feb 2026 10:35:00 -0000

Hi Waqas Khan,

The status of your permit has been updated:
[Same content for owner...]
```

---

## Files Where Notifications Are Called

### 1. Signal Handlers (`config/permits/signals.py`)

```python
# Lines ~26: Store old state before update
@receiver(pre_save, sender=Permit)
def store_permit_initial_state(sender, instance, **kwargs):

# Lines ~46: Send notification on assignment
@receiver(post_save, sender=Permit)
def send_notification_on_permit_assignment(sender, instance, created, update_fields, **kwargs):

# Lines ~89: Send notification on status change
@receiver(post_save, sender=Permit)
def send_notification_on_status_change(sender, instance, **kwargs):
```

### 2. Email Service (`config/permits/email_notifications.py`)

```python
# Lines ~24: Send assignment email
def send_permit_assigned_email(user, permit, assigned_by):

# Lines ~111: Send status change email to assigned user and owner
def send_permit_status_changed_email(user, permit, old_status, new_status, changed_by):

# Lines ~201: Generic email sender
def send_generic_notification_email(recipient_email, subject, message, html_content=None):
```

### 3. Update Handler (`config/permits/views.py`)

```python
# Lines ~965: Perform update and pass update_fields
def perform_update(self, serializer):
    # ...
    updated_permit.save(update_fields=update_fields)  # Triggers signals!
    # ...
```

### 4. Models (`config/permits/models.py`)

```python
# Lines ~936: Notification model definition
class Notification(models.Model):
    user = ForeignKey(User)
    notification_type = CharField(choices=NOTIFICATION_TYPES)
    title = CharField()
    message = TextField()
    permit = ForeignKey(Permit, nullable=True)
    is_read = BooleanField()
    email_sent = BooleanField()
    # ... more fields
```

---

## Debugging: When Notifications Don't Work

### Check 1: Is signal being triggered?

**Look for in logs:**
```
[STATUS_CHANGE] Permit ABC-123: draft → active
```

If not present, check:
- Is update_fields being passed? → View line ~1005 in views.py
- Is pre_save signal firing? → Check apps.py signal import

### Check 2: Is email being sent?

**Console backend (development):**
- Check Django console output
- Look for "Content-Type: text/plain"

**SMTP backend (production):**
- Check email service logs
- Verify SMTP credentials in .env
- Test with: `python manage.py shell`
  ```python
  from django.core.mail import send_mail
  send_mail('Test', 'Message', 'from@example.com', ['to@example.com'])
  ```

### Check 3: Is notification created?

```bash
python manage.py shell

from permits.models import Notification
Notification.objects.filter(notification_type='permit_status_changed')
# Should show your notification
```

### Check 4: Frontend not showing badge?

- Check browser console (F12) for fetch errors
- Verify API token is valid
- Check CORS settings
- Try manual poll: `GET /api/notifications/unread_count/`

---

## Summary

### Notifications Are Called When:

✅ **Permit Assigned**
- When `assigned_to` field is set/changed
- Creates in-app notification for assigned user
- Sends email to assigned user

✅ **Permit Status Changes**
- When `status` field changes to ANY new value
- Creates in-app notification for assigned user
- Sends email to assigned user
- Sends email to permit owner

✅ **On Any Other Field Change**
- Not automatically (only status and assignment)
- Can be added for other fields if needed

### Recipients:

| Change | Assigned User | Permit Owner |
|--------|---------------|--------------|
| Assigned | ✅ In-app + Email | ❌ None |
| Status | ✅ In-app + Email | ✅ Email only |

---

**System Status**: ✅ Fully Operational and Tested

**Test Result**: See `NOTIFICATION_SYSTEM_STATUS_REPORT.md`
