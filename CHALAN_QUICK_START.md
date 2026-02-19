# Chalan Management System - Quick Start Guide

## 🚀 5-Minute Setup

### What You Need
1. System admin access
2. User roles already created
3. Basic understanding of the RTA PTA system

### Step 1: Verify Installation ✓

The Chalan system is **already installed and ready to use!**

```bash
cd /Users/waqaskhan/Documents/PTA_RTA/config
python manage.py check
# Output: System check identified no issues (0 silenced)
```

### Step 2: Assign Permissions to Roles

Go to **Django Admin** → **Roles**

**Example Setup - Traffic Officer Role:**

1. Click on the role (e.g., "operator")
2. Under "Permissions" section, select:
   - ✓ chalan_view
   - ✓ chalan_create
   - ✓ chalan_edit
   - ✓ chalan_mark_paid
   - ✗ chalan_manage_fees (leave unchecked)

3. Save

**Example Setup - Senior Supervisor Role:**

1. Click on "supervisor" role
2. Select ALL chalan permissions:
   - ✓ chalan_view
   - ✓ chalan_create
   - ✓ chalan_edit
   - ✓ chalan_mark_paid
   - ✓ chalan_manage_fees ← **Fee modification access**

3. Save

---

## 📱 Using the Chalan System

### Via API (REST)

#### 1. Create a Chalan
```bash
curl -X POST http://localhost:8000/api/chalans/ \
  -H "Authorization: Token YOUR_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "owner_name": "Ahmed Ali Khan",
    "owner_cnic": "12345-1234567-1",
    "car_number": "ABC-1234",
    "permit": 1,
    "violation_description": "Speeding on GT Road",
    "fees_amount": "500.00",
    "owner_phone": "03001234567"
  }'
```

**Response:**
```json
{
  "id": 1,
  "chalan_number": "CHL-202601191245-12345",
  "owner_name": "Ahmed Ali Khan",
  "owner_cnic": "12345-1234567-1",
  "car_number": "ABC-1234",
  "status": "pending",
  "fees_amount": "500.00",
  "paid_amount": "0.00",
  "remaining_amount": "500.00",
  "issued_date": "2026-01-19T12:45:30Z"
}
```

#### 2. List All Chalans
```bash
curl -X GET "http://localhost:8000/api/chalans/?search=ABC" \
  -H "Authorization: Token YOUR_API_TOKEN"
```

#### 3. View Chalan Details
```bash
curl -X GET http://localhost:8000/api/chalans/1/ \
  -H "Authorization: Token YOUR_API_TOKEN"
```

#### 4. Update Chalan Details
```bash
curl -X PATCH http://localhost:8000/api/chalans/1/ \
  -H "Authorization: Token YOUR_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "violation_description": "Updated: Speeding and rash driving",
    "remarks": "Second offense from same driver"
  }'
```

#### 5. Update Fees (Senior Only) ⭐
```bash
curl -X PATCH http://localhost:8000/api/chalans/1/update_fees/ \
  -H "Authorization: Token YOUR_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fees_amount": "1000.00"
  }'
```

✅ This works ONLY if user has `chalan_manage_fees` permission

#### 6. Mark as Paid
```bash
curl -X POST http://localhost:8000/api/chalans/1/mark_as_paid/ \
  -H "Authorization: Token YOUR_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "payment_amount": "500.00",
    "payment_reference": "BANK-TXN-2026-001"
  }'
```

#### 7. Cancel Chalan
```bash
curl -X POST http://localhost:8000/api/chalans/1/cancel/ \
  -H "Authorization: Token YOUR_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "Duplicate entry found"
  }'
```

#### 8. Get Statistics
```bash
curl -X GET http://localhost:8000/api/chalans/statistics/ \
  -H "Authorization: Token YOUR_API_TOKEN"
```

**Response:**
```json
{
  "total_chalans": 45,
  "by_status": {
    "pending": 10,
    "issued": 15,
    "paid": 18,
    "cancelled": 2
  },
  "total_fees_amount": "50000.00",
  "total_paid_amount": "18000.00",
  "pending_collection": "32000.00"
}
```

---

### Via Django Admin

1. Go to http://localhost:8000/admin/
2. Navigate to **Permits** → **Chalans**
3. Click "Add Chalan" button
4. Fill in the form:
   - **Chalan Information**: Status, Violation Description
   - **Owner Information**: Name, CNIC, Phone, User Link
   - **Vehicle & Permit**: Car Number, Associated Permit
   - **Fee Details**: Fee Amount (shows remaining), Paid Amount
   - **Payment Info**: Date, Reference
   - **Issue Details**: Issued By, Location
   - **Additional**: Remarks, Document Upload

---

## 🔐 Permission Levels Explained

### User WITHOUT `chalan_manage_fees`
- ✓ Can create chalans
- ✓ Can view all chalans
- ✓ Can edit chalan details (name, phone, descriptions)
- ✓ Can mark as paid
- ✓ Can cancel chalans
- ✗ **CANNOT** modify fees_amount

### User WITH `chalan_manage_fees`
- ✓ Can do everything above
- ✓ **CAN** modify fees_amount
- ✓ Access Fee Updates API endpoint
- ✓ In Admin, fees_amount field is editable

### Admin / Superuser
- ✓ Can do everything
- ✓ Full access to all features regardless of role

---

## 📊 Chalan Fields Explained

| Field | Purpose | Editable | Notes |
|-------|---------|----------|-------|
| chalan_number | Unique ID | ❌ Auto-generated | Format: CHL-TIMESTAMP-RANDOM |
| owner_name | Violator's name | ✓ | Full legal name required |
| owner_cnic | ID for tracking | ✓ | Format: 12345-1234567-1 |
| owner_phone | Contact | ✓ | For notifications |
| car_number | Vehicle ID | ✓ | Linked from permit |
| permit | Associated permit | ✓ | Links to permit record |
| violation_description | What happened | ✓ | Detailed description |
| fees_amount | Fine amount | ⚠️ Only with permission | Can only change if not paid |
| status | Current state | ✓ | pending/issued/paid/cancelled/disputed/resolved |
| paid_amount | Payment received | ✓ | Updated via mark_as_paid |
| payment_reference | Transaction ID | ✓ | For tracking payments |
| issued_by | Officer | ✓ | Who issued the chalan |
| issue_location | Where violation occurred | ✓ | Location details |
| remarks | Extra notes | ✓ | Additional context |
| document | Proof file | ✓ | Upload violation photo/document |

---

## ⚠️ Important Rules

1. **Cannot edit paid chalans** - If status is "paid", you cannot change most fields
2. **Cannot cancel paid chalans** - Payment is final
3. **Cannot edit fees if paid** - Amount is locked after payment
4. **Fee changes require permission** - Only users with `chalan_manage_fees` can modify fees
5. **All changes logged** - Every action is automatically recorded in history
6. **Unique chalan numbers** - System ensures no duplicate IDs

---

## 🔍 Common Tasks

### Task: Give Employee Fee Management Permission

1. Go to **Django Admin** → **Users & Permissions** → **User Roles**
2. Find the user's role assignment
3. Edit the assigned role
4. Add `chalan_manage_fees` to features
5. Save

The next time that user logs in, they'll have fee management access.

---

### Task: View All Chalans for a Specific Vehicle

```bash
curl -X GET "http://localhost:8000/api/chalans/?search=ABC-1234" \
  -H "Authorization: Token YOUR_TOKEN"
```

---

### Task: Get Total Pending Collection

```bash
curl -X GET "http://localhost:8000/api/chalans/statistics/" \
  -H "Authorization: Token YOUR_TOKEN"

# Look for: "pending_collection": "32000.00"
```

---

### Task: Modify a Chalan Fee (Senior Officer)

```bash
# Make sure user has chalan_manage_fees permission

curl -X PATCH "http://localhost:8000/api/chalans/5/update_fees/" \
  -H "Authorization: Token YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"fees_amount": "1500.00"}'

# Response: Updated chalan with new fee and history entry
```

---

## 🛠️ Troubleshooting

### "Permission denied" when updating fees
```
→ Check if user's role has chalan_manage_fees feature
→ Go to admin and assign the feature to user's role
```

### Cannot find the chalan after creating
```
→ Make sure you have chalan_view permission
→ Search might be case-sensitive
→ Check filters (status, date range)
```

### "Cannot mark paid chalan as paid again"
```
→ This is correct - chalan is already in "paid" status
→ Check status in GET request
```

### Chalan number looks strange
```
→ Format: CHL-YYYYMMDDHHMMSS-XXXXX (timestamp + random)
→ Each one is unique to prevent duplicates
```

---

## 📈 Workflow Example

**Day 1: Officer Issues Chalan**
```
Officer creates chalan with:
- Owner: Ali Ahmed
- CNIC: 12345-1234567-1
- Car: ABC-1234
- Violation: Speeding
- Fee: 500.00 PKR
- Status: PENDING
```

**Day 2: Owner Pays**
```
Owner pays 500 PKR with transaction reference
Officer marks chalan as PAID via API/Admin
```

**Day 5: Supervisor Review (Optional)**
```
Supervisor views chalan history
All transactions are logged
System shows: Pending 500 → Paid 500
```

---

## 📞 Get Help

- **Documentation**: See `CHALAN_MANAGEMENT_SYSTEM.md`
- **API Errors**: Check HTTP status code and error message
- **Permission Issues**: Review user role assignments
- **Database Issues**: Check Django admin for consistency

---

## ✅ Checklist

Before going live:

- [ ] Roles configured with appropriate permissions
- [ ] Tested creating a chalan
- [ ] Tested marking chalan as paid
- [ ] Tested fee management (with authorized user)
- [ ] Verified history is recorded
- [ ] Checked statistics endpoint
- [ ] Assigned proper permissions to team members
