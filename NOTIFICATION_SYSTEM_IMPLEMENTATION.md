# Notification System Implementation Guide

## Overview
A comprehensive notification system has been implemented for the PTA & RTA Permit Management System that automatically sends notifications and emails to users when permits are assigned to them. The system includes:

- **In-app notifications** displayed in the header with a notification center
- **Email notifications** sent to users with permit information
- **Database persistence** of all notifications for history tracking
- **Real-time notification badges** showing unread notification counts
- **Notification management** features (mark as read, clear old notifications)

---

## System Architecture

### Backend Components

#### 1. Notification Model (`permits/models.py`)
```python
class Notification(models.Model):
    # Fields
    user                - ForeignKey to User
    notification_type   - Choice field (permit_assigned, permit_status_changed, etc.)
    title               - Short notification title
    message             - Full notification message
    permit              - Related permit (ForeignKey)
    is_read             - Boolean flag for read status
    read_at             - Timestamp when notification was read
    email_sent          - Boolean flag for email delivery
    email_sent_at       - Timestamp when email was sent
    action_url          - URL to navigate to related permit
    created_at          - Timestamp when created
    updated_at          - Timestamp when updated
```

**Notification Types:**
- `permit_assigned` - When a permit is assigned to a user
- `permit_status_changed` - When a permit's status changes
- `permit_updated` - When a permit is updated
- `system_info` - General system information
- `alert` - System alerts
- `reminder` - Reminders

#### 2. Email Notifications Service (`permits/email_notifications.py`)
Handles all email sending with methods:

- `send_permit_assigned_email()` - Sends email when permit is assigned
- `send_permit_status_changed_email()` - Sends email on status changes
- `send_generic_notification_email()` - Generic email sender

**Features:**
- HTML and plain text email support
- Template rendering (if templates exist)
- Error handling and logging
- Configurable from email address

#### 3. Signals (`permits/signals.py`)
Automatic triggers on permit changes:

- `send_notification_on_permit_assignment()` - Triggered when `assigned_to` field changes
- `send_notification_on_status_change()` - Triggered when `status` field changes

**Process:**
1. Signal detects field change
2. In-app notification created in database
3. Email sent asynchronously
4. Notification status updated with email delivery info

#### 4. API Serializers (`permits/serializers.py`)
- `NotificationSerializer` - Full notification details
- `NotificationListSerializer` - Simplified list view
- `NotificationMarkReadSerializer` - For marking read/unread

#### 5. API ViewSet (`permits/views.py`)
```python
class NotificationViewSet(viewsets.ModelViewSet)
```

**Endpoints:**
- `GET /api/notifications/` - List all notifications for current user
- `GET /api/notifications/unread_count/` - Get count of unread notifications
- `GET /api/notifications/unread/` - Get only unread notifications
- `POST /api/notifications/{id}/mark_as_read/` - Mark specific notification as read
- `POST /api/notifications/{id}/mark_as_unread/` - Mark specific notification as unread
- `POST /api/notifications/mark_all_as_read/` - Mark all as read in one call
- `DELETE /api/notifications/clear_read/` - Delete all read notifications

#### 6. URL Configuration (`permits/urls.py`)
Notification endpoints registered with:
```python
router.register(r'notifications', NotificationViewSet, basename='notification')
```

### Frontend Components

#### NotificationCenter Component (`frontend/src/components/NotificationCenter.js`)

A complete React component featuring:

**Features:**
- Bell icon with unread badge in header
- Dropdown notification list
- Notification details with formatted timestamps
- Mark as read/unread functionality
- Clear read notifications
- Responsive design
- Auto-refresh via polling (30-second interval)
- Error handling

**State Management:**
- Notifications array
- Unread count
- Loading states
- Error messages

**Polling Updates:**
Updates unread count every 30 seconds to keep badge current

#### Integration in App Header
Added to the main `App.js` AppBar component:
```javascript
<NotificationCenter />
```

Located between the app title and user profile menu

---

## Email Configuration

### Development Setup (Console Backend)
Default configuration uses console backend for testing:
```env
EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend
```
Emails will be printed to console instead of being sent.

### Production Setup (SMTP)
For sending real emails, configure in `.env`:

```env
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
DEFAULT_FROM_EMAIL=noreply@transportauthority.gov.pk
SERVER_EMAIL=noreply@transportauthority.gov.pk
```

**For Gmail:**
1. Enable 2-factor authentication
2. Generate an [App Password](https://support.google.com/accounts/answer/185833)
3. Use the app password in `EMAIL_HOST_PASSWORD`

**For Other SMTP Providers:**
- Update `EMAIL_HOST` with provider's SMTP server
- Update `EMAIL_PORT` (usually 587 for TLS or 465 for SSL)
- Set `EMAIL_USE_TLS` accordingly

### Email Templates
Custom email templates can be created at:
```
permits/templates/emails/permit_assigned.html
permits/templates/emails/permit_status_changed.html
```

The system will use these if they exist, otherwise falls back to plain text.

---

## Database Changes

### New Migration
A migration was created: `permits/migrations/0020_notification.py`

This creates the `permits_notification` table with:
- User relationship (ForeignKey)
- Permit relationship (ForeignKey)
- Notification type enumeration
- Read status tracking
- Email delivery tracking
- Indexes for performance optimization

### Admin Panel Registration
Notifications are registered in Django admin (`/admin/permits/notification/`):
- View all notifications
- Filter by type, read status, email status
- Search by title, message, user, permit number
- Readonly fields prevent modification of core data
- Manually creating notifications disabled (system only)

---

## Usage Flow

### When a Permit is Assigned:
1. Admin/Supervisor updates `assigned_to` field on a Permit
2. Signal `send_notification_on_permit_assignment()` triggers
3. `Notification` record created in database
4. `NotificationEmailService.send_permit_assigned_email()` called
5. Email sent to assigned user (if email configured)
6. Notification marked with `email_sent` status
7. User sees notification badge in header
8. User can click notification to mark as read or navigate to permit

### When a Permit Status Changes:
1. Permit status updated (e.g., active → expired)
2. Signal `send_notification_on_status_change()` triggers
3. If permit has assigned_to user:
   - Notification created
   - Status change email sent
   - Email status tracked

### Frontend Notification Display:
1. NotificationCenter fetches unread count every 30 seconds
2. Badge shows unread count
3. Click bell icon to open dropdown
4. Dropdown shows:
   - All notifications (paginated)
   - Notification type badge
   - Created timestamp
   - "Mark all read" button
   - "Clear read" button
5. Click notification to mark as read and navigate

---

## API Endpoints Reference

### Authentication
All endpoints require JWT Bearer token:
```
Authorization: Bearer <token>
Content-Type: application/json
```

### List Notifications
```
GET /api/notifications/
```
Returns paginated list of user's notifications.

### Unread Count
```
GET /api/notifications/unread_count/
```
Response:
```json
{
    "unread_count": 5
}
```

### Get Unread Only
```
GET /api/notifications/unread/
```
Returns only unread notifications (no pagination).

### Mark as Read
```
POST /api/notifications/{notification_id}/mark_as_read/
```

### Mark as Unread
```
POST /api/notifications/{notification_id}/mark_as_unread/
```

### Mark All as Read
```
POST /api/notifications/mark_all_as_read/
```
Response:
```json
{
    "marked_as_read_count": 10,
    "message": "10 notifications marked as read"
}
```

### Clear Read Notifications
```
DELETE /api/notifications/clear_read/
```
Response:
```json
{
    "deleted_count": 5,
    "message": "5 read notifications deleted"
}
```

---

## Testing the System

### 1. Create a Test Permit
```bash
POST /api/permits/
{
    "permit_number": "TST-001",
    "authority": "PTA",
    "vehicle_number": "ABC-123",
    "owner_name": "Test Owner",
    "owner_email": "owner@example.com",
    "owner_phone": "03001234567",
    "valid_from": "2024-01-01",
    "valid_to": "2025-01-01"
}
```

### 2. Assign to a User
```bash
PATCH /api/permits/1/
{
    "assigned_to": 2,
    "assigned_by": "Admin User"
}
```

### 3. Check Notifications
```bash
GET /api/notifications/
```

Should see a notification for the assigned user.

### 4. Check Unread Count
```bash
GET /api/notifications/unread_count/
```

Should show count of unread notifications.

### 5. Test Email (if configured)
Check email inbox or console for notification email with permit details.

### 6. Mark as Read
```bash
POST /api/notifications/1/mark_as_read/
```

### 7. Frontend Test
1. Log in as the assigned user
2. See notification bell badge in header
3. Click bell to open notification dropdown
4. Click notification to navigate to permit details

---

## Troubleshooting

### Notifications Not Appearing
1. Check if user is properly assigned: `Permit.assigned_to` should not be None
2. Verify signal is connected: Check `permits/apps.py` imports signals
3. Check database migration: Run `python manage.py migrate`
4. Review logs for errors

### Emails Not Sending
1. Development mode: Check console for email output
2. Production: Verify email settings in `.env`
3. Check email logs: `EventLog` records may have email send errors
4. Test SMTP connection:
```python
from django.core.mail import send_mail
send_mail(
    'Test Subject',
    'Test Message',
    'from@example.com',
    ['to@example.com'],
    fail_silently=False
)
```

### Notification Badge Not Updating
1. Check browser console for fetch errors
2. Verify authentication token is valid
3. Check CORS settings in `settings.py`
4. Verify user owns the notifications being fetched

### Performance Issues
1. Consider reducing polling interval if preferred
2. Add pagination to notification list queries
3. Implement websockets for real-time updates (optional enhancement)

---

## Future Enhancements

### Potential Improvements:
1. **WebSocket Integration** - Real-time notifications without polling
2. **Push Notifications** - Mobile/browser push notifications
3. **Notification Preferences** - Users can choose notification types
4. **Email Templates** - Custom HTML email designs
5. **SMS Notifications** - Text message delivery
6. **Notification Groups** - Related notifications grouped together
7. **Bulk Operations** - Archive/delete multiple notifications
8. **Notification Analytics** - Track read rates, engagement

---

## Security Considerations

1. **User Isolation** - Users only see their own notifications
2. **Permission Checks** - API endpoints check `request.user` ownership
3. **Token Authentication** - All endpoints require JWT token
4. **Email Validation** - Email addresses validated before sending
5. **SQL Injection Prevention** - ORM prevents injection attacks
6. **Rate Limiting** - Global rate limiting applied to all endpoints

---

## Performance Optimization

### Database Indexes
Notification model includes indexes on:
- `(user, created_at)` - For user's notification list
- `(user, is_read, created_at)` - For unread count queries
- `(notification_type, created_at)` - For filtering by type

### API Performance
- Pagination support (20 items per page by default)
- Separate unread list endpoint for quick fetches
- Unread count endpoint for lightweight badge update

### Frontend Optimization
- Polling interval set to 30 seconds (configurable)
- Component-level error handling
- Loading states prevent duplicate requests
- Efficient state updates

---

## Support & Maintenance

### Logging
All email operations logged to:
- `permits/email_notifications.py` - Email service logs
- `permits/signals.py` - Signal handling logs
- EventLog table - System event tracking

### Monitoring
Check Django logs for:
```bash
tail -f /path/to/django.log | grep "NOTIFICATION\|EMAIL"
```

### Database Cleanup
Remove old read notifications:
```python
from permits.models import Notification
from datetime import timedelta
from django.utils import timezone

old_date = timezone.now() - timedelta(days=30)
Notification.objects.filter(
    is_read=True,
    read_at__lt=old_date
).delete()
```

---

## Summary

The notification system provides:
✅ Automatic notifications on permit assignment
✅ Email delivery to assigned users
✅ Persistent notification history
✅ Real-time notification badges
✅ RESTful API for notification management
✅ React component for UI integration
✅ Full audit trail of notifications
✅ Configurable email backend
✅ Production-ready implementation

The system is fully integrated and ready for use in development and production environments.
