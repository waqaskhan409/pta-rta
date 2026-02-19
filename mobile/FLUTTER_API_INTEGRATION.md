# Flutter App - API Integration Guide

## Backend URL Configuration

The Flutter app connects to your Django backend. Before running the app, update the backend URL.

### Configuration Location
File: `lib/constants/app_config.dart`

```dart
class AppConfig {
  // Update this with your backend URL
  static const String apiBaseUrl = 'http://localhost:8000/api';
  // Update with your actual API key if required
  static const String apiKey = 'your-api-key-here';
}
```

### Development Setup
```
apiBaseUrl = 'http://localhost:8000/api'     # Local Django development server
apiBaseUrl = 'http://192.168.x.x:8000/api'   # Network machine
apiBaseUrl = 'http://10.0.2.2:8000/api'      # Android emulator (special host)
```

### Production Setup
```
apiBaseUrl = 'https://your-domain.com/api'   # HTTPS with domain
```

---

## API Authentication Flow

### 1. Login Flow (Splash → Login → Home)

**Step 1: App Launches**
```
SplashScreen checks: Is token in SharedPreferences?
├─ YES → Call API to validate token → Home Screen
└─ NO → Login Screen
```

**Step 2: User Logs In**
```
POST /api/auth/login/
Body: {
  "username": "user123",
  "password": "password123"
}

Response 200 OK: {
  "token": "abcd1234efgh5678",
  "user": {...}
}
```

**Step 3: Token Saved**
```
SharedPreferences.setString('auth_token', 'abcd1234efgh5678')
→ Navigate to Home Screen
```

**Step 4: Subsequent Requests**
```
GET /api/permits/
Header: Authorization: Token abcd1234efgh5678
```

---

## API Endpoints Reference

### 1. Login (Public - No Auth Required)
```
POST /api/auth/login/

Request Headers:
- Content-Type: application/json
- X-API-KEY: your-api-key

Request Body:
{
  "username": "john_doe",
  "password": "secure_password"
}

Response 200 OK:
{
  "token": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6",
  "user": {
    "id": 1,
    "username": "john_doe",
    "email": "john@example.com",
    "first_name": "John",
    "last_name": "Doe"
  }
}

Response 400/401:
{
  "error": "Invalid credentials"
}
```

### 2. Get User Permits (Protected - Requires Token)
```
GET /api/permits/

Request Headers:
- Content-Type: application/json
- Authorization: Token <token>
- X-API-KEY: your-api-key

Response 200 OK:
{
  "count": 2,
  "results": [
    {
      "id": 1,
      "permit_number": "PTA-2024-001",
      "vehicle_number": "ABC-123",
      "vehicle_type": {
        "id": 1,
        "name": "Rickshaw"
      },
      "permit_type": {
        "id": 1,
        "name": "Transport"
      },
      "owner_name": "Muhammad Ali",
      "status": "active",
      "valid_from": "2024-01-15",
      "valid_to": "2025-01-14"
    }
  ]
}

Response 401 Unauthorized:
{
  "detail": "Invalid token."
}
```

### 3. Search Permits (Public - No Auth Required)
```
GET /api/permits/public_search/?vehicle_number=ABC-123
OR
GET /api/permits/public_search/?cnic=12345-1234567-1

Request Headers:
- Content-Type: application/json
- X-API-KEY: your-api-key

Response 200 OK:
{
  "count": 1,
  "results": [
    {
      "id": 1,
      "permit_number": "PTA-2024-001",
      "authority": "PTA",
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
      "owner_cnic": "12345-1234567-1",
      "status": "active",
      "valid_from": "2024-01-15",
      "valid_to": "2025-01-14",
      "description": "Inter-city passenger transport"
    }
  ]
}

Response 200 OK (No Results):
{
  "count": 0,
  "results": [],
  "message": "No permits found"
}
```

### 4. Logout (Protected - Requires Token)
```
POST /api/auth/logout/

Request Headers:
- Authorization: Token <token>
- X-API-KEY: your-api-key

Response 200 OK:
{
  "message": "Successfully logged out"
}
```

---

## Implementation Code Reference

### API Service Methods

#### Login
```dart
// In: lib/services/api_service.dart
static Future<Map<String, dynamic>> login(
  String username,
  String password,
) async {
  final response = await http.post(
    Uri.parse('$baseUrl/auth/login/'),
    headers: {
      'Content-Type': 'application/json',
      'X-API-KEY': apiKey,
    },
    body: jsonEncode({
      'username': username,
      'password': password,
    }),
  );
  
  if (response.statusCode == 200) {
    final data = jsonDecode(response.body);
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('auth_token', data['token'] ?? '');
    return {'success': true, 'data': data};
  }
  return {'success': false, 'error': '...'};
}
```

#### Get User Permits
```dart
static Future<Map<String, dynamic>> getUserPermits() async {
  final prefs = await SharedPreferences.getInstance();
  final token = prefs.getString('auth_token') ?? '';
  
  final response = await http.get(
    Uri.parse('$baseUrl/permits/'),
    headers: {
      'Authorization': 'Token $token',
      'X-API-KEY': apiKey,
    },
  );
  
  if (response.statusCode == 200) {
    final data = jsonDecode(response.body);
    return {'success': true, 'data': data['results'] ?? []};
  }
  return {'success': false, 'error': '...'};
}
```

#### Search Permits
```dart
static Future<Map<String, dynamic>> searchPermits(
  String query,
  String searchType,
) async {
  final Map<String, String> params = {};
  if (searchType == 'vehicle_number') {
    params['vehicle_number'] = query;
  } else {
    params['cnic'] = query;
  }
  
  final uri = Uri.parse('$baseUrl/permits/public_search/')
    .replace(queryParameters: params);
  
  final response = await http.get(
    uri,
    headers: {'X-API-KEY': apiKey},
  );
  
  return {'success': true, 'data': jsonDecode(response.body)['results'] ?? []};
}
```

---

## Screen Implementation Reference

### Splash Screen Flow
```dart
// Check token and route
Future<void> _checkAuthStatus() async {
  await Future.delayed(const Duration(seconds: 2));
  final token = await ApiService.getToken();
  
  if (mounted) {
    if (token != null && token.isNotEmpty) {
      Navigator.of(context).pushReplacementNamed('/home');
    } else {
      Navigator.of(context).pushReplacementNamed('/login');
    }
  }
}
```

### Login Screen Flow
```dart
Future<void> _handleLogin() async {
  final result = await ApiService.login(username, password);
  if (result['success']) {
    // Token auto-saved in API service
    Navigator.of(context).pushReplacement(
      MaterialPageRoute(builder: (context) => const HomeScreen()),
    );
  }
}
```

### Home Screen Flow
```dart
Future<void> _loadUserPermits() async {
  // Gets permits for logged-in user
  final result = await ApiService.getUserPermits();
  setState(() {
    permits = result['data'] ?? [];
  });
}
```

### Search Screen Flow
```dart
Future<void> _handleSearch() async {
  final result = await ApiService.searchPermits(query, searchType);
  setState(() {
    searchResults = result['data'] ?? [];
  });
}
```

---

## Debugging Tips

### Check Network Requests
1. Add print statements in API Service
2. Use Flutter DevTools Network tab
3. Monitor Android Logcat / iOS Console

### Test API Endpoints
Use Postman or curl:
```bash
# Login
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test123"}'

# Get Permits (with token)
curl -H "Authorization: Token YOUR_TOKEN" \
  http://localhost:8000/api/permits/

# Search Permits
curl "http://localhost:8000/api/permits/public_search/?vehicle_number=ABC-123"
```

### Common Issues

**Issue**: `Connection refused` or `Cannot reach server`
- Check backend is running: `python manage.py runserver`
- Check correct API URL in `app_config.dart`
- Check network connectivity

**Issue**: `401 Unauthorized`
- Token expired or invalid
- Re-login required
- Clear app data: Settings → Apps → Clear Storage

**Issue**: `400 Bad Request`
- Invalid parameters
- Check API endpoint documentation
- Verify request format

---

## Security Checklist

Before Production:

- [ ] Change API base URL to HTTPS domain
- [ ] Update API Key to production value
- [ ] Enable SSL certificate pinning
- [ ] Use flutter_secure_storage for token (not SharedPreferences)
- [ ] Implement token refresh mechanism
- [ ] Add request timeout handling
- [ ] Validate all user input
- [ ] Handle errors gracefully
- [ ] Remove debug logs
- [ ] Enable code obfuscation in release build

---

## Next Steps

1. Ensure Django backend is running
2. Update `app_config.dart` with correct API URL
3. Run Flutter app: `flutter run`
4. Test login with backend credentials
5. View your permits
6. Search for public permits
7. Test logout

For detailed setup, see [FLUTTER_APP_SETUP.md](./FLUTTER_APP_SETUP.md)
