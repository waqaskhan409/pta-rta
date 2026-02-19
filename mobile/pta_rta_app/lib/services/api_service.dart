import 'package:http/http.dart' as http;
import 'dart:convert';
import 'dart:io';
import 'package:shared_preferences/shared_preferences.dart';

class ApiService {
  // Determine base URL based on platform
  static String get baseUrl {
    if (Platform.isAndroid) {
      return 'http://10.0.2.2:8000/api'; // Android emulator IP for host
    } else if (Platform.isIOS) {
      return 'http://localhost:8000/api'; // iOS simulator can use localhost
    } else {
      return 'http://localhost:8000/api'; // Default for other platforms
    }
  }

  static const String apiKey = 'your-api-key'; // Update with your API key

  static Future<Map<String, dynamic>> login(
    String username,
    String password,
  ) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/auth/login/'),
        headers: {
          'Content-Type': 'application/json',
        },
        body: jsonEncode({
          'username': username,
          'password': password,
        }),
      );

      print('🔐 LOGIN Request: $username');
      print('   URL: $baseUrl/auth/login/');
      print('   Response Status: ${response.statusCode}');
      print('   Response Body: ${response.body}');

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        // Save token
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString('auth_token', data['token'] ?? '');
        return {'success': true, 'data': data};
      } else {
        try {
          final errorData = jsonDecode(response.body);
          return {
            'success': false,
            'error': errorData['errors'] != null
                ? errorData['errors'].toString()
                : errorData['error'] ?? errorData.toString() ?? 'Login failed'
          };
        } catch (e) {
          return {
            'success': false,
            'error': 'Server error (${response.statusCode}): ${response.body}'
          };
        }
      }
    } catch (e) {
      return {'success': false, 'error': 'Network error: $e'};
    }
  }

  static Future<Map<String, dynamic>> searchPermits(
    String query,
    String searchType, // 'vehicle_number' or 'cnic'
  ) async {
    try {
      final Map<String, String> params = {
        'format': 'json', // DRF format suffix
      };
      if (searchType == 'vehicle_number') {
        params['vehicle_number'] = query;
      } else if (searchType == 'cnic') {
        params['cnic'] = query;
      }

      final uri = Uri.parse('$baseUrl/permits/public_search/')
          .replace(queryParameters: params);

      final response = await http.get(
        uri,
        headers: {
          'Content-Type': 'application/json',
          // No API key needed for public search endpoint
        },
      );

      print('Search Request URL: $uri');
      print('Response Status: ${response.statusCode}');
      print('Response Body: ${response.body}');

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return {'success': true, 'data': data['results'] ?? []};
      } else {
        try {
          final errorData = jsonDecode(response.body);
          return {
            'success': false,
            'error':
                errorData['error'] ?? errorData.toString() ?? 'Search failed'
          };
        } catch (e) {
          return {
            'success': false,
            'error': 'Server error (${response.statusCode}): ${response.body}'
          };
        }
      }
    } catch (e) {
      return {'success': false, 'error': 'Network error: $e'};
    }
  }

  static Future<Map<String, dynamic>> getUserPermits() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('auth_token') ?? '';

      if (token.isEmpty) {
        return {'success': false, 'error': 'No authentication token found'};
      }

      final response = await http.get(
        Uri.parse('$baseUrl/permits/'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Token $token',
          'X-API-KEY': apiKey,
        },
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return {'success': true, 'data': data['results'] ?? []};
      } else if (response.statusCode == 401) {
        return {'success': false, 'error': 'Unauthorized - Token expired'};
      } else {
        return {'success': false, 'error': 'Failed to fetch permits'};
      }
    } catch (e) {
      return {'success': false, 'error': 'Network error: $e'};
    }
  }

  static Future<void> logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('auth_token');
  }

  static Future<String?> getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('auth_token');
  }
}
