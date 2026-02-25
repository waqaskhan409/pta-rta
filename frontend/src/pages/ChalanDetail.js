import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Alert,
  Grid,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { chalanAPI, vehicleTypeAPI } from '../services/chalanService';
import {
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  DoneAll as PaidIcon,
} from '@mui/icons-material';
import '../styles/page.css';

function ChalanDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [chalan, setChalan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [vehicleTypes, setVehicleTypes] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({});

  // Dialog states
  const [paymentDialog, setPaymentDialog] = useState(false);
  const [feeDialog, setFeeDialog] = useState(false);
  const [paymentData, setPaymentData] = useState({
    payment_amount: '',
    payment_reference: '',
  });
  const [feeData, setFeeData] = useState({ fees_amount: '' });

  const statusColors = {
    pending: 'warning',
    issued: 'info',
    paid: 'success',
    cancelled: 'error',
    disputed: 'error',
    resolved: 'success',
  };

  // Fetch chalan details
  useEffect(() => {
    const fetchChalan = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await chalanAPI.getChalan(id);
        setChalan(response.data);
        setEditData(response.data);
        setPaymentData({
          payment_amount: response.data.remaining_amount || response.data.fees_amount,
          payment_reference: '',
        });
        setFeeData({ fees_amount: response.data.fees_amount });
      } catch (err) {
        console.error('Error fetching chalan:', err);
        setError('Failed to load chalan details');
      } finally {
        setLoading(false);
      }
    };
    fetchChalan();
  }, [id]);

  // Fetch vehicle types
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

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSaveEdit = async () => {
    try {
      setLoading(true);
      const updateData = {
        owner_name: editData.owner_name,
        owner_phone: editData.owner_phone,
        violation_description: editData.violation_description,
        issue_location: editData.issue_location,
        remarks: editData.remarks,
      };

      const response = await chalanAPI.updateChalan(id, updateData);
      setChalan(response.data);
      setIsEditing(false);
      setSuccess('Chalan updated successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update chalan');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsPaid = async () => {
    try {
      setLoading(true);
      await chalanAPI.markAsPaid(id, paymentData);
      setSuccess('Chalan marked as paid');
      setPaymentDialog(false);
      // Refresh chalan
      const response = await chalanAPI.getChalan(id);
      setChalan(response.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to mark as paid');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateFees = async () => {
    try {
      setLoading(true);
      await chalanAPI.updateFees(id, feeData);
      setSuccess('Fees updated successfully');
      setFeeDialog(false);
      // Refresh chalan
      const response = await chalanAPI.getChalan(id);
      setChalan(response.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update fees');
    } finally {
      setLoading(false);
    }
  };

  const getVehicleTypeName = (vehicleTypeId) => {
    const vType = vehicleTypes.find((vt) => vt.id === vehicleTypeId);
    return vType ? vType.name : 'N/A';
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error && !chalan) {
    return (
      <Box sx={{ padding: '20px' }}>
        <Alert severity="error">{error}</Alert>
        <Button
          variant="outlined"
          onClick={() => navigate('/chalans')}
          sx={{ marginTop: '20px' }}
        >
          Back to Chalans
        </Button>
      </Box>
    );
  }

  if (!chalan) {
    return (
      <Box sx={{ padding: '20px' }}>
        <Alert severity="info">Chalan not found</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ padding: '20px', maxWidth: '1000px', margin: '0 auto' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
          Chalan # {chalan.chalan_number}
        </Typography>
        <Box>
          <Button
            variant="outlined"
            onClick={() => navigate('/chalans')}
            sx={{ marginRight: '10px' }}
          >
            Back
          </Button>
          {!isEditing && (
            <Button
              variant="contained"
              startIcon={<EditIcon />}
              onClick={() => setIsEditing(true)}
            >
              Edit
            </Button>
          )}
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ marginBottom: '20px' }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ marginBottom: '20px' }}>{success}</Alert>}

      {/* Status Card */}
      <Card sx={{ marginBottom: '20px', backgroundColor: '#f5f5f5' }}>
        <CardContent>
          <Grid container spacing={3}>
            <Grid item xs={12} md={3}>
              <Typography color="textSecondary" gutterBottom>
                Status
              </Typography>
              <Chip
                label={chalan.status.toUpperCase()}
                color={statusColors[chalan.status] || 'default'}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <Typography color="textSecondary" gutterBottom>
                Created Date
              </Typography>
              <Typography>
                {new Date(chalan.issued_date).toLocaleDateString()}
              </Typography>
            </Grid>
            <Grid item xs={12} md={3}>
              <Typography color="textSecondary" gutterBottom>
                Total Fee
              </Typography>
              <Typography sx={{ fontWeight: 'bold', color: '#f44336' }}>
                Rs. {parseFloat(chalan.fees_amount).toFixed(2)}
              </Typography>
            </Grid>
            <Grid item xs={12} md={3}>
              <Typography color="textSecondary" gutterBottom>
                Paid Amount
              </Typography>
              <Typography sx={{ fontWeight: 'bold', color: '#4caf50' }}>
                Rs. {parseFloat(chalan.paid_amount).toFixed(2)}
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Owner Information */}
      <Paper sx={{ padding: '20px', marginBottom: '20px' }}>
        <Typography variant="h6" sx={{ marginBottom: '15px', fontWeight: 'bold' }}>
          Owner Information
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Typography color="textSecondary" gutterBottom>
              Name
            </Typography>
            {isEditing ? (
              <TextField
                name="owner_name"
                value={editData.owner_name}
                onChange={handleEditChange}
                fullWidth
                size="small"
              />
            ) : (
              <Typography>{chalan.owner_name}</Typography>
            )}
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography color="textSecondary" gutterBottom>
              CNIC
            </Typography>
            <Typography>{chalan.owner_cnic}</Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography color="textSecondary" gutterBottom>
              Phone
            </Typography>
            {isEditing ? (
              <TextField
                name="owner_phone"
                value={editData.owner_phone || ''}
                onChange={handleEditChange}
                fullWidth
                size="small"
              />
            ) : (
              <Typography>{chalan.owner_phone || 'N/A'}</Typography>
            )}
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography color="textSecondary" gutterBottom>
              Car Number
            </Typography>
            <Typography>{chalan.car_number}</Typography>
          </Grid>
        </Grid>
      </Paper>

      {/* Violation Information */}
      <Paper sx={{ padding: '20px', marginBottom: '20px' }}>
        <Typography variant="h6" sx={{ marginBottom: '15px', fontWeight: 'bold' }}>
          Violation Information
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Typography color="textSecondary" gutterBottom>
              Vehicle Type
            </Typography>
            <Typography>{getVehicleTypeName(chalan.vehicle_type)}</Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography color="textSecondary" gutterBottom>
              Issue Location
            </Typography>
            {isEditing ? (
              <TextField
                name="issue_location"
                value={editData.issue_location || ''}
                onChange={handleEditChange}
                fullWidth
                size="small"
              />
            ) : (
              <Typography>{chalan.issue_location || 'N/A'}</Typography>
            )}
          </Grid>
          <Grid item xs={12}>
            <Typography color="textSecondary" gutterBottom>
              Violation Description
            </Typography>
            {isEditing ? (
              <TextField
                name="violation_description"
                value={editData.violation_description}
                onChange={handleEditChange}
                fullWidth
                multiline
                rows={3}
                size="small"
              />
            ) : (
              <Typography>{chalan.violation_description}</Typography>
            )}
          </Grid>
          <Grid item xs={12}>
            <Typography color="textSecondary" gutterBottom>
              Remarks
            </Typography>
            {isEditing ? (
              <TextField
                name="remarks"
                value={editData.remarks || ''}
                onChange={handleEditChange}
                fullWidth
                multiline
                rows={2}
                size="small"
              />
            ) : (
              <Typography>{chalan.remarks || 'N/A'}</Typography>
            )}
          </Grid>
        </Grid>
      </Paper>

      {/* Payment Information */}
      <Paper sx={{ padding: '20px', marginBottom: '20px' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            Payment Information
          </Typography>
          <Box>
            {chalan.status !== 'paid' && chalan.status !== 'cancelled' && (
              <>
                <Button
                  variant="contained"
                  color="success"
                  startIcon={<PaidIcon />}
                  onClick={() => setPaymentDialog(true)}
                  sx={{ marginRight: '10px' }}
                >
                  Mark as Paid
                </Button>
                <Button
                  variant="contained"
                  color="warning"
                  onClick={() => setFeeDialog(true)}
                >
                  Update Fees
                </Button>
              </>
            )}
          </Box>
        </Box>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Typography color="textSecondary" gutterBottom>
              Total Fee
            </Typography>
            <Typography sx={{ fontWeight: 'bold' }}>
              Rs. {parseFloat(chalan.fees_amount).toFixed(2)}
            </Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography color="textSecondary" gutterBottom>
              Paid Amount
            </Typography>
            <Typography sx={{ fontWeight: 'bold' }}>
              Rs. {parseFloat(chalan.paid_amount || 0).toFixed(2)}
            </Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography color="textSecondary" gutterBottom>
              Remaining
            </Typography>
            <Typography sx={{ fontWeight: 'bold', color: '#f44336' }}>
              Rs. {parseFloat(chalan.remaining_amount || 0).toFixed(2)}
            </Typography>
          </Grid>
          {chalan.payment_date && (
            <Grid item xs={12} md={6}>
              <Typography color="textSecondary" gutterBottom>
                Payment Date
              </Typography>
              <Typography>
                {new Date(chalan.payment_date).toLocaleDateString()}
              </Typography>
            </Grid>
          )}
        </Grid>
      </Paper>

      {/* Edit Actions */}
      {isEditing && (
        <Box sx={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={handleSaveEdit}
            color="success"
            disabled={loading}
          >
            Save Changes
          </Button>
          <Button
            variant="outlined"
            startIcon={<CancelIcon />}
            onClick={() => setIsEditing(false)}
          >
            Cancel
          </Button>
        </Box>
      )}

      {/* Payment Dialog */}
      <Dialog open={paymentDialog} onClose={() => setPaymentDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Mark Chalan as Paid</DialogTitle>
        <DialogContent sx={{ paddingTop: '20px' }}>
          <TextField
            fullWidth
            label="Payment Amount (Rs.)"
            type="number"
            inputProps={{ step: '0.01' }}
            value={paymentData.payment_amount}
            onChange={(e) => setPaymentData({ ...paymentData, payment_amount: e.target.value })}
            sx={{ marginBottom: '15px' }}
          />
          <TextField
            fullWidth
            label="Payment Reference"
            value={paymentData.payment_reference}
            onChange={(e) => setPaymentData({ ...paymentData, payment_reference: e.target.value })}
            placeholder="e.g., Check #, Transaction ID"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPaymentDialog(false)}>Cancel</Button>
          <Button
            onClick={handleMarkAsPaid}
            variant="contained"
            color="success"
            disabled={loading}
          >
            {loading ? <CircularProgress size={20} /> : 'Mark as Paid'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Fee Dialog */}
      <Dialog open={feeDialog} onClose={() => setFeeDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Update Chalan Fees</DialogTitle>
        <DialogContent sx={{ paddingTop: '20px' }}>
          <TextField
            fullWidth
            label="New Fee Amount (Rs.)"
            type="number"
            inputProps={{ step: '0.01' }}
            value={feeData.fees_amount}
            onChange={(e) => setFeeData({ fees_amount: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFeeDialog(false)}>Cancel</Button>
          <Button
            onClick={handleUpdateFees}
            variant="contained"
            color="primary"
            disabled={loading}
          >
            {loading ? <CircularProgress size={20} /> : 'Update Fees'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default ChalanDetail;
