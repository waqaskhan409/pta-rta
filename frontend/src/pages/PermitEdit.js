import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  TextField,
  Button,
  IconButton,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Paper,
  Tabs,
  Tab,
  Typography,
} from '@mui/material';
import {
  Save as SaveIcon,
  Cancel as CancelIcon,
  Person as PersonIcon,
  Assignment as AssignmentIcon,
  Edit as EditIcon,
  Close as CloseIcon,
  DirectionsCar as VehicleIcon,
  DateRange as CalendarIcon,
  Description as DescriptionIcon,
  CloudUpload as CloudUploadIcon,
  Delete as DeleteIcon,
  Download as DownloadIcon,
  AttachFile as AttachFileIcon,
  OpenInNew as OpenInNewIcon,
} from '@mui/icons-material';
import apiClient from '../services/apiClient';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function TabPanel(props) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 1 }}>{children}</Box>}
    </div>
  );
}

const PermitEdit = () => {
  const { permitId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Form states
  const [formData, setFormData] = useState({
    authority: 'RTA',
    permit_type: '',
    vehicle_type: '',
    vehicle_number: '',
    vehicle_make: '',
    vehicle_model: '',
    vehicle_year: '',
    vehicle_capacity: '',
    owner_name: '',
    owner_email: '',
    owner_phone: '',
    owner_address: '',
    owner_cnic: '',
    status: 'pending',
    valid_from: '',
    valid_to: '',
    description: '',
    remarks: '',
    approved_routes: '',
    restrictions: '',
    assigned_to: '',
    assignment_details: '',
  });

  const [permit, setPermit] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [permitTypes, setPermitTypes] = useState([]);
  const [vehicleTypes, setVehicleTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [basicInfoSubTab, setBasicInfoSubTab] = useState(0);
  const [vehicleDetailsSubTab, setVehicleDetailsSubTab] = useState(0);
  const [ownerDetailsSubTab, setOwnerDetailsSubTab] = useState(0);
  const [validityPeriodSubTab, setValidityPeriodSubTab] = useState(0);
  const [additionalInfoSubTab, setAdditionalInfoSubTab] = useState(0);
  const [assignmentSubTab, setAssignmentSubTab] = useState(0);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [documents, setDocuments] = useState([]);
  const [pendingFiles, setPendingFiles] = useState([]);

  // Check if user can change status (admins and assistants)
  // Handle case where user.role might be an object {id, name} or a string
  const canChangeStatus = user?.features?.some(f =>
  (f.name?.toLowerCase() === 'permit_change_status' ||
    f.toLowerCase?.() === 'permit_change_status')
  );

  // Check if user is the assigned employee or admin
  const isAssignedEmployee = permit?.assigned_to === user?.id;
  const isAdmin = user?.is_staff;
  const canEditForm = isAdmin || isAssignedEmployee;

  // Debug logging for status field
  useEffect(() => {
    const userRoleName = (user?.role?.name || user?.role || '').toLowerCase().trim();
    console.log('[PermitEdit] Access Control Debug:', {
      username: user?.username,
      userId: user?.id,
      isAdmin: user?.is_staff,
      rawRole: user?.role,
      extractedRoleName: userRoleName,
      canChangeStatus: canChangeStatus,
      assignedToId: permit?.assigned_to,
      isAssignedEmployee: isAssignedEmployee,
      canEditForm: canEditForm
    });
  }, [user, canChangeStatus, permit, isAssignedEmployee, canEditForm]);

  const fetchAllData = useCallback(async () => {
    try {
      setLoading(true);
      const [permitRes, employeesRes, typesRes, vehiclesRes, docsRes] = await Promise.all([
        apiClient.get(`/permits/${permitId}/`),
        apiClient.get('/permits/eligible_users/'),
        apiClient.get('/permit-types/'),
        apiClient.get('/vehicle-types/'),
        apiClient.get(`/permit-documents/?permit_id=${permitId}`),
      ]);

      setPermit(permitRes.data);
      setFormData({
        authority: 'RTA',
        permit_type: permitRes.data.permit_type_id || '',
        vehicle_type: permitRes.data.vehicle_type_id || '',
        vehicle_number: permitRes.data.vehicle_number || '',
        status: permitRes.data.status || '',
        assigned_to: permitRes.data.assigned_to || '',
        valid_from: permitRes.data.valid_from || '',
        valid_to: permitRes.data.valid_to || '',
        notes: permitRes.data.notes || '',
        business_name: permitRes.data.business_name || '',
        business_location: permitRes.data.business_location || '',
        plate_number_issued_by: permitRes.data.plate_number_issued_by || '',
      });
      setEmployees(employeesRes.data.results || employeesRes.data);
      setPermitTypes(typesRes.data.results || typesRes.data);
      setVehicleTypes(vehiclesRes.data.results || vehiclesRes.data);
      setDocuments(docsRes.data.results || docsRes.data);
      setError('');
    } catch (err) {
      setError('Failed to load permit data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [permitId]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSaveChanges = async () => {
    try {
      setSaving(true);
      const updateData = {
        authority: 'RTA',
        permit_type_id: formData.permit_type ? parseInt(formData.permit_type) : null,
        vehicle_type_id: formData.vehicle_type ? parseInt(formData.vehicle_type) : null,
        vehicle_number: formData.vehicle_number,
        vehicle_make: formData.vehicle_make,
        vehicle_model: formData.vehicle_model,
        vehicle_year: formData.vehicle_year ? parseInt(formData.vehicle_year) : null,
        vehicle_capacity: formData.vehicle_capacity ? parseInt(formData.vehicle_capacity) : null,
        owner_name: formData.owner_name,
        owner_email: formData.owner_email,
        owner_phone: formData.owner_phone,
        owner_address: formData.owner_address,
        owner_cnic: formData.owner_cnic,
        status: formData.status,
        valid_from: formData.valid_from,
        valid_to: formData.valid_to,
        description: formData.description,
        remarks: formData.remarks,
        approved_routes: formData.approved_routes,
        restrictions: formData.restrictions,
        assigned_to: formData.assigned_to ? parseInt(formData.assigned_to) : (permit?.assigned_to || null),
        assignment_details: formData.assignment_details,
      };

      await apiClient.patch(`/permits/${permitId}/`, updateData);

      // Upload any pending files
      if (pendingFiles.length > 0) {
        for (const pendingFile of pendingFiles) {
          try {
            const formData = new FormData();
            formData.append('file', pendingFile.file);
            formData.append('permit', permitId);
            formData.append('document_type', 'other');
            formData.append('description', pendingFile.filename);

            const res = await apiClient.post('/permit-documents/', formData, {
              headers: { 'Content-Type': 'multipart/form-data' },
            });

            // Add uploaded document to documents list
            const newDoc = {
              id: res.data.id,
              name: res.data.filename,
              filename: pendingFile.filename,
              size: res.data.file_size,
              type: res.data.file,
              uploadedAt: new Date().toLocaleString(),
              uploadedBy: res.data.uploaded_by,
            };
            setDocuments(prev => [...prev, newDoc]);
          } catch (fileErr) {
            console.error('File upload error:', fileErr);
            setError(`Failed to upload ${pendingFile.file.name}`);
          }
        }
        setPendingFiles([]); // Clear pending files after upload
      }

      setSuccess('Permit updated successfully!');
      setTimeout(() => {
        navigate(`/permits/${permitId}`);
      }, 2000);
    } catch (err) {
      console.error('Save error:', err);
      console.error('Response data:', err.response?.data);
      const errorMsg = err.response?.data?.error ||
        err.response?.data?.detail ||
        (typeof err.response?.data === 'object' ? JSON.stringify(err.response?.data) : err.response?.data) ||
        'Failed to save permit';
      setError(errorMsg);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigate(`/permits/${permitId}`);
  };

  const handleAssignEmployee = async () => {
    if (!selectedEmployee) {
      setError('Please select an employee');
      return;
    }

    try {
      setSaving(true);
      await apiClient.patch(`/permits/${permitId}/`, {
        assigned_to: selectedEmployee,
      });
      setSuccess('Permit assigned successfully!');
      setAssignDialogOpen(false);
      fetchAllData();
    } catch (err) {
      setError('Failed to assign permit');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = (e) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      // Validate file size (max 10MB)
      const maxSize = 10 * 1024 * 1024;
      if (file.size > maxSize) {
        setError(`File ${file.name} exceeds 10MB limit`);
        return;
      }

      // Allowed file types
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!allowedTypes.includes(file.type)) {
        setError(`File type not allowed for ${file.name}. Allowed: PDF, JPG, PNG, DOC, DOCX`);
        return;
      }

      // Add file to pending uploads list
      const pendingFile = {
        id: `pending_${Date.now()}_${Math.random()}`, // Temporary unique ID
        file: file,
        filename: file.name,
        size: file.size,
        type: file.type,
      };

      setPendingFiles(prev => [...prev, pendingFile]);
      setSuccess(`File "${file.name}" added for upload. Click Save to upload.`);
      setError('');
    });

    // Reset file input
    e.target.value = '';
  };

  const handleDeleteDocument = (docId) => {
    // Check if it's a pending file or an uploaded document
    const isPending = docId.toString().startsWith('pending_');

    if (isPending) {
      // Remove from pending files
      setPendingFiles(prev => prev.filter(f => f.id !== docId));
      setSuccess('File removed from upload queue');
    } else {
      // Delete from backend
      apiClient.delete(`/permit-documents/${docId}/`)
        .then(() => {
          setDocuments(prev => prev.filter(doc => doc.id !== docId));
          setSuccess('Document deleted successfully');
        })
        .catch((err) => {
          console.error('Document delete error:', err);
          const errorMessage = err.response?.data?.detail ||
            err.response?.data?.error ||
            err.message ||
            'Failed to delete document';
          setError(`Failed to delete document: ${errorMessage}`);
        });
    }
  };

  const handleDownloadDocument = (doc) => {
    // If the document has a file property (locally uploaded), download from blob
    if (doc.file && doc.file instanceof File) {
      const url = URL.createObjectURL(doc.file);
      const link = document.createElement('a');
      link.href = url;
      link.download = doc.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } else {
      // Otherwise, download from backend API
      apiClient.get(`/permit-documents/${doc.id}/`, {
        responseType: 'blob',
      })
        .then((res) => {
          const url = URL.createObjectURL(res.data);
          const link = document.createElement('a');
          link.href = url;
          link.download = doc.name;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        })
        .catch((err) => {
          console.error('Download error:', err);
          setError(`Failed to download ${doc.name}`);
        });
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 3, minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
      {/* Header */}
      <Box
        sx={{
          mb: 4,
          pb: 3,
          borderBottom: '2px solid #e0e0e0',
          background: 'linear-gradient(135deg, rgba(25, 118, 210, 0.08) 0%, rgba(21, 101, 192, 0.04) 100%)',
          borderRadius: '8px',
          p: 2.5,
        }}
      >
        <Typography
          variant="h4"
          sx={{
            mb: 1,
            fontWeight: 700,
            background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          Edit Permit
        </Typography>
        <Typography variant="body2" color="textSecondary" sx={{ fontSize: '1rem' }}>
          Permit #: <Chip
            label={permit?.permit_number}
            variant="outlined"
            size="small"
            sx={{ ml: 1, fontWeight: 600 }}
          />
        </Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: '8px' }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2, borderRadius: '8px' }}>{success}</Alert>}

      {/* Access Control Alert */}
      {!isAdmin && (
        <Alert severity="info" sx={{ mb: 2, borderRadius: '8px' }}>
          {!canEditForm ? (
            <>This permit is not assigned to you. You can view permit details but cannot make changes.</>
          ) : (
            <>
              ℹ️ <strong>You have limited edit access.</strong> You can edit form fields and upload documents, but you <strong>cannot change the permit status</strong>. Only admins and assistants can change the status.
            </>
          )}
        </Alert>
      )}

      {/* Main Edit Form with Tabs */}
      <Card
        sx={{
          mb: 3,
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
          overflow: 'hidden',
        }}
      >
        {/* Tabs Header */}
        <Box sx={{ background: 'linear-gradient(135deg, #f5f7fa 0%, #e3f2fd 100%)', borderBottom: '1px solid #e0e0e0' }}>
          <Tabs
            value={tabValue}
            onChange={(e, newValue) => setTabValue(newValue)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              '& .MuiTabs-indicator': {
                backgroundColor: '#1976d2',
                height: 3,
              },
              '& .MuiTab-root': {
                textTransform: 'none',
                fontSize: '14px',
                fontWeight: 500,
                color: '#666',
                '&.Mui-selected': {
                  color: '#1976d2',
                  fontWeight: 600,
                },
              },
            }}
          >
            <Tab label="📋 Basic Information" icon={<EditIcon sx={{ mr: 1 }} />} iconPosition="start" />
            <Tab label="🚗 Vehicle Details" icon={<VehicleIcon sx={{ mr: 1 }} />} iconPosition="start" />
            <Tab label="👤 Owner Details" icon={<PersonIcon sx={{ mr: 1 }} />} iconPosition="start" />
            <Tab label="📅 Validity Period" icon={<CalendarIcon sx={{ mr: 1 }} />} iconPosition="start" />
            <Tab label="📝 Additional Info" icon={<DescriptionIcon sx={{ mr: 1 }} />} iconPosition="start" />
            <Tab label="👨‍💼 Assignment" icon={<AssignmentIcon sx={{ mr: 1 }} />} iconPosition="start" />
            <Tab label="📎 Documents" icon={<AttachFileIcon sx={{ mr: 1 }} />} iconPosition="start" />
          </Tabs>
        </Box>

        <CardContent sx={{ p: 2 }}>
          {/* Tab 1: Basic Information */}
          <TabPanel value={tabValue} index={0}>
            {/* Basic Info Sub-Tabs */}
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
              <Tabs
                value={basicInfoSubTab}
                onChange={(e, newValue) => setBasicInfoSubTab(newValue)}
                sx={{
                  '& .MuiTabs-indicator': {
                    backgroundColor: '#1976d2',
                    height: 3,
                  },
                  '& .MuiTab-root': {
                    textTransform: 'none',
                    fontSize: '13px',
                    fontWeight: 500,
                    color: '#666',
                    '&.Mui-selected': {
                      color: '#1976d2',
                      fontWeight: 600,
                    },
                  },
                }}
              >
                <Tab label="ℹ️ Permit Configuration" />
                <Tab label="📄 Permit & Vehicle Types" />
              </Tabs>
            </Box>

            {/* Sub-Tab: Permit Configuration */}
            {basicInfoSubTab === 0 && (
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth disabled={true}>
                    <InputLabel>Authority</InputLabel>
                    <Select
                      name="authority"
                      value={formData.authority}
                      onChange={handleInputChange}
                      label="Authority"
                      disabled={true}
                    >
                      <MenuItem value="PTA">Provincial Transport Authority</MenuItem>
                      <MenuItem value="RTA">Regional Transport Authority</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth disabled={!canChangeStatus}>
                    <InputLabel>Status</InputLabel>
                    <Select
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                      label="Status"
                      disabled={!canChangeStatus}
                    >
                      <MenuItem value="pending">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box sx={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#ffa726' }} />
                          Pending
                        </Box>
                      </MenuItem>
                      <MenuItem value="active">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box sx={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#66bb6a' }} />
                          Active
                        </Box>
                      </MenuItem>
                      <MenuItem value="inactive">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box sx={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#ef5350' }} />
                          Inactive
                        </Box>
                      </MenuItem>
                      <MenuItem value="cancelled">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box sx={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#ab47bc' }} />
                          Cancelled
                        </Box>
                      </MenuItem>
                      <MenuItem value="expired">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box sx={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#9c27b0' }} />
                          Expired
                        </Box>
                      </MenuItem>
                    </Select>
                    {!canChangeStatus && (
                      <Typography variant="caption" sx={{ color: '#f44336', mt: 0.5, display: 'block' }}>
                        ⚠️ Only Admins and Assistants can change status
                      </Typography>
                    )}
                  </FormControl>
                </Grid>
              </Grid>
            )}

            {/* Sub-Tab: Permit & Vehicle Types */}
            {basicInfoSubTab === 1 && (
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Permit Type</InputLabel>
                    <Select
                      name="permit_type"
                      value={formData.permit_type ? String(formData.permit_type) : ''}
                      onChange={(e) => {
                        const value = e.target.value;
                        setFormData(prev => ({
                          ...prev,
                          permit_type: value === '' ? '' : parseInt(value)
                        }));
                      }}
                      label="Permit Type"
                    >
                      <MenuItem value="">
                        <em>-- Select Permit Type --</em>
                      </MenuItem>
                      {permitTypes.map(type => (
                        <MenuItem key={type.id} value={String(type.id)}>
                          {type.name} ({type.code})
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Vehicle Type</InputLabel>
                    <Select
                      name="vehicle_type"
                      value={formData.vehicle_type ? String(formData.vehicle_type) : ''}
                      onChange={(e) => {
                        const value = e.target.value;
                        setFormData(prev => ({
                          ...prev,
                          vehicle_type: value === '' ? '' : parseInt(value)
                        }));
                      }}
                      label="Vehicle Type"
                    >
                      <MenuItem value="">
                        <em>-- Select Vehicle Type --</em>
                      </MenuItem>
                      {vehicleTypes.map(type => (
                        <MenuItem key={type.id} value={String(type.id)}>
                          {type.name} ({type.code})
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                {/* Permit Summary Info */}
                {permit && (
                  <Grid item xs={12}>
                    <Paper sx={{ p: 2, background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)', borderLeft: '4px solid #1976d2', mt: 2 }}>
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="caption" sx={{ color: '#0d47a1' }}>
                            <strong>Permit Number:</strong>
                          </Typography>
                          <Typography variant="body2" sx={{ color: '#1565c0', fontWeight: 600 }}>
                            {permit.permit_number}
                          </Typography>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="caption" sx={{ color: '#0d47a1' }}>
                            <strong>Created Date:</strong>
                          </Typography>
                          <Typography variant="body2" sx={{ color: '#1565c0', fontWeight: 600 }}>
                            {permit.issued_date ? new Date(permit.issued_date).toLocaleDateString() : 'N/A'}
                          </Typography>
                        </Grid>
                      </Grid>
                    </Paper>
                  </Grid>
                )}
              </Grid>
            )}
          </TabPanel>

          {/* Tab 2: Vehicle Details */}
          <TabPanel value={tabValue} index={1}>
            {/* Vehicle Sub-Tabs */}
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
              <Tabs
                value={vehicleDetailsSubTab}
                onChange={(e, newValue) => setVehicleDetailsSubTab(newValue)}
                sx={{
                  '& .MuiTabs-indicator': {
                    backgroundColor: '#1976d2',
                    height: 3,
                  },
                  '& .MuiTab-root': {
                    textTransform: 'none',
                    fontSize: '13px',
                    fontWeight: 500,
                    color: '#666',
                    '&.Mui-selected': {
                      color: '#1976d2',
                      fontWeight: 600,
                    },
                  },
                }}
              >
                <Tab label="🔍 Vehicle Identification" />
                <Tab label="📋 Vehicle Specifications" />
              </Tabs>
            </Box>

            {/* Sub-Tab: Vehicle Identification */}
            {vehicleDetailsSubTab === 0 && (
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Vehicle Number / Registration"
                    name="vehicle_number"
                    value={formData.vehicle_number}
                    onChange={handleInputChange}
                    placeholder="e.g., ABC-123 or ABC-123XYZ"
                    variant="outlined"
                    inputProps={{ maxLength: 20 }}
                    helperText="Format: ABC-123 (Provincial) or ABC-123XYZ (National)"
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Vehicle Type</InputLabel>
                    <Select
                      name="vehicle_type"
                      value={formData.vehicle_type ? String(formData.vehicle_type) : ''}
                      onChange={(e) => {
                        const value = e.target.value;
                        setFormData(prev => ({
                          ...prev,
                          vehicle_type: value === '' ? '' : parseInt(value)
                        }));
                      }}
                      label="Vehicle Type"
                    >
                      <MenuItem value="">-- Select Type --</MenuItem>
                      {vehicleTypes.map(type => (
                        <MenuItem key={type.id} value={String(type.id)}>
                          {type.name} ({type.code})
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            )}

            {/* Sub-Tab: Vehicle Specifications */}
            {vehicleDetailsSubTab === 1 && (
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Make / Manufacturer"
                    name="vehicle_make"
                    value={formData.vehicle_make}
                    onChange={handleInputChange}
                    placeholder="e.g., Honda, Toyota, Suzuki"
                    variant="outlined"
                    helperText="Vehicle manufacturer"
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Model / Variant"
                    name="vehicle_model"
                    value={formData.vehicle_model}
                    onChange={handleInputChange}
                    placeholder="e.g., CR-V, Camry, Alto"
                    variant="outlined"
                    helperText="Vehicle model name"
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Manufacturing Year"
                    name="vehicle_year"
                    type="number"
                    value={formData.vehicle_year}
                    onChange={handleInputChange}
                    inputProps={{ min: 1900, max: new Date().getFullYear() + 1 }}
                    variant="outlined"
                    helperText="Year of manufacture"
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Seating Capacity"
                    name="vehicle_capacity"
                    type="number"
                    value={formData.vehicle_capacity}
                    onChange={handleInputChange}
                    inputProps={{ min: 1, max: 300 }}
                    variant="outlined"
                    helperText="Number of seats"
                  />
                </Grid>

                {/* Vehicle Summary */}
                {formData.vehicle_number && (
                  <Grid item xs={12}>
                    <Paper sx={{ p: 2.5, background: 'linear-gradient(135deg, #c8e6c9 0%, #a5d6a7 100%)', borderLeft: '4px solid #4caf50', mt: 2 }}>
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="caption" sx={{ color: '#1b5e20' }}>
                            <strong>Vehicle:</strong>
                          </Typography>
                          <Typography variant="body2" sx={{ color: '#2e7d32', fontWeight: 600 }}>
                            {formData.vehicle_make && formData.vehicle_model ? `${formData.vehicle_make} ${formData.vehicle_model}` : formData.vehicle_number}
                          </Typography>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="caption" sx={{ color: '#1b5e20' }}>
                            <strong>Capacity:</strong>
                          </Typography>
                          <Typography variant="body2" sx={{ color: '#2e7d32', fontWeight: 600 }}>
                            {formData.vehicle_capacity ? `${formData.vehicle_capacity} seats` : 'Not specified'}
                          </Typography>
                        </Grid>
                      </Grid>
                    </Paper>
                  </Grid>
                )}
              </Grid>
            )}
          </TabPanel>

          {/* Tab 3: Owner Details */}
          <TabPanel value={tabValue} index={2}>
            {/* Owner Sub-Tabs */}
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
              <Tabs
                value={ownerDetailsSubTab}
                onChange={(e, newValue) => setOwnerDetailsSubTab(newValue)}
                sx={{
                  '& .MuiTabs-indicator': {
                    backgroundColor: '#1976d2',
                    height: 3,
                  },
                  '& .MuiTab-root': {
                    textTransform: 'none',
                    fontSize: '13px',
                    fontWeight: 500,
                    color: '#666',
                    '&.Mui-selected': {
                      color: '#1976d2',
                      fontWeight: 600,
                    },
                  },
                }}
              >
                <Tab label="👤 Personal Details" />
                <Tab label="📞 Contact Information" />
                <Tab label="📍 Address" />
              </Tabs>
            </Box>

            {/* Sub-Tab: Personal Details */}
            {ownerDetailsSubTab === 0 && (
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Full Name"
                    name="owner_name"
                    value={formData.owner_name}
                    onChange={handleInputChange}
                    placeholder="Enter owner name"
                    variant="outlined"
                    inputProps={{ maxLength: 100 }}
                    helperText="First and last name"
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="CNIC / National ID"
                    name="owner_cnic"
                    value={formData.owner_cnic}
                    onChange={handleInputChange}
                    placeholder="e.g., 12345-1234567-1"
                    variant="outlined"
                    inputProps={{ maxLength: 20 }}
                    helperText="National Identity Card number"
                  />
                </Grid>

                {/* Owner Summary - shown on Personal Details */}
                {formData.owner_name && (
                  <Grid item xs={12}>
                    <Paper sx={{ p: 2.5, background: 'linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%)', borderLeft: '4px solid #ff9800', mt: 1 }}>
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="caption" sx={{ color: '#e65100' }}>
                            <strong>Owner:</strong>
                          </Typography>
                          <Typography variant="body2" sx={{ color: '#f57c00', fontWeight: 600 }}>
                            {formData.owner_name}
                          </Typography>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="caption" sx={{ color: '#e65100' }}>
                            <strong>Contact:</strong>
                          </Typography>
                          <Typography variant="body2" sx={{ color: '#f57c00', fontWeight: 600 }}>
                            {formData.owner_phone || formData.owner_email || 'Not provided'}
                          </Typography>
                        </Grid>
                      </Grid>
                    </Paper>
                  </Grid>
                )}
              </Grid>
            )}

            {/* Sub-Tab: Contact Information */}
            {ownerDetailsSubTab === 1 && (
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Email Address"
                    name="owner_email"
                    type="email"
                    value={formData.owner_email}
                    onChange={handleInputChange}
                    placeholder="owner@example.com"
                    variant="outlined"
                    helperText="Valid email address"
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Phone Number"
                    name="owner_phone"
                    value={formData.owner_phone}
                    onChange={handleInputChange}
                    placeholder="e.g., 03001234567 or 051-1234567"
                    variant="outlined"
                    inputProps={{ maxLength: 20 }}
                    helperText="Mobile or landline number"
                  />
                </Grid>
              </Grid>
            )}

            {/* Sub-Tab: Address */}
            {ownerDetailsSubTab === 2 && (
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Complete Address"
                    name="owner_address"
                    multiline
                    rows={3}
                    value={formData.owner_address}
                    onChange={handleInputChange}
                    placeholder="Street address, City, Province"
                    variant="outlined"
                    helperText="Complete residential or business address"
                  />
                </Grid>
              </Grid>
            )}
          </TabPanel>

          {/* Tab 4: Validity Period */}
          <TabPanel value={tabValue} index={3}>
            {/* Validity Period Sub-Tabs */}
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
              <Tabs
                value={validityPeriodSubTab}
                onChange={(e, newValue) => setValidityPeriodSubTab(newValue)}
                sx={{
                  '& .MuiTabs-indicator': {
                    backgroundColor: '#1976d2',
                    height: 3,
                  },
                  '& .MuiTab-root': {
                    textTransform: 'none',
                    fontSize: '13px',
                    fontWeight: 500,
                    color: '#666',
                    '&.Mui-selected': {
                      color: '#1976d2',
                      fontWeight: 600,
                    },
                  },
                }}
              >
                <Tab label="📅 Valid Dates" />
                <Tab label="📊 Duration Details" />
              </Tabs>
            </Box>

            {/* Sub-Tab: Valid Dates */}
            {validityPeriodSubTab === 0 && (
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Valid From (Start Date)"
                    name="valid_from"
                    type="date"
                    value={formData.valid_from}
                    onChange={handleInputChange}
                    InputLabelProps={{ shrink: true }}
                    variant="outlined"
                    helperText="When this permit becomes active"
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Valid To (Expiry Date)"
                    name="valid_to"
                    type="date"
                    value={formData.valid_to}
                    onChange={handleInputChange}
                    InputLabelProps={{ shrink: true }}
                    variant="outlined"
                    helperText="When this permit expires"
                  />
                </Grid>
              </Grid>
            )}

            {/* Sub-Tab: Duration Details */}
            {validityPeriodSubTab === 1 && (
              <Grid container spacing={3}>
                {/* Validity Information */}
                {formData.valid_from && formData.valid_to && (
                  <Grid item xs={12}>
                    <Paper sx={{ p: 2.5, background: 'linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%)', borderLeft: '4px solid #ff9800' }}>
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="caption" sx={{ color: '#e65100' }}>
                            <strong>Total Duration:</strong>
                          </Typography>
                          <Typography variant="body2" sx={{ color: '#f57c00', fontWeight: 600 }}>
                            {Math.ceil((new Date(formData.valid_to) - new Date(formData.valid_from)) / (1000 * 60 * 60 * 24))} days
                          </Typography>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="caption" sx={{ color: '#e65100' }}>
                            <strong>Status:</strong>
                          </Typography>
                          <Typography variant="body2" sx={{
                            color: '#f57c00',
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.5
                          }}>
                            {new Date(formData.valid_to) > new Date() ? (
                              <>
                                <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#66bb6a' }} />
                                Active/Valid
                              </>
                            ) : (
                              <>
                                <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#ef5350' }} />
                                Expired
                              </>
                            )}
                          </Typography>
                        </Grid>
                      </Grid>
                    </Paper>
                  </Grid>
                )}

                {!formData.valid_from || !formData.valid_to ? (
                  <Grid item xs={12}>
                    <Paper sx={{ p: 2, background: 'linear-gradient(135deg, #f3e5f5 0%, #ede7f6 100%)', borderLeft: '4px solid #9c27b0' }}>
                      <Typography variant="body2" sx={{ color: '#6a1b9a' }}>
                        ⚠️ Please fill in both start and end dates to see permit duration details
                      </Typography>
                    </Paper>
                  </Grid>
                ) : null}
              </Grid>
            )}
          </TabPanel>

          {/* Tab 5: Additional Information */}
          <TabPanel value={tabValue} index={4}>
            {/* Additional Info Sub-Tabs */}
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
              <Tabs
                value={additionalInfoSubTab}
                onChange={(e, newValue) => setAdditionalInfoSubTab(newValue)}
                sx={{
                  '& .MuiTabs-indicator': {
                    backgroundColor: '#1976d2',
                    height: 3,
                  },
                  '& .MuiTab-root': {
                    textTransform: 'none',
                    fontSize: '13px',
                    fontWeight: 500,
                    color: '#666',
                    '&.Mui-selected': {
                      color: '#1976d2',
                      fontWeight: 600,
                    },
                  },
                }}
              >
                <Tab label="📋 General Information" />
                <Tab label="🛣️ Routes & Restrictions" />
              </Tabs>
            </Box>

            {/* Sub-Tab: General Information */}
            {additionalInfoSubTab === 0 && (
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Description"
                    name="description"
                    multiline
                    rows={3}
                    value={formData.description}
                    onChange={handleInputChange}
                    variant="outlined"
                    placeholder="Brief description of the permit purpose and details"
                    helperText="Provide a clear and concise description of what this permit is for"
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Remarks"
                    name="remarks"
                    multiline
                    rows={3}
                    value={formData.remarks}
                    onChange={handleInputChange}
                    variant="outlined"
                    placeholder="Any additional notes or remarks"
                    helperText="Additional information that may be important for staff processing this permit"
                  />
                </Grid>

                {/* Summary Box */}
                {formData.description && (
                  <Grid item xs={12}>
                    <Paper sx={{ p: 2.5, background: 'linear-gradient(135deg, #c8e6c9 0%, #a5d6a7 100%)', borderLeft: '4px solid #4caf50', mt: 1 }}>
                      <Grid container spacing={1}>
                        <Grid item xs={12}>
                          <Typography variant="caption" sx={{ color: '#1b5e20', fontWeight: 600 }}>
                            <strong>📝 Permit Summary:</strong>
                          </Typography>
                        </Grid>
                        <Grid item xs={12}>
                          <Typography variant="body2" sx={{ color: '#2e7d32', lineHeight: 1.6 }}>
                            {formData.description.substring(0, 150)}{formData.description.length > 150 ? '...' : ''}
                          </Typography>
                        </Grid>
                      </Grid>
                    </Paper>
                  </Grid>
                )}
              </Grid>
            )}

            {/* Sub-Tab: Routes & Restrictions */}
            {additionalInfoSubTab === 1 && (
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Approved Routes"
                    name="approved_routes"
                    multiline
                    rows={2}
                    value={formData.approved_routes}
                    onChange={handleInputChange}
                    variant="outlined"
                    placeholder="e.g., Route 1: City A to City B, Route 2: City C to City D"
                    helperText="Specify which routes this vehicle is approved to use"
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Restrictions & Conditions"
                    name="restrictions"
                    multiline
                    rows={2}
                    value={formData.restrictions}
                    onChange={handleInputChange}
                    variant="outlined"
                    placeholder="e.g., Only weekdays, Not during peak hours, Specific areas not allowed"
                    helperText="Any restrictions or special conditions for this permit"
                  />
                </Grid>
              </Grid>
            )}
          </TabPanel>

          {/* Tab 6: Assignment */}
          <TabPanel value={tabValue} index={5}>
            {/* Assignment Sub-Tabs */}
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
              <Tabs
                value={assignmentSubTab}
                onChange={(e, newValue) => setAssignmentSubTab(newValue)}
                sx={{
                  '& .MuiTabs-indicator': {
                    backgroundColor: '#1976d2',
                    height: 3,
                  },
                  '& .MuiTab-root': {
                    textTransform: 'none',
                    fontSize: '13px',
                    fontWeight: 500,
                    color: '#666',
                    '&.Mui-selected': {
                      color: '#1976d2',
                      fontWeight: 600,
                    },
                  },
                }}
              >
                <Tab label="👨‍💼 Select Employee" />
                <Tab label="📊 Assignment Status" />
              </Tabs>
            </Box>

            {/* Sub-Tab: Select Employee */}
            {assignmentSubTab === 0 && (
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  {!isAdmin && (
                    <Alert severity="info" sx={{ mb: 2 }}>
                      ℹ️ You can only change the assignment if this permit is currently assigned to you. Admins can reassign any permit.
                    </Alert>
                  )}
                  <FormControl fullWidth>
                    <InputLabel>Assign to Employee</InputLabel>
                    <Select
                      name="assigned_to"
                      value={formData.assigned_to}
                      onChange={handleInputChange}
                      label="Assign to Employee"
                    >
                      <MenuItem value="">
                        <em>No Assignment</em>
                      </MenuItem>
                      {employees.map(emp => (
                        <MenuItem key={emp.id} value={emp.id}>
                          {emp.full_name || emp.username} ({emp.role})
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Assignment Details"
                    name="assignment_details"
                    value={formData.assignment_details}
                    onChange={handleInputChange}
                    placeholder="e.g., Reviews documents, Verify registration details, Process approval"
                    multiline
                    rows={3}
                    helperText="Explain what tasks the assigned employee should perform for this permit"
                    variant="outlined"
                  />
                </Grid>
              </Grid>
            )}

            {/* Sub-Tab: Assignment Status */}
            {assignmentSubTab === 1 && (
              <Grid container spacing={3}>
                {permit?.assigned_to_full_name && (
                  <Grid item xs={12}>
                    <Paper sx={{ p: 2.5, background: 'linear-gradient(135deg, #c8e6c9 0%, #a5d6a7 100%)', borderLeft: '4px solid #4caf50' }}>
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="caption" sx={{ color: '#1b5e20' }}>
                            <strong>Assigned To:</strong>
                          </Typography>
                          <Typography variant="body2" sx={{ color: '#2e7d32', fontWeight: 600 }}>
                            {permit.assigned_to_full_name}
                          </Typography>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="caption" sx={{ color: '#1b5e20' }}>
                            <strong>Role:</strong>
                          </Typography>
                          <Typography variant="body2" sx={{ color: '#2e7d32', fontWeight: 600 }}>
                            {permit.assigned_to_role}
                          </Typography>
                        </Grid>
                        {permit.assignment_details && (
                          <Grid item xs={12}>
                            <Typography variant="caption" sx={{ color: '#1b5e20' }}>
                              <strong>Assignment Details:</strong>
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#2e7d32', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                              {permit.assignment_details}
                            </Typography>
                          </Grid>
                        )}
                      </Grid>
                    </Paper>
                  </Grid>
                )}

                {!permit?.assigned_to_full_name && (
                  <Grid item xs={12}>
                    <Paper sx={{ p: 2.5, background: 'linear-gradient(135deg, #ffccbc 0%, #ffab91 100%)', borderLeft: '4px solid #ff5722' }}>
                      <Typography variant="body2" sx={{ color: '#bf360c' }}>
                        <strong>Status:</strong> This permit is currently not assigned to any employee
                      </Typography>
                    </Paper>
                  </Grid>
                )}
              </Grid>
            )}
          </TabPanel>

          {/* Tab 7: Documents */}
          <TabPanel value={tabValue} index={6}>
            <Grid container spacing={3}>
              {/* Access Control Alert for Documents Tab */}
              {!canEditForm && (
                <Grid item xs={12}>
                  <Alert severity="warning" sx={{ mb: 1, borderRadius: '8px' }}>
                    📄 This permit is not assigned to you. You can view documents but cannot upload or delete them.
                  </Alert>
                </Grid>
              )}

              {/* Upload Section - Only visible to users with edit access */}
              {canEditForm && (
                <Grid item xs={12}>
                  <Paper
                    sx={{
                      p: 3,
                      textAlign: 'center',
                      background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)',
                      border: '2px dashed #1976d2',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        boxShadow: '0 4px 12px rgba(25, 118, 210, 0.3)',
                        background: 'linear-gradient(135deg, #bbdefb 0%, #90caf9 100%)',
                      },
                    }}
                  >
                    <input
                      type="file"
                      id="document-upload"
                      multiple
                      onChange={handleFileUpload}
                      style={{ display: 'none' }}
                      accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                      disabled={!canEditForm}
                    />
                    <label htmlFor="document-upload" style={{ cursor: canEditForm ? 'pointer' : 'not-allowed', display: 'block' }}>
                      <CloudUploadIcon sx={{ fontSize: 48, color: '#1976d2', mb: 1 }} />
                      <Typography variant="h6" sx={{ fontWeight: 600, color: '#1976d2', mb: 0.5 }}>
                        Upload Documents
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#666', mb: 1 }}>
                        Click to select or drag & drop files here
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#999' }}>
                        Supported formats: PDF, JPG, PNG, DOC, DOCX (Max 10MB each)
                      </Typography>
                    </label>
                  </Paper>
                </Grid>
              )}

              {/* Pending Files */}
              {pendingFiles.length > 0 && (
                <Grid item xs={12}>
                  <Paper sx={{ p: 2.5, background: 'linear-gradient(135deg, #fff9c4 0%, #fff59d 100%)', borderLeft: '4px solid #fbc02d' }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, color: '#f57f17', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                      ⏳ Pending Upload ({pendingFiles.length})
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#666', mb: 2, display: 'block' }}>
                      These files will be uploaded when you click Save Changes
                    </Typography>
                    <Grid container spacing={2}>
                      {pendingFiles.map((file) => (
                        <Grid item xs={12} sm={6} md={4} key={file.id}>
                          <Paper
                            sx={{
                              p: 2,
                              background: 'linear-gradient(135deg, #fffde7 0%, #fffce4 100%)',
                              border: '1px solid #fbc02d',
                              borderRadius: '8px',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: 1.5,
                              opacity: 0.9,
                              '&:hover': {
                                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                              },
                            }}
                          >
                            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                              <AttachFileIcon sx={{ color: '#fbc02d', fontSize: 24, mt: 0.5 }} />
                              <Box sx={{ flex: 1, minWidth: 0 }}>
                                <Typography variant="body2" sx={{ fontWeight: 600, color: '#333', wordBreak: 'break-word' }}>
                                  {file.filename}
                                </Typography>
                                <Typography variant="caption" sx={{ color: '#999' }}>
                                  {(file.size / 1024).toFixed(2)} KB
                                </Typography>
                                <Typography variant="caption" sx={{ color: '#fbc02d', display: 'block', fontWeight: 600 }}>
                                  Pending Upload
                                </Typography>
                              </Box>
                            </Box>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                              <Button
                                size="small"
                                variant="outlined"
                                startIcon={<DeleteIcon />}
                                onClick={() => handleDeleteDocument(file.id)}
                                sx={{
                                  flex: 1,
                                  fontSize: '12px',
                                  color: '#f57f17',
                                  borderColor: '#f57f17',
                                  '&:hover': {
                                    backgroundColor: '#fff9c4',
                                  },
                                }}
                              >
                                Remove
                              </Button>
                            </Box>
                          </Paper>
                        </Grid>
                      ))}
                    </Grid>
                  </Paper>
                </Grid>
              )}

              {/* Documents List */}
              {documents.length > 0 ? (
                <Grid item xs={12}>
                  <Paper sx={{ p: 2.5, background: 'linear-gradient(135deg, #f5f5f5 0%, #eeeeee 100%)' }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, color: '#1976d2', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <AttachFileIcon /> Uploaded Documents ({documents.length})
                    </Typography>
                    <Grid container spacing={2}>
                      {documents.map((doc) => (
                        <Grid item xs={12} sm={6} md={4} key={doc.id}>
                          <Paper
                            sx={{
                              p: 2,
                              background: 'linear-gradient(135deg, #ffffff 0%, #fafafa 100%)',
                              border: '1px solid #e0e0e0',
                              borderRadius: '8px',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: 1.5,
                              '&:hover': {
                                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                              },
                            }}
                          >
                            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                              <AttachFileIcon sx={{ color: '#1976d2', fontSize: 24, mt: 0.5 }} />
                              <Box sx={{ flex: 1, minWidth: 0 }}>
                                <Typography variant="body2" sx={{ fontWeight: 600, color: '#333', wordBreak: 'break-word' }}>
                                  {doc.filename || doc.name}
                                </Typography>
                                <Typography variant="caption" sx={{ color: '#999', display: 'block' }}>
                                  File: {doc.name}
                                </Typography>
                                <Typography variant="caption" sx={{ color: '#999' }}>
                                  {(doc.size / 1024).toFixed(2)} KB
                                </Typography>
                                <Typography variant="caption" sx={{ color: '#999', display: 'block' }}>
                                  {doc.uploadedAt}
                                </Typography>
                              </Box>
                            </Box>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                              <Button
                                size="small"
                                variant="outlined"
                                startIcon={<OpenInNewIcon />}
                                onClick={() => {
                                  // Open document in new tab
                                  if (doc.file) {
                                    window.open(doc.file, '_blank');
                                  }
                                }}
                                sx={{
                                  flex: 1,
                                  fontSize: '12px',
                                  color: '#2196f3',
                                  borderColor: '#2196f3',
                                  '&:hover': {
                                    backgroundColor: '#e3f2fd',
                                  },
                                }}
                              >
                                View
                              </Button>
                              <Button
                                size="small"
                                variant="outlined"
                                startIcon={<DownloadIcon />}
                                onClick={() => handleDownloadDocument(doc)}
                                sx={{
                                  flex: 1,
                                  fontSize: '12px',
                                  color: '#1976d2',
                                  borderColor: '#1976d2',
                                  '&:hover': {
                                    backgroundColor: '#e3f2fd',
                                  },
                                }}
                              >
                                Download
                              </Button>
                              <Button
                                size="small"
                                variant="outlined"
                                startIcon={<DeleteIcon />}
                                onClick={() => handleDeleteDocument(doc.id)}
                                disabled={!canEditForm}
                                sx={{
                                  flex: 1,
                                  fontSize: '12px',
                                  color: canEditForm ? '#f44336' : '#ccc',
                                  borderColor: canEditForm ? '#f44336' : '#ccc',
                                  '&:hover': {
                                    backgroundColor: canEditForm ? '#ffebee' : 'transparent',
                                  },
                                  '&:disabled': {
                                    cursor: 'not-allowed',
                                    opacity: 0.6,
                                  },
                                }}
                              >
                                Delete
                              </Button>
                            </Box>
                          </Paper>
                        </Grid>
                      ))}
                    </Grid>
                  </Paper>
                </Grid>
              ) : (
                <Grid item xs={12}>
                  <Paper
                    sx={{
                      p: 3,
                      textAlign: 'center',
                      background: 'linear-gradient(135deg, #f3e5f5 0%, #ede7f6 100%)',
                      borderLeft: '4px solid #9c27b0',
                    }}
                  >
                    <Typography variant="body2" sx={{ color: '#6a1b9a' }}>
                      <strong>No documents uploaded yet.</strong> Upload documents to attach them to this permit.
                    </Typography>
                  </Paper>
                </Grid>
              )}
            </Grid>
          </TabPanel>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <Box
        sx={{
          display: 'flex',
          gap: 2,
          justifyContent: 'flex-end',
          mt: 4,
          p: 3,
          backgroundColor: '#f5f7fa',
          borderRadius: '12px',
          borderTop: '1px solid #e0e0e0',
        }}
      >
        <Button
          variant="outlined"
          startIcon={<CancelIcon />}
          onClick={handleCancel}
          disabled={saving}
          sx={{
            borderColor: '#ccc',
            color: '#666',
            '&:hover': {
              borderColor: '#999',
              backgroundColor: '#f9f9f9',
            },
          }}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          color="primary"
          size="large"
          startIcon={<SaveIcon />}
          onClick={handleSaveChanges}
          disabled={saving}
          sx={{
            background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
            boxShadow: '0 4px 12px rgba(25, 118, 210, 0.4)',
            paddingX: 4,
            '&:hover': {
              boxShadow: '0 6px 16px rgba(25, 118, 210, 0.6)',
            },
            '&:disabled': {
              boxShadow: 'none',
            },
          }}
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </Box>

      {/* Assignment Dialog */}
      <Dialog
        open={assignDialogOpen}
        onClose={() => setAssignDialogOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            maxHeight: '90vh',
            height: 'auto',
            borderRadius: '12px',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
          },
        }}
      >
        {/* Dialog Header */}
        <DialogTitle
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
            color: 'white',
            padding: '20px 24px',
            borderRadius: '12px 12px 0 0',
          }}
        >
          <PersonIcon sx={{ fontSize: 28 }} />
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Assign Permit to Employee
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.9 }}>
              Select an employee to assign this permit
            </Typography>
          </Box>
          <IconButton
            onClick={() => setAssignDialogOpen(false)}
            sx={{
              position: 'absolute',
              right: 16,
              top: 16,
              color: 'white',
              '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.2)' }
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        {/* Dialog Content */}
        <DialogContent
          sx={{
            p: 4,
            maxHeight: 'calc(90vh - 200px)',
            overflowY: 'auto',
            backgroundColor: '#f5f7fa',
          }}
        >
          <Box sx={{ mt: 2 }}>
            {/* Employee Selection */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600, color: '#1976d2' }}>
                <PersonIcon sx={{ mr: 1, verticalAlign: 'middle', fontSize: 20 }} />
                Select Employee
              </Typography>
              <FormControl fullWidth>
                <Select
                  value={selectedEmployee}
                  onChange={(e) => setSelectedEmployee(e.target.value)}
                  displayEmpty
                  sx={{
                    backgroundColor: 'white',
                    borderRadius: '8px',
                    '& .MuiOutlinedInput-root': {
                      '&:hover fieldset': {
                        borderColor: '#1976d2',
                      },
                    },
                  }}
                >
                  <MenuItem value="" disabled>
                    <em style={{ color: '#999' }}>Choose an employee...</em>
                  </MenuItem>
                  {employees.map(emp => (
                    <MenuItem key={emp.id} value={emp.id}>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {emp.full_name || emp.username}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#666' }}>
                          {emp.role}
                        </Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            {/* Selected Employee Info */}
            {selectedEmployee && employees.find(e => e.id === parseInt(selectedEmployee)) && (
              <Paper
                elevation={2}
                sx={{
                  p: 2.5,
                  mb: 3,
                  background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)',
                  borderLeft: '4px solid #1976d2',
                  borderRadius: '8px',
                }}
              >
                <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600, color: '#1565c0' }}>
                  Selected Employee Details
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" sx={{ color: '#666' }}>Name</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {employees.find(e => e.id === parseInt(selectedEmployee))?.full_name ||
                        employees.find(e => e.id === parseInt(selectedEmployee))?.username}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" sx={{ color: '#666' }}>Role</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {employees.find(e => e.id === parseInt(selectedEmployee))?.role}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" sx={{ color: '#666' }}>Email</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {employees.find(e => e.id === parseInt(selectedEmployee))?.email}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" sx={{ color: '#666' }}>Username</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {employees.find(e => e.id === parseInt(selectedEmployee))?.username}
                    </Typography>
                  </Grid>
                </Grid>
              </Paper>
            )}
          </Box>
        </DialogContent>

        {/* Dialog Actions */}
        <DialogActions
          sx={{
            p: 3,
            backgroundColor: '#f5f7fa',
            borderTop: '1px solid #e0e0e0',
            gap: 1,
          }}
        >
          <Button
            onClick={() => setAssignDialogOpen(false)}
            variant="outlined"
            startIcon={<CancelIcon />}
            sx={{
              borderColor: '#ccc',
              color: '#666',
              '&:hover': {
                borderColor: '#999',
                backgroundColor: '#f9f9f9',
              },
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleAssignEmployee}
            variant="contained"
            color="primary"
            startIcon={<AssignmentIcon />}
            disabled={saving || !selectedEmployee}
            sx={{
              background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
              boxShadow: '0 4px 12px rgba(25, 118, 210, 0.4)',
              '&:hover': {
                boxShadow: '0 6px 16px rgba(25, 118, 210, 0.6)',
              },
              '&:disabled': {
                boxShadow: 'none',
              },
            }}
          >
            {saving ? 'Assigning...' : 'Assign Employee'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PermitEdit;
