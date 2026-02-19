# Notification System - Quick Reference & Troubleshooting

Fast lookup guide for when notifications are called and how to fix them.

---

## Quick Answer: When Are Notifications Called?

### ✅ Notifications ARE Sent When:

| Event | Recipient | In-App | Email | Where |
|-------|-----------|--------|-------|-------|
| **Permit Assigned** (assigned_to set) | Assigned User | ✅ | ✅ | Header badge |
| **Status Changed** (any → any) | Assigned User | ✅ | ✅ | Header badge |
| **Status Changed** (any → any) | Permit Owner | ❌ | ✅ | Email only |

### ❌ Notifications Are NOT Sent When:

| Scenario | Reason |
|----------|--------|
| Other fields changed | No signal handler for other fields |
| Status set to same value | `old_status == new_status` (no change detected) |
| assigned_to is NULL | No user to notify |
| owner_email is empty | No owner to email |

---

## Signal Handlers Quick Ref

```python
# File: config/permits/signals.py

# 1. ASSIGNMENT TRIGGER (lines ~46-87)
@receiver(post_save, sender=Permit)
def send_notification_on_permit_assignment():
    # Fires when: assigned_to field changes
    # If assigned_to in update_fields: ✓
    # Creates: 1 notification + 1 email

# 2. STATE CAPTURE (lines ~26-35)
@receiver(pre_save, sender=Permit)
def store_permit_initial_state():
    # Fires BEFORE save
    # Stores old status in _permit_initial_state dict
    # Critical for status change detection

# 3. STATUS CHANGE TRIGGER (lines ~89-165)
@receiver(post_save, sender=Permit)
def send_notification_on_status_change():
    # Fires when: status field changes
    # Detects: old_status != new_status
    # Creates: 1 notification + 1-2 emails
```

---

## When Exactly Are Signals Fired?

### Timeline:

```
API PATCH /api/permits/1/
    ↓ [1ms]
View: perform_update()
    ↓ [2ms]
    ├─ Detect changed fields
    ├─ Build update_fields=['status']
    ↓ [3ms]
permit.save(update_fields=['status'])
    ↓ [4ms]
♦ PRE_SAVE SIGNAL FIRES ♦
    ├─ store_permit_initial_state()
    ├─ old_permission_initial_state[1] = {'status': 'draft'}
    ↓ [5ms]
✓ Database UPDATE executed
    ↓ [11ms]
♦ POST_SAVE SIGNAL FIRES ♦
    ├─ send_notification_on_permit_assignment() [if assigned_to changed]
    ├─ send_notification_on_status_change() [if status changed]
    ├─ Notification created in DB
    ├─ Email(s) sent
    ↓ [20ms]
✓ Response sent to client
    ↓ [30-60s LATER]
Frontend polls /api/notifications/unread_count/
    ├─ Bell icon badge updates
    └─ User sees notification
```

---

## Exact Field Change Detection

### What Triggers "Permit Assigned" Notification?

```python
# In signal handler: send_notification_on_permit_assignment()

TRIGGER CONDITION:
if 'assigned_to' in update_fields:      # Field was changed
    if instance.assigned_to is not None: # Now has a user assigned
        # → NOTIFICATION SENT ✓
```

**Example:**
```python
# DOES trigger:
permit.save(update_fields=['assigned_to'])  # ✓

# DOES NOT trigger:
permit.save(update_fields=['status'])       # ✗ (no 'assigned_to')
permit.save()                               # ✗ depends on implementation
Model.objects.filter(...).update()          # ✗ (bulk update, no signal)
```

---

### What Triggers "Status Changed" Notification?

```python
# In signal handler: send_notification_on_status_change()

TRIGGER CONDITION:
old_status = _permit_initial_state.get(instance.pk, {}).get('status')
new_status = instance.status

if old_status != new_status:  # Status actually changed
    # → NOTIFICATION SENT ✓
```

**Examples:**
```python
# DOES trigger:
permit.status = 'active'      # ✓ (draft → active)
permit.save()

permit.status = 'expired'     # ✓ (active → expired)
permit.save()

# DOES NOT trigger:
permit.status = 'active'      # ✗ (already active → active)
permit.save()

permit.status = 'draft'       # ✗ (already draft → draft)
permit.save()
```

---

## Checking If Notifications Are Working

### Quick Debug Checklist

```
□ Step 1: Change a permit status
  curl -X PATCH "http://localhost:8000/api/permits/1/" \
    -H "Authorization: Bearer TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"status": "active"}'

□ Step 2: Check Django console for signal log
  Looking for: [STATUS_CHANGE] Permit XXX: draft → active

□ Step 3: If no log, check update_fields parameter
  Django needs: permit.save(update_fields=['status'])
  Check: config/permits/views.py line ~1005

□ Step 4: Check if permit has assigned_to
  curl -X GET "http://localhost:8000/api/permits/1/" \
    -H "Authorization: Bearer TOKEN"
  Should show: "assigned_to": 2 (not null)

□ Step 5: Check if user exists
  curl -X GET "http://localhost:8000/api/users/2/" \
    -H "Authorization: Bearer TOKEN"
  Should exist

□ Step 6: Check if owner_email exists
  curl -X GET "http://localhost:8000/api/permits/1/" \
    -H "Authorization: Bearer TOKEN"
  Should show: "owner_email": "someone@example.com"

□ Step 7: Check notifications in database
  python manage.py shell
  from permits.models import Notification
  Notification.objects.all().count()  # Should increase

□ Step 8: Check API response
  curl -X GET "http://localhost:8000/api/notifications/" \
    -H "Authorization: Bearer TOKEN"
  Should show newest notification
```

---

## Common Issues & Fixes

### Issue 1: Notifications Not Appearing in Frontend

**Symptoms:**
- Status changes but bell badge doesn't update
- No notification in dropdown

**Checklist:**
```
□ Is backend API running? 
  Test: curl http://localhost:8000/api/notifications/

□ Is frontend polling active?
  Check: Browser DevTools → Network tab → Search "unread_count"
  Should see requests every 30 seconds

□ Is the user linked to the notification?
  Check: Who is currently logged in user vs assigned_to user
  Notification only shows for the assigned user

□ Is token fresh and valid?
  Get new token: curl -X POST http://localhost:8000/api/token/

□ Is CORS configured correctly?
  Check: Frontend should be able to call backend
  Test: Try GET /api/permits/ from frontend console
```

---

### Issue 2: Status Change Detected But No Email Sent

**Symptoms:**
- Console shows: `[STATUS_CHANGE] Permit XXX: draft → active` ✓
- But no email in console output

**Checklist:**
```
□ Check assigned_to is set
  SELECT assigned_to FROM permits_permit WHERE id=1;
  Should NOT be NULL

□ Check if assigned user has email
  SELECT email FROM auth_user WHERE id=<assigned_to>;
  Should have value

□ Is EMAIL_BACKEND configured?
  Check: config/config/settings.py
  Should see: EMAIL_BACKEND = '...'
  For dev: EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'

□ Are email settings correct?
  Check .env file for SMTP settings
  For console backend: no settings needed

□ Check if send_mail is imported in signals
  config/permits/signals.py should have:
  from config.permits.email_notifications import NotificationEmailService
```

---

### Issue 3: Pre_save Signal Not Detecting Old State

**Symptoms:**
- `[STATUS_CHANGE]` log appears but shows wrong old status
- OR status change notification not sent

**Checklist:**
```
□ Is pre_save signal registered?
  Check: config/permits/signals.py ~26
  Should have: @receiver(pre_save, sender=Permit)

□ Is signal imported in apps.py?
  Check: config/permits/apps.py
  Should have: from . import signals

□ Is instance.pk set?
  If creating new permit: instance.pk is None
  Pre_save only works for updates

□ Is _permit_initial_state dict cleared?
  Check: config/permits/signals.py line ~35-40
  After processing, dict should be cleaned

□ Multiple processes?
  If using multiple workers: each has own _permit_initial_state
  May need to use DB fallback
```

---

### Issue 4: Notification Created But Email Not Sending

**Symptoms:**
- Database shows: Notification created ✓
- email_sent = False (or NULL)
- No email in console output

**Checklist:**
```
□ Check email_notifications.py exists
  File: config/permits/email_notifications.py
  Should exist and have send_permit_status_changed_email()

□ Is email service imported?
  Check: config/permits/signals.py ~10
  Should have: from config.permits.email_notifications import ...

□ Check error handling
  Check Django console for exception tracebacks
  May show: SMTPException, ConnectionError, etc.

□ Test email directly
  python manage.py shell
  >>> from django.core.mail import send_mail
  >>> send_mail('Test', 'Body', 'from@example.com', ['to@example.com'])
  1  # Should return 1 (success)

□ Check NO_REPLY_EMAIL setting
  DEFAULT_FROM_EMAIL should be set in settings.py
  Example: DEFAULT_FROM_EMAIL = 'noreply@example.com'
```

---

### Issue 5: Notification Badge Not Updating

**Symptoms:**
- Notification created ✓
- Signal fires ✓
- Email sent ✓
- But bell icon stays at "0"

**Checklist:**
```
□ Is frontend NotificationCenter mounted?
  Check: src/App.js
  Should have: <NotificationCenter />

□ Is polling running?
  Browser DevTools → Network tab
  Filter "unread_count"
  Should see GET requests every ~30 seconds

□ Is correct user logged in?
  Check: Who is notification.user?
  Must match current logged-in user

□ Is API token valid?
  Check: API returns 401 or 403?
  If so: get new token

□ Is response correct?
  Check: API returns {"unread_count": 1}?
  Or is it returning empty list?

□ Is state updating in React?
  Check: src/components/NotificationCenter.js
  Should have: setUnreadCount(response.data.unread_count)
```

---

## Signal Handler Entry Points

### How Signals Are Triggered

```python
# ENTRY POINT 1: API Call
POST/PATCH /api/permits/{id}/

# ENTRY POINT 2: View processes request
class PermitViewSet(viewsets.ModelViewSet):
    def perform_update(self, serializer):
        # ← KEY: Must pass update_fields to save()
        updated_permit.save(update_fields=update_fields)

# ENTRY POINT 3: Django models.py triggers signals
class Permit(models.Model):
    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        # ↓ Signals fire here automatically

# ENTRY POINT 4: Signal handlers execute
@receiver(pre_save, sender=Permit)   # Fires first
@receiver(post_save, sender=Permit)  # Fires second

# ENTRY POINT 5: Notifications sent
NotificationEmailService.send_permit_status_changed_email()
```

---

## Testing Notifications Directly

### Test 1: Assignment Notification

```bash
#!/bin/bash
TOKEN="your_token"
PERMIT_ID=1
USER_ID=2

# Find unassigned permit first
curl -s "http://localhost:8000/api/permits/?assigned_to__isnull=true" \
  -H "Authorization: Bearer $TOKEN" | head -20

# Assign it
curl -X PATCH "http://localhost:8000/api/permits/$PERMIT_ID/" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"assigned_to\": $USER_ID}"

# Check notification was created
curl "http://localhost:8000/api/notifications/" \
  -H "Authorization: Bearer $TOKEN" | python -m json.tool | head -30
```

### Test 2: Status Change Notification

```bash
#!/bin/bash
TOKEN="your_token"
PERMIT_ID=1

# Get current status
curl "http://localhost:8000/api/permits/$PERMIT_ID/" \
  -H "Authorization: Bearer $TOKEN" | \
  python -c "import sys, json; print(json.load(sys.stdin)['status'])"

# Change it
curl -X PATCH "http://localhost:8000/api/permits/$PERMIT_ID/" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "active"}'

# Watch django console for:
# [STATUS_CHANGE] Permit ...: draft → active
# Email to user ✅

# Check API
curl "http://localhost:8000/api/notifications/?ordering=-created_at" \
  -H "Authorization: Bearer $TOKEN" | python -m json.tool | head -50
```

### Test 3: Check Email Backend

```bash
python manage.py shell

# Check backend
from django.conf import settings
print(settings.EMAIL_BACKEND)
# Should show: django.core.mail.backends.console.EmailBackend

# Test send_mail
from django.core.mail import send_mail
result = send_mail(
    'Test Subject',
    'Test message',
    'from@example.com',
    ['to@example.com'],
)
print(result)  # Should print: 1 (success)
```

### Test 4: Database Check

```bash
python manage.py shell

from permits.models import Permit, Notification

# Recent permits
Permit.objects.all().order_by('-updated_at')[0:3]

# Recent notifications
Notification.objects.all().order_by('-created_at')[0:3]

# Check specific permit
p = Permit.objects.get(id=1)
print(f"Status: {p.status}")
print(f"Assigned to: {p.assigned_to}")
print(f"Owner email: {p.owner_email}")

# Check notifications for this permit
Notification.objects.filter(permit=p).count()
```

---

## Signal Firing Order (Critical!)

**IMPORTANT: Understanding the exact order prevents bugs**

```
When you call: permit.save(update_fields=['status'])

Order of execution:
1. Django's Model.save() starts
   ↓
2. ♦ PRE_SAVE SIGNAL FIRES ♦
   └─ Instance exists in memory: old data
   └─ Database still has old data
   └─ store_permit_initial_state() captures old status HERE
   ↓
3. Django validates (if needed)
   ↓
4. Database UPDATE executed
   └─ Old data in DB replaced with new data
   ↓
5. ♦ POST_SAVE SIGNAL FIRES ♦
   └─ Instance in memory: new data
   └─ Database now has: new data
   └─ send_notification_on_status_change() compares old vs new HERE
   ↓
6. Model.save() returns
```

**Why this matters:**

```python
# ✓ CORRECT approach
@receiver(pre_save, sender=Permit)
def get_old_state(sender, instance, **kwargs):
    # ✓ Pre-save = get old data BEFORE update
    old_instance = Permit.objects.get(pk=instance.pk)
    store_old_state(old_instance.status)

@receiver(post_save, sender=Permit)
def compare_states(sender, instance, **kwargs):
    # ✓ Post-save = compare old (stored) vs new (in instance)
    new_status = instance.status
    old_status = get_stored_old_state()
    
# ❌ WRONG approach
@receiver(post_save, sender=Permit)
def wrong_way(sender, instance, **kwargs):
    # ❌ This won't work - database already updated!
    old_data = Permit.objects.get(pk=instance.pk)
    # old_data.status == instance.status (both new!)
```

---

## Configuration Verification

### Check Email Backend

**File: config/config/settings.py**

```python
# For Development (Console):
EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'
# Emails print to console - no config needed

# For Production (SMTP):
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = os.getenv('EMAIL_HOST', 'smtp.gmail.com')
EMAIL_PORT = os.getenv('EMAIL_PORT', 587)
EMAIL_USE_TLS = os.getenv('EMAIL_USE_TLS', True)
EMAIL_HOST_USER = os.getenv('EMAIL_HOST_USER')
EMAIL_HOST_PASSWORD = os.getenv('EMAIL_HOST_PASSWORD')
DEFAULT_FROM_EMAIL = os.getenv('DEFAULT_FROM_EMAIL', 'noreply@example.com')
```

### Check Signals Import

**File: config/permits/apps.py**

```python
class PermitsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'permits'
    
    def ready(self):
        import permits.signals  # ← CRITICAL: Import signals here
```

### Check update_fields Passing

**File: config/permits/views.py (line ~1005)**

```python
def perform_update(self, serializer):
    # Must track which fields changed
    old_data = PermitSerializer(self.get_object()).data
    
    # Collect changed fields
    update_fields = []
    for field_name in serializer.validated_data.keys():
        if old_data.get(field_name) != serializer.validated_data[field_name]:
            update_fields.append(field_name)
    
    # KEY LINE:
    updated_permit = serializer.save()
    updated_permit.save(update_fields=update_fields)  # ← Tell signals what changed
```

---

## Summary: Notification Timing

```
WHAT                          WHEN              WHERE
─────────────────────────────────────────────────────────
Permit Assigned               Immediately       signal.post_save
Status Changed                Immediately       signal.post_save
Email Sent                    ~1-5ms later      signal handler
Notification Created (DB)     ~1-5ms later      signal handler
Frontend Sees Badge           ~30-60s later     polling
User Sees Dropdown            When clicks bell  React state
```

**Key Insight**: Notifications are created and emails sent INSTANTLY (within signal execution). Frontend lag is due to 30-second polling interval.

---

## One-Line Verification

```bash
# Is permit assigned?
curl http://localhost:8000/api/permits/1/ -H "Auth: Bearer TOKEN" | grep assigned_to

# Do you have notifications?
curl http://localhost:8000/api/notifications/ -H "Auth: Bearer TOKEN" | grep -c permit_status

# Is signal log appearing?
# (Watch Django console while changing permit status)

# Did email send?
# (Check console output for "Email to ..." lines)
```

---

**Status**: ✅ Notification system fully documented and tested
