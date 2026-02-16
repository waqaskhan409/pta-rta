import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Grid,
  Tabs,
  Tab,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
  Chip,
} from '@mui/material';
import {
  Download as DownloadIcon,
  History as HistoryIcon,
  Assignment as AssignmentIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import apiClient from '../services/apiClient';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const PermitDetails = () => {
  const { permitId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [permit, setPermit] = useState(null);
  const [history, setHistory] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [detailedChangesDialog, setDetailedChangesDialog] = useState(false);
  const [selectedChange, setSelectedChange] = useState(null);
  const [reapplyDialogOpen, setReapplyDialogOpen] = useState(false);
  const [reapplyLoading, setReapplyLoading] = useState(false);
  const [newValidFrom, setNewValidFrom] = useState('');
  const [newValidTo, setNewValidTo] = useState('');
  const [reapplyError, setReapplyError] = useState('');

  useEffect(() => {
    fetchPermitDetails();
    fetchPermitHistory();
    fetchPermitDocuments();
  }, [permitId]);

  const fetchPermitDetails = async () => {
    try {
      const response = await apiClient.get(`/permits/${permitId}/`);
      setPermit(response.data);
      setError('');
    } catch (err) {
      setError('Failed to load permit details');
      console.error(err);
    }
  };

  const fetchPermitHistory = async () => {
    try {
      const response = await apiClient.get(`/permits/${permitId}/history/`);
      setHistory(response.data.history);
    } catch (err) {
      console.error('Failed to load permit history', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPermitDocuments = async () => {
    try {
      const response = await apiClient.get(`/permit-documents/?permit_id=${permitId}`);
      setDocuments(response.data.results || response.data || []);
    } catch (err) {
      console.error('Failed to load documents', err);
    }
  };

  const handleReapplyClick = () => {
    // Set default dates
    const today = new Date().toISOString().split('T')[0];
    setNewValidFrom(today);
    // Default to 1 year from today
    const nextYear = new Date();
    nextYear.setFullYear(nextYear.getFullYear() + 1);
    setNewValidTo(nextYear.toISOString().split('T')[0]);
    setReapplyError('');
    setReapplyDialogOpen(true);
  };

  const handleReapplySubmit = async () => {
    if (!newValidTo) {
      setReapplyError('Valid To date is required');
      return;
    }

    if (new Date(newValidFrom) >= new Date(newValidTo)) {
      setReapplyError('Valid To date must be after Valid From date');
      return;
    }

    setReapplyLoading(true);
    try {
      const response = await apiClient.post(`/permits/${permitId}/reapply_for_expired/`, {
        valid_from: newValidFrom,
        valid_to: newValidTo,
      });

      // Show success and navigate to the new permit
      setReapplyDialogOpen(false);
      alert(`New permit created successfully: ${response.data.permit_number}`);
      navigate(`/permit-details/${response.data.id}`);
    } catch (err) {
      console.error('Failed to reapply for permit:', err);
      setReapplyError(err.response?.data?.error || 'Failed to create renewal permit. Please try again.');
    } finally {
      setReapplyLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const canEditPermit = () => {
    if (!user || !permit) return false;

    // Admins can always edit
    if (user.is_staff) return true;

    // Check if user has permit_edit feature
    const hasFeature = user.features && Array.isArray(user.features) &&
      user.features.some(feature => feature.name === 'permit_edit');
    if (!hasFeature) return false;

    // Check if permit is assigned
    if (!permit.assigned_to) {
      console.log('[PermitDetails] Permit is unassigned, only admins can edit');
      return false;
    }

    // Check if user's role matches the assigned role
    // user.role can be an object {id, name, ...} or a string, handle both
    let userRole = (user.role?.name || user.role || '').toLowerCase().trim();
    let assignedRole = (permit.assigned_to_role || '').toLowerCase().trim();

    console.log('[PermitDetails] ====== ROLE MATCHING DEBUG ======');
    console.log('[PermitDetails] User Info:', {
      username: user?.username,
      is_staff: user?.is_staff,
      rawRole: user?.role,
      roleType: typeof user?.role,
      roleName: user?.role?.name,
      roleString: typeof user?.role === 'string' ? user?.role : 'not_a_string',
      finalUserRole: userRole
    });
    console.log('[PermitDetails] Permit Info:', {
      permitNumber: permit?.permit_number,
      assigned_to_name: permit?.assigned_to_full_name,
      assigned_to_role_raw: permit?.assigned_to_role,
      assigned_to_role_type: typeof permit?.assigned_to_role,
      finalAssignedRole: assignedRole
    });
    console.log('[PermitDetails] Comparison:', {
      userRole,
      assignedRole,
      matches: userRole === assignedRole,
      bothExist: !!userRole && !!assignedRole
    });
    console.log('[PermitDetails] ====== END DEBUG ======');

    // If both roles exist and match (case-insensitive), allow edit
    if (userRole && assignedRole && userRole === assignedRole) {
      console.log('[PermitDetails] ✅ ROLES MATCH - Allowing edit');
      return true;
    } else if (userRole && assignedRole) {
      console.log(`[PermitDetails] ❌ ROLES DO NOT MATCH - "${userRole}" !== "${assignedRole}"`);
    }

    // If we can't determine roles, allow edit if they have the feature (fallback)
    if (!userRole || !assignedRole) {
      console.log('[PermitDetails] Missing role data, allowing edit with feature check');
      return true;
    }

    return false;
  };

  const downloadPDF = () => {
    // This would require a backend endpoint to generate PDF
    alert('PDF download feature coming soon');
  };

  const downloadReportCSV = () => {
    if (!permit) return;

    const data = [
      ['Permit Details Report'],
      ['Generated', new Date().toLocaleString()],
      [],
      ['BASIC INFORMATION'],
      ['Permit Number', permit.permit_number],
      ['Authority', permit.authority],
      ['Permit Type', permit.permit_type && typeof permit.permit_type === 'object' ? permit.permit_type.name : permit.permit_type],
      ['Status', permit.status],
      [],
      ['VEHICLE INFORMATION'],
      ['Vehicle Number', permit.vehicle_number],
      ['Vehicle Type', permit.vehicle_type && typeof permit.vehicle_type === 'object' ? permit.vehicle_type.name : permit.vehicle_type],
      ['Make', permit.vehicle_make],
      ['Model', permit.vehicle_model],
      ['Year', permit.vehicle_year],
      ['Capacity', permit.vehicle_capacity],
      [],
      ['OWNER INFORMATION'],
      ['Name', permit.owner_name],
      ['Email', permit.owner_email],
      ['Phone', permit.owner_phone],
      ['CNIC', permit.owner_cnic],
      ['Address', permit.owner_address],
      [],
      ['PERMIT VALIDITY'],
      ['Issued Date', new Date(permit.issued_date).toLocaleDateString()],
      ['Valid From', permit.valid_from],
      ['Valid To', permit.valid_to],
      ['Last Modified', new Date(permit.last_modified).toLocaleDateString()],
      [],
      ['RESTRICTIONS'],
      ['Routes', permit.approved_routes],
      ['Restrictions', permit.restrictions],
    ];

    const csv = data.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv));
    element.setAttribute('download', `permit_${permit.permit_number}.csv`);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !permit) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error || 'Permit not found'}</Alert>
        <Button onClick={() => navigate('/permits')} sx={{ mt: 2 }}>
          Back to Permits
        </Button>
      </Box>
    );
  }

  const isValid = permit.status === 'active';
  const daysUntilExpiry = permit.valid_to ? Math.ceil((new Date(permit.valid_to) - new Date()) / (1000 * 60 * 60 * 24)) : null;

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
          Permit Details: {permit.permit_number}
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<DownloadIcon />}
            onClick={downloadReportCSV}
          >
            Export
          </Button>
          {permit.status === 'expired' && (
            <Button
              variant="contained"
              size="small"
              sx={{ bgcolor: '#ff9800', '&:hover': { bgcolor: '#f57c00' } }}
              onClick={handleReapplyClick}
            >
              Reapply for Expired
            </Button>
          )}
          <Button
            variant="contained"
            size="small"
            startIcon={<EditIcon />}
            onClick={() => navigate(`/permit-edit/${permitId}`)}
            disabled={!canEditPermit()}
            title={!canEditPermit() ? `Only users with ${permit?.assigned_to_role || 'the assigned'} role can edit this permit. Your role: ${user?.role?.name || user?.role || 'unknown'}` : ''}
            sx={{
              bgcolor: '#1976d2',
              '&:disabled': {
                bgcolor: '#ccc',
                color: '#999',
              }
            }}
          >
            Edit
          </Button>
          <Button variant="outlined" onClick={() => navigate('/permits')}>
            Back
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Status Bar */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <Chip
          label={permit.status.toUpperCase()}
          color={permit.status === 'active' ? 'success' : 'default'}
          variant="filled"
        />
        <Chip
          label={`${permit.authority} Authority`}
          variant="outlined"
        />
        {daysUntilExpiry && (
          <Chip
            label={`Expires in ${daysUntilExpiry} days`}
            color={daysUntilExpiry <= 7 ? 'error' : daysUntilExpiry <= 30 ? 'warning' : 'default'}
            variant="outlined"
          />
        )}
      </Box>

      {/* Tabs */}
      <Paper>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          sx={{
            borderBottom: '1px solid #ddd',
            '& .MuiTab-root': {
              textTransform: 'none',
              fontSize: '0.95rem',
            },
          }}
        >
          <Tab label="Basic Information" />
          <Tab label="Vehicle Details" />
          <Tab label="Owner Information" />
          <Tab label="Additional Details" />
          <Tab label="History" icon={<HistoryIcon />} />
          <Tab label="Documents" icon={<AssignmentIcon />} />
        </Tabs>

        <Box sx={{ p: 3 }}>
          {/* Basic Information Tab */}
          {tabValue === 0 && (
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                  Permit Number
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {permit.permit_number}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                  Authority
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {permit.authority} - Provincial Transport Authority
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                  Permit Type
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {permit.permit_type && typeof permit.permit_type === 'object'
                    ? permit.permit_type.name
                    : permit.permit_type}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                  Status
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 500, textTransform: 'capitalize' }}>
                  {permit.status}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                  Issued Date
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {new Date(permit.issued_date).toLocaleDateString()}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                  Last Modified
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {new Date(permit.last_modified).toLocaleDateString()}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                  Valid From
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {permit.valid_from}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                  Valid To
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {permit.valid_to}
                </Typography>
              </Grid>

              {/* Permit Renewal Status and Chain */}
              {permit.has_previous_permits && (
                <>
                  <Grid item xs={12}>
                    <Card sx={{ backgroundColor: '#fff3cd', borderLeft: '4px solid #ff9800' }}>
                      <CardContent>
                        <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, color: '#ff6f00' }}>
                          ⚠️ This is a Renewal Permit
                        </Typography>
                        <Typography variant="body2">
                          This permit is a renewal from an expired permit. Below is the chain of previous permits:
                        </Typography>
                        <Box sx={{ mt: 2 }}>
                          {permit.permit_chain && permit.permit_chain.length > 0 ? (
                            <Box>
                              {permit.permit_chain.map((previousPermit, index) => (
                                <Box key={index} sx={{ mb: 1, p: 1, backgroundColor: '#fff', borderRadius: '4px' }}>
                                  <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                    {index === 0 ? '📄 Current:' : `📋 Previous (${index}):`} {previousPermit.permit_number}
                                  </Typography>
                                  <Typography variant="caption" sx={{ display: 'block', color: '#666', mt: 0.5 }}>
                                    Status: <Chip label={previousPermit.status} size="small" sx={{ ml: 1 }} />
                                  </Typography>
                                  <Typography variant="caption" sx={{ display: 'block', color: '#666' }}>
                                    Valid: {previousPermit.valid_from} to {previousPermit.valid_to}
                                  </Typography>
                                </Box>
                              ))}
                            </Box>
                          ) : permit.previous_permits && permit.previous_permits.length > 0 ? (
                            <Box>
                              {permit.previous_permits.map((previousPermit, index) => (
                                <Box key={index} sx={{ mb: 1, p: 1, backgroundColor: '#fff', borderRadius: '4px' }}>
                                  <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                    📋 Previous: {previousPermit.permit_number}
                                  </Typography>
                                  <Typography variant="caption" sx={{ display: 'block', color: '#666', mt: 0.5 }}>
                                    Status: <Chip label={previousPermit.status} size="small" sx={{ ml: 1 }} />
                                  </Typography>
                                  <Typography variant="caption" sx={{ display: 'block', color: '#666' }}>
                                    Valid: {previousPermit.valid_from} to {previousPermit.valid_to}
                                  </Typography>
                                </Box>
                              ))}
                            </Box>
                          ) : (
                            <Typography variant="caption">No detailed chain available</Typography>
                          )}
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                </>
              )}
            </Grid>
          )}

          {/* Vehicle Details Tab */}
          {tabValue === 1 && (
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                  Vehicle Number
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {permit.vehicle_number}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                  Vehicle Type
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {permit.vehicle_type && typeof permit.vehicle_type === 'object'
                    ? permit.vehicle_type.name
                    : permit.vehicle_type || 'N/A'}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                  Make
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {permit.vehicle_make || 'N/A'}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                  Model
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {permit.vehicle_model || 'N/A'}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                  Year
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {permit.vehicle_year || 'N/A'}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                  Capacity (Seating)
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {permit.vehicle_capacity ? `${permit.vehicle_capacity} seats` : 'N/A'}
                </Typography>
              </Grid>
            </Grid>
          )}

          {/* Owner Information Tab */}
          {tabValue === 2 && (
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                  Name
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {permit.owner_name}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                  CNIC
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {permit.owner_cnic || 'N/A'}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                  Email
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {permit.owner_email}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                  Phone
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {permit.owner_phone}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                  Address
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {permit.owner_address || 'N/A'}
                </Typography>
              </Grid>
            </Grid>
          )}

          {/* Additional Details Tab */}
          {tabValue === 3 && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                  Description
                </Typography>
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                  {permit.description || 'N/A'}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                  Remarks
                </Typography>
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                  {permit.remarks || 'N/A'}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                  Approved Routes
                </Typography>
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                  {permit.approved_routes || 'N/A'}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                  Restrictions
                </Typography>
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                  {permit.restrictions || 'N/A'}
                </Typography>
              </Grid>
            </Grid>
          )}

          {/* History Tab */}
          {tabValue === 4 && (
            <Box>
              {history.length > 0 ? (
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                        <TableCell><strong>Action</strong></TableCell>
                        <TableCell><strong>Performed By</strong></TableCell>
                        <TableCell><strong>Date & Time</strong></TableCell>
                        <TableCell><strong>Notes</strong></TableCell>
                        <TableCell><strong>Details</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {history.map((item, index) => (
                        <TableRow key={index} hover>
                          <TableCell>
                            <Chip
                              label={item.action}
                              variant="outlined"
                              size="small"
                              color={
                                item.action === 'created'
                                  ? 'success'
                                  : item.action === 'cancelled'
                                    ? 'error'
                                    : 'default'
                              }
                            />
                          </TableCell>
                          <TableCell>{item.performed_by}</TableCell>
                          <TableCell>
                            {new Date(item.timestamp).toLocaleString()}
                          </TableCell>
                          <TableCell>{item.notes}</TableCell>
                          <TableCell>
                            {Object.keys(item.changes || {}).length > 0 ? (
                              <Button
                                size="small"
                                variant="outlined"
                                onClick={() => {
                                  setSelectedChange(item.changes);
                                  setDetailedChangesDialog(true);
                                }}
                              >
                                View Changes
                              </Button>
                            ) : (
                              '-'
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Typography color="textSecondary">No history records found</Typography>
              )}
            </Box>
          )}

          {/* Documents Tab */}
          {tabValue === 5 && (
            <Box>
              {documents.length > 0 ? (
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                        <TableCell><strong>Document Type</strong></TableCell>
                        <TableCell><strong>Filename</strong></TableCell>
                        <TableCell><strong>Uploaded By</strong></TableCell>
                        <TableCell><strong>Uploaded Date</strong></TableCell>
                        <TableCell><strong>Verified</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {documents.map((doc) => (
                        <TableRow key={doc.id} hover>
                          <TableCell>{doc.document_type}</TableCell>
                          <TableCell>{doc.filename}</TableCell>
                          <TableCell>{doc.uploaded_by || 'N/A'}</TableCell>
                          <TableCell>
                            {new Date(doc.uploaded_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={doc.is_verified ? 'Verified' : 'Not Verified'}
                              color={doc.is_verified ? 'success' : 'default'}
                              size="small"
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Typography color="textSecondary">No documents attached</Typography>
              )}
            </Box>
          )}
        </Box>
      </Paper>

      {/* Changes Dialog */}
      <Dialog open={detailedChangesDialog} onClose={() => setDetailedChangesDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Detailed Changes</DialogTitle>
        <DialogContent dividers>
          {selectedChange && Object.keys(selectedChange).length > 0 ? (
            <Box>
              {Object.entries(selectedChange).map(([field, change]) => (
                <Box key={field} sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                    {field}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', ml: 2 }}>
                    <Typography variant="body2" color="error">
                      {change.old}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      →
                    </Typography>
                    <Typography variant="body2" color="success">
                      {change.new}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Box>
          ) : (
            <Typography color="textSecondary">No changes to display</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailedChangesDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Reapply for Expired Permit Dialog */}
      <Dialog open={reapplyDialogOpen} onClose={() => setReapplyDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Reapply for Expired Permit</DialogTitle>
        <DialogContent dividers>
          {reapplyError && (
            <Alert severity="error" sx={{ mb: 2 }}>{reapplyError}</Alert>
          )}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="body2" color="textSecondary">
              Create a new permit for the same vehicle and owner. The system will automatically track the reference to this expired permit ({permit?.permit_number}).
            </Typography>
            <TextField
              label="Valid From"
              type="date"
              value={newValidFrom}
              onChange={(e) => setNewValidFrom(e.target.value)}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
            <TextField
              label="Valid To"
              type="date"
              value={newValidTo}
              onChange={(e) => setNewValidTo(e.target.value)}
              InputLabelProps={{ shrink: true }}
              fullWidth
              required
            />
            <Alert severity="info">
              The new permit will be created with status "Pending" and will be assigned to an available operator for processing.
            </Alert>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReapplyDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleReapplySubmit}
            variant="contained"
            disabled={reapplyLoading}
            sx={{ bgcolor: '#ff9800' }}
          >
            {reapplyLoading ? 'Creating...' : 'Create Renewal Permit'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PermitDetails;
