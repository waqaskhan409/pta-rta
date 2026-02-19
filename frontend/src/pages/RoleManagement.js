import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Grid,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Box,
  Typography,
  Chip,
  Alert,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Toolbar,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Add as AddIcon,
  CheckCircle as CheckIcon,
} from '@mui/icons-material';
import apiClient from '../services/apiClient';
import '../styles/RoleManagement.css';

const RoleManagement = () => {
  const [roles, setRoles] = useState([]);
  const [features, setFeatures] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [createRoleDialogOpen, setCreateRoleDialogOpen] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleDescription, setNewRoleDescription] = useState('');
  const [selectedFeaturesForRole, setSelectedFeaturesForRole] = useState([]);
  const [expandedRole, setExpandedRole] = useState(null);
  const [selectedFeatureForRole, setSelectedFeatureForRole] = useState({});

  useEffect(() => {
    fetchRoles();
    fetchFeatures();
  }, []);

  const fetchRoles = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/roles/');
      setRoles(response.data.results || response.data);
      setError('');
    } catch (err) {
      console.error('Error fetching roles:', err);
      setError('Failed to load roles');
    } finally {
      setLoading(false);
    }
  };

  const fetchFeatures = async () => {
    try {
      const response = await apiClient.get('/features/');
      setFeatures(response.data.results || response.data);
    } catch (err) {
      console.error('Error fetching features:', err);
    }
  };

  const handleCreateRole = async () => {
    try {
      setLoading(true);
      const roleData = {
        name: newRoleName.toLowerCase().replace(/\s+/g, '_'),
        description: newRoleDescription,
      };

      const response = await apiClient.post('/roles/', roleData);
      const newRole = response.data;

      // Add selected features to the new role
      for (const featureId of selectedFeaturesForRole) {
        await apiClient.post(`/roles/${newRole.id}/add-feature/`, {
          feature_id: featureId,
        });
      }

      setSuccess('Role created successfully!');
      setCreateRoleDialogOpen(false);
      setNewRoleName('');
      setNewRoleDescription('');
      setSelectedFeaturesForRole([]);
      fetchRoles();
    } catch (err) {
      console.error('Error creating role:', err);
      const errorMsg = err.response?.data?.error || err.response?.data?.detail || err.message || 'Failed to create role';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleAddFeature = async (roleId, featureId) => {
    try {
      setLoading(true);
      setError('');
      const fId = parseInt(featureId, 10);

      if (!fId || isNaN(fId)) {
        setError('Please select a valid feature');
        setLoading(false);
        return;
      }

      await apiClient.post(`/roles/${roleId}/add-feature/`, {
        feature_id: fId,
      });
      setSuccess('Feature added successfully');
      // Update local state instead of re-fetching all roles
      setRoles(roles.map(role => {
        if (role.id === roleId) {
          const featureToAdd = features.find(f => f.id === fId);
          return {
            ...role,
            features: [...role.features, featureToAdd]
          };
        }
        return role;
      }));
      // Clear selection
      setSelectedFeatureForRole(prev => ({ ...prev, [roleId]: '' }));
    } catch (err) {
      console.error('Error adding feature:', err);
      const errorMsg = err.response?.data?.error || err.message || 'Failed to add feature';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFeature = async (roleId, featureId) => {
    if (window.confirm('Are you sure you want to remove this feature?')) {
      try {
        setLoading(true);
        await apiClient.post(`/roles/${roleId}/remove-feature/`, {
          feature_id: featureId,
        });
        setSuccess('Feature removed successfully');
        // Update local state instead of re-fetching all roles
        setRoles(roles.map(role => {
          if (role.id === roleId) {
            return {
              ...role,
              features: role.features.filter(f => f.id !== featureId)
            };
          }
          return role;
        }));
      } catch (err) {
        console.error('Error removing feature:', err);
        const errorMsg = err.response?.data?.error || err.message || 'Failed to remove feature';
        setError(errorMsg);
      } finally {
        setLoading(false);
      }
    }
  };

  const getRoleColor = (roleName) => {
    const colors = {
      'admin': '#dc3545',
      'operator': '#007bff',
      'supervisor': '#ffc107',
      'user': '#28a745',
    };
    return colors[roleName] || '#6c757d';
  };

  return (
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
      <Toolbar sx={{ pl: 0, pr: 0, mb: 3 }}>
        <Typography variant="h5" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
          🔐 Role & Permissions Management
        </Typography>
        <Button
          variant="contained"
          color="success"
          startIcon={<AddIcon />}
          onClick={() => setCreateRoleDialogOpen(true)}
        >
          Create New Role
        </Button>
      </Toolbar>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      )}

      <Grid container spacing={3}>
        {roles.length > 0 ? (
          roles.map((role) => (
            <Grid item xs={12} sm={6} md={6} lg={5} key={role.id}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    boxShadow: '0 8px 16px rgba(0,0,0,0.15)',
                    transform: 'translateY(-4px)',
                  },
                }}
                onClick={() =>
                  setExpandedRole(expandedRole === role.id ? null : role.id)
                }
              >
                <CardHeader
                  title={role.display_name || role.name}
                  sx={{
                    backgroundColor: getRoleColor(role.name),
                    color: 'white',
                    '& .MuiCardHeader-title': {
                      fontWeight: 'bold',
                      fontSize: '1.2rem',
                    },
                  }}
                />
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                    {role.description || 'No description'}
                  </Typography>

                  <Box sx={{ mb: 2 }}>
                    <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
                      Features ({role.features.length})
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                      {role.features.length > 0 ? (
                        role.features.slice(0, 3).map((feature) => (
                          <Chip
                            key={feature.id}
                            label={feature.display_name}
                            size="small"
                            variant="outlined"
                            icon={<CheckIcon />}
                          />
                        ))
                      ) : (
                        <Typography variant="caption" color="textSecondary">
                          No features assigned
                        </Typography>
                      )}
                      {role.features.length > 3 && (
                        <Typography variant="caption" color="primary">
                          +{role.features.length - 3} more
                        </Typography>
                      )}
                    </Box>
                  </Box>

                  {expandedRole === role.id && (
                    <>
                      <Divider sx={{ my: 2 }} />
                      <Typography
                        variant="subtitle2"
                        sx={{ fontWeight: 'bold', mb: 1 }}
                      >
                        All Assigned Features:
                      </Typography>
                      <List dense>
                        {role.features.map((feature) => (
                          <ListItem
                            key={feature.id}
                            secondaryAction={
                              <Button
                                edge="end"
                                size="small"
                                color="error"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRemoveFeature(role.id, feature.id);
                                }}
                              >
                                <DeleteIcon fontSize="small" />
                              </Button>
                            }
                          >
                            <ListItemIcon>
                              <CheckIcon fontSize="small" color="success" />
                            </ListItemIcon>
                            <ListItemText primary={feature.display_name} />
                          </ListItem>
                        ))}
                      </List>

                      <Divider sx={{ my: 2 }} />
                      <Typography
                        variant="subtitle2"
                        sx={{ fontWeight: 'bold', mb: 2 }}
                      >
                        Add Feature:
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <TextField
                          select
                          SelectProps={{ native: true }}
                          size="small"
                          sx={{ flex: 1 }}
                          value={selectedFeatureForRole[role.id] || ''}
                          onChange={(e) => {
                            e.stopPropagation();
                            setSelectedFeatureForRole(prev => ({
                              ...prev,
                              [role.id]: e.target.value
                            }));
                          }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <option value="">Select a feature</option>
                          {features.map((feature) => {
                            const isAssigned = role.features.some(
                              (f) => f.id === feature.id
                            );
                            return !isAssigned ? (
                              <option key={feature.id} value={feature.id}>
                                {feature.display_name || feature.name}
                              </option>
                            ) : null;
                          })}
                        </TextField>
                        <Button
                          size="small"
                          variant="contained"
                          color="success"
                          startIcon={<AddIcon />}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (selectedFeatureForRole[role.id]) {
                              handleAddFeature(role.id, selectedFeatureForRole[role.id]);
                            }
                          }}
                          disabled={!selectedFeatureForRole[role.id] || loading}
                          sx={{ whiteSpace: 'nowrap' }}
                        >
                          Add
                        </Button>
                      </Box>
                    </>
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))
        ) : (
          <Grid item xs={12}>
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 4 }}>
                <Typography color="textSecondary">No roles found</Typography>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>

      {/* Create Role Dialog */}
      <Dialog open={createRoleDialogOpen} onClose={() => setCreateRoleDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ bgcolor: '#4caf50', color: 'white', fontWeight: 'bold' }}>
          Create New Role
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <TextField
            fullWidth
            label="Role Name"
            value={newRoleName}
            onChange={(e) => setNewRoleName(e.target.value)}
            margin="normal"
            placeholder="e.g., Reviewer, Approver"
          />
          <TextField
            fullWidth
            label="Description"
            value={newRoleDescription}
            onChange={(e) => setNewRoleDescription(e.target.value)}
            margin="normal"
            multiline
            rows={3}
            placeholder="Describe the purpose of this role"
          />

          <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mt: 3, mb: 1 }}>
            Select Features:
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {features.map((feature) => (
              <Chip
                key={feature.id}
                label={feature.display_name}
                onClick={() => {
                  if (selectedFeaturesForRole.includes(feature.id)) {
                    setSelectedFeaturesForRole(
                      selectedFeaturesForRole.filter((id) => id !== feature.id)
                    );
                  } else {
                    setSelectedFeaturesForRole([...selectedFeaturesForRole, feature.id]);
                  }
                }}
                color={
                  selectedFeaturesForRole.includes(feature.id)
                    ? 'primary'
                    : 'default'
                }
                variant={
                  selectedFeaturesForRole.includes(feature.id)
                    ? 'filled'
                    : 'outlined'
                }
              />
            ))}
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, bgcolor: '#f5f5f5' }}>
          <Button onClick={() => setCreateRoleDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleCreateRole}
            variant="contained"
            color="success"
            disabled={loading || !newRoleName.trim()}
          >
            Create Role
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RoleManagement;
