# Notification System - API Testing Guide

Complete guide to test the notification system using API calls.

---

## Prerequisites

1. Django server running: `python manage.py runserver`
2. Have a valid JWT token
3. Have a permit that is already assigned to a user

### Get JWT Token

```bash
# Get your token
curl -X POST "http://localhost:8000/api/token/" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "your_username",
    "password": "your_password"
  }'
```

**Response:**
```json
{
  "access": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Store the `access` token** for all subsequent requests. Use it as:
```bash
-H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## API Endpoints

### 1. Get Unread Notification Count

**Endpoint:** `GET /api/notifications/unread_count/`

```bash
curl -X GET "http://localhost:8000/api/notifications/unread_count/" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Response:**
```json
{
  "unread_count": 0
}
```

**Use Case:** Get badge count for bell icon. Call every 30 seconds for real-time updates.

---

### 2. Get All Notifications

**Endpoint:** `GET /api/notifications/`

```bash
curl -X GET "http://localhost:8000/api/notifications/" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Response:**
```json
{
  "count": 3,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": 3,
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
    },
    {
      "id": 2,
      "user": 2,
      "user_username": "api_user",
      "notification_type": "permit_assigned",
      "title": "Permit Assigned: TRN-001",
      "message": "A permit (TRN-001) has been assigned to you.",
      "permit": 1,
      "permit_number": "TRN-001",
      "is_read": true,
      "read_at": "2026-02-19T10:30:00Z",
      "email_sent": true,
      "email_sent_at": "2026-02-19T10:25:00Z",
      "action_url": "/permits/1",
      "created_at": "2026-02-19T10:25:00Z",
      "updated_at": "2026-02-19T10:30:00Z"
    }
  ]
}
```

**Query Parameters:**
```bash
# Get unread only
curl -X GET "http://localhost:8000/api/notifications/?is_read=false" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# Get specific notification type
curl -X GET "http://localhost:8000/api/notifications/?notification_type=permit_assigned" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# Get for specific permit
curl -X GET "http://localhost:8000/api/notifications/?permit=1" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# Pagination
curl -X GET "http://localhost:8000/api/notifications/?page=2" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

### 3. Get Unread Notifications Only

**Endpoint:** `GET /api/notifications/unread/`

```bash
curl -X GET "http://localhost:8000/api/notifications/unread/" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Response:**
```json
{
  "count": 1,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": 3,
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

---

### 4. Mark Single Notification as Read

**Endpoint:** `POST /api/notifications/{id}/mark_as_read/`

```bash
curl -X POST "http://localhost:8000/api/notifications/3/mark_as_read/" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}'
```

**Response:**
```json
{
  "id": 3,
  "user": 2,
  "user_username": "api_user",
  "notification_type": "permit_status_changed",
  "title": "Permit Status Changed: TRN-001",
  "message": "Permit TRN-001 status changed from draft to active.",
  "permit": 1,
  "permit_number": "TRN-001",
  "is_read": true,
  "read_at": "2026-02-19T10:40:00Z",
  "email_sent": true,
  "email_sent_at": "2026-02-19T10:35:00.049446Z",
  "action_url": "/permits/1",
  "created_at": "2026-02-19T10:35:00.043704Z",
  "updated_at": "2026-02-19T10:40:00Z"
}
```

**Note:** `is_read` is now `true` and `read_at` is set to current time.

---

### 5. Mark All Notifications as Read

**Endpoint:** `POST /api/notifications/mark_all_as_read/`

```bash
curl -X POST "http://localhost:8000/api/notifications/mark_all_as_read/" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}'
```

**Response:**
```json
{
  "updated_count": 2
}
```

All unread notifications are now marked as read.

---

### 6. Clear All Read Notifications

**Endpoint:** `POST /api/notifications/clear_read/`

Deletes all already-read notifications for the current user.

```bash
curl -X POST "http://localhost:8000/api/notifications/clear_read/" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}'
```

**Response:**
```json
{
  "deleted_count": 2
}
```

Only read notifications are deleted. Unread notifications remain.

---

## Test Scenarios

### Scenario 1: Assign a Permit and Receive Notification

#### Step 1: Get a Permit

```bash
curl -X GET "http://localhost:8000/api/permits/" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" | head -100
```

**Find one with `assigned_to: null`** - Write down the ID.

#### Step 2: Get a User to Assign To

```bash
curl -X GET "http://localhost:8000/api/users/" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Get a user ID** (e.g., 2).

#### Step 3: Check Unread Count Before

```bash
curl -X GET "http://localhost:8000/api/notifications/unread_count/" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Expected:** `{"unread_count": N}` (some number)

#### Step 4: Assign the Permit

Replace `PERMIT_ID` with actual permit ID and `USER_ID` with user ID:

```bash
curl -X PATCH "http://localhost:8000/api/permits/PERMIT_ID/" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "assigned_to": USER_ID
  }'
```

**Behind the Scenes:**
- ✅ pre_save signal fires (no-op for assignment)
- ✅ Permit updated with assigned_to = USER_ID
- ✅ post_save signal fires
- ✅ Checks: 'assigned_to' in update_fields? ✅
- ✅ Creates Notification
- ✅ Sends email

#### Step 5: Check Unread Count After

```bash
curl -X GET "http://localhost:8000/api/notifications/unread_count/" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Expected:** `{"unread_count": N+1}` (count increased by 1)

#### Step 6: View New Notification

```bash
curl -X GET "http://localhost:8000/api/notifications/unread/" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Expected to see:**
```json
{
  "notification_type": "permit_assigned",
  "title": "Permit Assigned: [PERMIT_NUMBER]",
  "message": "A permit ([PERMIT_NUMBER]) has been assigned to you.",
  "is_read": false,
  "email_sent": true
}
```

#### Step 7: Check Django Console

Look for in Django logs:
```
[PERMIT_ASSIGNED] Permit [NUMBER]: Assigned to user [USERNAME]
Email to [email@domain.com]: ✅ Sent
```

---

### Scenario 2: Change Permit Status and Get Notifications

#### Step 1: Find an Assigned Permit

```bash
curl -X GET "http://localhost:8000/api/permits/?assigned_to=2" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Get permit ID with an assigned user.**

#### Step 2: Check Initial Status and Notifications

```bash
curl -X GET "http://localhost:8000/api/permits/PERMIT_ID/" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Check:** Current status (e.g., "draft")

```bash
curl -X GET "http://localhost:8000/api/notifications/unread_count/" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Note current count.**

#### Step 3: Change Status to Active

```bash
curl -X PATCH "http://localhost:8000/api/permits/PERMIT_ID/" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "active"}'
```

**Behind the Scenes:**
- ✅ pre_save signal stores: old_state[id] = {'status': 'draft'}
- ✅ Permit updated: status = 'active'
- ✅ post_save signal fires
- ✅ Compares: old_status='draft' vs new_status='active'
- ✅ Creates notification for assigned user
- ✅ Sends email to assigned user
- ✅ Sends email to permit owner (if owner_email exists)

#### Step 4: Check Updated Notification Count

```bash
curl -X GET "http://localhost:8000/api/notifications/unread_count/" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Expected:** Count increased by 1

#### Step 5: View Status Change Notification

```bash
curl -X GET "http://localhost:8000/api/notifications/unread/" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Expected:**
```json
{
  "notification_type": "permit_status_changed",
  "title": "Permit Status Changed: [PERMIT_NUMBER]",
  "message": "Permit [PERMIT_NUMBER] status changed from draft to active.",
  "is_read": false,
  "email_sent": true
}
```

#### Step 6: Check Django Console

Look for TWO emails:
```
[STATUS_CHANGE] Permit [NUMBER]: draft → active
Email to api@transport.local: ✅ Sent (Assigned user)
Email to kwaqas40929@gmail.com: ✅ Sent (Permit owner)
```

#### Step 7: Mark Notification as Read

```bash
curl -X POST "http://localhost:8000/api/notifications/NOTIFY_ID/mark_as_read/" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}'
```

**Check:** `is_read` becomes `true`

#### Step 8: Check Unread Count

```bash
curl -X GET "http://localhost:8000/api/notifications/unread_count/" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Expected:** Count back to original

---

### Scenario 3: Multiple Status Changes

#### Step 1: Change Status Multiple Times

```bash
# First: draft → pending
curl -X PATCH "http://localhost:8000/api/permits/PERMIT_ID/" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "pending"}'

# Second: pending → active
curl -X PATCH "http://localhost:8000/api/permits/PERMIT_ID/" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "active"}'

# Third: active → expired
curl -X PATCH "http://localhost:8000/api/permits/PERMIT_ID/" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "expired"}'

# Fourth: expired → cancelled
curl -X PATCH "http://localhost:8000/api/permits/PERMIT_ID/" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "cancelled"}'
```

#### Step 2: Check All Notifications

```bash
curl -X GET "http://localhost:8000/api/notifications/" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Expected:** 4 new notifications (one for each status change):
- draft → pending
- pending → active
- active → expired
- expired → cancelled

#### Step 3: View Unread Count

```bash
curl -X GET "http://localhost:8000/api/notifications/unread_count/" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Expected:** 4 (or more if previous notifications unread)

---

## Complete Real-World Test Script

Save as `test_notifications_api.sh`:

```bash
#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SERVER="http://localhost:8000"
TOKEN="YOUR_ACCESS_TOKEN_HERE"

echo -e "${BLUE}=== Notification System API Test ===${NC}\n"

# Get initial notification count
echo -e "${BLUE}1. Initial unread count:${NC}"
curl -s -X GET "$SERVER/api/notifications/unread_count/" \
  -H "Authorization: Bearer $TOKEN" | python -m json.tool
echo

# Get initial notifications
echo -e "${BLUE}2. All notifications (before change):${NC}"
curl -s -X GET "$SERVER/api/notifications/" \
  -H "Authorization: Bearer $TOKEN" | python -m json.tool | head -50
echo

# Find a permit to use
echo -e "${BLUE}3. Finding a permit to update...${NC}"
PERMIT_ID=$(curl -s -X GET "$SERVER/api/permits/" \
  -H "Authorization: Bearer $TOKEN" | python -c "import sys, json; d=json.load(sys.stdin); print(d['results'][0]['id'])" 2>/dev/null)
echo -e "${GREEN}Using Permit ID: $PERMIT_ID${NC}"
echo

# Get current permit status
echo -e "${BLUE}4. Current permit status:${NC}"
curl -s -X GET "$SERVER/api/permits/$PERMIT_ID/" \
  -H "Authorization: Bearer $TOKEN" | python -c "import sys, json; d=json.load(sys.stdin); print(f\"Status: {d['status']}, Assigned to: {d.get('assigned_to', 'None')}\")"
echo

# Change status
echo -e "${BLUE}5. Changing permit status to 'active'...${NC}"
curl -s -X PATCH "$SERVER/api/permits/$PERMIT_ID/" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "active"}' | python -m json.tool | head -20
echo

# Wait for notification to be created
echo -e "${BLUE}6. Waiting 2 seconds for notification...${NC}"
sleep 2
echo

# Get updated notification count
echo -e "${BLUE}7. Updated unread count:${NC}"
curl -s -X GET "$SERVER/api/notifications/unread_count/" \
  -H "Authorization: Bearer $TOKEN" | python -m json.tool
echo

# Get latest notification
echo -e "${BLUE}8. Latest notifications:${NC}"
curl -s -X GET "$SERVER/api/notifications/?ordering=-created_at" \
  -H "Authorization: Bearer $TOKEN" | python -m json.tool | head -60
echo

echo -e "${GREEN}=== Test Complete ===${NC}"
```

**Usage:**
```bash
# Replace YOUR_ACCESS_TOKEN_HERE with actual token
chmod +x test_notifications_api.sh
./test_notifications_api.sh
```

---

## Troubleshooting API Calls

### 401 Unauthorized

**Error:**
```json
{"detail":"Invalid token"}
```

**Solution:**
- Token expired? Get new one: `curl -X POST "http://localhost:8000/api/token/" ...`
- Token incorrect? Double-check with copy-paste
- Missing header? Use: `-H "Authorization: Bearer YOUR_TOKEN"`

---

### 404 Not Found

**Error:**
```json
{"detail":"Not found."}
```

**Solution:**
- Wrong notification ID? List all: `GET /api/notifications/`
- Wrong permit ID? List all: `GET /api/permits/`
- Endpoint typo? Check spelling

---

### 400 Bad Request

**Error:**
```json
{"detail":"Invalid request."}
```

**Solution:**
- Missing field? Check required fields
- Invalid JSON? Use `python -m json.tool` to validate
- Wrong content type? Use: `-H "Content-Type: application/json"`

---

### No Notifications Appearing

**Check this:**
1. Is permit assigned to a user? `GET /api/permits/ID/`
2. Are you logged in as the assigned user?
3. Check Django console for signal logs:
   ```
   [STATUS_CHANGE] Permit [...]: [...] → [...]
   ```
4. Try changing status differently:
   ```bash
   curl -X PATCH "http://localhost:8000/api/permits/ID/" \
     -H "Authorization: Bearer TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"status":"inactive"}'
   ```

---

## Summary

**Key API Endpoints:**
- `GET /api/notifications/unread_count/` - Get badge count
- `GET /api/notifications/` - Get all notifications
- `GET /api/notifications/unread/` - Get unread only
- `POST /api/notifications/{id}/mark_as_read/` - Mark as read
- `POST /api/notifications/mark_all_as_read/` - Mark all as read
- `POST /api/notifications/clear_read/` - Delete read notifications

**What Triggers Notifications:**
- ✅ Permit assigned (`assigned_to` changes)
- ✅ Permit status changes (any status → any status)

**Recipients:**
- ✅ Assigned user (in-app + email)
- ✅ Permit owner (email only for status changes)

**Expected Result:**
- In-app notification appears in dropdown
- Bell icon shows badge with count
- Email sent to relevant recipients
- `email_sent: true` in API response
