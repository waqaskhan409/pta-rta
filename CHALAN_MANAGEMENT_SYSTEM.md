# Chalan Management System - Complete Documentation

## Overview

The **Chalan Management System** has been successfully integrated into the RTA PTA (Road Traffic Authority - Permit and Tracking Authority) system. A chalan is a traffic violation/penalty issued to vehicle owners for violations.

## What is a Chalan?

A **Chalan** is a traffic violation/penalty record that contains:
- **Owner Information**: Name, CNIC (National ID), Phone
- **Vehicle Information**: Car/Vehicle registration number
- **Permit Association**: Linked to a specific permit
- **Violation Details**: Description of the traffic violation
- **Fee Management**: Amount due, payment tracking, and ability to manage fees by authorized personnel

---

## System Architecture

### 1. **Database Models**

#### Chalan Model
Main model for storing chalan information:

```python
class Chalan(models.Model):
    # Identification
    chalan_number          # Unique auto-generated identifier
    
    # User Information
    user                   # FK to User (permit owner)
    owner_name            # Name of the violator
    owner_cnic            # CNIC for identification
    owner_phone           # Contact number
    
    # Permit & Vehicle
    permit                # FK to Permit record
    car_number            # Vehicle registration number
    
    # Violation Details
    violation_description # Details of the traffic violation
    fees_amount           # Fine/fee amount
    
    # Payment Tracking
    status                # pending, issued, paid, cancelled, disputed, resolved
    paid_amount           # Amount paid so far
    payment_date          # When payment was received
    payment_reference     # Transaction reference
    
    # Issue Details
    issued_date           # When the chalan was issued
    issued_by             # FK to User (officer who issued)
    issue_location        # Location where violation occurred
    
    # Additional
    remarks               # Additional notes
    document              # Uploaded violation document
    
    # Audit Fields
    created_by            # User who created the record
    updated_by            # User who last updated
    last_modified         # Timestamp of last update
```

#### ChalanHistory Model
Tracks all changes to chalans for audit purposes:

```python
class ChalanHistory(models.Model):
    chalan                # FK to Chalan
    action                # Type of action (created, updated, paid, etc.)
    performed_by          # User who performed the action
    timestamp             # When the action occurred
    changes               # JSON of field changes
    notes                 # Additional context
```

---

## Features & Permissions

### Permission-Based Fee Management

The system uses a **role-based permission model** where fee management is controlled through specific permissions:

#### Chalan Features Available:
1. **chalan_view** - View chalan records
2. **chalan_create** - Create new chalans
3. **chalan_edit** - Edit chalan details (name, phone, descriptions, remarks)
4. **chalan_manage_fees** - Manage/modify chalan fees ⭐ **KEY PERMISSION**
5. **chalan_mark_paid** - Record chalan payments
6. **chalan_cancel** - Cancel existing chalans

### Fee Management Rules

**To modify chalan fees:**
1. User must have the **`chalan_manage_fees`** feature in their role
2. Chalan cannot be paid or cancelled
3. Only specific authorized personnel should have this permission
4. All fee changes are logged in the history

**Who can manage fees:**
- System administrators (Django staff users)
- Employees with the `chalan_manage_fees` permission assigned to their role

**Who cannot manage fees:**
- Regular users without the permission
- Anyone trying to modify fees on paid/cancelled chalans

---

## How to Set Up

### Step 1: Run the Setup Script ✓ (Already Done)
```bash
cd /Users/waqaskhan/Documents/PTA_RTA/config
python setup_chalan_features.py
```

This creates:
- 6 Chalan-related features
- 5 Chalan-related audit events

### Step 2: Configure Roles

**In Django Admin:**

1. Go to `Roles` section
2. Select the role that should manage chalans (e.g., "Operator" or "Supervisor")
3. Under "Permissions", select:
   - `chalan_view` - For viewing
   - `chalan_create` - For creating new chalans
   - `chalan_edit` - For editing basic chalan info
   - `chalan_mark_paid` - For recording payments

4. For **Fee Management ONLY**, select additional permission:
   - `chalan_manage_fees` - This controls who can modify fees

### Example Role Configurations:

**Traffic Officer Role:**
- ✓ chalan_view
- ✓ chalan_create
- ✓ chalan_edit
- ✓ chalan_mark_paid
- ✗ chalan_manage_fees (Only senior officers)

**Senior Supervisor Role:**
- ✓ chalan_view
- ✓ chalan_create
- ✓ chalan_edit
- ✓ chalan_mark_paid
- ✓ chalan_manage_fees (Can modify fees)

---

## API Endpoints

All endpoints are located at: `/api/chalans/`

### 1. **List All Chalans**
```
GET /api/chalans/
```
**Parameters:**
- `search` - Search by number, name, CNIC, or car number
- `status` - Filter by status (pending, issued, paid, cancelled, disputed, resolved)
- `ordering` - Sort results

**Response:** List of chalans with summary information

---

### 2. **Create New Chalan**
```
POST /api/chalans/
```
**Required Fields:**
```json
{
  "owner_name": "Ali Ahmed",
  "owner_cnic": "12345-1234567-1",
  "car_number": "ABC-123",
  "permit": 1,
  "violation_description": "Speeding on highway",
  "fees_amount": "500.00"
}
```

**Optional Fields:**
```json
{
  "owner_phone": "03001234567",
  "user": 2,
  "issue_location": "Lahore - GT Road",
  "remarks": "First-time violation",
  "document": "upload_file.pdf"
}
```

**Response:** Created chalan details with auto-generated `chalan_number`

---

### 3. **View Chalan Details**
```
GET /api/chalans/{id}/
```
**Response:** Complete chalan information including:
- Full details
- Payment history
- All changes history
- Related permit information
- Remaining amount due

---

### 4. **Update Chalan Details**
```
PATCH /api/chalans/{id}/
```
**Updatable Fields:**
```json
{
  "owner_name": "New Name",
  "owner_phone": "03009876543",
  "violation_description": "Updated violation details",
  "issue_location": "New Location",
  "remarks": "Updated remarks"
}
```

**Note:** `fees_amount` cannot be updated through this endpoint. Use the dedicated fee update endpoint.

---

### 5. **update Chalan Fees** ⭐ Important
```
PATCH /api/chalans/{id}/update_fees/
```
**Required Permission:** `chalan_manage_fees`

**Request Body:**
```json
{
  "fees_amount": "1500.00"
}
```

**Response:** Updated chalan with history entry

**Restrictions:**
- Only users with `chalan_manage_fees` permission
- Cannot modify fees on paid or cancelled chalans
- All changes are automatically logged

---

### 6. **Mark Chalan as Paid**
```
POST /api/chalans/{id}/mark_as_paid/
```
**Required Permission:** `chalan_mark_paid`

**Request Body:**
```json
{
  "payment_amount": "500.00",
  "payment_reference": "TXN-2026-01-19-001"
}
```

**Response:** Chalan updated with status "paid"

---

### 7. **Cancel Chalan**
```
POST /api/chalans/{id}/cancel/
```
**Required Permission:** `chalan_cancel`

**Request Body:**
```json
{
  "reason": "Duplicate entry" or "Owner dispute"
}
```

**Restrictions:**
- Cannot cancel already-paid chalans
- Records reason in history

---

### 8. **Get Chalan Statistics**
```
GET /api/chalans/statistics/
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

### 9. **Get Chalan History**
```
GET /api/chalans/{id}/history/
```
**Response:** Complete audit trail showing all actions and changes

---

## Chalan Status Workflow

```
┌─────────┐
│ PENDING │  ← Initial status when created
└────┬────┘
     │
     ├──→ ISSUED  ← Officially issued to owner
     │
     ├──→ PAID    ← Payment received (final)
     │
     ├──→ CANCELLED ← Dismissed (final)
     │
     ├──→ DISPUTED ← Owner disputed (awaiting review)
     │
     └──→ RESOLVED ← Dispute resolved
```

---

## Developer Guide

### Import Statements
```python
from permits.models import Chalan, ChalanHistory
from permits.serializers import ChalanDetailSerializer, ChalanCreateSerializer
from permits.authentication import CanManageChalanFees, CanMarkChalanAsPaid
```

### Common Operations

#### Create a Chalan Programmatically
```python
from permits.models import Chalan, Permit, ChalanHistory

# Create chalan
chalan = Chalan.objects.create(
    chalan_number="CHL-202601190001",
    owner_name="Ahmed Ali",
    owner_cnic="12345-1234567-1",
    car_number="ABC-123",
    permit=Permit.objects.first(),
    violation_description="Speeding",
    fees_amount=500.00,
    issued_by=User.objects.first(),
    created_by=request.user.username
)

# Create history entry
ChalanHistory.objects.create(
    chalan=chalan,
    action='created',
    performed_by=request.user.username,
    notes="Chalan created for traffic violation"
)
```

#### Mark Chalan as Paid
```python
chalan.mark_as_paid("TXN-2026-01-19-001")

# Log the payment
ChalanHistory.objects.create(
    chalan=chalan,
    action='paid',
    performed_by=request.user.username,
    changes={'status': {'old': 'pending', 'new': 'paid'}},
    notes='Payment received'
)
```

#### Check User's Fee Management Permission
```python
from permits.models import UserRole

def can_manage_fees(user):
    try:
        if user.is_staff or user.is_superuser:
            return True
        user_role = UserRole.objects.get(user=user, is_active=True)
        return user_role.role.has_feature('chalan_manage_fees')
    except UserRole.DoesNotExist:
        return False
```

---

## Admin Interface

In Django Admin (`/admin/`):

### Chalan Admin Page
- **List View:** Shows all chalans with key information
- **Search:** By chalan_number, owner name, CNIC, car number, permit
- **Filter:** By status, issued date, payment date
- **Fee Management:** Shows remaining amount due
- **Permission-Based:** Fees field is read-only for users without `chalan_manage_fees`

### Features
- Auto-calculated remaining amount
- Read-only fields for created chalans
- History tab showing all changes
- Payment date tracking

---

## Security & Compliance

### Permission System
✓ Fee modifications are permission-based  
✓ Only authorized personnel can change fees  
✓ All changes are logged with user information  
✓ Cannot modify paid/cancelled chalans  

### Audit Trail
✓ Complete history of all actions  
✓ Tracks who made changes and when  
✓ Records change details (before/after values)  
✓ Event logging for critical operations  

### Data Integrity
✓ CNIC formatting and uniqueness checks  
✓ Vehicle number validation  
✓ Payment amount validation  
✓ Status transition validation  

---

## Troubleshooting

### Issue: Permission Denied for Fee Update
**Solution:** Check that user's role has `chalan_manage_fees` feature assigned

### Issue: Cannot Mark Paid Chalan as Paid Again
**Solution:** Chalan is already paid. This is correct behavior for data integrity

### Issue: Cannot Cancel Paid Chalan
**Solution:** This is by design. Paid chalans cannot be modified to prevent data tampering

### Issue: Chalan History Not Showing
**Solution:** History is created automatically. Check database has ChalanHistory entries

---

## API Usage Examples

### Create and Pay a Chalan (Full Workflow)

```bash
# 1. Create a chalan
curl -X POST http://localhost:8000/api/chalans/ \
  -H "Authorization: Token YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "owner_name": "Ali Ahmed",
    "owner_cnic": "12345-1234567-1",
    "car_number": "ABC-123",
    "permit": 1,
    "violation_description": "Speeding on highway",
    "fees_amount": "500.00"
  }'

# Response: {"id": 1, "chalan_number": "CHL-202601190001", ...}

# 2. Mark as paid
curl -X POST http://localhost:8000/api/chalans/1/mark_as_paid/ \
  -H "Authorization: Token YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "payment_amount": "500.00",
    "payment_reference": "TXN-2026-01-19-001"
  }'

# 3. View details
curl -X GET http://localhost:8000/api/chalans/1/ \
  -H "Authorization: Token YOUR_TOKEN"
```

---

## Database Schema

```sql
-- Chalan Table
CREATE TABLE permits_chalan (
    id INTEGER PRIMARY KEY,
    chalan_number VARCHAR(50) UNIQUE,
    user_id INTEGER FOREIGN KEY,
    owner_name VARCHAR(200),
    owner_cnic VARCHAR(20),
    owner_phone VARCHAR(20),
    permit_id INTEGER FOREIGN KEY,
    car_number VARCHAR(20),
    violation_description TEXT,
    fees_amount DECIMAL(10,2),
    status VARCHAR(20),
    paid_amount DECIMAL(10,2),
    payment_date DATETIME,
    payment_reference VARCHAR(100),
    issued_date DATETIME,
    issued_by_id INTEGER FOREIGN KEY,
    issue_location VARCHAR(255),
    remarks TEXT,
    document VARCHAR(100),
    created_by VARCHAR(200),
    updated_by VARCHAR(200),
    last_modified DATETIME,
    INDEXES: (car_number, status), (owner_cnic), (permit_id, status)
);

-- ChalanHistory Table
CREATE TABLE permits_chalanhistory (
    id INTEGER PRIMARY KEY,
    chalan_id INTEGER FOREIGN KEY,
    action VARCHAR(20),
    performed_by VARCHAR(200),
    timestamp DATETIME,
    changes JSON,
    notes TEXT
);
```

---

## Migration Notes

✓ Migration file: `permits/migrations/0017_chalan_alter_feature_name_chalanhistory_and_more.py`
✓ Models created: `Chalan`, `ChalanHistory`
✓ Features created: 6 chalan-related features
✓ Events created: 5 chalan-related audit events
✓ URL routing: Registered as `/api/chalans/`
✓ Admin interface: Fully configured

---

## Support & Best Practices

### Best Practice: Fee Management Workflow
1. **Traffic Officer** collects information and creates chalan
2. **Officer** marks payments as received with transaction reference
3. **Senior Supervisor** only modifies fees if needed (with proper approval)
4. **System** logs all changes automatically

### Best Practice: Dispute Handling
1. Set chalan status to "disputed"
2. Add reason in remarks
3. Create history entry with dispute details
4. Management reviews and resolves
5. Update status to "resolved"

### Best Practice: Audit Compliance
- Grant `chalan_manage_fees` to minimum necessary users
- Review chalan history regularly
- Audit fee modifications monthly
- Maintain proper documentation for changes

---

## Summary

The Chalan Management System is now fully integrated with:
- ✅ Complete data model with Chalan and ChalanHistory
- ✅ Permission-based fee management
- ✅ Full REST API with CRUD operations
- ✅ Admin interface with fee controls
- ✅ Audit logging and history tracking
- ✅ Payment management capabilities
- ✅ Role-based access control

Users can create, edit, track, and manage traffic violations with automated fee management capabilities restricted to authorized personnel only.
