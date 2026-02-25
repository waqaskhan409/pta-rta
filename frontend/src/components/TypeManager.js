import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
  Box,
  Alert,
  CircularProgress,
  Chip,
  Toolbar,
  Typography,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import apiClient from '../services/apiClient';

// Helper function to format duration days to readable format
const formatDuration = (days) => {
  if (!days) return '365 days (1 year)';
  const years = Math.floor(days / 365);
  const remaining = days % 365;
  const months = Math.floor(remaining / 30);

  if (years > 0 && months > 0) {
    return `${days} days (${years}y ${months}m)`;
  } else if (years > 0) {
    return `${days} days (${years} year${years > 1 ? 's' : ''})`;
  } else if (months > 0) {
    return `${days} days (${months} month${months > 1 ? 's' : ''})`;
  } else {
    return `${days} days`;
  }
};

// Default icons for vehicle and permit types
const DEFAULT_ICONS = {
  vehicle: [
    { value: '🏍️', label: 'Motorcycle' },
    { value: '🛺', label: 'Rickshaw' },
    { value: '🚗', label: 'Car' },
    { value: '🚕', label: 'Taxi' },
    { value: '🚙', label: 'SUV' },
    { value: '🚚', label: 'Truck' },
    { value: '🚐', label: 'Van' },
    { value: '🚌', label: 'Bus' },
    { value: '🚎', label: 'Public Bus' },
    { value: '🏎️', label: 'Sports Car' },
    { value: '🚛', label: 'Heavy Truck' },
    { value: '🛴', label: 'E-Scooter' },
    { value: '🚲', label: 'Bicycle' },
  ],
  permit: [
    { value: '📄', label: 'Document' },
    { value: '🎫', label: 'Ticket' },
    { value: '🚨', label: 'Alert' },
    { value: '✅', label: 'Approved' },
    { value: '⏳', label: 'Pending' },
    { value: '❌', label: 'Rejected' },
    { value: '📋', label: 'Clipboard' },
    { value: '🏛️', label: 'Authority' },
    { value: '🔑', label: 'License' },
    { value: '📍', label: 'Location' },
  ]
};

function TypeManager({ title, endpoint }) {
  const [items, setItems] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchItems = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(endpoint);
      setItems(response.data.results || response.data);
      setError('');
    } catch (err) {
      setError('Failed to load data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [endpoint]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);



  const handleOpenDialog = (item = null) => {
    if (item) {
      setFormData(item);
      setEditingId(item.id);
    } else {
      setFormData({});
      setEditingId(null);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setFormData({});
    setEditingId(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    try {
      if (editingId) {
        await apiClient.put(`${endpoint}${editingId}/`, formData);
        setSuccess('Updated successfully');
      } else {
        await apiClient.post(endpoint, formData);
        setSuccess('Created successfully');
      }
      fetchItems();
      handleCloseDialog();
    } catch (err) {
      setError(err.response?.data?.detail || 'Error saving data');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure?')) return;
    try {
      await apiClient.delete(`${endpoint}${id}/`);
      setSuccess('Deleted successfully');
      fetchItems();
    } catch (err) {
      setError('Error deleting data');
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Toolbar sx={{ pl: 0, pr: 0, mb: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold', flexGrow: 1 }}>
          {title}
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add New
        </Button>
      </Toolbar>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      <TableContainer component={Paper}>
        <Table>
          <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
            <TableRow>
              <TableCell>Name</TableCell>
              {endpoint.includes('permit') && <TableCell>Code</TableCell>}
              {endpoint.includes('vehicle') && <TableCell>Icon</TableCell>}
              {endpoint.includes('vehicle') && <TableCell>Permit Duration</TableCell>}
              <TableCell>Description</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id} hover>
                <TableCell>{item.name}</TableCell>
                {endpoint.includes('permit') && <TableCell><Chip label={item.code} size="small" /></TableCell>}
                {endpoint.includes('vehicle') && <TableCell sx={{ fontSize: '24px' }}>{item.icon}</TableCell>}
                {endpoint.includes('vehicle') && <TableCell><Chip label={formatDuration(item.permit_duration_days)} size="small" color="primary" variant="outlined" /></TableCell>}
                <TableCell>{item.description}</TableCell>
                <TableCell>
                  <Chip
                    label={item.is_active ? 'Active' : 'Inactive'}
                    color={item.is_active ? 'success' : 'default'}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Tooltip title="Edit">
                    <IconButton
                      size="small"
                      onClick={() => handleOpenDialog(item)}
                      color="primary"
                    >
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete">
                    <IconButton
                      size="small"
                      onClick={() => handleDelete(item.id)}
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingId ? `Edit ${title}` : `Add ${title}`}
          <IconButton
            onClick={handleCloseDialog}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <TextField
            fullWidth
            label="Name"
            name="name"
            value={formData.name || ''}
            onChange={handleInputChange}
            margin="normal"
            required
          />
          {endpoint.includes('permit') && (
            <>
              <TextField
                fullWidth
                label="Code"
                name="code"
                value={formData.code || ''}
                onChange={handleInputChange}
                margin="normal"
                required
              />
              <FormControl fullWidth margin="normal">
                <InputLabel>Icon</InputLabel>
                <Select
                  label="Icon"
                  name="icon"
                  value={formData.icon || ''}
                  onChange={handleInputChange}
                >
                  <MenuItem value="">-- Select an Icon --</MenuItem>
                  {DEFAULT_ICONS.permit.map((icon) => (
                    <MenuItem key={icon.value} value={icon.value}>
                      <span style={{ fontSize: '20px', marginRight: '8px' }}>{icon.value}</span>
                      {icon.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              {formData.icon && (
                <Box sx={{ my: 1, textAlign: 'center' }}>
                  <Typography variant="caption" sx={{ color: '#666' }}>Preview:</Typography>
                  <Box sx={{ fontSize: '48px' }}>{formData.icon}</Box>
                </Box>
              )}
            </>
          )}
          {endpoint.includes('vehicle') && (
            <>
              <FormControl fullWidth margin="normal" required>
                <InputLabel>Icon</InputLabel>
                <Select
                  label="Icon"
                  name="icon"
                  value={formData.icon || ''}
                  onChange={handleInputChange}
                >
                  <MenuItem value="">-- Select an Icon --</MenuItem>
                  {DEFAULT_ICONS.vehicle.map((icon) => (
                    <MenuItem key={icon.value} value={icon.value}>
                      <span style={{ fontSize: '20px', marginRight: '8px' }}>{icon.value}</span>
                      {icon.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              {formData.icon && (
                <Box sx={{ my: 1, textAlign: 'center' }}>
                  <Typography variant="caption" sx={{ color: '#666' }}>Preview:</Typography>
                  <Box sx={{ fontSize: '48px' }}>{formData.icon}</Box>
                </Box>
              )}
              <TextField
                fullWidth
                label="Permit Duration (days)"
                name="permit_duration_days"
                type="number"
                value={formData.permit_duration_days || 365}
                onChange={handleInputChange}
                margin="normal"
                required
                helperText={formData.permit_duration_days ? formatDuration(formData.permit_duration_days) : 'Enter number of days'}
                inputProps={{ min: 1, max: 10950 }}
              />
            </>
          )}
          <TextField
            fullWidth
            label="Description"
            name="description"
            value={formData.description || ''}
            onChange={handleInputChange}
            margin="normal"
            multiline
            rows={3}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingId ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default TypeManager;
