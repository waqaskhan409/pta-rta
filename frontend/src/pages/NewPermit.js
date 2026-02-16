import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Stepper,
  Step,
  StepLabel,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Paper,
  Grid,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  NavigateBefore as BackIcon,
  NavigateNext as NextIcon,
  CheckCircle as SubmitIcon,
} from '@mui/icons-material';
import apiClient from '../services/apiClient';
import '../styles/page.css';

function NewPermit() {
  const steps = [
    'Permit Configuration',
    'Vehicle Details',
    'Owner Information',
    'Additional Info',
    'Documents Submission',
    'Review & Submit',
  ];

  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState({
    authority: 'RTA',
    permit_type_id: '',
    vehicle_number: '',
    vehicle_type_id: '',
    vehicle_make: '',
    vehicle_model: '',
    vehicle_year: new Date().getFullYear(),
    vehicle_capacity: '',
    owner_name: '',
    owner_cnic: '',
    owner_email: '',
    owner_phone: '',
    owner_address: '',
    description: '',
    remarks: '',
    restrictions: '',
    approved_routes: '',
    valid_from: new Date().toISOString().split('T')[0],
    valid_to: '',
  });
  const [permitTypes, setPermitTypes] = useState([]);
  const [vehicleTypes, setVehicleTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [pendingDocuments, setPendingDocuments] = useState([]);

  // Fetch permit types and vehicle types on component mount
  useEffect(() => {
    fetchPermitTypes();
    fetchVehicleTypes();
  }, []);

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

  // Validate current step
  const validateStep = (stepIndex) => {
    switch (stepIndex) {
      case 0: // Permit Configuration
        return formData.permit_type_id !== '';
      case 1: // Vehicle Details
        return (
          formData.vehicle_number !== '' &&
          formData.vehicle_type_id !== '' &&
          formData.vehicle_make !== '' &&
          formData.vehicle_model !== '' &&
          formData.vehicle_year !== '' &&
          formData.vehicle_capacity !== ''
        );
      case 2: // Owner Information
        return (
          formData.owner_name !== '' &&
          formData.owner_cnic !== '' &&
          formData.owner_phone !== '' &&
          formData.owner_address !== ''
        );
      case 3: // Additional Info
        return formData.description !== '';
      case 4: // Documents Submission (optional)
        return true;
      case 5: // Review & Submit
        return true;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep((prev) => prev + 1);
    } else {
      setMessage({
        type: 'error',
        text: 'Please fill in all required fields on this step.',
      });
    }
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    let processedValue = value;

    // Format CNIC: 12345-1234567-1
    if (name === 'owner_cnic') {
      const cleaned = value.replace(/\D/g, '');
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

    // Format Phone: numeric only
    if (name === 'owner_phone') {
      processedValue = value.replace(/\D/g, '');
    }

    const updatedData = {
      ...formData,
      [name]: processedValue,
    };

    // Auto-calculate valid_to when vehicle type changes
    if (name === 'vehicle_type_id' && value) {
      const selectedVehicle = vehicleTypes.find((v) => v.id === parseInt(value));
      if (selectedVehicle && formData.valid_from) {
        const durationDays = selectedVehicle.permit_duration_days || 365;
        const fromDate = new Date(formData.valid_from);
        const toDate = new Date(fromDate);
        toDate.setDate(toDate.getDate() + durationDays);
        updatedData.valid_to = toDate.toISOString().split('T')[0];
      }
    }

    setFormData(updatedData);
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);

      const vehicleTypeId = parseInt(formData.vehicle_type_id, 10);
      const permitTypeId = parseInt(formData.permit_type_id, 10);

      if (isNaN(vehicleTypeId) || isNaN(permitTypeId)) {
        setMessage({
          type: 'error',
          text: 'Invalid type selection. Please select again.',
        });
        setLoading(false);
        return;
      }

      const dataToSubmit = {
        vehicle_number: formData.vehicle_number,
        vehicle_type: vehicleTypeId,
        vehicle_make: formData.vehicle_make,
        vehicle_model: formData.vehicle_model,
        vehicle_year: formData.vehicle_year,
        vehicle_capacity: formData.vehicle_capacity,
        owner_name: formData.owner_name,
        owner_email: formData.owner_email,
        owner_cnic: formData.owner_cnic,
        owner_phone: formData.owner_phone,
        owner_address: formData.owner_address,
        authority: formData.authority,
        permit_type: permitTypeId,
        valid_from: formData.valid_from,
        valid_to: formData.valid_to,
        description: formData.description,
        remarks: formData.remarks,
        restrictions: formData.restrictions,
        approved_routes: formData.approved_routes,
      };

      const response = await apiClient.post('/permits/', dataToSubmit);
      const permitId = response.data.id;

      // Upload documents if any
      let uploadedDocCount = 0;
      let failedDocCount = 0;
      
      if (pendingDocuments.length > 0) {
        console.log(`Uploading ${pendingDocuments.length} documents for permit ${permitId}`);
        
        for (const doc of pendingDocuments) {
          const docFormData = new FormData();
          docFormData.append('file', doc.file);
          docFormData.append('permit', permitId);
          docFormData.append('document_type', 'other');
          docFormData.append('filename', doc.filename);

          try {
            console.log(`Uploading document: ${doc.filename}`);
            const docResponse = await apiClient.post('/permit-documents/', docFormData, {
              headers: { 'Content-Type': 'multipart/form-data' },
            });
            console.log(`Document uploaded successfully:`, docResponse.data);
            uploadedDocCount++;
          } catch (docErr) {
            console.error(`Error uploading document ${doc.filename}:`, docErr);
            console.error(`Response data:`, docErr.response?.data);
            failedDocCount++;
          }
        }
      }

      // Prepare success/warning message
      let resultMessage = 'Permit created successfully!';
      if (pendingDocuments.length > 0) {
        resultMessage = `Permit created with ${uploadedDocCount} document(s) uploaded`;
        if (failedDocCount > 0) {
          resultMessage += ` (${failedDocCount} document(s) failed to upload)`;
        }
      }
      
      setMessage({ type: failedDocCount > 0 ? 'warning' : 'success', text: resultMessage });
      setConfirmDialogOpen(false);

      // Reset form and documents
      setFormData({
        authority: 'RTA',
        permit_type_id: '',
        vehicle_number: '',
        vehicle_type_id: '',
        vehicle_make: '',
        vehicle_model: '',
        vehicle_year: new Date().getFullYear(),
        vehicle_capacity: '',
        owner_name: '',
        owner_cnic: '',
        owner_email: '',
        owner_phone: '',
        owner_address: '',
        description: '',
        remarks: '',
        restrictions: '',
        approved_routes: '',
        valid_from: new Date().toISOString().split('T')[0],
        valid_to: '',
      });
      setPendingDocuments([]);
      setActiveStep(0);
    } catch (err) {
      console.error('Error creating permit:', err);
      const errorMessage =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        (typeof err.response?.data === 'object' ? JSON.stringify(err.response.data) : err.message) ||
        'Failed to create permit. Please try again.';
      setMessage({ type: 'error', text: `Error: ${errorMessage}` });
    } finally {
      setLoading(false);
    }
  };

  // Render step components
  const renderStep = () => {
    switch (activeStep) {
      case 0:
        return renderPermitConfiguration();
      case 1:
        return renderVehicleDetails();
      case 2:
        return renderOwnerInformation();
      case 3:
        return renderAdditionalInfo();
      case 4:
        return renderDocuments();
      case 5:
        return renderReviewSubmit();
      default:
        return null;
    }
  };

  const renderPermitConfiguration = () => (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Typography variant="h6" sx={{ fontWeight: 600, color: '#1976d2', mb: 2 }}>
        📋 Permit Configuration
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth disabled>
            <InputLabel>Authority</InputLabel>
            <Select
              name="authority"
              value={formData.authority}
              onChange={handleChange}
              label="Authority"
              disabled
            >
              <MenuItem value="PTA">Provincial Transport Authority</MenuItem>
              <MenuItem value="RTA">Regional Transport Authority</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth required error={formData.permit_type_id === ''}>
            <InputLabel>Permit Type</InputLabel>
            <Select
              name="permit_type_id"
              value={formData.permit_type_id}
              onChange={handleChange}
              label="Permit Type"
            >
              <MenuItem value="">
                <em>-- Select Permit Type --</em>
              </MenuItem>
              {permitTypes.map((type) => (
                <MenuItem key={type.id} value={String(type.id)}>
                  {type.name} ({type.code})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
      </Grid>
      <Paper
        sx={{
          p: 2,
          background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)',
          borderLeft: '4px solid #1976d2',
        }}
      >
        <Typography variant="body2" sx={{ color: '#0d47a1' }}>
          <strong>ℹ️ Info:</strong> Select a permit type to get started. You'll configure vehicle and owner details in the next steps.
        </Typography>
      </Paper>
    </Box>
  );

  const renderVehicleDetails = () => (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Typography variant="h6" sx={{ fontWeight: 600, color: '#1976d2', mb: 2 }}>
        🚗 Vehicle Details
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Vehicle Number / Registration"
            name="vehicle_number"
            value={formData.vehicle_number}
            onChange={handleChange}
            placeholder="e.g., ABC-123"
            variant="outlined"
            inputProps={{ maxLength: 20 }}
            required
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth required error={formData.vehicle_type_id === ''}>
            <InputLabel>Vehicle Type</InputLabel>
            <Select
              name="vehicle_type_id"
              value={formData.vehicle_type_id}
              onChange={handleChange}
              label="Vehicle Type"
            >
              <MenuItem value="">-- Select Type --</MenuItem>
              {vehicleTypes.map((type) => (
                <MenuItem key={type.id} value={String(type.id)}>
                  {type.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Make / Manufacturer"
            name="vehicle_make"
            value={formData.vehicle_make}
            onChange={handleChange}
            placeholder="e.g., Honda, Toyota"
            variant="outlined"
            required
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Model / Variant"
            name="vehicle_model"
            value={formData.vehicle_model}
            onChange={handleChange}
            placeholder="e.g., CR-V, Camry"
            variant="outlined"
            required
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Manufacturing Year"
            name="vehicle_year"
            type="number"
            value={formData.vehicle_year}
            onChange={handleChange}
            inputProps={{ min: 1900, max: new Date().getFullYear() + 1 }}
            variant="outlined"
            required
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Seating Capacity"
            name="vehicle_capacity"
            type="number"
            value={formData.vehicle_capacity}
            onChange={handleChange}
            inputProps={{ min: 1, max: 300 }}
            variant="outlined"
            required
          />
        </Grid>
      </Grid>
      {formData.vehicle_type_id && formData.valid_from && (
        <Paper
          sx={{
            p: 2.5,
            background: 'linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%)',
            borderLeft: '4px solid #ff9800',
          }}
        >
          <Typography variant="caption" sx={{ color: '#e65100', display: 'block', fontWeight: 600, mb: 1 }}>
            📅 Permit Duration
          </Typography>
          <Typography variant="body2" sx={{ color: '#d84315' }}>
            <strong>
              {vehicleTypes.find((v) => v.id === parseInt(formData.vehicle_type_id))?.name}:
            </strong>{' '}
            {formData.valid_to &&
              `Valid until ${new Date(formData.valid_to).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}`}
          </Typography>
        </Paper>
      )}
    </Box>
  );

  const renderOwnerInformation = () => (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Typography variant="h6" sx={{ fontWeight: 600, color: '#1976d2', mb: 2 }}>
        👤 Owner Information
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Full Name"
            name="owner_name"
            value={formData.owner_name}
            onChange={handleChange}
            placeholder="Enter owner name"
            variant="outlined"
            inputProps={{ maxLength: 100 }}
            required
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="CNIC / National ID"
            name="owner_cnic"
            value={formData.owner_cnic}
            onChange={handleChange}
            placeholder="e.g., 12345-1234567-1"
            variant="outlined"
            inputProps={{ maxLength: 20 }}
            required
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Email Address"
            name="owner_email"
            type="email"
            value={formData.owner_email}
            onChange={handleChange}
            placeholder="owner@example.com"
            variant="outlined"
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Phone Number"
            name="owner_phone"
            value={formData.owner_phone}
            onChange={handleChange}
            placeholder="03xxxxxxxxx"
            variant="outlined"
            inputProps={{ maxLength: 20 }}
            required
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Complete Address"
            name="owner_address"
            multiline
            rows={3}
            value={formData.owner_address}
            onChange={handleChange}
            placeholder="Street address, City, Province"
            variant="outlined"
            required
          />
        </Grid>
      </Grid>
    </Box>
  );

  const renderAdditionalInfo = () => (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Typography variant="h6" sx={{ fontWeight: 600, color: '#1976d2', mb: 2 }}>
        📝 Additional Information
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Description"
            name="description"
            multiline
            rows={3}
            value={formData.description}
            onChange={handleChange}
            placeholder="Brief description of the permit purpose"
            variant="outlined"
            required
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Remarks"
            name="remarks"
            multiline
            rows={2}
            value={formData.remarks}
            onChange={handleChange}
            placeholder="Any additional notes or remarks"
            variant="outlined"
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Approved Routes"
            name="approved_routes"
            multiline
            rows={2}
            value={formData.approved_routes}
            onChange={handleChange}
            placeholder="e.g., Route 1: City A to City B"
            variant="outlined"
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Restrictions & Conditions"
            name="restrictions"
            multiline
            rows={2}
            value={formData.restrictions}
            onChange={handleChange}
            placeholder="e.g., Only weekdays, Not during peak hours"
            variant="outlined"
          />
        </Grid>
      </Grid>
    </Box>
  );

  const handleFileUpload = (e) => {
    const files = e.target.files;
    if (!files) return;

    const newDocs = Array.from(files).map((file) => ({
      id: Date.now() + Math.random(),
      file: file,
      filename: file.name,
      size: file.size,
    }));

    setPendingDocuments([...pendingDocuments, ...newDocs]);
    e.target.value = ''; // Reset file input
  };

  const handleRemoveDocument = (docId) => {
    setPendingDocuments(pendingDocuments.filter((doc) => doc.id !== docId));
  };

  const renderDocuments = () => (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Typography variant="h6" sx={{ fontWeight: 600, color: '#1976d2', mb: 2 }}>
        📎 Documents Submission
      </Typography>

      {/* Upload Section */}
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
        />
        <label htmlFor="document-upload" style={{ cursor: 'pointer', display: 'block' }}>
          <Typography variant="h6" sx={{ fontWeight: 600, color: '#1976d2', mb: 1 }}>
            📤 Upload Documents
          </Typography>
          <Typography variant="body2" sx={{ color: '#666', mb: 1 }}>
            Click to select or drag & drop files here
          </Typography>
          <Typography variant="caption" sx={{ color: '#999' }}>
            Supported formats: PDF, JPG, PNG, DOC, DOCX (Max 10MB each)
          </Typography>
        </label>
      </Paper>

      {/* Pending Documents List */}
      {pendingDocuments.length > 0 && (
        <Paper sx={{ p: 2.5, background: 'linear-gradient(135deg, #fff9c4 0%, #fff59d 100%)', borderLeft: '4px solid #fbc02d' }}>
          <Typography variant="h6" sx={{ fontWeight: 600, color: '#f57f17', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            ⏳ Pending Upload ({pendingDocuments.length})
          </Typography>
          <Typography variant="caption" sx={{ color: '#666', mb: 2, display: 'block' }}>
            These files will be uploaded when you submit the permit
          </Typography>
          <Grid container spacing={2}>
            {pendingDocuments.map((doc) => (
              <Grid item xs={12} sm={6} md={4} key={doc.id}>
                <Paper
                  sx={{
                    p: 2,
                    background: 'linear-gradient(135deg, #fffde7 0%, #fffce4 100%)',
                    border: '1px solid #fbc02d',
                    borderRadius: '8px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 1.5,
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#333', wordBreak: 'break-word', flex: 1 }}>
                      📄 {doc.filename}
                    </Typography>
                  </Box>
                  <Typography variant="caption" sx={{ color: '#999' }}>
                    {(doc.size / 1024).toFixed(2)} KB
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#fbc02d', fontWeight: 600 }}>
                    Pending Upload
                  </Typography>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => handleRemoveDocument(doc.id)}
                    sx={{
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
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Paper>
      )}

      {/* Info Box */}
      <Paper
        sx={{
          p: 2,
          background: 'linear-gradient(135deg, #f3e5f5 0%, #ede7f6 100%)',
          borderLeft: '4px solid #9c27b0',
        }}
      >
        <Typography variant="body2" sx={{ color: '#6a1b9a' }}>
          <strong>ℹ️ Optional:</strong> Documents are optional. You can upload them now or add them later in the permit details page.
        </Typography>
      </Paper>
    </Box>
  );

  const renderReviewSubmit = () => (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Typography variant="h6" sx={{ fontWeight: 600, color: '#1976d2', mb: 2 }}>
        ✓ Review & Submit
      </Typography>
      <Paper sx={{ p: 3, background: 'linear-gradient(135deg, #f5f5f5 0%, #eeeeee 100%)' }}>
        <Grid container spacing={3}>
          {/* Permit Configuration */}
          <Grid item xs={12}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#1976d2', mb: 1.5 }}>
              📋 Permit Configuration
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" sx={{ color: '#666' }}>
                  Authority
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {formData.authority === 'PTA' ? 'Provincial Transport Authority' : 'Regional Transport Authority'}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" sx={{ color: '#666' }}>
                  Permit Type
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {permitTypes.find((t) => t.id === parseInt(formData.permit_type_id))?.name}
                </Typography>
              </Grid>
            </Grid>
          </Grid>

          {/* Vehicle Details */}
          <Grid item xs={12}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#1976d2', mb: 1.5 }}>
              🚗 Vehicle Details
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" sx={{ color: '#666' }}>
                  Vehicle
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {formData.vehicle_make} {formData.vehicle_model} ({formData.vehicle_year})
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" sx={{ color: '#666' }}>
                  Registration
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {formData.vehicle_number}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" sx={{ color: '#666' }}>
                  Vehicle Type
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {vehicleTypes.find((v) => v.id === parseInt(formData.vehicle_type_id))?.name}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" sx={{ color: '#666' }}>
                  Capacity
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {formData.vehicle_capacity} seats
                </Typography>
              </Grid>
            </Grid>
          </Grid>

          {/* Owner Information */}
          <Grid item xs={12}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#1976d2', mb: 1.5 }}>
              👤 Owner Information
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" sx={{ color: '#666' }}>
                  Name
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {formData.owner_name}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" sx={{ color: '#666' }}>
                  CNIC
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {formData.owner_cnic}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" sx={{ color: '#666' }}>
                  Email
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {formData.owner_email || 'N/A'}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" sx={{ color: '#666' }}>
                  Phone
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {formData.owner_phone}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="caption" sx={{ color: '#666' }}>
                  Address
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {formData.owner_address}
                </Typography>
              </Grid>
            </Grid>
          </Grid>

          {/* Validity Period */}
          <Grid item xs={12}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#1976d2', mb: 1.5 }}>
              📅 Validity Period
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" sx={{ color: '#666' }}>
                  Valid From
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {new Date(formData.valid_from).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" sx={{ color: '#666' }}>
                  Valid To
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {new Date(formData.valid_to).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </Typography>
              </Grid>
            </Grid>
          </Grid>

          {/* Documents */}
          {pendingDocuments.length > 0 && (
            <Grid item xs={12}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#1976d2', mb: 1.5 }}>
                📎 Documents to Upload
              </Typography>
              <Grid container spacing={2}>
                {pendingDocuments.map((doc) => (
                  <Grid item xs={12} sm={6} key={doc.id}>
                    <Paper
                      sx={{
                        p: 2,
                        background: 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)',
                        borderLeft: '4px solid #4caf50',
                      }}
                    >
                      <Typography variant="caption" sx={{ color: '#1b5e20', display: 'block' }}>
                        📄 File
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500, color: '#2e7d32', wordBreak: 'break-word' }}>
                        {doc.filename}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#558b2f', display: 'block', mt: 0.5 }}>
                        {(doc.size / 1024).toFixed(2)} KB
                      </Typography>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </Grid>
          )}
        </Grid>

        <Box sx={{ mt: 3, p: 2, background: 'linear-gradient(135deg, #c8e6c9 0%, #a5d6a7 100%)', borderRadius: '8px' }}>
          <Typography variant="body2" sx={{ color: '#1b5e20', fontWeight: 600 }}>
            ✓ All information looks correct. Click Submit to create the permit{pendingDocuments.length > 0 ? ` and upload ${pendingDocuments.length} document(s)` : ''}.
          </Typography>
        </Box>
      </Paper>
    </Box>
  );

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
          Create New Permit
        </Typography>
        <Typography variant="body2" color="textSecondary" sx={{ fontSize: '1rem' }}>
          Follow the steps below to create a new permit
        </Typography>
      </Box>

      {message && (
        <Alert
          severity={message.type}
          sx={{ mb: 3, borderRadius: '8px' }}
          onClose={() => setMessage(null)}
        >
          {message.text}
        </Alert>
      )}

      {/* Stepper */}
      <Card sx={{ mb: 3, borderRadius: '12px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)', overflow: 'hidden' }}>
        <Box sx={{ background: 'linear-gradient(135deg, #f5f7fa 0%, #e3f2fd 100%)', borderBottom: '1px solid #e0e0e0' }}>
          <Stepper activeStep={activeStep} sx={{ p: 3 }}>
            {steps.map((label, index) => (
              <Step key={label}>
                <StepLabel
                  sx={{
                    '& .MuiStepLabel-label': {
                      fontSize: '14px',
                      fontWeight: 500,
                    },
                    '& .MuiStepLabel-label.Mui-active': {
                      fontWeight: 600,
                      color: '#1976d2',
                    },
                  }}
                >
                  {label}
                </StepLabel>
              </Step>
            ))}
          </Stepper>
        </Box>

        {/* Content */}
        <CardContent sx={{ p: 4, minHeight: '400px' }}>
          {renderStep()}
        </CardContent>

        {/* Navigation Buttons */}
        <Box
          sx={{
            display: 'flex',
            gap: 2,
            justifyContent: 'space-between',
            p: 3,
            backgroundColor: '#f5f7fa',
            borderTop: '1px solid #e0e0e0',
          }}
        >
          <Button
            variant="outlined"
            startIcon={<BackIcon />}
            onClick={handleBack}
            disabled={activeStep === 0 || loading}
            sx={{
              borderColor: '#ccc',
              color: '#666',
              '&:hover': {
                borderColor: '#999',
                backgroundColor: '#f9f9f9',
              },
            }}
          >
            Back
          </Button>

          {activeStep < steps.length - 1 ? (
            <Button
              variant="contained"
              color="primary"
              endIcon={<NextIcon />}
              onClick={handleNext}
              disabled={!validateStep(activeStep) || loading}
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
              Next
            </Button>
          ) : (
            <Button
              variant="contained"
              color="success"
              startIcon={<SubmitIcon />}
              onClick={() => setConfirmDialogOpen(true)}
              disabled={!validateStep(activeStep) || loading}
              sx={{
                background: 'linear-gradient(135deg, #4caf50 0%, #45a049 100%)',
                boxShadow: '0 4px 12px rgba(76, 175, 80, 0.4)',
                paddingX: 4,
                '&:hover': {
                  boxShadow: '0 6px 16px rgba(76, 175, 80, 0.6)',
                },
                '&:disabled': {
                  boxShadow: 'none',
                },
              }}
            >
              {loading ? 'Submitting...' : 'Submit'}
            </Button>
          )}
        </Box>
      </Card>

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialogOpen} onClose={() => setConfirmDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            background: 'linear-gradient(135deg, #4caf50 0%, #45a049 100%)',
            color: 'white',
            padding: '20px 24px',
          }}
        >
          <SubmitIcon sx={{ fontSize: 28 }} />
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Confirm Permit Creation
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.9 }}>
              Please review the information before submitting
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 3, mt: 2 }}>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Are you sure you want to create this permit with the information provided?
          </Typography>
          <Alert severity="info">All changes will be saved and cannot be immediately undone.</Alert>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button onClick={() => setConfirmDialogOpen(false)} variant="outlined">
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            color="success"
            disabled={loading}
          >
            {loading ? 'Creating...' : 'Create Permit'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default NewPermit;
