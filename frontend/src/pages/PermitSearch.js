import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Container,
  Grid,
  TextField,
  Button,
  Alert,
  TableCell,
  TableContainer,
  TableHead,
  Typography,
  Chip,
  Divider,
  LinearProgress,
} from '@mui/material';
import {
  Search as SearchIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Schedule as ScheduleIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import apiClient from '../services/apiClient';
import '../styles/page.css';

const PermitSearch = () => {
  const [searchType, setSearchType] = useState('vehicle'); // 'vehicle' or 'cnic'
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [results, setResults] = useState([]);
  const [searched, setSearched] = useState(false);

  // Calculate days until expiry
  const getDaysUntilExpiry = (expiryDate) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Get status color and message
  const getStatusInfo = (permit) => {
    const daysLeft = getDaysUntilExpiry(permit.valid_to);

    if (permit.status === 'expired') {
      return { label: 'Expired', color: 'error', icon: <CancelIcon /> };
    }
    if (permit.status === 'cancelled') {
      return { label: 'Cancelled', color: 'error', icon: <CancelIcon /> };
    }
    if (daysLeft < 30 && daysLeft >= 0) {
      return { label: 'Expiring Soon', color: 'warning', icon: <ScheduleIcon /> };
    }
    if (daysLeft < 0) {
      return { label: 'Expired', color: 'error', icon: <CancelIcon /> };
    }
    if (permit.status === 'active') {
      return { label: 'Active', color: 'success', icon: <CheckCircleIcon /> };
    }
    return { label: permit.status, color: 'default', icon: <InfoIcon /> };
  };

  const handleSearch = async (e) => {
    e.preventDefault();

    if (!searchQuery.trim()) {
      setError('Please enter a search query');
      return;
    }

    setLoading(true);
    setError('');
    setResults([]);
    setSearched(true);

    try {
      const params =
        searchType === 'vehicle'
          ? { vehicle_number: searchQuery }
          : { cnic: searchQuery };

      const response = await apiClient.get('/permits/public_search/', { params });

      if (response.data.count === 0) {
        setError(response.data.message || 'No permits found');
        setResults([]);
      } else {
        setResults(response.data.results);
      }
    } catch (err) {
      setError(
        err.response?.data?.error ||
        err.response?.data?.detail ||
        'Failed to search permits. Please try again.'
      );
      setResults([]);
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setSearchQuery('');
    setResults([]);
    setError('');
    setSearched(false);
  };

  const statusInfo = results.length > 0 ? getStatusInfo(results[0]) : null;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1, color: '#1976d2' }}>
          Permit Search
        </Typography>
        <Typography variant="body1" sx={{ color: 'text.secondary' }}>
          Search for permit details by vehicle number or CNIC
        </Typography>
      </Box>

      {/* Search Card */}
      <Card sx={{ mb: 4 }}>
        <CardHeader
          title="Search Permits"
          subheader="Enter vehicle number or CNIC to find permit details"
          sx={{ bgcolor: '#f5f5f5' }}
        />
        <CardContent>
          <form onSubmit={handleSearch}>
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  fullWidth
                  label="Search By"
                  value={searchType}
                  onChange={(e) => setSearchType(e.target.value)}
                  SelectProps={{ native: true }}
                >
                  <option value="vehicle">Vehicle Number (e.g., ABC-123)</option>
                  <option value="cnic">CNIC (e.g., 12345-1234567-1)</option>
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label={searchType === 'vehicle' ? 'Vehicle Number' : 'CNIC'}
                  placeholder={searchType === 'vehicle' ? 'Enter vehicle number' : 'Enter CNIC'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  disabled={loading}
                />
              </Grid>
            </Grid>

            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="contained"
                startIcon={<SearchIcon />}
                onClick={handleSearch}
                disabled={loading || !searchQuery.trim()}
                sx={{
                  bgcolor: '#1976d2',
                  '&:hover': { bgcolor: '#1565c0' },
                }}
              >
                {loading ? 'Searching...' : 'Search'}
              </Button>
              <Button
                variant="outlined"
                onClick={handleClear}
                disabled={loading}
              >
                Clear
              </Button>
            </Box>
          </form>

          {loading && <LinearProgress sx={{ mt: 2 }} />}
        </CardContent>
      </Card>

      {/* Error Message */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Results */}
      {searched && results.length > 0 && (
        <Box>
          {/* Summary */}
          <Card sx={{ mb: 3, bgcolor: '#f5f5f5' }}>
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    Found {results.length} permit(s)
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6} sx={{ textAlign: { xs: 'left', sm: 'right' } }}>
                  {statusInfo && (
                    <Chip
                      icon={statusInfo.icon}
                      label={statusInfo.label}
                      color={statusInfo.color}
                      variant="outlined"
                    />
                  )}
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Results Table */}
          {results.map((permit) => (
            <PermitDetailsCard key={permit.id} permit={permit} />
          ))}
        </Box>
      )}

      {/* Empty State */}
      {searched && results.length === 0 && !error && (
        <Card sx={{ textAlign: 'center', py: 4 }}>
          <CardContent>
            <SearchIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" sx={{ color: 'text.secondary' }}>
              No results found
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mt: 1 }}>
              Try searching with a different vehicle number or CNIC
            </Typography>
          </CardContent>
        </Card>
      )}
    </Container>
  );
};

// Permit Details Card Component
const PermitDetailsCard = ({ permit }) => {
  const getDaysUntilExpiry = (expiryDate) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  const getStatusColor = (status, validTo) => {
    const daysLeft = getDaysUntilExpiry(validTo);
    if (status === 'expired' || daysLeft < 0) return '#f44336';
    if (daysLeft < 30) return '#ff9800';
    if (status === 'active') return '#4caf50';
    return '#2196f3';
  };

  const daysLeft = getDaysUntilExpiry(permit.valid_to);
  const statusColor = getStatusColor(permit.status, permit.valid_to);

  return (
    <Card sx={{ mb: 3, borderLeft: `5px solid ${statusColor}` }}>
      <CardHeader
        title={`Permit: ${permit.permit_number}`}
        subheader={`Authority: ${permit.authority}`}
        sx={{ bgcolor: '#f5f5f5' }}
      />
      <CardContent>
        <Grid container spacing={3}>
          {/* Vehicle Information */}
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1, color: '#1976d2' }}>
              Vehicle Information
            </Typography>
            <Box sx={{ pl: 2 }}>
              <Box sx={{ mb: 1 }}>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Vehicle Number:
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                  {permit.vehicle_number}
                </Typography>
              </Box>
              <Box sx={{ mb: 1 }}>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Vehicle Type:
                </Typography>
                <Typography variant="body1">
                  {permit.vehicle_type?.name || 'N/A'}
                </Typography>
              </Box>
              <Box sx={{ mb: 1 }}>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Make & Model:
                </Typography>
                <Typography variant="body1">
                  {permit.vehicle_make && permit.vehicle_model
                    ? `${permit.vehicle_make} ${permit.vehicle_model}`
                    : 'N/A'}
                </Typography>
              </Box>
              {permit.vehicle_year && (
                <Box>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    Year:
                  </Typography>
                  <Typography variant="body1">{permit.vehicle_year}</Typography>
                </Box>
              )}
            </Box>
          </Grid>

          {/* Owner Information */}
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1, color: '#1976d2' }}>
              Owner Information
            </Typography>
            <Box sx={{ pl: 2 }}>
              <Box sx={{ mb: 1 }}>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Owner Name:
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                  {permit.owner_name}
                </Typography>
              </Box>
              <Box sx={{ mb: 1 }}>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  CNIC:
                </Typography>
                <Typography variant="body1">{permit.owner_cnic || 'N/A'}</Typography>
              </Box>
              <Box sx={{ mb: 1 }}>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Email:
                </Typography>
                <Typography variant="body1">{permit.owner_email}</Typography>
              </Box>
              <Box>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Phone:
                </Typography>
                <Typography variant="body1">{permit.owner_phone}</Typography>
              </Box>
            </Box>
          </Grid>

          <Grid item xs={12}>
            <Divider />
          </Grid>

          {/* Permit Details */}
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1, color: '#1976d2' }}>
              Permit Details
            </Typography>
            <Box sx={{ pl: 2 }}>
              <Box sx={{ mb: 1 }}>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Permit Type:
                </Typography>
                <Typography variant="body1">
                  {permit.permit_type?.name || 'N/A'}
                </Typography>
              </Box>
              <Box sx={{ mb: 1 }}>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Status:
                </Typography>
                <Chip
                  label={permit.status}
                  color={permit.status === 'active' ? 'success' : 'error'}
                  size="small"
                />
              </Box>
              <Box>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Valid From:
                </Typography>
                <Typography variant="body1">{formatDate(permit.valid_from)}</Typography>
              </Box>
            </Box>
          </Grid>

          {/* Expiry Information */}
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1, color: '#1976d2' }}>
              Expiry Information
            </Typography>
            <Box sx={{ pl: 2 }}>
              <Box sx={{ mb: 1 }}>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Valid Until:
                </Typography>
                <Typography
                  variant="body1"
                  sx={{
                    fontWeight: 'bold',
                    color: statusColor,
                  }}
                >
                  {formatDate(permit.valid_to)}
                </Typography>
              </Box>
              <Box sx={{ mb: 1 }}>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Days Remaining:
                </Typography>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 'bold',
                    color: daysLeft < 0 ? '#f44336' : daysLeft < 30 ? '#ff9800' : '#4caf50',
                  }}
                >
                  {Math.max(daysLeft, 0)} days
                </Typography>
              </Box>
              {daysLeft < 0 && (
                <Alert severity="error" sx={{ mt: 1, '*': { margin: 0 } }}>
                  This permit has expired
                </Alert>
              )}
              {daysLeft < 30 && daysLeft >= 0 && (
                <Alert severity="warning" sx={{ mt: 1, '*': { margin: 0 } }}>
                  This permit is expiring soon
                </Alert>
              )}
            </Box>
          </Grid>

          {permit.description && (
            <>
              <Grid item xs={12}>
                <Divider />
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1, color: '#1976d2' }}>
                  Description
                </Typography>
                <Typography variant="body2">{permit.description}</Typography>
              </Grid>
            </>
          )}

          {permit.approved_routes && (
            <Grid item xs={12}>
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1, color: '#1976d2' }}>
                Approved Routes
              </Typography>
              <Typography variant="body2">{permit.approved_routes}</Typography>
            </Grid>
          )}
        </Grid>
      </CardContent>
    </Card>
  );
};

export default PermitSearch;
