import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Alert,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { chalanAPI, vehicleTypeAPI } from '../services/chalanService';
import '../styles/page.css';

function CreateChalan() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [vehicleTypes, setVehicleTypes] = useState([]);
  const [autoCalcFee, setAutoCalcFee] = useState(true);
  const [selectedVehicleType, setSelectedVehicleType] = useState(null);

  const [formData, setFormData] = useState({
    owner_name: '',
    owner_cnic: '',
    owner_phone: '',
    car_number: '',
    permit: '',
    vehicle_type: '',
    violation_description: '',
    fees_amount: '',
    issue_location: '',
    remarks: '',
  });

  // Fetch vehicle types
  useEffect(() => {
    const fetchVehicleTypes = async () => {
      try {
        const response = await vehicleTypeAPI.getVehicleTypes();
        const types = response.data.results || response.data || [];
        setVehicleTypes(types);
      } catch (err) {
        console.error('Error fetching vehicle types:', err);
      }
    };
    fetchVehicleTypes();
  }, []);

  // Auto-calculate fee when vehicle type changes
  useEffect(() => {
    if (autoCalcFee && formData.vehicle_type && formData.vehicle_type !== '') {
      const vehicleType = vehicleTypes.find((vt) => vt.id === parseInt(formData.vehicle_type));
      if (vehicleType) {
        setSelectedVehicleType(vehicleType);
        // The fee will be auto-calculated on the backend
        setFormData((prev) => ({
          ...prev,
          fees_amount: '', // Let backend calculate
        }));
      }
    }
  }, [formData.vehicle_type, autoCalcFee, vehicleTypes]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateForm = () => {
    if (!formData.owner_name.trim()) {
      setError('Owner name is required');
      return false;
    }
    if (!formData.owner_cnic.trim()) {
      setError('Owner CNIC is required');
      return false;
    }
    if (!formData.car_number.trim()) {
      setError('Car number is required');
      return false;
    }
    if (!formData.vehicle_type) {
      setError('Vehicle type is required');
      return false;
    }
    if (!formData.violation_description.trim()) {
      setError('Violation description is required');
      return false;
    }
    if (!autoCalcFee && !formData.fees_amount) {
      setError('Fees amount is required');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);

      const submitData = {
        ...formData,
        auto_calculate_fee: autoCalcFee,
        vehicle_type: parseInt(formData.vehicle_type),
      };

      // Remove empty optional fields
      if (!submitData.fees_amount) {
        delete submitData.fees_amount;
      }
      if (!submitData.permit) {
        delete submitData.permit;
      }

      const response = await chalanAPI.createChalan(submitData);

      setSuccess(true);
      setTimeout(() => {
        navigate(`/chalans/${response.data.id}`);
      }, 1500);
    } catch (err) {
      console.error('Error creating chalan:', err);
      setError(
        err.response?.data?.detail ||
        err.response?.data?.non_field_errors?.[0] ||
        'Failed to create chalan'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({
      owner_name: '',
      owner_cnic: '',
      owner_phone: '',
      car_number: '',
      permit: '',
      vehicle_type: '',
      violation_description: '',
      fees_amount: '',
      issue_location: '',
      remarks: '',
    });
    setAutoCalcFee(true);
    setSelectedVehicleType(null);
    setError(null);
  };

  return (
    <Box sx={{ padding: '20px', maxWidth: '900px', margin: '0 auto' }}>
      <Typography variant="h4" sx={{ marginBottom: '20px', fontWeight: 'bold' }}>
        Create New Chalan
      </Typography>

      {error && <Alert severity="error" sx={{ marginBottom: '20px' }}>{error}</Alert>}
      {success && (
        <Alert severity="success" sx={{ marginBottom: '20px' }}>
          Chalan created successfully! Redirecting...
        </Alert>
      )}

      <Paper sx={{ padding: '30px' }}>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            {/* Basic Information */}
            <Grid item xs={12}>
              <Typography variant="h6" sx={{ marginBottom: '15px', fontWeight: 'bold', color: '#1976d2' }}>
                Owner Information
              </Typography>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Owner Name *"
                name="owner_name"
                value={formData.owner_name}
                onChange={handleInputChange}
                placeholder="Enter owner name"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Owner CNIC *"
                name="owner_cnic"
                value={formData.owner_cnic}
                onChange={handleInputChange}
                placeholder="e.g., 12345-1234567-1"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Phone Number"
                name="owner_phone"
                value={formData.owner_phone}
                onChange={handleInputChange}
                placeholder="+92-300-1234567"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Car Number *"
                name="car_number"
                value={formData.car_number}
                onChange={handleInputChange}
                placeholder="e.g., ABC-123"
              />
            </Grid>

            {/* Vehicle & Permit Information */}
            <Grid item xs={12}>
              <Typography variant="h6" sx={{ marginBottom: '15px', fontWeight: 'bold', color: '#1976d2' }}>
                Vehicle & Violation Information
              </Typography>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                select
                label="Vehicle Type *"
                name="vehicle_type"
                value={formData.vehicle_type}
                onChange={handleInputChange}
                SelectProps={{ native: true }}
              >
                <option value="">Select Vehicle Type</option>
                {vehicleTypes.map((vt) => (
                  <option key={vt.id} value={vt.id}>
                    {vt.name}
                  </option>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Permit ID (Optional)"
                name="permit"
                value={formData.permit}
                onChange={handleInputChange}
                placeholder="Enter permit ID"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Violation Description *"
                name="violation_description"
                value={formData.violation_description}
                onChange={handleInputChange}
                placeholder="Describe the traffic violation..."
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Issue Location"
                name="issue_location"
                value={formData.issue_location}
                onChange={handleInputChange}
                placeholder="Where the violation was recorded"
              />
            </Grid>

            {/* Fee Information */}
            <Grid item xs={12}>
              <Typography variant="h6" sx={{ marginBottom: '15px', fontWeight: 'bold', color: '#1976d2' }}>
                Fee Information
              </Typography>
            </Grid>

            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={autoCalcFee}
                    onChange={(e) => setAutoCalcFee(e.target.checked)}
                  />
                }
                label="Auto-calculate fee from vehicle type (if available)"
              />
            </Grid>

            {selectedVehicleType && autoCalcFee && (
              <Grid item xs={12}>
                <Card sx={{ backgroundColor: '#e8f5e9' }}>
                  <CardContent>
                    <Typography>
                      Selected Vehicle Type: <strong>{selectedVehicleType.name}</strong>
                    </Typography>
                    <Typography variant="small" color="textSecondary">
                      Fee will be automatically calculated based on the vehicle type's fee structure
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            )}

            {!autoCalcFee && (
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Fees Amount (Rs.) *"
                  name="fees_amount"
                  type="number"
                  inputProps={{ step: '0.01' }}
                  value={formData.fees_amount}
                  onChange={handleInputChange}
                  placeholder="0.00"
                />
              </Grid>
            )}

            {/* Additional Information */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Remarks"
                name="remarks"
                value={formData.remarks}
                onChange={handleInputChange}
                placeholder="Additional notes or remarks..."
              />
            </Grid>

            {/* Buttons */}
            <Grid item xs={12} sx={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <Button
                variant="outlined"
                onClick={handleReset}
                disabled={loading}
              >
                Reset
              </Button>
              <Button
                variant="contained"
                color="primary"
                type="submit"
                disabled={loading}
                startIcon={loading && <CircularProgress size={20} />}
              >
                {loading ? 'Creating...' : 'Create Chalan'}
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Box>
  );
}

export default CreateChalan;
