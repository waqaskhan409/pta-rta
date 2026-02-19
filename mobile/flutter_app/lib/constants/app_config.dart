class AppConfig {
  // API Configuration
  static const String apiBaseUrl = 'http://localhost:8000/api';
  static const String apiKey = 'your-api-key-here';
  
  // Network Timeouts
  static const Duration connectTimeout = Duration(seconds: 30);
  static const Duration receiveTimeout = Duration(seconds: 30);
  
  // Animation Durations
  static const Duration shortAnimationDuration = Duration(milliseconds: 300);
  static const Duration mediumAnimationDuration = Duration(milliseconds: 600);
  static const Duration longAnimationDuration = Duration(milliseconds: 1000);
  
  // Splash Screen Duration
  static const Duration splashDuration = Duration(seconds: 2);
  
  // SharedPreferences Keys
  static const String tokenKey = 'auth_token';
  static const String userKey = 'user_data';
  
  // Pagination
  static const int pageSize = 20;
}
