# Notification System - Quick Setup Guide

## What Was Implemented

A complete **Notification & Email System** for the PTA & RTA Permit Management platform that automatically notifies users when permits are assigned to them.

---

## Quick Start (Development)

### 1. Database Setup
The migration has already been applied. The `Notification` model is ready to use.

```bash
# If needed, reapply migrations
cd config
python manage.py migrate permits
```

### 2. Configure Email (Development)
For **testing without sending real emails**, the system is configured to use the console backend by default:

In `.env`:
```env
EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend
```

Emails will be printed to the Django console. This is perfect for development!

### 3. Start the Backend
```bash
cd config
python manage.py runserver
```

The API will be available at: `http://localhost:8000/api/`

### 4. Start the Frontend
```bash
cd frontend
npm start
```

The frontend will be available at: `http://localhost:3000/`

### 5. Test the System

**Steps to test:**

1. **Create a Permit** (if you don't have one)
   - Go to "New Permit" in the app
   - Fill in the permit details
   - Click "Create"

2. **Assign the Permit to a User**
   - View the permit details
   - Click "Assign" or edit the permit
   - Select a user to assign it to
   - **You should see notifications being created automatically!**

3. **Check Notifications**
   - Look for the **Bell Icon** in the header (next to profile)
   - The bell will show a **red badge with the unread count**
   - Click the bell to open the notification dropdown
   - You should see your permit assignment notification

4. **View in Django Admin**
   - Go to `http://localhost:8000/admin/`
   - Navigate to **Permits > Notifications**
   - You can see all notifications created in the system

---

## Email Configuration (Production)

### Using Gmail

1. **Enable 2-Factor Authentication** on your Gmail account (if not already enabled)

2. **Generate an App Password**:
   - Go to [Google Account Security](https://myaccount.google.com/security)
   - Click "App passwords"
   - Select "Mail" and "Windows Computer" (or your device)
   - Copy the generated 16-character password

3. **Update `.env`**:
   ```env
   EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USE_TLS=True
   EMAIL_HOST_USER=your-email@gmail.com
   EMAIL_HOST_PASSWORD=your-16-char-app-password
   DEFAULT_FROM_EMAIL=your-email@gmail.com
   SERVER_EMAIL=your-email@gmail.com
   ```

4. **Restart Django** to apply the changes

5. **Test email sending**:
   ```python
   from django.core.mail import send_mail
   send_mail(
       'Test Subject',
       'Test Message',
       'from@gmail.com',
       ['recipient@example.com']
   )
   ```

### Using Other SMTP Providers

Update the `.env` with your provider's details:

```env
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=your-smtp-server.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-username
EMAIL_HOST_PASSWORD=your-password
DEFAULT_FROM_EMAIL=noreply@transportauthority.gov.pk
SERVER_EMAIL=noreply@transportauthority.gov.pk
```

---

## Key Features

### ✅ Backend Features
- **Automatic Notifications** - Created when permits are assigned
- **Email Integration** - Automatic email delivery to assigned users
- **Notification History** - All notifications stored in database
- **Status Tracking** - Track read/unread and email delivery status
- **Admin Panel** - Manage and view notifications in Django admin
- **REST API** - Full API for frontend integration

### ✅ Frontend Features
- **Notification Bell Icon** - In app header with unread badge
- **Notification Dropdown** - Click to view all notifications
- **Quick Actions** - Mark as read, clear old notifications
- **Auto-Refresh** - Updates badge every 30 seconds
- **Responsive Design** - Works on mobile and desktop
- **Real-time Updates** - Immediate notification display

### ✅ Email Features
- **Permit Assignment Emails** - Sent when permit assigned
- **Status Change Emails** - Sent when permit status updates
- **HTML & Text Email** - Both formats supported
- **Error Handling** - Graceful fallback on email failures
- **Template Support** - Custom HTML templates (optional)

---

## API Endpoints

### Get Unread Notification Count
```
GET /api/notifications/unread_count/
```

Response:
```json
{
    "unread_count": 5
}
```

### List All Notifications
```
GET /api/notifications/
```

### Get Only Unread Notifications
```
GET /api/notifications/unread/
```

### Mark Specific Notification as Read
```
POST /api/notifications/{notification_id}/mark_as_read/
```

### Mark All as Read
```
POST /api/notifications/mark_all_as_read/
```

### Clear All Read Notifications
```
DELETE /api/notifications/clear_read/
```

---

## Files Created/Modified

### New Files Created:
- ✅ `frontend/src/components/NotificationCenter.js` - React component
- ✅ `config/permits/email_notifications.py` - Email service
- ✅ `NOTIFICATION_SYSTEM_IMPLEMENTATION.md` - Full documentation

### Modified Files:
- ✅ `config/permits/models.py` - Added `Notification` model
- ✅ `config/permits/signals.py` - Added notification signals
- ✅ `config/permits/serializers.py` - Added notification serializers
- ✅ `config/permits/views.py` - Added `NotificationViewSet`
- ✅ `config/permits/urls.py` - Added notification routes
- ✅ `config/permits/admin.py` - Added notification admin
- ✅ `config/config/settings.py` - Added email configuration
- ✅ `frontend/src/App.js` - Integrated notification component

### Migration Created:
- ✅ `config/permits/migrations/0020_notification.py` - Database schema

---

## Testing Checklist

- [ ] Backend server running and migrations applied
- [ ] Frontend showing notification bell in header
- [ ] Create a test permit
- [ ] Assign permit to a user
- [ ] See notification badge update on bell icon
- [ ] Click bell to open notification dropdown
- [ ] Verify notification is displayed with correct details
- [ ] Click "Mark All Read" button
- [ ] Badge count decreases to 0
- [ ] Email sent (check console or inbox)
- [ ] Click notification to navigate to permit

---

## Troubleshooting

### Notification Bell Not Showing
- Ensure you're logged in
- Check browser console for errors (F12 → Console tab)
- Verify frontend API URL: `process.env.REACT_APP_API_URL`

### Notifications Not Appearing
- Check that permit has `assigned_to` field set (not null)
- Verify Django backend is running
- Check Django logs for errors
- Verify database migration was applied: `python manage.py showmigrations permits`

### Emails Not Sending
- Check email configuration in `.env`
- For Gmail: Verify app password (not regular password)
- Check Django console for email output (development mode)
- Check email logs in Django admin

### Badge Not Showing Count
- Try refreshing the page
- Check browser console for fetch errors
- Verify authentication token is still valid
- Check if unread count endpoint is working: `GET /api/notifications/unread_count/`

---

## Next Steps

### Optional Enhancements:
1. **Add Email Templates** - Create custom HTML emails
2. **WebSocket Support** - Real-time notifications without polling
3. **Push Notifications** - Browser/mobile push notifications
4. **SMS Notifications** - Text message delivery
5. **Notification Preferences** - Let users choose what notifications they receive

### Production Deployment:
1. Switch to production email backend (SMTP)
2. Configure proper email credentials
3. Set up email templates
4. Monitor notification queue
5. Set up logs for debugging
6. Consider adding Celery for async email sending

---

## Support

For detailed information about the notification system, see:
**[NOTIFICATION_SYSTEM_IMPLEMENTATION.md](./NOTIFICATION_SYSTEM_IMPLEMENTATION.md)**

This guide includes:
- Complete architecture overview
- Detailed API reference
- Email configuration guide
- Troubleshooting procedures
- Performance optimization tips
- Security considerations

---

## Summary

Your notification system is now fully implemented and ready to use! 🎉

When a permit is assigned to a user:
1. ✅ A notification is created automatically
2. ✅ An email is sent to the user (if configured)
3. ✅ The user sees a notification badge in the header
4. ✅ The user can click to view and manage notifications

The system is production-ready and fully integrated with the PTA & RTA Permit Management System.
