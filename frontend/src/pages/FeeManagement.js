import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Typography,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Chip,
  Toolbar,
  Grid,
  Card,
  CardContent,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import { vehicleFeeAPI, vehicleTypeAPI } from '../services/chalanService';
import '../styles/page.css';

function FeeManagement() {
  const [feeStructures, setFeeStructures] = useState([]);
  const [vehicleTypes, setVehicleTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Dialog states
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentFeeStructure, setCurrentFeeStructure] = useState(null);
  const [formData, setFormData] = useState({
    vehicle_type: '',
    base_fee: '',
    description: '',
    is_active: true,
  });

  // Fetch fee structures and vehicle types
  const fetchFeeStructures = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await vehicleFeeAPI.getFeeStructures();
      const data = response.data.results || response.data || [];
      setFeeStructures(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching fee structures:', err);
      setError('Failed to load fee structures');
    } finally {
      setLoading(false);
    }
  };

  const fetchVehicleTypes = async () => {
    try {
      const response = await vehicleTypeAPI.getVehicleTypes();
      const types = response.data.results || response.data || [];
      setVehicleTypes(Array.isArray(types) ? types : []);
    } catch (err) {
      console.error('Error fetching vehicle types:', err);
    }
  };

  useEffect(() => {
    fetchFeeStructures();
    fetchVehicleTypes();
  }, []);

  const handleOpenDialog = (feeStructure = null) => {
    if (feeStructure) {
      setIsEditing(true);
      setCurrentFeeStructure(feeStructure);
      setFormData({
        vehicle_type: feeStructure.vehicle_type,
        base_fee: feeStructure.base_fee,
        description: feeStructure.description || '',
        is_active: feeStructure.is_active || true,
      });
    } else {
      setIsEditing(false);
      setCurrentFeeStructure(null);
      setFormData({
        vehicle_type: '',
        base_fee: '',
        description: '',
        is_active: true,
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setFormData({
      vehicle_type: '',
      base_fee: '',
      description: '',
      is_active: true,
    });
  };

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!formData.vehicle_type) {
        setError('Vehicle type is required');
        setLoading(false);
        return;
      }

      if (!formData.base_fee || parseFloat(formData.base_fee) <= 0) {
        setError('Base fee must be greater than 0');
        setLoading(false);
        return;
      }

      const submitData = {
        vehicle_type: parseInt(formData.vehicle_type),
        base_fee: parseFloat(formData.base_fee),
        description: formData.description,
        is_active: formData.is_active,
      };

      if (isEditing && currentFeeStructure) {
        // Update
        const response = await vehicleFeeAPI.updateFeeStructure(
          currentFeeStructure.id,
          submitData
        );
        setFeeStructures((prev) =>
          prev.map((fs) => (fs.id === currentFeeStructure.id ? response.data : fs))
        );
        setSuccess('Fee structure updated successfully');
      } else {
        // Create
        const response = await vehicleFeeAPI.createFeeStructure(submitData);
        setFeeStructures((prev) => [...prev, response.data]);
        setSuccess('Fee structure created successfully');
      }

      handleCloseDialog();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error saving fee structure:', err);
      setError(
        err.response?.data?.detail ||
        err.response?.data?.non_field_errors?.[0] ||
        'Failed to save fee structure'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this fee structure?')) {
      try {
        setLoading(true);
        await vehicleFeeAPI.deleteFeeStructure(id);
        setFeeStructures((prev) => prev.filter((fs) => fs.id !== id));
        setSuccess('Fee structure deleted successfully');
        setTimeout(() => setSuccess(null), 3000);
      } catch (err) {
        console.error('Error deleting fee structure:', err);
        setError('Failed to delete fee structure');
      } finally {
        setLoading(false);
      }
    }
  };

  const getVehicleTypeName = (vehicleTypeId) => {
    const vType = vehicleTypes.find((vt) => vt.id === vehicleTypeId);
    return vType ? vType.name : 'Unknown';
  };

  return (
    <Box sx={{ padding: '20px' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
          Vehicle Fee Management
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add Fee Structure
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ marginBottom: '20px' }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ marginBottom: '20px' }}>{success}</Alert>}

      {/* Statistics Cards */}
      {feeStructures.length > 0 && (
        <Grid container spacing={2} sx={{ marginBottom: '30px' }}>
          <Grid item xs={12} sm={6} md={4}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography color="textSecondary" gutterBottom>
                  Total Vehicles
                </Typography>
                <Typography variant="h5">
                  {feeStructures.length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography color="textSecondary" gutterBottom>
                  Active
                </Typography>
                <Typography variant="h5" sx={{ color: '#4caf50' }}>
                  {feeStructures.filter((fs) => fs.is_active).length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography color="textSecondary" gutterBottom>
                  Average Fee
                </Typography>
                <Typography variant="h5">
                  Rs. {(
                    feeStructures.reduce((sum, fs) => sum + parseFloat(fs.base_fee || 0), 0) /
                    feeStructures.length
                  ).toFixed(2)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Loading */}
      {loading && !dialogOpen && (
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
                <TableCell sx={{ fontWeight: 'bold' }}>Vehicle Type</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                  Base Fee (Rs.)
                </TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Description</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Last Updated</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {feeStructures.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ padding: '40px' }}>
                    No fee structures found. Create one to get started.
                  </TableCell>
                </TableRow>
              ) : (
                feeStructures.map((fs) => (
                  <TableRow key={fs.id} hover>
                    <TableCell>{getVehicleTypeName(fs.vehicle_type)}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold', color: '#1976d2' }}>
                      Rs. {parseFloat(fs.base_fee).toFixed(2)}
                    </TableCell>
                    <TableCell>
                      {fs.description ? (
                        <Typography variant="body2" sx={{ maxWidth: '200px' }}>
                          {fs.description.substring(0, 50)}
                          {fs.description.length > 50 ? '...' : ''}
                        </Typography>
                      ) : (
                        'N/A'
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={fs.is_active ? 'Active' : 'Inactive'}
                        color={fs.is_active ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {new Date(fs.updated_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: '5px' }}>
                        <Button
                          size="small"
                          startIcon={<EditIcon />}
                          onClick={() => handleOpenDialog(fs)}
                        >
                          Edit
                        </Button>
                        <Button
                          size="small"
                          startIcon={<DeleteIcon />}
                          color="error"
                          onClick={() => handleDelete(fs.id)}
                        >
                          Delete
                        </Button>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {isEditing ? 'Edit Fee Structure' : 'Add New Fee Structure'}
        </DialogTitle>
        <DialogContent sx={{ paddingTop: '20px' }}>
          <TextField
            fullWidth
            select
            label="Vehicle Type *"
            name="vehicle_type"
            value={formData.vehicle_type}
            onChange={handleFormChange}
            disabled={isEditing}
            SelectProps={{ native: true }}
            sx={{ marginBottom: '15px' }}
          >
            <option value="">Select Vehicle Type</option>
            {vehicleTypes
              .filter((vt) => {
                // If editing, allow current vehicle type or types without fee structure
                if (isEditing) {
                  return (
                    vt.id === formData.vehicle_type ||
                    !feeStructures.some((fs) => fs.vehicle_type === vt.id)
                  );
                }
                // If creating, only show vehicle types without fee structure
                return !feeStructures.some((fs) => fs.vehicle_type === vt.id);
              })
              .map((vt) => (
                <option key={vt.id} value={vt.id}>
                  {vt.name}
                </option>
              ))}
          </TextField>

          <TextField
            fullWidth
            label="Base Fee (Rs.) *"
            name="base_fee"
            type="number"
            inputProps={{ step: '0.01' }}
            value={formData.base_fee}
            onChange={handleFormChange}
            sx={{ marginBottom: '15px' }}
          />

          <TextField
            fullWidth
            multiline
            rows={3}
            label="Description"
            name="description"
            value={formData.description}
            onChange={handleFormChange}
            placeholder="Add notes or description about this fee..."
            sx={{ marginBottom: '15px' }}
          />

          <FormControlLabel
            control={
              <Checkbox
                name="is_active"
                checked={formData.is_active}
                onChange={handleFormChange}
              />
            }
            label="Active"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            onClick={handleSave}
            variant="contained"
            color="primary"
            disabled={loading}
            startIcon={loading && <CircularProgress size={20} />}
          >
            {isEditing ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default FeeManagement;
