# Reporting API Endpoints Reference

## Base URL
```
http://localhost:8000/api
```

## Authentication
All endpoints require:
```
Headers: {
  "Authorization": "Token YOUR_AUTH_TOKEN"
}
```

---

## Reporting Endpoints

### 1. Dashboard Statistics
```
GET /permits/report_detailed_stats/

Purpose: Comprehensive dashboard statistics
Returns: Overall stats, Recent activity, Authority breakdown, Type/Vehicle distributions

Response Example:
{
  "report_type": "Detailed Statistics",
  "generated_at": "2026-01-25T10:30:00Z",
  "overall_stats": {
    "total_permits": 150,
    "active_permits": 120,
    "expired_permits": 15,
    "cancelled_permits": 10,
    "pending_permits": 5,
    "inactive_permits": 0
  },
  "recent_activity": {
    "created_last_30_days": 12,
    "modified_last_30_days": 25,
    "expiring_in_30_days": 8
  },
  "by_authority": {
    "PTA": 90,
    "RTA": 60
  },
  "by_permit_type": {
    "Transport": 50,
    "Goods": 40,
    "Passenger": 35,
    "Commercial": 25
  },
  "by_vehicle_type": {
    "Rickshaw": 30,
    "Truck": 35,
    "Bus": 40,
    ...
  }
}
```

---

### 2. Permits by Type
```
GET /permits/report_permits_by_type/

Purpose: Breakdown of permits by type
Returns: Detailed count by type and status

Response Example:
{
  "report_type": "Permits by Type",
  "generated_at": "2026-01-25T10:30:00Z",
  "data": [
    {
      "permit_type": "Transport",
      "permit_code": "TRN",
      "total": 50,
      "active": 45,
      "expired": 3,
      "cancelled": 1,
      "pending": 1,
      "inactive": 0,
      "status_breakdown": {
        "active": 45,
        "expired": 3,
        "cancelled": 1,
        "pending": 1,
        "inactive": 0
      }
    },
    ...
  ]
}
```

---

### 3. Permits by Vehicle Type
```
GET /permits/report_permits_by_vehicle/

Purpose: Breakdown of permits by vehicle type
Returns: Detailed count by vehicle type and status

Response Example:
{
  "report_type": "Permits by Vehicle Type",
  "generated_at": "2026-01-25T10:30:00Z",
  "data": [
    {
      "vehicle_type": "Rickshaw",
      "total": 30,
      "active": 28,
      "expired": 2,
      "status_breakdown": {
        "active": 28,
        "expired": 2,
        "cancelled": 0,
        "pending": 0,
        "inactive": 0
      }
    },
    ...
  ]
}
```

---

### 4. Authority Summary
```
GET /permits/report_authority_summary/

Purpose: Summary of permits by authority (PTA/RTA)
Returns: Authority-wise permit distribution and status breakdown

Response Example:
{
  "report_type": "Authority Summary",
  "generated_at": "2026-01-25T10:30:00Z",
  "data": [
    {
      "authority": "Provincial Transport Authority",
      "authority_code": "PTA",
      "total_permits": 90,
      "active": 75,
      "inactive": 5,
      "cancelled": 5,
      "expired": 5,
      "pending": 0
    },
    {
      "authority": "Regional Transport Authority",
      "authority_code": "RTA",
      "total_permits": 60,
      "active": 45,
      "inactive": 5,
      "cancelled": 5,
      "expired": 5,
      "pending": 0
    }
  ]
}
```

---

### 5. Expiring Permits
```
GET /permits/report_expiring_permits/?days=30

Purpose: Get permits expiring soon
Parameters:
  - days: Number of days to look ahead (default: 30)

Returns: List of permits expiring within specified days

Response Example:
{
  "report_type": "Permits Expiring Within 30 Days",
  "generated_at": "2026-01-25T10:30:00Z",
  "expiring_date": "2026-02-24",
  "total_expiring": 8,
  "data": [
    {
      "id": 1,
      "permit_number": "PTA/2026/001",
      "vehicle_number": "ABC-123",
      "owner_name": "John Doe",
      "permit_type": {
        "id": 1,
        "name": "Transport",
        "code": "TRN"
      },
      "valid_to": "2026-02-15",
      "status": "active"
    },
    ...
  ]
}
```

---

### 6. Owner Permits
```
GET /permits/report_owner_permits/?email=owner@email.com&name=John&phone=123456789

Purpose: Get permits for specific owner
Parameters (Optional):
  - email: Owner email (case-insensitive partial match)
  - name: Owner name (case-insensitive partial match)
  - phone: Owner phone number (partial match)

Returns: List of permits matching owner criteria

Response Example:
{
  "report_type": "Owner Permits Report",
  "generated_at": "2026-01-25T10:30:00Z",
  "filters": {
    "email": "john@example.com",
    "name": "John",
    "phone": null
  },
  "total_permits": 5,
  "data": [
    {
      "id": 1,
      "permit_number": "PTA/2026/001",
      "vehicle_number": "ABC-123",
      "owner_name": "John Doe",
      "owner_email": "john@example.com",
      "owner_phone": "0300-1234567",
      "valid_from": "2026-01-01",
      "valid_to": "2026-12-31",
      "status": "active"
    },
    ...
  ]
}
```

---

### 7. Permit History (Filtered)
```
GET /permits/report_history/?permit_id=1&status=active&action=updated&days=30

Purpose: Get filtered permit history
Parameters (Optional):
  - permit_id: Filter by specific permit
  - status: Filter by permit status (active, expired, cancelled, etc.)
  - action: Filter by action type (created, updated, activated, cancelled, renewed)
  - days: Days in past to include (default: 30)

Returns: History records matching filters

Response Example:
{
  "total_records": 12,
  "filters": {
    "permit_id": 1,
    "status": "active",
    "action": "updated",
    "days": 30
  },
  "data": [
    {
      "id": 1,
      "permit": {
        "id": 1,
        "permit_number": "PTA/2026/001"
      },
      "action": "updated",
      "performed_by": "admin",
      "timestamp": "2026-01-25T10:30:00Z",
      "changes": {
        "valid_to": {
          "old": "2026-12-31",
          "new": "2027-01-31"
        }
      },
      "notes": "Updated 1 field(s)"
    },
    ...
  ]
}
```

---

### 8. Single Permit History
```
GET /permits/{permit_id}/history/

Purpose: Get complete history for a single permit
Parameters:
  - permit_id (path): ID of the permit

Returns: Complete audit trail with all changes

Response Example:
{
  "permit_number": "PTA/2026/001",
  "vehicle_number": "ABC-123",
  "total_changes": 5,
  "history": [
    {
      "id": 1,
      "permit": 1,
      "action": "created",
      "performed_by": "admin",
      "timestamp": "2026-01-01T10:00:00Z",
      "changes": {
        "status": {
          "old": null,
          "new": "pending"
        }
      },
      "notes": "Permit created"
    },
    {
      "id": 2,
      "permit": 1,
      "action": "activated",
      "performed_by": "supervisor",
      "timestamp": "2026-01-05T14:30:00Z",
      "changes": {
        "status": {
          "old": "pending",
          "new": "active"
        }
      },
      "notes": "Activated after approval"
    },
    ...
  ]
}
```

---

## Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 400 | Bad Request (invalid parameters) |
| 401 | Unauthorized (missing/invalid token) |
| 403 | Forbidden (no permission) |
| 404 | Not Found (permit doesn't exist) |
| 500 | Server Error |

---

## Error Response Format

```json
{
  "error": "Error message",
  "detail": "Detailed explanation"
}
```

---

## Common Use Cases

### Get Executive Dashboard Data
```bash
curl -X GET "http://localhost:8000/api/permits/report_detailed_stats/" \
  -H "Authorization: Token YOUR_TOKEN"
```

### Get Expiring Permits for Next 7 Days
```bash
curl -X GET "http://localhost:8000/api/permits/report_expiring_permits/?days=7" \
  -H "Authorization: Token YOUR_TOKEN"
```

### Get Permits for Specific Owner
```bash
curl -X GET "http://localhost:8000/api/permits/report_owner_permits/?email=john@example.com" \
  -H "Authorization: Token YOUR_TOKEN"
```

### Get History for Specific Permit
```bash
curl -X GET "http://localhost:8000/api/permits/123/history/" \
  -H "Authorization: Token YOUR_TOKEN"
```

### Get Updated Permits in Last 7 Days
```bash
curl -X GET "http://localhost:8000/api/permits/report_history/?action=updated&days=7" \
  -H "Authorization: Token YOUR_TOKEN"
```

---

## Field Descriptions

### Permit Status Values
- `active` - Currently valid and active
- `inactive` - Valid but not active
- `pending` - Awaiting approval
- `expired` - Past validity date
- `cancelled` - Explicitly cancelled

### Action Types
- `created` - Permit created
- `updated` - Permit details modified
- `activated` - Status changed to active
- `deactivated` - Status changed to inactive
- `cancelled` - Permit cancelled
- `renewed` - Validity period extended

### Authority Types
- `PTA` - Provincial Transport Authority
- `RTA` - Regional Transport Authority

---

## Pagination

Most endpoints return all matching records. For large datasets, responses can be paginated by the frontend using filters and manual limiting.

---

## Response Time

- Dashboard stats: ~100-500ms
- Type reports: ~50-200ms
- History reports: ~50-300ms
- Owner reports: ~50-200ms

Performance depends on permit count in database.

---

## Rate Limiting

Currently no rate limiting. Implement if needed for production.

---

## Caching

All responses are real-time. No caching implemented.

---

## Backwards Compatibility

All endpoints are additions to existing API. No breaking changes to existing endpoints.

---

## Version

Current API Version: 1.0
Last Updated: January 25, 2026

---
