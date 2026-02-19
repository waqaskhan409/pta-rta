# Flutter App Setup & Deployment Guide

## Quick Start

### Prerequisites
- Flutter SDK (3.0+)
- Dart SDK (included with Flutter)
- Android Studio / Xcode (for mobile development)
- macOS, Linux, or Windows with Git

### Step 1: Navigate to Flutter App Directory
```bash
cd config/mobile/flutter_app
```

### Step 2: Get Dependencies
```bash
flutter pub get
```

### Step 3: Configure API
Edit `lib/constants/app_config.dart` and update:
```dart
static const String apiBaseUrl = 'http://your-backend-url:8000/api';
static const String apiKey = 'your-actual-api-key';
```

### Step 4: Run the App
```bash
# Android
flutter run

# iOS
flutter run -d ios

# Web (Chrome)
flutter run -d chrome
```

---

## Project Structure

```
flutter_app/
├── lib/
│   ├── main.dart                    # App entry point
│   ├── main_router.dart             # Route definitions
│   ├── constants/
│   │   ├── app_colors.dart
│   │   ├── app_config.dart
│   │   ├── app_icons.dart
│   │   └── app_strings.dart
│   ├── screens/
│   │   ├── splash_screen.dart       # Initial loading & auth check
│   │   ├── login_screen.dart        # User authentication
│   │   ├── home_screen.dart         # Display user's permits
│   │   └── search_permit_screen.dart # Public permit search
│   ├── services/
│   │   └── api_service.dart         # API communication
│   └── models/                      # (Add as needed)
│
├── android/                         # Android native code
│   ├── app/
│   ├── gradle/
│   └── build.gradle
│
├── ios/                            # iOS native code
│   ├── Runner/
│   │   └── Info.plist
│   └── Podfile (optional)
│
├── web/                            # Web configuration
│   ├── index.html
│   ├── manifest.json
│   └── icons/
│
├── assets/                         # Images, fonts, data
│   ├── images/
│   └── fonts/
│
├── pubspec.yaml                    # Dependencies & project config
├── analysis_options.yaml           # Lint rules
├── README.md                       # Main readme
└── .gitignore                      # Git ignore rules
```

---

## Features Overview

### ✅ Implemented

#### 1. Splash Screen (`lib/screens/splash_screen.dart`)
- Animated intro with gradient background
- Automatic token validation
- Redirects based on authentication:
  - **Authenticated**: → Home Screen (shows permits)
  - **Not Authenticated**: → Login Screen

#### 2. Authentication (`lib/screens/login_screen.dart`)
- Username/Password login form
- Password visibility toggle
- Error message display
- Loading state handling
- Token saved to SharedPreferences

Endpoint: `POST /api/auth/login/`

#### 3. Home Screen (`lib/screens/home_screen.dart`)
- Display user's permits in a scrollable list
- Pull-to-refresh functionality
- Status badges (Active/Inactive)
- Logout button in app bar
- Navigate to search screen

Endpoint: `GET /api/permits/` (requires auth token)

#### 4. Search Permits (`lib/screens/search_permit_screen.dart`)
- **Search Options**:
  - By Vehicle Number (e.g., ABC-123)
  - By CNIC (e.g., 12345-1234567-1)
- Tap result to view full details in modal
- Detailed information display

Endpoint: `GET /api/permits/public_search/?vehicle_number=ABC-123` or `?cnic=12345-1234567-1`

#### 5. Token Management
- Automatically saves token to SharedPreferences after login
- Checks for existing token on app startup (splash screen)
- Includes token in API requests: `Authorization: Token <token>`
- Logout clears token

---

## API Integration

### Authentication Flow
```
┌─────────┐
│ Splash  │ Check for token in SharedPreferences
│ Screen  │
└────┬────┘
     │
     ├─ Token exists → Validate & Go to Home
     └─ No token → Go to Login
```

### API Service (`lib/services/api_service.dart`)

#### Login
```dart
final result = await ApiService.login(username, password);
// Response: {success: true/false, data/error: ...}
// Token auto-saved to SharedPreferences
```

#### Search Permits
```dart
final result = await ApiService.searchPermits(query, 'vehicle_number');
// Returns: {success: true, data: [permits]}
```

#### Get User Permits
```dart
final result = await ApiService.getUserPermits();
// Requires token in header
// Returns: {success: true, data: [permits]}
```

#### Logout
```dart
await ApiService.logout();
// Removes token from SharedPreferences
```

---

## Building for Production

### Android APK
```bash
flutter build apk --release
# Output: build/app/outputs/flutter-app-release.apk
```

### Android App Bundle (Google Play)
```bash
flutter build appbundle --release
# Output: build/app/outputs/bundle/release/app-release.aab
```

### iOS App
```bash
flutter build ios --release
# Output: build/ios/iphoneos/Runner.app
```

### iOS IPA (App Store)
```bash
flutter build ipa --release
# Output: build/ios/ipa/
```

### Web
```bash
flutter build web --release
# Output: build/web/
# Deploy to any web server
```

---

## Configuration

### Update Backend URL
File: `lib/constants/app_config.dart`
```dart
static const String apiBaseUrl = 'http://your-backend-url:8000/api';
static const String apiKey = 'your-api-key';
```

### Customize Colors
File: `lib/constants/app_colors.dart`
```dart
static const Color primary = Color(0xFF1976D2);
// Update colors as needed
```

### Customize Strings
File: `lib/constants/app_strings.dart`
```dart
static const String appName = 'PTA/RTA';
// Update strings for localization
```

---

## Testing

### Run Tests
```bash
# Unit tests
flutter test

# Integration tests
flutter test integration_test/
```

### Debug Mode
```bash
flutter run
# Use DevTools: flutter pub global run devtools
```

---

## Troubleshooting

### API Connection Issues
1. **Backend not running**: Start Django development server
   ```bash
   cd config
   python manage.py runserver 0.0.0.0:8000
   ```

2. **CORS Issues**: Ensure Django has CORS enabled:
   ```python
   INSTALLED_APPS = [
       'corsheaders',
       ...
   ]
   CORS_ALLOWED_ORIGINS = [
       'http://localhost:8000',
   ]
   ```

3. **Network error**: 
   - Check if backend URL is correct in `app_config.dart`
   - Verify device/emulator can reach backend

### Authentication Issues
1. **Token not saving**: Check SharedPreferences permissions
2. **Login fails**: Verify username/password are correct
3. **Session expires**: Token validation failed; re-login required

### Build Issues

#### Android
```bash
flutter clean
flutter pub get
flutter pub cache repair
```

#### iOS
```bash
cd ios
rm -rf Pods
pod install
cd ..
flutter clean
flutter pub get
```

#### Web
```bash
flutter clean
flutter pub get
flutter build web
```

---

## Dependencies

| Package | Purpose |
|---------|---------|
| `http` | HTTP requests to backend |
| `shared_preferences` | Local token storage |
| `animate_do` | UI animations |
| `intl` | Date formatting & localization |
| `cached_network_image` | Image caching |
| `flutter_lints` | Code quality rules |

---

## Performance Optimization

### Tips
1. **Lazy load images**: Use `cached_network_image`
2. **Pagination**: Load permits in batches
3. **Minimize rebuilds**: Use `const` widgets
4. **Optimize animations**: Use `SingleTickerProviderStateMixin`
5. **Profile performance**: Use Flutter DevTools

---

## Security Best Practices

1. **Never hardcode API keys** in production
2. **Use HTTPS** in production
3. **Validate user input** on client and server
4. **Store tokens securely** (consider flutter_secure_storage)
5. **Implement SSL pinning** for sensitive data
6. **Set appropriate timeouts** to prevent hanging requests

---

## Deployment

### Google Play Store
1. Create keystore and sign APK
2. Build app bundle: `flutter build appbundle --release`
3. Upload to Google Play Console
4. Set up store listing and pricing
5. Publish app

### Apple App Store
1. Create signing certificate in Xcode
2. Build IPA: `flutter build ipa --release`
3. Upload using Transporter
4. Complete App Store Connect form
5. Submit for review

### Web Deployment
1. Build: `flutter build web --release`
2. Upload `build/web/` to any web server
3. Ensure backend CORS allows your domain

---

## Support & Contribution

For issues or improvements:
1. Check existing documentation
2. Review API endpoint responses
3. Check backend logs for errors
4. Open issue with error logs and steps to reproduce

---

## License

This Flutter app is part of the PTA/RTA Permit Management System.

---

## Changelog

### Version 1.0.0
- ✅ Splash screen with auth check
- ✅ Login with token persistence
- ✅ Display user's permits
- ✅ Search permits by vehicle number or CNIC
- ✅ Detailed permit view
- ✅ Logout functionality
- ✅ Beautiful Material UI with animations
- ✅ Android, iOS, and Web support
