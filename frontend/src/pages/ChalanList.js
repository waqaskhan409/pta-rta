import React, { useState, useEffect, useCallback } from 'react';
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Box,
  TextField,
  CircularProgress,
  Alert,
  Chip,
  Toolbar,
  Typography,
  Tooltip,
  TablePagination,
  Card,
  CardContent,
  Grid,
} from '@mui/material';
import {
  Visibility as ViewIcon,
  Add as AddIcon,
  Edit as EditIcon,
  DoneAll as PaidIcon,
  Cancel as CancelIcon,
  PriceChange as FeeIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { chalanAPI, vehicleTypeAPI } from '../services/chalanService';
import '../styles/page.css';

function ChalanList() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [chalans, setChalans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [vehicleTypes, setVehicleTypes] = useState([]);
  const [stats, setStats] = useState(null);

  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);

  const statusColors = {
    pending: 'warning',
    issued: 'info',
    paid: 'success',
    cancelled: 'error',
    disputed: 'error',
    resolved: 'success',
  };

  // Fetch vehicle types for display
  useEffect(() => {
    const fetchVehicleTypes = async () => {
      try {
        const response = await vehicleTypeAPI.getVehicleTypes();
        setVehicleTypes(response.data.results || response.data || []);
      } catch (err) {
        console.error('Error fetching vehicle types:', err);
      }
    };
    fetchVehicleTypes();
  }, []);

  // Fetch chalans
  const fetchChalans = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let params = {
        offset: page * rowsPerPage,
        limit: rowsPerPage,
      };

      if (searchTerm) {
        params.search = searchTerm;
      }

      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }

      const response = await chalanAPI.getChalans(params);
      const data = response.data.results || response.data || [];
      setChalans(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching chalans:', err);
      setError(err.response?.data?.detail || 'Failed to load chalans');
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, searchTerm, statusFilter]);

  // Fetch statistics
  const fetchStats = useCallback(async () => {
    try {
      const response = await chalanAPI.getStatistics();
      setStats(response.data);
    } catch (err) {
      console.error('Error fetching statistics:', err);
    }
  }, []);

  useEffect(() => {
    fetchChalans();
    fetchStats();
  }, [fetchChalans, fetchStats]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleViewChalan = (id) => {
    navigate(`/chalans/${id}`);
  };

  const handleManageFees = () => {
    navigate('/fee-management');
  };

  // Check if user has permission to manage vehicle fees
  const canManageFees = user && user.features &&
    user.features.some(f => f.name === 'chalan_vehicle_fee_manage') ||
    user?.role?.name === 'admin';

  const getVehicleTypeName = (vehicleTypeId) => {
    const vType = vehicleTypes.find((vt) => vt.id === vehicleTypeId);
    return vType ? vType.name : 'N/A';
  };

  return (
    <Box sx={{ padding: '20px' }}>
      <Typography variant="h4" sx={{ marginBottom: '20px', fontWeight: 'bold' }}>
        Chalan Management
      </Typography>

      {/* Statistics Cards */}
      {stats && (
        <Grid container spacing={2} sx={{ marginBottom: '30px' }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography color="textSecondary" gutterBottom>
                  Total Chalans
                </Typography>
                <Typography variant="h5">
                  {stats.total_chalans || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography color="textSecondary" gutterBottom>
                  Pending
                </Typography>
                <Typography variant="h5" sx={{ color: '#ff9800' }}>
                  {stats.pending_count || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography color="textSecondary" gutterBottom>
                  Paid
                </Typography>
                <Typography variant="h5" sx={{ color: '#4caf50' }}>
                  {stats.paid_count || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography color="textSecondary" gutterBottom>
                  Pending Collection
                </Typography>
                <Typography variant="h5" sx={{ color: '#f44336' }}>
                  Rs. {parseFloat(stats.pending_collection || 0).toFixed(2)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Error Alert */}
      {error && <Alert severity="error" sx={{ marginBottom: '20px' }}>{error}</Alert>}

      {/* Toolbar */}
      <Toolbar sx={{ backgroundColor: '#f5f5f5', borderRadius: '4px', marginBottom: '20px', padding: '10px' }}>
        <TextField
          label="Search by name, CNIC, or car number"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setPage(0);
          }}
          size="small"
          sx={{ marginRight: '20px', minWidth: '300px' }}
        />

        <TextField
          select
          label="Status"
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(0);
          }}
          size="small"
          SelectProps={{ native: true }}
          sx={{ marginRight: '20px', minWidth: '150px' }}
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="issued">Issued</option>
          <option value="paid">Paid</option>
          <option value="cancelled">Cancelled</option>
          <option value="disputed">Disputed</option>
          <option value="resolved">Resolved</option>
        </TextField>

        <Box sx={{ flexGrow: 1 }} />

        {canManageFees && (
          <Button
            variant="outlined"
            color="primary"
            startIcon={<FeeIcon />}
            onClick={handleManageFees}
            sx={{ marginRight: '10px' }}
          >
            Manage Vehicle Fees
          </Button>
        )}

      </Toolbar>

      {/* Loading */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
          <CircularProgress />
        </Box>
      )}

      {/* Table */}
      {!loading && (
        <TableContainer component={Paper}>
          <Table>
            <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>Chalan #</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Owner Name</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>CNIC</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Car Number</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Vehicle Type</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold' }}>Fee</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold' }}>Paid</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {chalans.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ padding: '40px' }}>
                    No chalans found
                  </TableCell>
                </TableRow>
              ) : (
                chalans.map((chalan) => (
                  <TableRow key={chalan.id} hover>
                    <TableCell>{chalan.chalan_number}</TableCell>
                    <TableCell>{chalan.owner_name}</TableCell>
                    <TableCell>{chalan.owner_cnic}</TableCell>
                    <TableCell>{chalan.car_number}</TableCell>
                    <TableCell>{getVehicleTypeName(chalan.vehicle_type)}</TableCell>
                    <TableCell align="right">
                      Rs. {parseFloat(chalan.fees_amount).toFixed(2)}
                    </TableCell>
                    <TableCell align="right">
                      Rs. {parseFloat(chalan.paid_amount).toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={chalan.status.toUpperCase()}
                        color={statusColors[chalan.status] || 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Tooltip title="View Details">
                        <Button
                          size="small"
                          startIcon={<ViewIcon />}
                          onClick={() => handleViewChalan(chalan.id)}
                        >
                          View
                        </Button>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          <TablePagination
            rowsPerPageOptions={[5, 10, 20, 50]}
            component="div"
            count={stats?.total_chalans || 0}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </TableContainer>
      )}
    </Box>
  );
}

export default ChalanList;
