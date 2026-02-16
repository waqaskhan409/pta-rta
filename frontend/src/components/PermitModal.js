import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  CircularProgress,
  Alert,
  Box,
  Tab,
  Tabs,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  Chip,
  LinearProgress,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Tooltip,
  Card,
  CardContent,
} from '@mui/material';
import {
  ContentCopy as DuplicateIcon,
  CloudUpload as UploadIcon,
  Delete as DeleteIcon,
  GetApp as DownloadIcon,
  Description as DocumentIcon,
  CheckCircle as VerifiedIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Visibility as ViewIcon,
  Close as CloseIcon,
  Edit as EditIcon,
  Info as InfoIcon,
  DirectionsCar as VehicleIcon,
  Person as OwnerIcon,
  Description as DetailsIcon,
  Print as PrintIcon,
} from '@mui/icons-material';
import apiClient from '../services/apiClient';
import { useAuth } from '../context/AuthContext';
import PrintCertificate from './PrintCertificate';

// Helper function to construct full media URL
const getMediaUrl = (filePath) => {
  const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000';
  // Files are stored directly in config folder, not in media subfolder
  return `${baseUrl}/${filePath}`;
};

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
      {value === index && <Box sx={{ p: 2 }}>{children}</Box>}
    </div>
  );
}

const PermitModal = ({ open, permit, onClose, onSave, isEditMode = false, showHistoryTab = false, showPrintCertificateOnOpen = false }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [tabValue, setTabValue] = useState(showHistoryTab ? 5 : 0);
  const [isDuplicateMode, setIsDuplicateMode] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [eligibleUsers, setEligibleUsers] = useState([]);
  const [documentViewerOpen, setDocumentViewerOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [failedImages, setFailedImages] = useState(new Set());
  const [permitTypes, setPermitTypes] = useState([]);
  const [vehicleTypes, setVehicleTypes] = useState([]);
  const [printCertificateOpen, setPrintCertificateOpen] = useState(false);
  const [vehicleValidation, setVehicleValidation] = useState({
    isChecking: false,
    message: '',
    available: null,
    activePermits: 0,
  });
  const vehicleCheckTimeoutRef = React.useRef(null);

  // Check if user has permission to edit permits
  const canEditPermits = () => {
    if (!user) {
      console.log('[PermitModal] No user found');
      return false;
    }

    console.log('[PermitModal] User data:', { user, role: user?.role, features: user?.features });

    // Admins (is_staff) can always edit any permit
    if (user.is_staff) {
      console.log('[PermitModal] User is admin/staff, allowing edit');
      return true;
    }

    // Check if user has 'permit_edit' feature
    const hasEditFeature = user.features && Array.isArray(user.features) &&
      user.features.some(feature => feature.name === 'permit_edit');
    console.log('[PermitModal] Has permit_edit feature:', hasEditFeature, 'Features:', user.features);
    if (!hasEditFeature) {
      console.log('[PermitModal] User does not have permit_edit feature');
      return false;
    }

    // Additional check: permit must be assigned
    // Check BOTH permit data AND formData since formData might not be populated yet
    const isAssigned = permit?.assigned_to || formData?.assigned_to;
    if (!isAssigned) {
      console.log('[PermitModal] Permit is unassigned, cannot edit');
      return false;
    }
    console.log('[PermitModal] Permit is assigned to:', isAssigned);

    // Get user's role name properly (could be user.role.name or user.role string)
    let userRoleName = (user?.role?.name || user?.role || '').toLowerCase().trim();
    let assignedRoleName = (permit?.assigned_to_role || '').toLowerCase().trim();

    console.log('[PermitModal] ====== ROLE MATCHING DEBUG ======');
    console.log('[PermitModal] STEP 1: User Info', {
      username: user?.username,
      rawRole: user?.role,
      extractedRoleName: userRoleName,
      hasPermitEditFeature: hasEditFeature
    });
    console.log('[PermitModal] STEP 2: Permit Info', {
      permitNumber: permit?.permit_number,
      assigned_to_id: permit?.assigned_to,
      assigned_to_name: permit?.assigned_to_full_name,
      assigned_to_role_raw: permit?.assigned_to_role,
      extractedRoleName: assignedRoleName
    });
    console.log('[PermitModal] STEP 3: Role Comparison', {
      userRole: userRoleName,
      assignedRole: assignedRoleName,
      areEqual: userRoleName === assignedRoleName,
      userRoleLength: userRoleName.length,
      assignedRoleLength: assignedRoleName.length,
      bothNonEmpty: !!userRoleName && !!assignedRoleName
    });

    // If both roles are known and they match (case-insensitive), allow edit
    if (assignedRoleName && userRoleName && assignedRoleName === userRoleName) {
      console.log('[PermitModal] ✅ SUCCESS: Roles match! Allowing edit');
      console.log('[PermitModal] ====== END DEBUG ======');
      return true;
    } else if (assignedRoleName && userRoleName) {
      console.log(`[PermitModal] ❌ FAILED: Roles do not match!`);
      console.log(`    Expected: "${userRoleName}"`);
      console.log(`    Got:      "${assignedRoleName}"`);
    }

    // If role data is missing but user has edit feature, allow edit (fallback)
    if (!assignedRoleName || !userRoleName) {
      console.log('[PermitModal] Role data incomplete, allowing edit for users with permit_edit feature');
      return true;
    }

    // Deny if roles don't match
    console.log('[PermitModal] ❌ Roles do not match, denying edit');
    return false;
  };

  const hasEditPermission = canEditPermits();

  // Determine if we're creating a new permit (no permit provided) or editing/viewing
  const isCreateMode = !permit;

  // For create mode, allow editing. For edit mode, check permission. For view mode, disable editing.
  const effectiveEditMode = isCreateMode || (isEditMode && hasEditPermission);

  // Debug logging
  useEffect(() => {
    console.log('PermitModal state:', { open, isEditMode, isCreateMode, effectiveEditMode, permit: permit?.id, formDataExists: !!formData, eligibleUsersCount: eligibleUsers.length });
  }, [open, isEditMode, isCreateMode, effectiveEditMode, permit, formData, eligibleUsers]);

  // Fetch permit types and vehicle types on modal open
  useEffect(() => {
    if (open) {
      fetchPermitTypes();
      fetchVehicleTypes();
    }
  }, [open]);

  const fetchPermitTypes = async () => {
    try {
      const response = await apiClient.get('/permit-types/');
      setPermitTypes(response.data.results || response.data);
    } catch (err) {
      console.error('Failed to fetch permit types:', err);
      setPermitTypes([]);
    }
  };

  const fetchVehicleTypes = async () => {
    try {
      const response = await apiClient.get('/vehicle-types/');
      setVehicleTypes(response.data.results || response.data);
    } catch (err) {
      console.error('Failed to fetch vehicle types:', err);
      setVehicleTypes([]);
    }
  };

  useEffect(() => {
    if (permit) {
      // Ensure permit has an id property for document operations
      const permitData = {
        ...permit,
        id: permit.id || permit.pk, // Handle both 'id' and 'pk' field names
        permit_type: permit.permit_type || null, // Handle as FK object or null
        vehicle_type: permit.vehicle_type || null, // Handle as FK object or null
        assigned_to: permit.assigned_to || null,
        assigned_to_username: permit.assigned_to_username || '',
        assigned_to_full_name: permit.assigned_to_full_name || '',
        assigned_to_role: permit.assigned_to_role || '',
      };
      setFormData(permitData);
      // Fetch documents for this permit
      if (permitData.id) {
        fetchDocuments(permitData.id);
      }
    } else {
      setFormData({
        permit_number: '',
        authority: 'RTA',
        permit_type: null,
        vehicle_number: '',
        vehicle_type: null,
        vehicle_make: '',
        vehicle_model: '',
        vehicle_year: new Date().getFullYear(),
        vehicle_capacity: '',
        owner_name: '',
        owner_email: '',
        owner_phone: '',
        owner_address: '',
        owner_cnic: '',
        status: 'pending',
        valid_from: new Date().toISOString().split('T')[0],
        valid_to: '', // Start empty - will auto-calculate when vehicle type is selected
        description: '',
        remarks: '',
        approved_routes: '',
        restrictions: '',
        assigned_to: user?.id || null,
        assigned_to_username: user?.username || '',
        assigned_to_full_name: user?.first_name && user?.last_name ? `${user.first_name} ${user.last_name}` : user?.username || '',
        assigned_at: null,
        assigned_by: null,
      });
      setDocuments([]);
    }
    setError('');
    setSuccess('');
    // Set tab based on showHistoryTab prop
    if (showHistoryTab) {
      setTabValue(5);
    } else {
      setTabValue(0);
    }
    // Fetch eligible users when modal opens in edit mode
    if (open && effectiveEditMode) {
      fetchEligibleUsers();
    }
  }, [permit, open, showHistoryTab, isEditMode, effectiveEditMode]);

  // Auto-open print certificate when showPrintCertificateOnOpen is true
  // Only open if NOT in edit/duplicate mode
  useEffect(() => {
    if (showPrintCertificateOnOpen && formData && !isEditMode && !isDuplicateMode && formData.status === 'active') {
      setPrintCertificateOpen(true);
    }
  }, [showPrintCertificateOnOpen, formData, isEditMode, isDuplicateMode]);

  // Clear vehicle validation and cleanup timeout when modal closes
  useEffect(() => {
    if (!open) {
      // Clear vehicle validation
      setVehicleValidation({
        isChecking: false,
        message: '',
        available: null,
        activePermits: 0,
      });

      // Clear any pending vehicle check timeout
      if (vehicleCheckTimeoutRef.current) {
        clearTimeout(vehicleCheckTimeoutRef.current);
      }
    }
  }, [open]);

  const fetchEligibleUsers = async () => {
    try {
      // Fetch assignable users based on role hierarchy
      const response = await apiClient.get('/permits/assignable_users/');
      console.log('Assignable users fetched:', response.data);
      setEligibleUsers(response.data.results || []);
    } catch (err) {
      console.error('Error fetching assignable users:', err);
      // Fallback to empty list
      setEligibleUsers([]);
    }
  };

  const fetchDocuments = async (permitId) => {
    try {
      const response = await apiClient.get(`/permit-documents/?permit_id=${permitId}`);
      const docs = response.data.results || response.data;
      console.log('Fetched documents:', docs);
      docs.forEach(doc => {
        const ext = doc.file_extension?.toLowerCase();
        const isImage = ['jpg', 'jpeg', 'png', 'gif'].includes(ext);
        console.log(`Document: ${doc.filename}, Extension: "${doc.file_extension}" (lowercase: "${ext}"), IsImage: ${isImage}`);
      });
      console.log(`Total docs: ${docs.length}, Image docs: ${docs.filter(d => ['jpg', 'jpeg', 'png', 'gif'].includes(d.file_extension?.toLowerCase())).length}`);
      setDocuments(docs);
    } catch (err) {
      console.error('Error fetching documents:', err);
    }
  };

  const handleFileUpload = async (event) => {
    const files = event.target.files;
    if (!files || files.length === 0 || !formData.id) return;

    for (let file of files) {
      const formDataUpload = new FormData();
      formDataUpload.append('permit', formData.id);
      formDataUpload.append('file', file);
      formDataUpload.append('document_type', 'other');
      formDataUpload.append('description', `Uploaded: ${file.name}`);

      try {
        setUploading(true);
        setUploadProgress(0);

        const response = await apiClient.post('/permit-documents/', formDataUpload, {
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress: (progressEvent) => {
            const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(percent);
          }
        });

        setDocuments([...documents, response.data]);
        setSuccess(`Document "${file.name}" uploaded successfully!`);
      } catch (err) {
        setError(`Failed to upload "${file.name}": ${err.message}`);
      } finally {
        setUploading(false);
        setUploadProgress(0);
      }
    }
    event.target.value = '';
  };

  const handleDeleteDocument = async (docId) => {
    if (window.confirm('Are you sure you want to delete this document?')) {
      try {
        await apiClient.delete(`/permit-documents/${docId}/`);
        setDocuments(documents.filter(doc => doc.id !== docId));
        setSuccess('Document deleted successfully!');
      } catch (err) {
        setError('Failed to delete document');
      }
    }
  };

  const checkVehicleNumber = async (vehicleNumber, excludePermitId = null) => {
    if (!vehicleNumber || vehicleNumber.trim().length === 0) {
      setVehicleValidation({
        isChecking: false,
        message: '',
        available: null,
        activePermits: 0,
      });
      return;
    }

    try {
      setVehicleValidation(prev => ({ ...prev, isChecking: true }));

      const params = new URLSearchParams();
      params.append('vehicle_number', vehicleNumber.trim());
      if (excludePermitId) {
        params.append('exclude_permit_id', excludePermitId);
      }

      const response = await apiClient.get(`/permits/check_vehicle_number/?${params.toString()}`);

      setVehicleValidation({
        isChecking: false,
        message: response.data.message,
        available: response.data.available,
        activePermits: response.data.active_permits_count,
      });
    } catch (err) {
      console.error('Error checking vehicle number:', err);
      setVehicleValidation({
        isChecking: false,
        message: 'Error checking vehicle number availability',
        available: null,
        activePermits: 0,
      });
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    let processedValue = value;

    // Convert assigned_to to integer or null
    if (name === 'assigned_to') {
      processedValue = value === '' ? null : parseInt(value, 10);
    }

    // Format CNIC: 12345-1234567-1
    if (name === 'owner_cnic') {
      // Remove all non-numeric characters
      const cleaned = value.replace(/\D/g, '');
      // Format as XXXXX-XXXXXXX-X
      if (cleaned.length > 0) {
        if (cleaned.length <= 5) {
          processedValue = cleaned;
        } else if (cleaned.length <= 12) {
          processedValue = cleaned.slice(0, 5) + '-' + cleaned.slice(5);
        } else {
          processedValue = cleaned.slice(0, 5) + '-' + cleaned.slice(5, 12) + '-' + cleaned.slice(12, 13);
        }
      } else {
        processedValue = '';
      }
    }

    // Format Phone: 03123456789 (only numbers)
    if (name === 'owner_phone') {
      // Remove all non-numeric characters
      processedValue = value.replace(/\D/g, '');
    }

    const updatedData = {
      ...formData,
      [name]: processedValue,
    };

    // Auto-update valid_to if valid_from changes and vehicle_type is selected
    if (name === 'valid_from' && formData.vehicle_type && typeof formData.vehicle_type === 'object' && formData.vehicle_type.permit_duration_days) {
      const durationDays = formData.vehicle_type.permit_duration_days;
      const fromDate = new Date(value);
      const toDate = new Date(fromDate);
      toDate.setDate(toDate.getDate() + durationDays);
      updatedData.valid_to = toDate.toISOString().split('T')[0];
    }

    setFormData(updatedData);

    // Check vehicle number with debouncing (only on new permits or when vehicle_number changes)
    if (name === 'vehicle_number' && value.trim().length > 0) {
      // Clear existing timeout
      if (vehicleCheckTimeoutRef.current) {
        clearTimeout(vehicleCheckTimeoutRef.current);
      }

      // Set new timeout for debounced check (500ms delay)
      vehicleCheckTimeoutRef.current = setTimeout(() => {
        checkVehicleNumber(value, formData.id);
      }, 500);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');

      // Debug logging
      console.log('Form data before submit:', formData);
      console.log('assigned_to value:', formData.assigned_to, 'type:', typeof formData.assigned_to);
      console.log('permit_type value:', formData.permit_type, 'type:', typeof formData.permit_type);

      // Create clean submit data with only writable fields
      const submitData = {
        permit_number: formData.permit_number,
        authority: formData.authority,
        permit_type: formData.permit_type && typeof formData.permit_type === 'object' ? formData.permit_type.id : formData.permit_type,
        vehicle_number: formData.vehicle_number,
        vehicle_type: formData.vehicle_type && typeof formData.vehicle_type === 'object' ? formData.vehicle_type.id : formData.vehicle_type,
        vehicle_make: formData.vehicle_make,
        vehicle_model: formData.vehicle_model,
        vehicle_year: formData.vehicle_year,
        vehicle_capacity: formData.vehicle_capacity,
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
        assigned_to: formData.assigned_to,
      };

      if (effectiveEditMode && permit?.id) {
        const response = await apiClient.put(`/permits/${permit.id}/`, submitData);
        console.log('Update response:', response.data);
        setSuccess('Permit updated successfully!');
      } else {
        // For duplicate or new permit, clear the ID so it creates a new record
        delete submitData.permit_number; // Let backend generate new permit number
        delete submitData.id;
        const response = await apiClient.post('/permits/', submitData);
        console.log('Create response:', response.data);
        setSuccess(isDuplicateMode ? 'Permit duplicated successfully!' : 'Permit created successfully!');
      }

      setTimeout(() => {
        onSave();
        onClose();
      }, 1500);
    } catch (err) {
      console.error('Full error object:', err);
      console.error('Error response:', err.response);

      // Handle different types of validation errors
      let errorMessage = 'An error occurred while saving the permit';

      if (err.response?.data?.vehicle_number?.[0]) {
        errorMessage = err.response.data.vehicle_number[0];
      } else if (err.response?.data?.assigned_to?.[0]) {
        errorMessage = err.response.data.assigned_to[0];
      } else if (err.response?.data?.detail) {
        errorMessage = err.response.data.detail;
      } else if (err.response?.data?.non_field_errors?.[0]) {
        errorMessage = err.response.data.non_field_errors[0];
      }

      setError(errorMessage);
      console.error('Error saving permit:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!formData) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth
      PaperProps={{
        sx: {
          borderRadius: '12px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
        }
      }}>
      <DialogTitle sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
        color: 'white',
        padding: '20px 24px',
        borderRadius: '12px 12px 0 0',
      }}>
        <EditIcon sx={{ fontSize: 28 }} />
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 600, margin: 0 }}>
            {effectiveEditMode ? 'Edit Permit' : isDuplicateMode ? 'Duplicate Permit' : 'View Permit'}
          </Typography>
          {formData?.permit_number && (
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>
              Permit #{formData.permit_number}
            </Typography>
          )}
        </Box>
        <Box sx={{ ml: 'auto' }}>
          <IconButton
            onClick={onClose}
            sx={{
              color: 'white',
              '&:hover': {
                backgroundColor: 'rgba(255,255,255,0.1)',
              }
            }}
          >
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{
        mt: 2,
        backgroundColor: '#fafafa',
        flex: 1,
        overflow: 'auto',
        maxHeight: 'calc(90vh - 160px)',
      }}>
        {error && <Alert severity="error" sx={{ mb: 2, borderRadius: '8px' }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2, borderRadius: '8px' }}>{success}</Alert>}

        {/* Edit Permission Info */}
        {isEditMode && !effectiveEditMode && (
          <Alert severity="warning" sx={{ mb: 2, borderRadius: '8px' }}>
            ⛔ <strong>Edit Restricted:</strong> You can only edit permits assigned to your role ({user?.role?.name || 'your role'}).
            {formData?.assigned_to_full_name && ` This permit is assigned to a ${permit?.assigned_to_role || 'different'} role.`}
          </Alert>
        )}

        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          sx={{
            borderBottom: 2,
            borderColor: '#e0e0e0',
            '& .MuiTab-root': {
              textTransform: 'none',
              fontSize: '14px',
              fontWeight: 500,
              transition: 'all 0.3s ease',
              '&.Mui-selected': {
                color: '#1976d2',
                fontWeight: 600,
              },
              '&:hover': {
                backgroundColor: 'rgba(25, 118, 210, 0.08)',
              }
            },
            '& .MuiTabs-indicator': {
              backgroundColor: '#1976d2',
              height: '3px',
            }
          }}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="Basic Information" icon={<InfoIcon />} iconPosition="start" />
          <Tab label="Vehicle Details" icon={<VehicleIcon />} iconPosition="start" />
          <Tab label="Owner Information" icon={<OwnerIcon />} iconPosition="start" />
          <Tab label="Additional Details" icon={<DetailsIcon />} iconPosition="start" />
          <Tab label={`Documents (${documents.length})`} icon={<DocumentIcon />} iconPosition="start" />
          <Tab label="History" icon={<InfoIcon />} iconPosition="start" />
        </Tabs>

        {/* Tab 1: Basic Information */}
        <TabPanel value={tabValue} index={0}>
          <Card sx={{ borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', border: '1px solid #e0e0e0' }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: '#1976d2' }}>
                📋 Basic Information
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Permit Number"
                    name="permit_number"
                    value={formData.permit_number}
                    onChange={handleChange}
                    disabled={effectiveEditMode}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Authority"
                    name="authority"
                    select
                    SelectProps={{ native: true }}
                    value={formData.authority}
                    onChange={handleChange}
                    disabled={true}
                  >
                    <option value="PTA">PTA</option>
                    <option value="RTA">RTA</option>
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Permit Type"
                    name="permit_type"
                    select
                    SelectProps={{ native: true }}
                    value={formData.permit_type && typeof formData.permit_type === 'object' ? formData.permit_type.id : (formData.permit_type || '')}
                    onChange={(e) => {
                      const selectedId = parseInt(e.target.value);
                      const selectedType = permitTypes.find(t => t.id === selectedId);
                      setFormData(prev => ({
                        ...prev,
                        permit_type: selectedType || null
                      }));
                    }}
                    disabled={!effectiveEditMode || permitTypes.length === 0}
                  >
                    <option value="">-- Select Permit Type --</option>
                    {permitTypes.map(type => (
                      <option key={type.id} value={type.id}>
                        {type.name} ({type.code})
                      </option>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    select
                    fullWidth
                    label="Vehicle Type"
                    name="vehicle_type"
                    SelectProps={{ native: true }}
                    value={formData.vehicle_type && typeof formData.vehicle_type === 'object'
                      ? formData.vehicle_type.id
                      : (formData.vehicle_type || '')}
                    onChange={(e) => {
                      const selectedId = parseInt(e.target.value);
                      const selectedType = vehicleTypes.find(t => t.id === selectedId);

                      const updatedData = {
                        ...formData,
                        vehicle_type: selectedType || null
                      };

                      // Auto-calculate valid_to if valid_from is set
                      if (selectedType && formData.valid_from) {
                        const durationDays = selectedType.permit_duration_days || 365;
                        const fromDate = new Date(formData.valid_from);
                        const toDate = new Date(fromDate);
                        toDate.setDate(toDate.getDate() + durationDays);
                        const calculatedValidTo = toDate.toISOString().split('T')[0];
                        updatedData.valid_to = calculatedValidTo;
                        console.log('[PermitModal] Vehicle type selected, auto-calculation:', {
                          vehicleType: selectedType.name,
                          duration: durationDays,
                          validFrom: formData.valid_from,
                          validTo: calculatedValidTo
                        });
                      } else if (selectedType && !formData.valid_from) {
                        // If valid_from is empty/default, still calculate valid_to
                        // Use today as default
                        const fromDate = new Date(formData.valid_from || new Date().toISOString().split('T')[0]);
                        const durationDays = selectedType.permit_duration_days || 365;
                        const toDate = new Date(fromDate);
                        toDate.setDate(toDate.getDate() + durationDays);
                        updatedData.valid_to = toDate.toISOString().split('T')[0];
                      }

                      setFormData(updatedData);
                    }}
                    disabled={!effectiveEditMode || vehicleTypes.length === 0}
                  >
                    <option value="">-- Select Vehicle Type --</option>
                    {vehicleTypes.map(type => (
                      <option key={type.id} value={type.id}>
                        {type.name}{type.permit_duration_days ? ` (${Math.floor(type.permit_duration_days / 30)} months)` : ''}
                      </option>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Status"
                    name="status"
                    select
                    SelectProps={{ native: true }}
                    value={formData.status}
                    onChange={handleChange}
                    disabled={!effectiveEditMode}
                  >
                    <option value="pending">Pending</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="expired">Expired</option>
                  </TextField>
                </Grid>
                {/* Date fields only shown in edit mode, auto-calculated in create mode */}
                {!isCreateMode && (
                  <>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Valid From"
                        name="valid_from"
                        type="date"
                        value={formData.valid_from}
                        onChange={handleChange}
                        InputLabelProps={{ shrink: true }}
                        disabled={!effectiveEditMode}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Valid To"
                        name="valid_to"
                        type="date"
                        value={formData.valid_to}
                        onChange={handleChange}
                        InputLabelProps={{ shrink: true }}
                        disabled={!effectiveEditMode}
                      />
                    </Grid>
                  </>
                )}
                {/* Permit Duration Info */}
                {formData.vehicle_type && formData.valid_from && (
                  <Grid item xs={12}>
                    <Paper sx={{
                      p: 2,
                      backgroundColor: isCreateMode ? '#fff3e0' : '#e8f5e9',
                      border: `2px solid ${isCreateMode ? '#ff9800' : '#81c784'}`,
                      borderRadius: '8px',
                    }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Box sx={{
                          width: 16,
                          height: 16,
                          borderRadius: '50%',
                          backgroundColor: isCreateMode ? '#ff9800' : '#4caf50',
                        }} />
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="caption" sx={{ color: '#666', fontWeight: 500 }}>
                            📅 {isCreateMode ? 'Permit Will Be Valid For' : 'Permit Validity'}
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: isCreateMode ? '#e65100' : '#2e7d32', marginTop: '4px' }}>
                            <strong>{formData.vehicle_type?.name}:</strong> {formData.vehicle_type?.permit_duration_days || 365} days
                          </Typography>
                          {formData.valid_to && (
                            <Typography variant="body2" sx={{ fontWeight: 600, color: isCreateMode ? '#d84315' : '#1b5e20', marginTop: '4px' }}>
                              ✓ {isCreateMode ? 'Will expire on' : 'Expires'}: {new Date(formData.valid_to).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                            </Typography>
                          )}
                          {isCreateMode && (
                            <Typography variant="caption" sx={{ color: '#666', marginTop: '8px', display: 'block', fontStyle: 'italic' }}>
                              Dates are automatically calculated based on the vehicle type's permit duration.
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    </Paper>
                  </Grid>
                )}
              </Grid>
            </CardContent>
          </Card>
        </TabPanel>

        {/* Tab 2: Vehicle Details */}
        <TabPanel value={tabValue} index={1}>
          <Card sx={{ borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', border: '1px solid #e0e0e0' }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: '#1976d2' }}>
                🚗 Vehicle Details
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Vehicle Number"
                    name="vehicle_number"
                    value={formData.vehicle_number}
                    onChange={handleChange}
                    disabled={!effectiveEditMode}
                  />
                  {(vehicleValidation.isChecking || vehicleValidation.message) && (
                    <Box
                      sx={{
                        mt: 1,
                        p: 1.5,
                        borderRadius: 1,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        backgroundColor:
                          vehicleValidation.isChecking
                            ? '#f5f5f5'
                            : vehicleValidation.available
                              ? '#e8f5e9'
                              : '#ffebee',
                        borderLeft: `4px solid ${vehicleValidation.isChecking
                            ? '#bdbdbd'
                            : vehicleValidation.available
                              ? '#4caf50'
                              : '#f44336'
                          }`,
                      }}
                    >
                      {vehicleValidation.isChecking ? (
                        <>
                          <CircularProgress size={16} />
                          <Typography variant="body2" sx={{ color: '#666' }}>
                            Checking vehicle number...
                          </Typography>
                        </>
                      ) : (
                        <>
                          {vehicleValidation.available ? (
                            <CheckCircleIcon sx={{ color: '#4caf50', fontSize: 18 }} />
                          ) : (
                            <ErrorIcon sx={{ color: '#f44336', fontSize: 18 }} />
                          )}
                          <Typography
                            variant="body2"
                            sx={{
                              color: vehicleValidation.available ? '#2e7d32' : '#c62828',
                              fontWeight: 500,
                            }}
                          >
                            {vehicleValidation.message}
                          </Typography>
                        </>
                      )}
                    </Box>
                  )}
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Vehicle Make"
                    name="vehicle_make"
                    value={formData.vehicle_make}
                    onChange={handleChange}
                    disabled={!effectiveEditMode}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Vehicle Model"
                    name="vehicle_model"
                    value={formData.vehicle_model}
                    onChange={handleChange}
                    disabled={!effectiveEditMode}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Vehicle Year"
                    name="vehicle_year"
                    type="number"
                    value={formData.vehicle_year}
                    onChange={handleChange}
                    disabled={!effectiveEditMode}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Vehicle Capacity"
                    name="vehicle_capacity"
                    type="number"
                    value={formData.vehicle_capacity}
                    onChange={handleChange}
                    disabled={!effectiveEditMode}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </TabPanel>

        {/* Tab 3: Owner Information */}
        <TabPanel value={tabValue} index={2}>
          <Card sx={{ borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', border: '1px solid #e0e0e0' }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: '#1976d2' }}>
                👥 Owner Information
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Owner Name"
                    name="owner_name"
                    value={formData.owner_name}
                    onChange={handleChange}
                    disabled={!effectiveEditMode}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Owner CNIC"
                    name="owner_cnic"
                    value={formData.owner_cnic}
                    onChange={handleChange}
                    disabled={!effectiveEditMode}
                    placeholder="12345-1234567-1"
                    inputProps={{
                      pattern: "[0-9]{5}-[0-9]{7}-[0-9]{1}",
                      inputMode: "numeric"
                    }}
                    helperText="Format: 12345-1234567-1"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Owner Email"
                    name="owner_email"
                    type="email"
                    value={formData.owner_email}
                    onChange={handleChange}
                    disabled={!effectiveEditMode}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Owner Phone"
                    name="owner_phone"
                    value={formData.owner_phone}
                    onChange={handleChange}
                    disabled={!effectiveEditMode}
                    placeholder="03123456789"
                    inputProps={{
                      pattern: "03[0-9]{9}",
                      inputMode: "numeric"
                    }}
                    helperText="Format: 03123456789"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Owner Address"
                    name="owner_address"
                    multiline
                    rows={3}
                    value={formData.owner_address}
                    onChange={handleChange}
                    disabled={!effectiveEditMode}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </TabPanel>

        {/* Tab 4: Additional Details */}
        <TabPanel value={tabValue} index={3}>
          <Card sx={{ borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', border: '1px solid #e0e0e0' }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: '#1976d2' }}>
                📝 Additional Details & Assignment
              </Typography>
              {/* Status & Assignment Info Section */}
              <Box sx={{ mb: 3, p: 2, backgroundColor: '#f5f9ff', borderRadius: '8px', border: '1px solid #b3d9ff' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2, color: '#1565c0' }}>📊 Permit Status & Assignment</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Box sx={{
                        width: 16,
                        height: 16,
                        borderRadius: '50%',
                        backgroundColor:
                          formData.status === 'active' ? '#4caf50' :
                            formData.status === 'pending' ? '#ff9800' :
                              formData.status === 'inactive' ? '#9c27b0' :
                                formData.status === 'expired' ? '#f44336' : '#999',
                      }} />
                      <Box>
                        <Typography variant="caption" sx={{ color: '#666' }}>Current Status:</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{formData.status?.toUpperCase()}</Typography>
                      </Box>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Box sx={{
                        width: 16,
                        height: 16,
                        borderRadius: '50%',
                        backgroundColor: formData?.assigned_to ? '#1976d2' : '#bdbdbd',
                      }} />
                      <Box>
                        <Typography variant="caption" sx={{ color: '#666' }}>Assignment:</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {formData?.assigned_to ? 'Assigned' : 'Unassigned'}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                </Grid>
              </Box>
              <Grid container spacing={2}>
                {effectiveEditMode && formData && (
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth variant="outlined">
                      <InputLabel id="assign-user-label">Assign to User</InputLabel>
                      <Select
                        labelId="assign-user-label"
                        id="assign-to-user"
                        name="assigned_to"
                        value={formData?.assigned_to || ''}
                        onChange={handleChange}
                        label="Assign to User"
                        disabled={false}
                      >
                        <MenuItem value="">-- Unassigned --</MenuItem>
                        {eligibleUsers && eligibleUsers.length > 0 ? (
                          eligibleUsers.map((userItem) => {
                            const isCurrentUser = user?.id === userItem.id;
                            return (
                              <MenuItem
                                key={userItem.id}
                                value={String(userItem.id)}
                                sx={{
                                  backgroundColor: isCurrentUser ? '#e3f2fd' : 'inherit',
                                  fontWeight: isCurrentUser ? 600 : 400,
                                  fontSize: isCurrentUser ? '15px' : '14px',
                                  '&:hover': {
                                    backgroundColor: isCurrentUser ? '#bbdefb' : '#f5f5f5',
                                  }
                                }}
                              >
                                {userItem.full_name} ({userItem.role.toUpperCase()})
                                {isCurrentUser && ' ✓'}
                              </MenuItem>
                            );
                          })
                        ) : (
                          <MenuItem disabled>No eligible users available</MenuItem>
                        )}
                      </Select>
                    </FormControl>
                  </Grid>
                )}
                {!effectiveEditMode && formData?.assigned_to && (
                  <Grid item xs={12} sm={6}>
                    <Paper sx={{
                      p: 2,
                      backgroundColor: '#e3f2fd',
                      border: '1px solid #90caf9',
                      borderRadius: '8px',
                    }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Box sx={{
                          width: 12,
                          height: 12,
                          borderRadius: '50%',
                          backgroundColor: '#1976d2',
                        }} />
                        <Box>
                          <Typography variant="caption" sx={{ color: '#666' }}>Assigned to:</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: '#1565c0' }}>
                            {formData?.assigned_to_full_name}
                          </Typography>
                        </Box>
                      </Box>
                    </Paper>
                  </Grid>
                )}
                {!isEditMode && !formData?.assigned_to && (
                  <Grid item xs={12} sm={6}>
                    <Paper sx={{
                      p: 2,
                      backgroundColor: '#fafafa',
                      border: '1px solid #e0e0e0',
                      borderRadius: '8px',
                    }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Box sx={{
                          width: 12,
                          height: 12,
                          borderRadius: '50%',
                          backgroundColor: '#999',
                        }} />
                        <Box>
                          <Typography variant="caption" sx={{ color: '#666' }}>Status:</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: '#999' }}>
                            Unassigned
                          </Typography>
                        </Box>
                      </Box>
                    </Paper>
                  </Grid>
                )}
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Description"
                    name="description"
                    multiline
                    rows={3}
                    value={formData.description}
                    onChange={handleChange}
                    disabled={!effectiveEditMode}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Approved Routes"
                    name="approved_routes"
                    multiline
                    rows={3}
                    value={formData.approved_routes}
                    onChange={handleChange}
                    helperText="Comma separated routes"
                    disabled={!effectiveEditMode}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Restrictions"
                    name="restrictions"
                    multiline
                    rows={3}
                    value={formData.restrictions}
                    onChange={handleChange}
                    disabled={!effectiveEditMode}
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
                    onChange={handleChange}
                    disabled={!effectiveEditMode}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </TabPanel>

        {/* Tab 5: Documents */}
        <TabPanel value={tabValue} index={4}>
          {formData.id && (
            <Box>
              {(isEditMode || isDuplicateMode) && (
                <Grid item xs={12}>
                  <Paper sx={{
                    p: 2,
                    backgroundColor: '#f0f7ff',
                    textAlign: 'center',
                    border: '2px dashed #1976d2',
                    borderRadius: '12px',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      backgroundColor: '#e3f2fd',
                      borderColor: '#1565c0',
                    }
                  }}>
                    <input
                      type="file"
                      multiple
                      onChange={handleFileUpload}
                      disabled={uploading}
                      style={{ display: 'none' }}
                      id="file-upload"
                    />
                    <label htmlFor="file-upload" style={{ cursor: 'pointer', width: '100%', display: 'block' }}>
                      <Button
                        variant="outlined"
                        component="span"
                        startIcon={uploading ? <CircularProgress size={20} /> : <UploadIcon />}
                        disabled={uploading}
                        sx={{ textTransform: 'none' }}
                      >
                        {uploading ? 'Uploading...' : 'Click to Upload Documents'}
                      </Button>
                    </label>
                    {uploading && (
                      <Box sx={{ mt: 2 }}>
                        <LinearProgress variant="determinate" value={uploadProgress} />
                        <Typography variant="caption" sx={{ mt: 1 }}>{uploadProgress}%</Typography>
                      </Box>
                    )}
                  </Paper>
                </Grid>
              )}

              {documents.length > 0 && (
                <Grid item xs={12}>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                    📸 Uploaded Documents ({documents.length})
                  </Typography>

                  {/* Separate images and other files */}
                  {documents.some(doc => doc.file_extension && ['jpg', 'jpeg', 'png', 'gif'].includes(doc.file_extension.toLowerCase())) && (
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold', color: '#1976d2' }}>
                        Image Gallery
                      </Typography>
                      <Grid container spacing={1.5}>
                        {documents
                          .filter(doc => doc.file_extension && ['jpg', 'jpeg', 'png', 'gif'].includes(doc.file_extension.toLowerCase()))
                          .map((doc) => (
                            <Grid item xs={6} sm={4} md={3} key={doc.id} sx={{ display: 'flex', justifyContent: 'center' }}>
                              <Paper
                                sx={{
                                  position: 'relative',
                                  width: '180px',
                                  height: '180px',
                                  overflow: 'hidden',
                                  cursor: 'pointer',
                                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                  '&:hover': {
                                    boxShadow: '0 8px 20px rgba(0,0,0,0.2)',
                                    transform: 'translateY(-4px)',
                                  },
                                  borderRadius: '8px',
                                  backgroundColor: '#f5f5f5',
                                  border: '1px solid #e0e0e0',
                                }}
                                onClick={() => {
                                  setSelectedDocument(doc);
                                  setDocumentViewerOpen(true);
                                }}
                              >
                                <img
                                  src={getMediaUrl(doc.file)}
                                  alt={doc.filename}
                                  style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover',
                                    backgroundColor: '#f5f5f5',
                                    display: failedImages.has(doc.id) ? 'none' : 'block',
                                  }}
                                  onError={(e) => {
                                    console.error('Failed to load image:', getMediaUrl(doc.file));
                                    setFailedImages(prev => new Set([...prev, doc.id]));
                                    e.target.style.display = 'none';
                                  }}
                                />
                                {/* Empty state when image not found */}
                                {failedImages.has(doc.id) && (
                                  <Box
                                    sx={{
                                      position: 'absolute',
                                      top: 0,
                                      left: 0,
                                      width: '100%',
                                      height: '100%',
                                      backgroundColor: '#f5f5f5',
                                      display: 'flex',
                                      flexDirection: 'column',
                                      justifyContent: 'center',
                                      alignItems: 'center',
                                      padding: 1,
                                      textAlign: 'center',
                                      border: '2px dashed #ddd',
                                    }}
                                  >
                                    <DocumentIcon sx={{ fontSize: 56, color: '#999', mb: 1, opacity: 0.7 }} />
                                    <Typography variant="caption" sx={{ color: '#666', fontSize: '12px', fontWeight: 600 }}>
                                      Not Found
                                    </Typography>
                                    <Typography variant="caption" sx={{ color: '#999', fontSize: '9px', mt: 0.5, maxWidth: '85%', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                      {doc.filename.substring(0, 12)}...
                                    </Typography>
                                  </Box>
                                )}
                                {/* Overlay */}
                                <Box
                                  sx={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    width: '100%',
                                    height: '100%',
                                    backgroundColor: 'rgba(0,0,0,0)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'space-between',
                                    padding: 1,
                                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                    '&:hover': {
                                      backgroundColor: 'rgba(0,0,0,0.5)',
                                    },
                                  }}
                                >
                                  {/* Top badges */}
                                  <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
                                    <Chip
                                      size="small"
                                      label={doc.file_extension}
                                      color="primary"
                                      variant="outlined"
                                      sx={{ backgroundColor: 'rgba(255,255,255,0.9)' }}
                                    />
                                    {doc.is_verified && (
                                      <Chip
                                        size="small"
                                        icon={<VerifiedIcon />}
                                        label="Verified"
                                        color="success"
                                        sx={{ backgroundColor: 'rgba(255,255,255,0.9)' }}
                                      />
                                    )}
                                  </Box>

                                  {/* Bottom actions */}
                                  <Box
                                    sx={{
                                      display: 'flex',
                                      gap: 0.5,
                                      justifyContent: 'space-between',
                                      opacity: 0,
                                      transition: 'opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                      '&:hover': {
                                        opacity: 1,
                                      },
                                    }}
                                  >
                                    <Tooltip title={doc.filename}>
                                      <Typography
                                        variant="caption"
                                        sx={{
                                          color: 'white',
                                          backgroundColor: 'rgba(0,0,0,0.6)',
                                          padding: '4px 8px',
                                          borderRadius: '4px',
                                          flex: 1,
                                          overflow: 'hidden',
                                          textOverflow: 'ellipsis',
                                          whiteSpace: 'nowrap',
                                        }}
                                      >
                                        {doc.filename.substring(0, 8)}...
                                      </Typography>
                                    </Tooltip>
                                    <Tooltip title="Download">
                                      <IconButton
                                        size="small"
                                        href={doc.file}
                                        download
                                        sx={{
                                          backgroundColor: 'rgba(255,255,255,0.2)',
                                          color: 'white',
                                          '&:hover': {
                                            backgroundColor: 'rgba(255,255,255,0.4)',
                                          },
                                        }}
                                      >
                                        <DownloadIcon fontSize="small" />
                                      </IconButton>
                                    </Tooltip>
                                    {(isEditMode || isDuplicateMode) && (
                                      <Tooltip title="Delete">
                                        <IconButton
                                          size="small"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteDocument(doc.id);
                                          }}
                                          sx={{
                                            backgroundColor: 'rgba(255,0,0,0.3)',
                                            color: 'white',
                                            '&:hover': {
                                              backgroundColor: 'rgba(255,0,0,0.6)',
                                            },
                                          }}
                                        >
                                          <DeleteIcon fontSize="small" />
                                        </IconButton>
                                      </Tooltip>
                                    )}
                                  </Box>
                                </Box>
                              </Paper>
                            </Grid>
                          ))}
                      </Grid>
                    </Box>
                  )}

                  {/* Other files - list view */}
                  {documents.some(doc => !doc.file_extension || !['jpg', 'jpeg', 'png', 'gif'].includes(doc.file_extension.toLowerCase())) && (
                    <Box>
                      <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold', color: '#1976d2' }}>
                        Other Files
                      </Typography>
                      <List>
                        {documents
                          .filter(doc => !doc.file_extension || !['jpg', 'jpeg', 'png', 'gif'].includes(doc.file_extension.toLowerCase()))
                          .map((doc) => (
                            <Paper key={doc.id} sx={{ mb: 1, p: 1.5 }}>
                              <ListItem
                                secondaryAction={
                                  <Box sx={{ display: 'flex', gap: 1 }}>
                                    <Chip
                                      size="small"
                                      label={doc.file_extension}
                                      color="primary"
                                      variant="outlined"
                                    />
                                    {doc.is_verified && (
                                      <Chip
                                        size="small"
                                        icon={<VerifiedIcon />}
                                        label="Verified"
                                        color="success"
                                      />
                                    )}
                                    <Tooltip title="View Document">
                                      <IconButton
                                        edge="end"
                                        onClick={() => {
                                          setSelectedDocument(doc);
                                          setDocumentViewerOpen(true);
                                        }}
                                        size="small"
                                        color="primary"
                                      >
                                        <ViewIcon />
                                      </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Download">
                                      <IconButton
                                        edge="end"
                                        href={doc.file}
                                        download
                                        size="small"
                                        title="Download"
                                      >
                                        <DownloadIcon />
                                      </IconButton>
                                    </Tooltip>
                                    {(isEditMode || isDuplicateMode) && (
                                      <Tooltip title="Delete">
                                        <IconButton
                                          edge="end"
                                          onClick={() => handleDeleteDocument(doc.id)}
                                          size="small"
                                          title="Delete"
                                        >
                                          <DeleteIcon color="error" />
                                        </IconButton>
                                      </Tooltip>
                                    )}
                                  </Box>
                                }
                              >
                                <ListItemIcon>
                                  <DocumentIcon color="primary" />
                                </ListItemIcon>
                                <ListItemText
                                  primary={
                                    <Tooltip title={doc.filename}>
                                      <span>{doc.filename.substring(0, 5)}...</span>
                                    </Tooltip>
                                  }
                                  secondary={`${doc.document_type} • ${doc.file_size_display} • ${new Date(doc.uploaded_at).toLocaleDateString()}`}
                                />
                              </ListItem>
                            </Paper>
                          ))}
                      </List>
                    </Box>
                  )}
                </Grid>
              )}

              {documents.length === 0 && !uploading && (
                <Grid item xs={12}>
                  <Typography variant="body2" color="textSecondary" sx={{ textAlign: 'center', py: 3 }}>
                    No documents uploaded yet. Upload your first document above.
                  </Typography>
                </Grid>
              )}
            </Box>
          )}

          {!formData.id && (
            <Alert severity="info">
              Save the permit first before uploading documents.
            </Alert>
          )}
        </TabPanel>

        {/* Tab 6: History/Audit Trail */}
        <TabPanel value={tabValue} index={5}>
          {formData.history && Array.isArray(formData.history) && formData.history.length > 0 ? (
            <Box sx={{ px: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 2, color: '#666', fontWeight: 'bold' }}>
                Total Actions: {formData.history.length}
              </Typography>
              <Box sx={{ position: 'relative' }}>
                {/* Timeline line */}
                <Box sx={{
                  position: 'absolute',
                  left: 12,
                  top: 0,
                  bottom: 0,
                  width: '2px',
                  backgroundColor: '#e0e0e0',
                }} />

                {formData.history.map((record, index) => (
                  <Paper key={`history-${index}`} sx={{
                    mb: 2,
                    p: 2,
                    ml: 6,
                    borderLeft: '4px solid #1976d2',
                    backgroundColor: index === 0 ? '#f5f5f5' : '#ffffff',
                    position: 'relative',
                  }}>
                    {/* Timeline dot */}
                    <Box sx={{
                      position: 'absolute',
                      left: -18,
                      top: 12,
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      backgroundColor: index === 0 ? '#ff9800' : '#1976d2',
                      border: '3px solid white',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    }} />

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                      <Box>
                        <Chip
                          label={String(record.action || 'Unknown').toUpperCase()}
                          color={index === 0 ? 'warning' : 'primary'}
                          size="small"
                          variant="outlined"
                          sx={{ fontWeight: 'bold', mr: 1 }}
                        />
                        <Typography variant="body2" sx={{ display: 'inline', color: '#666' }}>
                          by <strong>{record.performed_by || 'System'}</strong>
                        </Typography>
                      </Box>
                      <Typography variant="caption" sx={{ color: '#999' }}>
                        {record.timestamp ? new Date(record.timestamp).toLocaleString() : 'Unknown date'}
                      </Typography>
                    </Box>

                    {/* Notes */}
                    {record.notes && (
                      <Typography variant="body2" sx={{ mb: 1.5, color: '#555' }}>
                        <strong>Notes:</strong> {record.notes}
                      </Typography>
                    )}

                    {/* Changes */}
                    {record.changes && typeof record.changes === 'object' && Object.keys(record.changes).length > 0 && (
                      <Box sx={{
                        backgroundColor: '#f9f9f9',
                        borderRadius: 1,
                        p: 1.5,
                        mt: 1.5,
                      }}>
                        <Typography variant="caption" sx={{ fontWeight: 'bold', color: '#666', display: 'block', mb: 1 }}>
                          📋 Field Changes:
                        </Typography>
                        {Object.entries(record.changes).map(([field, change]) => (
                          <Box key={field} sx={{
                            mb: 1,
                            pb: 1,
                            borderBottom: '1px solid #e0e0e0',
                            '&:last-child': { borderBottom: 'none', mb: 0, pb: 0 },
                          }}>
                            <Typography variant="caption" sx={{ color: '#999' }}>
                              <strong>{field.replace(/_/g, ' ').toUpperCase()}:</strong>
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 1, mt: 0.5, flexWrap: 'wrap' }}>
                              <Chip
                                label={`Old: ${change?.old !== undefined ? change.old : '(empty)'}`}
                                size="small"
                                variant="outlined"
                                sx={{ backgroundColor: '#ffebee', color: '#c62828' }}
                              />
                              <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center' }}>→</Typography>
                              <Chip
                                label={`New: ${change?.new !== undefined ? change.new : '(empty)'}`}
                                size="small"
                                variant="outlined"
                                sx={{ backgroundColor: '#e8f5e9', color: '#2e7d32' }}
                              />
                            </Box>
                          </Box>
                        ))}
                      </Box>
                    )}
                  </Paper>
                ))}
              </Box>
            </Box>
          ) : (
            <Alert severity="info" sx={{ mt: 2 }}>
              No history records available for this permit.
            </Alert>
          )}
        </TabPanel>
      </DialogContent>

      <DialogActions sx={{
        p: 2,
        bgcolor: '#fafafa',
        borderTop: '1px solid #e0e0e0',
        display: 'flex',
        gap: 1,
        justifyContent: 'flex-end',
      }}>
        <Button
          onClick={onClose}
          disabled={loading}
          sx={{
            textTransform: 'none',
            fontSize: '14px',
            fontWeight: 500,
            px: 3,
            py: 1.2,
            borderRadius: '8px',
          }}
        >
          Cancel
        </Button>
        {/* Print Certificate Button - Only for Active Permits in View (not edit/duplicate) Mode */}
        {permit && !isDuplicateMode && !isEditMode && formData?.status === 'active' && (
          <Button
            onClick={() => setPrintCertificateOpen(true)}
            variant="outlined"
            color="info"
            disabled={loading}
            startIcon={<PrintIcon />}
            sx={{
              textTransform: 'none',
              fontSize: '14px',
              fontWeight: 500,
              px: 3,
              py: 1.2,
              borderRadius: '8px',
            }}
          >
            Print Certificate
          </Button>
        )}
        {isEditMode && !isDuplicateMode && (
          <Button
            onClick={() => setIsDuplicateMode(true)}
            variant="outlined"
            color="success"
            disabled={loading}
            startIcon={<DuplicateIcon />}
            sx={{
              textTransform: 'none',
              fontSize: '14px',
              fontWeight: 500,
              px: 3,
              py: 1.2,
              borderRadius: '8px',
            }}
          >
            Duplicate
          </Button>
        )}
        {isEditMode && isDuplicateMode && (
          <Button
            onClick={() => setIsDuplicateMode(false)}
            variant="outlined"
            disabled={loading}
            sx={{
              textTransform: 'none',
              fontSize: '14px',
              fontWeight: 500,
              px: 3,
              py: 1.2,
              borderRadius: '8px',
            }}
          >
            Cancel Duplicate
          </Button>
        )}
        {(isEditMode || isDuplicateMode) && (
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={loading || ((!isEditMode || isDuplicateMode) && formData.vehicle_number && (vehicleValidation.isChecking || vehicleValidation.available === false))}
            startIcon={loading ? <CircularProgress size={20} /> : null}
            sx={{
              textTransform: 'none',
              fontSize: '14px',
              fontWeight: 600,
              px: 4,
              py: 1.2,
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
              color: 'white',
              boxShadow: '0 4px 12px rgba(25, 118, 210, 0.3)',
              '&:hover': {
                boxShadow: '0 6px 16px rgba(25, 118, 210, 0.4)',
                transform: 'translateY(-2px)',
              },
              transition: 'all 0.3s ease',
              '&:disabled': {
                opacity: 0.6,
              },
            }}
            title={(!isEditMode || isDuplicateMode) && formData.vehicle_number && vehicleValidation.available === false ? 'Vehicle number is not available' : (vehicleValidation.isChecking ? 'Checking vehicle availability...' : '')}
          >
            {loading ? 'Saving...' : isEditMode ? 'Update' : 'Create Duplicate'}
          </Button>
        )}
      </DialogActions>

      {/* Print Certificate Modal */}
      {printCertificateOpen && formData && (
        <Box>
          <PrintCertificate
            permit={formData}
            onClose={() => setPrintCertificateOpen(false)}
          />
        </Box>
      )}

      {/* Document Viewer Modal */}
      <Dialog
        open={documentViewerOpen}
        onClose={() => {
          setDocumentViewerOpen(false);
          setSelectedDocument(null);
        }}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '12px',
            boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
          }
        }}
      >
        <DialogTitle sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
          color: 'white',
          padding: '20px 24px',
          borderRadius: '12px 12px 0 0',
        }}>
          <Tooltip title={selectedDocument?.filename}>
            <Typography variant="h6" sx={{ fontWeight: 600, margin: 0 }}>
              📄 {selectedDocument?.filename?.substring(0, 20)}...
            </Typography>
          </Tooltip>
          <IconButton
            onClick={() => {
              setDocumentViewerOpen(false);
              setSelectedDocument(null);
            }}
            sx={{ color: 'white' }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{
          p: 0,
          bgcolor: '#fafafa',
          minHeight: '500px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          borderTop: '1px solid #e0e0e0',
        }}>
          {selectedDocument && (
            <Box sx={{ width: '100%', height: '600px', display: 'flex', flexDirection: 'column' }}>
              {selectedDocument.file_extension?.toLowerCase() === 'pdf' ? (
                <iframe
                  src={getMediaUrl(selectedDocument.file)}
                  style={{ width: '100%', height: '600px', border: 'none' }}
                  title="Document Viewer"
                />
              ) : selectedDocument.file_extension?.toLowerCase() === 'jpg' ||
                selectedDocument.file_extension?.toLowerCase() === 'jpeg' ||
                selectedDocument.file_extension?.toLowerCase() === 'png' ||
                selectedDocument.file_extension?.toLowerCase() === 'gif' ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 2 }}>
                  <img
                    src={getMediaUrl(selectedDocument.file)}
                    alt={selectedDocument.filename}
                    style={{ maxWidth: '100%', maxHeight: '600px', objectFit: 'contain' }}
                  />
                </Box>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', p: 3 }}>
                  <DocumentIcon sx={{ fontSize: '80px', color: '#ccc', mb: 2 }} />
                  <Typography variant="h6" color="textSecondary" sx={{ mb: 2 }}>
                    Document Preview Not Available
                  </Typography>
                  <Typography variant="body2" color="textSecondary" sx={{ mb: 3, textAlign: 'center' }}>
                    This file type ({selectedDocument.file_extension}) cannot be previewed in the browser.
                  </Typography>
                  <Button
                    variant="contained"
                    color="primary"
                    href={selectedDocument.file}
                    download
                    startIcon={<DownloadIcon />}
                  >
                    Download File
                  </Button>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, bgcolor: 'white', borderTop: '1px solid #e0e0e0' }}>
          <Box sx={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              {selectedDocument && (
                <Typography variant="caption" color="textSecondary">
                  {selectedDocument.file_size_display} • {new Date(selectedDocument.uploaded_at).toLocaleDateString()} • {selectedDocument.document_type}
                </Typography>
              )}
            </Box>
            <Box sx={{ display: 'flex', gap: 1.5 }}>
              <Button
                href={selectedDocument?.file}
                download
                variant="contained"
                startIcon={<DownloadIcon />}
                sx={{
                  textTransform: 'none',
                  fontSize: '14px',
                  fontWeight: 600,
                  px: 3,
                  py: 1.2,
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
                  color: 'white',
                  boxShadow: '0 4px 12px rgba(25, 118, 210, 0.3)',
                  '&:hover': {
                    boxShadow: '0 6px 16px rgba(25, 118, 210, 0.4)',
                    transform: 'translateY(-2px)',
                  },
                  transition: 'all 0.3s ease',
                }}
              >
                Download
              </Button>
              <Button
                onClick={() => {
                  setDocumentViewerOpen(false);
                  setSelectedDocument(null);
                }}
                variant="outlined"
                sx={{
                  textTransform: 'none',
                  fontSize: '14px',
                  fontWeight: 500,
                  px: 3,
                  py: 1.2,
                  borderRadius: '8px',
                }}
              >
                Close
              </Button>
            </Box>
          </Box>
        </DialogActions>
      </Dialog>
    </Dialog>
  );
};

export default PermitModal;
