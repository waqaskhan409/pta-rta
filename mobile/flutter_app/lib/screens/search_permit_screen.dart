import 'package:flutter/material.dart';
import 'package:animate_do/animate_do.dart';
import '../services/api_service.dart';

class SearchPermitScreen extends StatefulWidget {
  const SearchPermitScreen({Key? key}) : super(key: key);

  @override
  State<SearchPermitScreen> createState() => _SearchPermitScreenState();
}

class _SearchPermitScreenState extends State<SearchPermitScreen> {
  final _searchController = TextEditingController();
  List<dynamic> searchResults = [];
  bool _isLoading = false;
  String _errorMessage = '';
  String _searchType = 'vehicle_number';
  bool _hasSearched = false;

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _handleSearch() async {
    if (_searchController.text.isEmpty) {
      setState(() {
        _errorMessage = 'Please enter a search query';
      });
      return;
    }

    setState(() {
      _isLoading = true;
      _errorMessage = '';
      _hasSearched = true;
    });

    try {
      final result = await ApiService.searchPermits(
        _searchController.text,
        _searchType,
      );

      if (result['success']) {
        setState(() {
          searchResults = result['data'] ?? [];
        });
      } else {
        setState(() {
          _errorMessage = result['error'] ?? 'Search failed';
        });
      }
    } catch (e) {
      setState(() {
        _errorMessage = 'An error occurred: $e';
      });
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Search Permit'),
        elevation: 0,
        backgroundColor: Colors.blue.shade900,
      ),
      body: SingleChildScrollView(
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            children: [
              FadeInDown(
                duration: const Duration(milliseconds: 600),
                child: Card(
                  elevation: 4,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Padding(
                    padding: const EdgeInsets.all(16.0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Search By',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: 12),
                        Row(
                          children: [
                            Expanded(
                              child: RadioListTile<String>(
                                title: const Text('Vehicle Number'),
                                value: 'vehicle_number',
                                groupValue: _searchType,
                                onChanged: (value) {
                                  if (value != null) {
                                    setState(() {
                                      _searchType = value;
                                      _searchController.clear();
                                    });
                                  }
                                },
                              ),
                            ),
                            Expanded(
                              child: RadioListTile<String>(
                                title: const Text('CNIC'),
                                value: 'cnic',
                                groupValue: _searchType,
                                onChanged: (value) {
                                  if (value != null) {
                                    setState(() {
                                      _searchType = value;
                                      _searchController.clear();
                                    });
                                  }
                                },
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 16),
                        TextField(
                          controller: _searchController,
                          decoration: InputDecoration(
                            hintText: _searchType == 'vehicle_number'
                                ? 'e.g., ABC-123'
                                : 'e.g., 12345-1234567-1',
                            labelText: _searchType == 'vehicle_number'
                                ? 'Vehicle Number'
                                : 'CNIC',
                            border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(8),
                            ),
                            enabledBorder: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(8),
                              borderSide: BorderSide(
                                color: Colors.grey.shade300,
                              ),
                            ),
                            focusedBorder: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(8),
                              borderSide: BorderSide(
                                color: Colors.blue.shade900,
                                width: 2,
                              ),
                            ),
                            suffixIcon: _searchController.text.isNotEmpty
                                ? IconButton(
                                    icon: const Icon(Icons.clear),
                                    onPressed: () {
                                      _searchController.clear();
                                      setState(() {});
                                    },
                                  )
                                : null,
                          ),
                          onChanged: (_) {
                            setState(() {});
                          },
                        ),
                        const SizedBox(height: 20),
                        SizedBox(
                          width: double.infinity,
                          height: 48,
                          child: ElevatedButton.icon(
                            onPressed: _isLoading ? null : _handleSearch,
                            style: ElevatedButton.styleFrom(
                              backgroundColor: Colors.blue.shade900,
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(8),
                              ),
                            ),
                            icon: _isLoading
                                ? const SizedBox(
                                    width: 20,
                                    height: 20,
                                    child: CircularProgressIndicator(
                                      strokeWidth: 2,
                                      valueColor: AlwaysStoppedAnimation<Color>(
                                        Colors.white,
                                      ),
                                    ),
                                  )
                                : const Icon(Icons.search),
                            label: Text(
                              _isLoading ? 'Searching...' : 'Search',
                              style: const TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 24),
              if (_errorMessage.isNotEmpty)
                FadeInUp(
                  duration: const Duration(milliseconds: 600),
                  child: Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: Colors.red.shade50,
                      border: Border.all(color: Colors.red.shade300),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Row(
                      children: [
                        Icon(
                          Icons.error_outline,
                          color: Colors.red.shade700,
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Text(
                            _errorMessage,
                            style: TextStyle(
                              color: Colors.red.shade700,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              if (_hasSearched && searchResults.isEmpty && !_isLoading)
                FadeInUp(
                  duration: const Duration(milliseconds: 600),
                  child: Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(
                          Icons.search_off,
                          size: 64,
                          color: Colors.grey.shade400,
                        ),
                        const SizedBox(height: 16),
                        Text(
                          'No permits found',
                          style: TextStyle(
                            color: Colors.grey.shade600,
                            fontSize: 16,
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          'Try searching with a different query',
                          style: TextStyle(
                            color: Colors.grey.shade500,
                            fontSize: 14,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              if (searchResults.isNotEmpty)
                ListView.builder(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  itemCount: searchResults.length,
                  itemBuilder: (context, index) {
                    final permit = searchResults[index];
                    return FadeInUp(
                      duration: Duration(milliseconds: 300 + (index * 100)),
                      child: _buildSearchResultCard(permit),
                    );
                  },
                ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildSearchResultCard(dynamic permit) {
    return Card(
      margin: const EdgeInsets.only(bottom: 16),
      elevation: 4,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
      ),
      child: InkWell(
        onTap: () {
          _showPermitDetails(permit);
        },
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
                          permit['permit_number'] ?? 'N/A',
                          style: const TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          permit['vehicle_number'] ?? 'N/A',
                          style: TextStyle(
                            fontSize: 14,
                            color: Colors.grey.shade600,
                          ),
                        ),
                      ],
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 6,
                    ),
                    decoration: BoxDecoration(
                      color: permit['status'] == 'active'
                          ? Colors.green.shade100
                          : Colors.orange.shade100,
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Text(
                      permit['status']?.toUpperCase() ?? 'N/A',
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                        color: permit['status'] == 'active'
                            ? Colors.green.shade700
                            : Colors.orange.shade700,
                      ),
                    ),
                  ),
                ],
              ),
              const Divider(height: 20),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  _buildInfoColumn('Vehicle Type', permit['vehicle_type']?['name'] ?? 'N/A'),
                  _buildInfoColumn('Permit Type', permit['permit_type']?['name'] ?? 'N/A'),
                ],
              ),
              const SizedBox(height: 16),
              _buildInfoColumn('Owner', permit['owner_name'] ?? 'N/A'),
              const SizedBox(height: 8),
              Text(
                'Tap to view full details',
                style: TextStyle(
                  fontSize: 12,
                  color: Colors.blue.shade700,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildInfoColumn(String label, String value) {
    return Expanded(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: TextStyle(
              fontSize: 12,
              color: Colors.grey.shade600,
              fontWeight: FontWeight.w500,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            value,
            style: const TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w600,
            ),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
    );
  }

  void _showPermitDetails(dynamic permit) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) {
        return DraggableScrollableSheet(
          expand: false,
          builder: (context, scrollController) {
            return SingleChildScrollView(
              controller: scrollController,
              child: Padding(
                padding: const EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Center(
                      child: Container(
                        width: 40,
                        height: 4,
                        decoration: BoxDecoration(
                          color: Colors.grey.shade300,
                          borderRadius: BorderRadius.circular(2),
                        ),
                      ),
                    ),
                    const SizedBox(height: 24),
                    Text(
                      'Permit Details',
                      style: TextStyle(
                        fontSize: 24,
                        fontWeight: FontWeight.bold,
                        color: Colors.blue.shade900,
                      ),
                    ),
                    const SizedBox(height: 20),
                    _buildDetailRow('Permit Number', permit['permit_number'] ?? 'N/A'),
                    _buildDetailRow('Authority', permit['authority'] ?? 'N/A'),
                    _buildDetailRow('Status', permit['status'] ?? 'N/A'),
                    const Divider(height: 24),
                    Text(
                      'Vehicle Information',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: Colors.blue.shade900,
                      ),
                    ),
                    const SizedBox(height: 12),
                    _buildDetailRow('Vehicle Number', permit['vehicle_number'] ?? 'N/A'),
                    _buildDetailRow('Vehicle Type', permit['vehicle_type']?['name'] ?? 'N/A'),
                    _buildDetailRow('Make', permit['vehicle_make'] ?? 'N/A'),
                    _buildDetailRow('Model', permit['vehicle_model'] ?? 'N/A'),
                    _buildDetailRow('Year', permit['vehicle_year']?.toString() ?? 'N/A'),
                    _buildDetailRow('Capacity', permit['vehicle_capacity']?.toString() ?? 'N/A'),
                    const Divider(height: 24),
                    Text(
                      'Owner Information',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: Colors.blue.shade900,
                      ),
                    ),
                    const SizedBox(height: 12),
                    _buildDetailRow('Owner Name', permit['owner_name'] ?? 'N/A'),
                    _buildDetailRow('Owner CNIC', permit['owner_cnic'] ?? 'N/A'),
                    _buildDetailRow('Email', permit['owner_email'] ?? 'N/A'),
                    _buildDetailRow('Phone', permit['owner_phone'] ?? 'N/A'),
                    _buildDetailRow('Address', permit['owner_address'] ?? 'N/A'),
                    const Divider(height: 24),
                    Text(
                      'Permit Information',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: Colors.blue.shade900,
                      ),
                    ),
                    const SizedBox(height: 12),
                    _buildDetailRow('Permit Type', permit['permit_type']?['name'] ?? 'N/A'),
                    _buildDetailRow('Valid From', permit['valid_from']?.split('T')[0] ?? 'N/A'),
                    _buildDetailRow('Valid To', permit['valid_to']?.split('T')[0] ?? 'N/A'),
                    _buildDetailRow('Description', permit['description'] ?? 'N/A'),
                    if (permit['approved_routes'] != null)
                      _buildDetailRow('Routes', permit['approved_routes'] ?? 'N/A'),
                    const SizedBox(height: 24),
                  ],
                ),
              ),
            );
          },
        );
      },
    );
  }

  Widget _buildDetailRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 130,
            child: Text(
              label,
              style: TextStyle(
                fontSize: 14,
                color: Colors.grey.shade600,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: const TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
