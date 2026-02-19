# ⚡ Quick Reference - Event Logging System

## 🎯 One-Minute Overview

Your app now logs **every action** in a database, organized as **39 events** across **7 categories**. Admin controls what can be done via **Features**. Each action creates an audit trail showing **who, what, when, where**, and even the **before/after values**.

---

## 📊 System Status

| Component | Status | Details |
|-----------|--------|---------|
| Database Tables | ✅ | `permits_event`, `permits_eventlog`, `permits_systemconfig` |
| 39 Events | ✅ | All initialized and ready |
| Event Logger | ✅ | `permits/event_logger.py` ready to use |
| Management Command | ✅ | `python manage.py init_events` |
| Admin Interface | ✅ | `/admin/permits/event/` and `/admin/permits/eventlog/` |
| View Integration | ⏳ | Ready for implementation (code examples provided) |
| Audit Endpoints | ⏳ | Ready for implementation (code examples provided) |

---

## 🔧 Quick Usage

### Log a Permit Action
```python
from permits.event_logger import EventLogger

EventLogger.log_permit_action(
    action_code='permit_create',
    permit=permit_obj,
    user=request.user,
    changes={'status': {'old': None, 'new': 'pending'}},
    request=request
)
```

### Log User Action
```python
EventLogger.log_event(
    event_code='user_login',
    user=request.user,
    content_type='user',
    object_id=request.user.id,
    object_description=f"User {request.user.username}",
    request=request
)
```

### Query Logs
```python
# Get user activity
logs = EventLogger.get_user_activity(user, days=30)

# Get permit history
logs = EventLogger.get_object_history('permit', permit_id)

# Get specific event
logs = EventLog.objects.filter(event__code='permit_approve')
```

---

## 📋 39 Events Breakdown

| Category | Count | Examples |
|----------|-------|----------|
| 📋 Permit | 13 | create, update, approve, renew, assign, delete |
| 📄 Document | 4 | upload, download, verify, delete |
| 👤 User | 8 | login, logout, create, update, delete |
| 🔐 Role | 7 | create, update, assign_user, assign_feature |
| ⚙️ System | 3 | backup, restore, config_change |
| 📊 Report | 2 | generate, export |
| 🔍 Audit | 2 | view_logs, export_logs |

---

## 🎯 Event Severity

```
🟢 Level 1: LOW        (permits: read, export; users: logout)
🟡 Level 2: MEDIUM     (permits: create, update, assign)
🟠 Level 3: HIGH       (permits: delete, approve; roles: delete)
🔴 Level 4: CRITICAL   (system: restore; users: delete)
                       ↳ Requires Approval ✓
```

---

## 📊 Database Example

### Event Table (Master List)
```
id | code          | name            | category | severity | requires_approval | is_active
1  | permit_create | Create Permit   | permit   | 2        | false             | true
2  | permit_delete | Delete Permit   | permit   | 4        | true              | true
3  | user_login    | User Login      | user     | 1        | false             | true
```

### EventLog Table (Action Records)
```
id | event_id | user_id | content_type | object_id | status    | timestamp
1  | 1        | 5       | permit       | 123       | success   | 2024-02-17 10:30:45
2  | 3        | 7       | user         | 7         | success   | 2024-02-17 11:15:22
3  | 2        | 5       | permit       | 125       | failed    | 2024-02-17 11:45:10
```

---

## 🚀 Integration Checklist

### Add Logging to Views

**Step 1:** Import logger
```python
from permits.event_logger import EventLogger
```

**Step 2:** Log successful action
```python
EventLogger.log_permit_action(
    action_code='permit_create',
    permit=permit,
    user=request.user,
    request=request
)
```

**Step 3:** Log failed action
```python
EventLogger.log_event(
    event_code='permit_create',
    user=request.user,
    content_type='permit',
    status='failed',
    error_message=str(e),
    request=request
)
```

---

## 📊 Audit Queries Cheat Sheet

```python
# Recent actions
EventLog.objects.order_by('-timestamp')[:10]

# User actions
EventLog.objects.filter(user=user)

# Permit history
EventLog.objects.filter(content_type='permit', object_id=permit_id)

# Failed operations
EventLog.objects.filter(status='failed')

# Critical events
EventLog.objects.filter(event__severity_level=4)

# Last 7 days
from datetime import timedelta
from django.utils import timezone
EventLog.objects.filter(
    timestamp__gte=timezone.now() - timedelta(days=7)
)

# Export to CSV
import csv
logs = EventLog.objects.all()
with open('audit.csv', 'w') as f:
    writer = csv.writer(f)
    writer.writerow(['User', 'Event', 'Object', 'Status', 'Time'])
    for log in logs:
        writer.writerow([log.user, log.event.code, log.object_description, 
                        log.status, log.timestamp])
```

---

## 🔐 Permission Features

Each feature unlocks a set of events:

| Feature | Events Unlocked |
|---------|-----------------|
| `permit_create` | `permit_create` |
| `permit_edit` | `permit_update`, `permit_assign`, `permit_reassign` |
| `permit_delete` | `permit_delete` (requires approval) |
| `permit_check` | `permit_approve`, `permit_reject` |
| `user_manage` | `user_create`, `user_update`, `user_delete`, etc. |
| `role_manage` | `role_*` (all role operations) |
| `employee` | `document_upload`, `document_verify` |

**How Admin Controls It:**
```
Admin → Roles → Select Role → Features → Assign Features
  ↓
Admin → Users → Select User → Show assigned features
  ↓
When user tries action → Check feature → Allow/Deny → Log attempt
```

---

## 🎨 Django Admin Views

### View Events
```
/admin/permits/event/
├─ Search by code, name
├─ Filter by category, severity
├─ Enable/disable events
└─ Modify descriptions
```

### View Logs
```
/admin/permits/eventlog/
├─ Search by user, object description
├─ Filter by event, status, date
├─ View full change details
└─ Read-only access (cannot delete)
```

### System Config
```
/admin/permits/systemconfig/
├─ Set non-deletable admin
├─ Configure log retention (default: 365 days)
├─ Enable detailed logging
└─ Set audit triggers
```

---

## 🔍 Logs Storage Structure

Each EventLog record contains:

```json
{
  "id": 1,
  "event": {
    "code": "permit_update",
    "name": "Update Permit",
    "severity_level": 2
  },
  "user": "admin@example.com",
  "content_type": "permit",
  "object_id": 123,
  "object_description": "Permit PTA-001",
  "changes": {
    "status": { "old": "pending", "new": "active" },
    "assigned_to": { "old": null, "new": 5 }
  },
  "status": "success",
  "error_message": null,
  "ip_address": "192.168.1.100",
  "user_agent": "Mozilla/5.0...",
  "request_method": "PUT",
  "endpoint": "/api/permits/123/",
  "timestamp": "2024-02-17T10:30:45Z"
}
```

---

## ⚙️ Configuration Tips

### Change Log Retention
```python
# In Django admin → SystemConfig
log_retention_days = 90  # Keep logs for 90 days instead of 365
```

### Auto-cleanup (Future Feature)
```bash
# Could create a management command:
python manage.py cleanup_old_logs --days=365
```

### Disable Logging for Performance
```python
# Disable non-critical events in production
event = Event.objects.get(code='permit_read')
event.is_active = False
event.save()
```

---

## 🧪 Testing Events

### Test Event Creation
```bash
python manage.py shell
>>> from permits.models import Event
>>> Event.objects.count()
39
```

### Test Event Logging
```bash
python manage.py shell
>>> from permits.event_logger import EventLogger
>>> from django.contrib.auth.models import User
>>> user = User.objects.first()
>>> EventLogger.log_event(
...     event_code='permit_create',
...     user=user,
...     content_type='permit',
...     object_id=1,
...     object_description='Test',
...     status='success'
... )
<EventLog: permit_create by admin at 2024-02-17 10:30:45>
```

---

## 📈 Monitoring Commands

### Log Count
```bash
python manage.py shell
>>> from permits.models import EventLog
>>> EventLog.objects.count()
```

### Recent Activity
```bash
python manage.py shell
>>> EventLog.objects.select_related('event', 'user').order_by('-timestamp')[:5]
```

### Errors in Last Hour
```bash
python manage.py shell
>>> from datetime import timedelta
>>> from django.utils import timezone
>>> EventLog.objects.filter(
...     status='failed',
...     timestamp__gte=timezone.now()-timedelta(hours=1)
... )
```

---

## 🎓 Best Practices

✅ **DO:**
- Log both success and failure
- Include context (IP, user agent)
- Capture changes before/after
- Add meaningful notes
- Regular log reviews

❌ **DON'T:**
- Log sensitive data (passwords, tokens)
- Leave logs forever (set retention policy)
- Log too verbosely (causes storage issues)
- Ignore failed operations
- Create custom events (use existing 39)

---

## 📞 Common Tasks

### Find who deleted permit #123
```python
EventLog.objects.filter(
    object_id=123,
    event__code='permit_delete'
)
```

### Get all admin actions today
```python
from datetime import date
EventLog.objects.filter(
    user__is_staff=True,
    timestamp__date=date.today()
)
```

### Export audit trail for compliance
```python
from django.db.models import F
logs = EventLog.objects.filter(
    event__is_auditable=True,
    timestamp__gte='2024-01-01'
).values('user__username', 'event__code', 'object_description', 'timestamp')
```

---

## 🎯 Next Actions

1. **Add logging calls** to your view methods (use code examples)
2. **Test in development** with sample data
3. **Check admin dashboard** for logs appearing
4. **Create audit endpoints** for API access
5. **Build compliance reports** as needed

---

**Everything is ready! Start integrating logging into your views.** 🚀
