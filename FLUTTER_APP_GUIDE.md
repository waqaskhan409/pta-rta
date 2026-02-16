# Flutter Permit Search App - Implementation Guide

## Overview
This guide provides step-by-step instructions to create a Flutter app for searching and viewing permit details.

---

## Project Setup

### 1. Create Flutter Project

```bash
flutter create permit_search_app
cd permit_search_app
```

### 2. Update pubspec.yaml Dependencies

```yaml
dependencies:
  flutter:
    sdk: flutter
  http: ^1.1.0
  intl: ^0.18.0
  provider: ^6.0.0
  cached_network_image: ^3.2.0
  flutter_dotenv: ^5.1.0
  
dev_dependencies:
  flutter_test:
    sdk: flutter
```

### 3. Install Dependencies

```bash
flutter pub get
```

---

## Project Structure

```
lib/
├── main.dart
├── pages/
│   ├── home_page.dart
│   ├── search_page.dart
│   └── permit_details_page.dart
├── models/
│   ├── permit.dart
│   └── permit_type.dart
├── services/
│   ├── api_service.dart
│   └── constants.dart
├── widgets/
│   ├── permit_card.dart
│   ├── search_form.dart
│   └── permit_details.dart
└── utils/
    └── date_utils.dart
```

---

## 1. Models

### lib/models/permit.dart

```dart
import 'package:intl/intl.dart';

class PermitType {
  final int id;
  final String name;
  final String code;

  PermitType({
    required this.id,
    required this.name,
    required this.code,
  });

  factory PermitType.fromJson(Map<String, dynamic> json) {
    return PermitType(
      id: json['id'] ?? 0,
      name: json['name'] ?? 'Unknown',
      code: json['code'] ?? '',
    );
  }
}

class VehicleType {
  final int id;
  final String name;

  VehicleType({required this.id, required this.name});

  factory VehicleType.fromJson(Map<String, dynamic> json) {
    return VehicleType(
      id: json['id'] ?? 0,
      name: json['name'] ?? 'Unknown',
    );
  }
}

class Permit {
  final int id;
  final String permitNumber;
  final String authority;
  final String vehicleNumber;
  final String status;
  final DateTime validFrom;
  final DateTime validTo;
  final String ownerName;
  final String ownerEmail;
  final String ownerPhone;
  final String? ownerCnic;
  final String? ownerAddress;
  final PermitType? permitType;
  final VehicleType? vehicleType;
  final String? vehicleMake;
  final String? vehicleModel;
  final int? vehicleYear;
  final int? vehicleCapacity;
  final String? description;
  final String? remarks;
  final String? approvedRoutes;
  final String? restrictions;

  Permit({
    required this.id,
    required this.permitNumber,
    required this.authority,
    required this.vehicleNumber,
    required this.status,
    required this.validFrom,
    required this.validTo,
    required this.ownerName,
    required this.ownerEmail,
    required this.ownerPhone,
    this.ownerCnic,
    this.ownerAddress,
    this.permitType,
    this.vehicleType,
    this.vehicleMake,
    this.vehicleModel,
    this.vehicleYear,
    this.vehicleCapacity,
    this.description,
    this.remarks,
    this.approvedRoutes,
    this.restrictions,
  });

  factory Permit.fromJson(Map<String, dynamic> json) {
    return Permit(
      id: json['id'] ?? 0,
      permitNumber: json['permit_number'] ?? '',
      authority: json['authority'] ?? '',
      vehicleNumber: json['vehicle_number'] ?? '',
      status: json['status'] ?? 'pending',
      validFrom: DateTime.parse(json['valid_from'] ?? DateTime.now().toString()),
      validTo: DateTime.parse(json['valid_to'] ?? DateTime.now().toString()),
      ownerName: json['owner_name'] ?? '',
      ownerEmail: json['owner_email'] ?? '',
      ownerPhone: json['owner_phone'] ?? '',
      ownerCnic: json['owner_cnic'],
      ownerAddress: json['owner_address'],
      permitType: json['permit_type'] != null 
          ? PermitType.fromJson(json['permit_type']) 
          : null,
      vehicleType: json['vehicle_type'] != null 
          ? VehicleType.fromJson(json['vehicle_type']) 
          : null,
      vehicleMake: json['vehicle_make'],
      vehicleModel: json['vehicle_model'],
      vehicleYear: json['vehicle_year'],
      vehicleCapacity: json['vehicle_capacity'],
      description: json['description'],
      remarks: json['remarks'],
      approvedRoutes: json['approved_routes'],
      restrictions: json['restrictions'],
    );
  }

  int get daysUntilExpiry {
    final today = DateTime.now();
    return validTo.difference(today).inDays;
  }

  bool get isExpired => daysUntilExpiry < 0;
  bool get isExpiringSoon => daysUntilExpiry < 30 && daysUntilExpiry >= 0;
  bool get isActive => status == 'active' && !isExpired;
}
```

---

## 2. API Service

### lib/services/constants.dart

```dart
const String BASE_URL = 'http://localhost:8000/api';
// For production, use your actual API URL
// const String BASE_URL = 'https://api.yourserver.com/api';
```

### lib/services/api_service.dart

```dart
import 'package:http/http.dart' as http;
import 'dart:convert';
import '../models/permit.dart';
import 'constants.dart';

class ApiService {
  static const String baseUrl = BASE_URL;

  /// Search permits by vehicle number
  static Future<List<Permit>> searchByVehicleNumber(String vehicleNumber) async {
    return _search(vehicleNumber: vehicleNumber);
  }

  /// Search permits by CNIC
  static Future<List<Permit>> searchByCnic(String cnic) async {
    return _search(cnic: cnic);
  }

  /// Internal search method
  static Future<List<Permit>> _search({
    String? vehicleNumber,
    String? cnic,
  }) async {
    try {
      final uri = Uri.parse('$baseUrl/permits/public_search/');
      
      // Build query parameters
      final queryParams = <String, String>{};
      if (vehicleNumber != null && vehicleNumber.isNotEmpty) {
        queryParams['vehicle_number'] = vehicleNumber;
      }
      if (cnic != null && cnic.isNotEmpty) {
        queryParams['cnic'] = cnic;
      }

      // Make request
      final response = await http.get(
        uri.replace(queryParameters: queryParams),
        headers: {
          'Content-Type': 'application/json',
        },
      ).timeout(
        const Duration(seconds: 10),
        onTimeout: () => throw Exception('Request timeout'),
      );

      // Handle response
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        
        if (data['count'] == 0) {
          return [];
        }

        final results = data['results'] as List;
        return results.map((json) => Permit.fromJson(json)).toList();
      } else if (response.statusCode == 400) {
        final error = jsonDecode(response.body);
        throw Exception(error['error'] ?? 'Invalid search parameters');
      } else {
        throw Exception('Failed to search permits: ${response.statusCode}');
      }
    } catch (e) {
      rethrow;
    }
  }
}
```

---

## 3. Utilities

### lib/utils/date_utils.dart

```dart
import 'package:intl/intl.dart';

class DateUtil {
  static String formatDate(DateTime date) {
    final formatter = DateFormat('MMM dd, yyyy');
    return formatter.format(date);
  }

  static String formatDateTime(DateTime dateTime) {
    final formatter = DateFormat('MMM dd, yyyy hh:mm a');
    return formatter.format(dateTime);
  }

  static String getRelativeTime(DateTime date) {
    final now = DateTime.now();
    final difference = now.difference(date);

    if (difference.inDays > 0) {
      return '${difference.inDays} days ago';
    } else if (difference.inHours > 0) {
      return '${difference.inHours} hours ago';
    } else if (difference.inMinutes > 0) {
      return '${difference.inMinutes} minutes ago';
    } else {
      return 'Just now';
    }
  }

  static String getDaysUntilExpiry(DateTime expiryDate) {
    final today = DateTime.now();
    final daysLeft = expiryDate.difference(today).inDays;
    
    if (daysLeft < 0) {
      return 'Expired';
    } else if (daysLeft == 0) {
      return 'Today';
    } else if (daysLeft == 1) {
      return 'Tomorrow';
    } else {
      return '$daysLeft days';
    }
  }
}
```

---

## 4. Widgets

### lib/widgets/search_form.dart

```dart
import 'package:flutter/material.dart';

class SearchForm extends StatefulWidget {
  final Function(String, String) onSearch;
  final bool isLoading;

  const SearchForm({
    Key? key,
    required this.onSearch,
    required this.isLoading,
  }) : super(key: key);

  @override
  State<SearchForm> createState() => _SearchFormState();
}

class _SearchFormState extends State<SearchForm> {
  late String _searchType = 'vehicle';
  late TextEditingController _searchController;

  @override
  void initState() {
    super.initState();
    _searchController = TextEditingController();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Card(
      elevation: 2,
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          children: [
            DropdownButton<String>(
              isExpanded: true,
              value: _searchType,
              items: [
                DropdownMenuItem(
                  value: 'vehicle',
                  child: Text('Search by Vehicle Number'),
                ),
                DropdownMenuItem(
                  value: 'cnic',
                  child: Text('Search by CNIC'),
                ),
              ],
              onChanged: (value) {
                setState(() {
                  _searchType = value!;
                  _searchController.clear();
                });
              },
            ),
            const SizedBox(height: 16),
            TextField(
              controller: _searchController,
              decoration: InputDecoration(
                hintText: _searchType == 'vehicle' 
                    ? 'Enter vehicle number (e.g., ABC-123)'
                    : 'Enter CNIC (e.g., 12345-1234567-1)',
                border: OutlineInputBorder(),
                prefixIcon: Icon(Icons.search),
              ),
              enabled: !widget.isLoading,
            ),
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: widget.isLoading
                    ? null
                    : () {
                        widget.onSearch(_searchType, _searchController.text);
                      },
                child: widget.isLoading
                    ? SizedBox(
                        height: 20,
                        width: 20,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                        ),
                      )
                    : Text('Search'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
```

### lib/widgets/permit_card.dart

```dart
import 'package:flutter/material.dart';
import '../models/permit.dart';
import '../utils/date_utils.dart';

class PermitCard extends StatelessWidget {
  final Permit permit;
  final VoidCallback onTap;

  const PermitCard({
    Key? key,
    required this.permit,
    required this.onTap,
  }) : super(key: key);

  Color _getStatusColor() {
    if (permit.isExpired) return Colors.red;
    if (permit.isExpiringSoon) return Colors.orange;
    if (permit.isActive) return Colors.green;
    return Colors.grey;
  }

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.symmetric(vertical: 8),
      child: InkWell(
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          permit.permitNumber,
                          style: Theme.of(context).textTheme.titleLarge,
                        ),
                        const SizedBox(height: 4),
                        Text(
                          permit.vehicleNumber,
                          style: Theme.of(context).textTheme.bodyMedium,
                        ),
                      ],
                    ),
                  ),
                  Chip(
                    label: Text(permit.status),
                    backgroundColor: _getStatusColor(),
                    labelStyle: TextStyle(color: Colors.white),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    permit.ownerName,
                    style: Theme.of(context).textTheme.bodySmall,
                  ),
                  Text(
                    'Expires: ${DateUtil.getDaysUntilExpiry(permit.validTo)}',
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: _getStatusColor(),
                          fontWeight: FontWeight.bold,
                        ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
```

---

## 5. Pages

### lib/pages/search_page.dart

```dart
import 'package:flutter/material.dart';
import '../models/permit.dart';
import '../services/api_service.dart';
import '../widgets/search_form.dart';
import '../widgets/permit_card.dart';
import 'permit_details_page.dart';

class SearchPage extends StatefulWidget {
  const SearchPage({Key? key}) : super(key: key);

  @override
  State<SearchPage> createState() => _SearchPageState();
}

class _SearchPageState extends State<SearchPage> {
  List<Permit> _results = [];
  bool _isLoading = false;
  String? _error;
  bool _hasSearched = false;

  Future<void> _performSearch(String searchType, String query) async {
    if (query.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Please enter a search query')),
      );
      return;
    }

    setState(() {
      _isLoading = true;
      _error = null;
      _hasSearched = true;
    });

    try {
      late List<Permit> results;
      
      if (searchType == 'vehicle') {
        results = await ApiService.searchByVehicleNumber(query);
      } else {
        results = await ApiService.searchByCnic(query);
      }

      setState(() {
        _results = results;
      });
    } catch (e) {
      setState(() {
        _error = e.toString().replaceFirst('Exception: ', '');
      });
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Search Permits'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            SearchForm(
              onSearch: _performSearch,
              isLoading: _isLoading,
            ),
            const SizedBox(height: 24),
            if (_error != null)
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.red.shade100,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Row(
                  children: [
                    Icon(Icons.error, color: Colors.red),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        _error!,
                        style: TextStyle(color: Colors.red),
                      ),
                    ),
                  ],
                ),
              ),
            if (_hasSearched && _results.isEmpty && _error == null)
              Center(
                child: Column(
                  children: [
                    Icon(
                      Icons.search_off,
                      size: 64,
                      color: Colors.grey,
                    ),
                    const SizedBox(height: 16),
                    Text('No permits found'),
                  ],
                ),
              ),
            if (_results.isNotEmpty)
              ListView.builder(
                shrinkWrap: true,
                physics: NeverScrollableScrollPhysics(),
                itemCount: _results.length,
                itemBuilder: (context, index) {
                  return PermitCard(
                    permit: _results[index],
                    onTap: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (context) => PermitDetailsPage(
                            permit: _results[index],
                          ),
                        ),
                      );
                    },
                  );
                },
              ),
          ],
        ),
      ),
    );
  }
}
```

### lib/pages/permit_details_page.dart

```dart
import 'package:flutter/material.dart';
import '../models/permit.dart';
import '../utils/date_utils.dart';

class PermitDetailsPage extends StatelessWidget {
  final Permit permit;

  const PermitDetailsPage({Key? key, required this.permit}) : super(key: key);

  Color _getStatusColor() {
    if (permit.isExpired) return Colors.red;
    if (permit.isExpiringSoon) return Colors.orange;
    if (permit.isActive) return Colors.green;
    return Colors.grey;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(permit.permitNumber),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Status Card
            Card(
              color: _getStatusColor(),
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      permit.status.toUpperCase(),
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Days remaining: ${permit.daysUntilExpiry}',
                      style: TextStyle(color: Colors.white),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 24),

            // Vehicle Information
            _buildSection(
              context,
              'Vehicle Information',
              [
                _buildField('Vehicle Number', permit.vehicleNumber),
                if (permit.vehicleType != null)
                  _buildField('Vehicle Type', permit.vehicleType!.name),
                if (permit.vehicleMake != null)
                  _buildField('Make', permit.vehicleMake!),
                if (permit.vehicleModel != null)
                  _buildField('Model', permit.vehicleModel!),
                if (permit.vehicleYear != null)
                  _buildField('Year', permit.vehicleYear.toString()),
                if (permit.vehicleCapacity != null)
                  _buildField('Capacity', permit.vehicleCapacity.toString()),
              ],
            ),
            const SizedBox(height: 16),

            // Owner Information
            _buildSection(
              context,
              'Owner Information',
              [
                _buildField('Owner Name', permit.ownerName),
                _buildField('Email', permit.ownerEmail),
                _buildField('Phone', permit.ownerPhone),
                if (permit.ownerCnic != null)
                  _buildField('CNIC', permit.ownerCnic!),
                if (permit.ownerAddress != null)
                  _buildField('Address', permit.ownerAddress!),
              ],
            ),
            const SizedBox(height: 16),

            // Permit Details
            _buildSection(
              context,
              'Permit Details',
              [
                _buildField('Authority', permit.authority),
                if (permit.permitType != null)
                  _buildField('Permit Type', permit.permitType!.name),
                _buildField('Valid From', DateUtil.formatDate(permit.validFrom)),
                _buildField('Valid To', DateUtil.formatDate(permit.validTo)),
              ],
            ),

            if (permit.description != null)
              Padding(
                padding: const EdgeInsets.only(top: 16),
                child: _buildSection(
                  context,
                  'Description',
                  [_buildField('', permit.description!)],
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildSection(
    BuildContext context,
    String title,
    List<Widget> children,
  ) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          title,
          style: Theme.of(context).textTheme.titleLarge,
        ),
        const SizedBox(height: 12),
        Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              children: children,
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildField(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: label.isEmpty
          ? Text(value)
          : Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(label, style: TextStyle(fontWeight: FontWeight.bold)),
                Expanded(
                  child: Text(
                    value,
                    textAlign: TextAlign.right,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ],
            ),
    );
  }
}
```

---

## 6. Main App

### lib/main.dart

```dart
import 'package:flutter/material.dart';
import 'pages/search_page.dart';

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Permit Search',
      theme: ThemeData(
        primarySwatch: Colors.blue,
        useMaterial3: true,
      ),
      home: const SearchPage(),
    );
  }
}
```

---

## Testing the App

### Run on Android/iOS Simulator

```bash
# Run on Android
flutter run

# Run on specific device
flutter run -d <device-id>

# Run with verbose output
flutter run -v
```

### Run on Web

```bash
flutter run -d chrome
```

---

## Database Migration (Backend)

No database migrations are needed as the `public_search` endpoint uses existing permit data.

---

## Environment Configuration

Create a `.env` file for easy API URL configuration:

```
API_BASE_URL=http://localhost:8000/api
```

---

## Next Steps

1. **Test the API endpoint** using the provided curl commands
2. **Run the Flutter app** on an emulator/device
3. **Test search functionality** with sample data
4. **Customize UI** to match your branding
5. **Add error handling** and user feedback improvements
6. **Implement local caching** for frequently searched permits
7. **Add share functionality** to permit details

---

## Troubleshooting

### Issue: Connection Refused

**Solution:** Ensure your backend is running and accessible:

```bash
# Check if backend is running
curl http://localhost:8000/api/permits/public_search/?vehicle_number=test

# If using Android emulator, use 10.0.2.2 instead of localhost
# Update constants.dart:
# const String BASE_URL = 'http://10.0.2.2:8000/api';
```

### Issue: CORS Errors

**Solution:** Flutter mobile apps don't have CORS restrictions. For web, ensure CORS is configured on backend.

### Issue: SSL Certificate Errors

**Solution:** For production, use HTTPS. For development, you may need to disable SSL verification:

```dart
// Only for development!
HttpClient httpClient = new HttpClient()
  ..badCertificateCallback = (X509Certificate cert, String host, int port) => true;
```

---

**Version:** 1.0  
**Last Updated:** February 10, 2026
