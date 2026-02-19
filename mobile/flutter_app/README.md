# Getting Started with Flutter

This project is a starting point for a Flutter application - PTA/RTA Permit Management App.

## Supported platforms
- Android
- iOS
- Web

## Setup Instructions

### Prerequisites
- Flutter SDK (latest stable)
- Dart SDK (included with Flutter)
- Android Studio / XCode (for mobile development)
- Git

### Installation

1. **Install Flutter** (if not already installed)
   ```bash
   # Download from https://flutter.dev/docs/get-started/install
   ```

2. **Navigate to the Flutter app directory**
   ```bash
   cd config/mobile/flutter_app
   ```

3. **Get dependencies**
   ```bash
   flutter pub get
   ```

4. **Run the app**
   ```bash
   # For Android
   flutter run
   
   # For iOS
   flutter run -d ios
   
   # For Web
   flutter run -d chrome
   ```

## Project Structure

```
flutter_app/
├── lib/
│   ├── main.dart                 # Entry point
│   ├── main_router.dart          # Route definitions
│   ├── screens/
│   │   ├── splash_screen.dart    # Splash screen & auth check
│   │   ├── login_screen.dart     # User login
│   │   ├── home_screen.dart      # User's permits display
│   │   └── search_permit_screen.dart  # Permit search
│   └── services/
│       └── api_service.dart      # API communication
├── android/                      # Android-specific code
├── ios/                          # iOS-specific code
├── web/                          # Web-specific code
├── assets/                       # Images, fonts, etc.
└── pubspec.yaml                  # Dependencies
```

## Features

### ✅ Implemented
- **Splash Screen**: Shows on app launch with token validation
- **Authentication**: 
  - Login with username/password
  - Token saved in SharedPreferences
  - Persistent login across sessions
- **User Permits**: Display permits associated with logged-in user
- **Permit Search**:
  - Search by vehicle number
  - Search by CNIC (Citizen ID)
  - View detailed permit information
- **Logout**: Clear token and redirect to login

## API Configuration

The app connects to a Django backend. Update the API base URL in [lib/services/api_service.dart](lib/services/api_service.dart):

```dart
static const String baseUrl = 'http://localhost:8000/api';
static const String apiKey = 'your-api-key';
```

## API Endpoints Used

1. **Login**: `POST /api/auth/login/`
   - Request: `{username, password}`
   - Response: `{token, user_info}`

2. **Get User Permits**: `GET /api/permits/`
   - Header: `Authorization: Token <token>`
   - Response: `{count, results: [permits]}`

3. **Search Permits**: `GET /api/permits/public_search/`
   - Query: `?vehicle_number=ABC-123` or `?cnic=12345-1234567-1`
   - Response: `{count, results: [permits]}`

4. **Logout**: `POST /api/auth/logout/`
   - Header: `Authorization: Token <token>`

## SharedPreferences Storage

The app uses SharedPreferences to store:
- **auth_token**: User authentication token (persistent login)

## State Management

Currently using Flutter's built-in `setState`. For larger apps, consider:
- Provider
- Riverpod
- Bloc
- GetX

## Building for Production

### Android
```bash
flutter build apk
# or
flutter build appbundle  # For Google Play Store
```

### iOS
```bash
flutter build ios
```

### Web
```bash
flutter build web
```

## Troubleshooting

### Connection Issues
- Ensure Django backend is running
- Check API base URL in api_service.dart
- Verify network connectivity

### SharedPreferences Issues
- Clear app data: Settings > Apps > PTA/RTA > Storage > Clear Data
- Run: `flutter clean && flutter pub get`

### Platform Issues
- Android: `flutter clean && flutter pub get`
- iOS: `cd ios && pod install && cd ..`

## Dependencies

- **http**: For API calls
- **shared_preferences**: For local storage
- **animate_do**: For animations
- **intl**: For internationalization
- **cached_network_image**: For image caching

## Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## License

This project is part of the PTA/RTA Permit Management System.

## Support

For issues or questions, please open an issue in the main repository.
