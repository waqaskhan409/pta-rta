# Permit Public Search API Documentation

## Overview
The Public Search API allows clients (web, mobile, Flutter apps) to search for permit details without authentication. Users can search by vehicle number or CNIC (Citizen ID).

## Endpoint

### GET `/api/permits/public_search/`

**Description:** Search for permits by vehicle number or CNIC

**Authentication:** Not required (Public endpoint)

**Method:** GET

---

## Request Parameters

### Query Parameters

| Parameter | Type | Required | Description | Example |
|-----------|------|----------|-------------|---------|
| `vehicle_number` | string | No* | Search by vehicle registration number | `ABC-123`, `PK-123` |
| `cnic` | string | No* | Search by owner's CNIC | `12345-1234567-1` |

**Note:** At least one of `vehicle_number` or `cnic` must be provided. Both can be provided simultaneously.

---

## Response Format

### Success Response (200 OK)

```json
{
  "count": 1,
  "results": [
    {
      "id": 1,
      "permit_number": "PTA-2024-001",
      "authority": "PTA",
      "permit_type": {
        "id": 1,
        "name": "Transport",
        "code": "TRN"
      },
      "vehicle_number": "ABC-123",
      "vehicle_type": {
        "id": 1,
        "name": "Rickshaw"
      },
      "vehicle_make": "Suzuki",
      "vehicle_model": "Bolan",
      "vehicle_year": 2022,
      "vehicle_capacity": 6,
      "owner_name": "Muhammad Ali",
      "owner_email": "ali@example.com",
      "owner_phone": "+92-300-1234567",
      "owner_address": "123 Main Street, Lahore",
      "owner_cnic": "12345-1234567-1",
      "status": "active",
      "valid_from": "2024-01-15",
      "valid_to": "2025-01-14",
      "issued_date": "2024-01-15T10:30:00Z",
      "last_modified": "2024-01-15T10:30:00Z",
      "description": "Inter-city passenger transport permit",
      "remarks": null,
      "approved_routes": "Lahore-Islamabad, Lahore-Rawalpindi",
      "restrictions": null
    }
  ],
  "search_criteria": ["vehicle_number: ABC-123"]
}
```

### No Results Response (200 OK)

```json
{
  "count": 0,
  "results": [],
  "message": "No permits found matching: vehicle_number: ABC-123"
}
```

### Error Response (400 Bad Request)

```json
{
  "error": "Please provide either vehicle_number or cnic parameter"
}
```

---

## HTTP Status Codes

| Code | Description |
|------|-------------|
| 200 | Request successful, results returned (may be empty) |
| 400 | Missing required parameters or invalid request |
| 404 | Endpoint not found |
| 500 | Server error |

---

## Search Behavior

- **Case-insensitive:** Searches are case-insensitive (e.g., `abc-123` will match `ABC-123`)
- **Partial matching:** Searches using partial matches (e.g., `123` will match `ABC-123`)
- **Multiple results:** If multiple permits match, all matching permits are returned, ordered by expiry date (newest first)
- **Sorting:** Results are automatically sorted by `valid_to` (expiry date) in descending order

---

## Usage Examples

### Example 1: Search by Vehicle Number

```bash
curl -X GET "http://localhost:8000/api/permits/public_search/?vehicle_number=ABC-123"
```

### Example 2: Search by CNIC

```bash
curl -X GET "http://localhost:8000/api/permits/public_search/?cnic=12345-1234567-1"
```

### Example 3: Search by Both Vehicle Number and CNIC

```bash
curl -X GET "http://localhost:8000/api/permits/public_search/?vehicle_number=ABC-123&cnic=12345-1234567-1"
```

### Example 4: JavaScript Fetch

```javascript
// Search by vehicle number
fetch('http://localhost:8000/api/permits/public_search/?vehicle_number=ABC-123')
  .then(response => response.json())
  .then(data => console.log(data))
  .catch(error => console.error('Error:', error));

// Search by CNIC
fetch('http://localhost:8000/api/permits/public_search/?cnic=12345-1234567-1')
  .then(response => response.json())
  .then(data => console.log(data))
  .catch(error => console.error('Error:', error));
```

### Example 5: Python Requests

```python
import requests

# Search by vehicle number
response = requests.get(
    'http://localhost:8000/api/permits/public_search/',
    params={'vehicle_number': 'ABC-123'}
)
data = response.json()
print(data)

# Search by CNIC
response = requests.get(
    'http://localhost:8000/api/permits/public_search/',
    params={'cnic': '12345-1234567-1'}
)
data = response.json()
print(data)
```

### Example 6: Dart/Flutter

```dart
import 'package:http/http.dart' as http;
import 'dart:convert';

Future<Map<String, dynamic>> searchPermitByVehicle(String vehicleNumber) async {
  final response = await http.get(
    Uri.parse('http://localhost:8000/api/permits/public_search/')
        .replace(queryParameters: {'vehicle_number': vehicleNumber}),
  );

  if (response.statusCode == 200) {
    return jsonDecode(response.body);
  } else {
    throw Exception('Failed to search permit');
  }
}

Future<Map<String, dynamic>> searchPermitByCNIC(String cnic) async {
  final response = await http.get(
    Uri.parse('http://localhost:8000/api/permits/public_search/')
        .replace(queryParameters: {'cnic': cnic}),
  );

  if (response.statusCode == 200) {
    return jsonDecode(response.body);
  } else {
    throw Exception('Failed to search permit');
  }
}
```

---

## Response Field Descriptions

| Field | Type | Description |
|-------|------|-------------|
| `id` | integer | Unique permit identifier |
| `permit_number` | string | Unique permit number (e.g., PTA-2024-001) |
| `authority` | string | Issuing authority (PTA or RTA) |
| `permit_type` | object | Permit type details (Transport, Goods, etc.) |
| `vehicle_number` | string | Vehicle registration number |
| `vehicle_type` | object | Vehicle type (Rickshaw, Truck, etc.) |
| `vehicle_make` | string | Vehicle manufacturer |
| `vehicle_model` | string | Vehicle model |
| `vehicle_year` | integer | Manufacturing year |
| `vehicle_capacity` | integer | Passenger/cargo capacity |
| `owner_name` | string | Vehicle owner's full name |
| `owner_email` | string | Vehicle owner's email |
| `owner_phone` | string | Vehicle owner's phone number |
| `owner_address` | string | Vehicle owner's address |
| `owner_cnic` | string | Vehicle owner's CNIC |
| `status` | string | Permit status (active, inactive, cancelled, expired, pending) |
| `valid_from` | date | Permit validity start date (YYYY-MM-DD) |
| `valid_to` | date | Permit validity end date (YYYY-MM-DD) |
| `issued_date` | datetime | When the permit was issued |
| `last_modified` | datetime | Last modification timestamp |
| `description` | string | Permit description/purpose |
| `remarks` | string | Additional remarks |
| `approved_routes` | string | Comma-separated list of approved routes |
| `restrictions` | string | Any restrictions on the permit |

---

## Permit Status Explanation

- **active:** Permit is currently valid and in use
- **inactive:** Permit exists but is not currently active
- **pending:** Permit is awaiting approval
- **cancelled:** Permit has been cancelled
- **expired:** Permit validity period has ended

---

## Web Implementation Notes

1. **Expiry Calculation:** Calculate days remaining as `(valid_to - today)` to show expiry status
2. **Status Color Coding:**
   - Green: Active permit
   - Yellow/Orange: Expiring within 30 days
   - Red: Expired or cancelled
3. **User Feedback:** Consider showing loading state while searching
4. **Error Handling:** Validate user input before sending request

---

## Flutter Implementation Notes

1. Use `http` or `dio` package for API requests
2. Parse JSON response to Dart model classes
3. Implement local caching for recent searches
4. Handle network errors gracefully
5. Show loading indicators during search

---

## Rate Limiting & Security

Currently, this endpoint has **no rate limiting** but may be added in the future. Guidelines for clients:

- Cache search results locally when possible
- Avoid making duplicate requests for the same search
- Implement exponential backoff for retries
- Do not abuse the API with automated/bot requests

---

## CORS Configuration

The API is configured to accept requests from:
- `http://localhost:3000` (Development)
- Production domains (to be configured)

For Flutter mobile apps, CORS is not applicable as mobile apps don't have this restriction.

---

## Support & Issues

For API issues, contact the development team or create an issue with:
- The search criteria used
- Expected vs. actual results
- Request/response details

---

**API Version:** 1.0  
**Last Updated:** February 10, 2026  
**Endpoint Status:** Active & Public
