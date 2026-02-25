import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Divider,
  CircularProgress,
  Alert,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Lock as LockIcon,
} from '@mui/icons-material';
import apiClient from '../services/apiClient';
import { useAuth } from '../context/AuthContext';

function FeatureList() {
  const { user } = useAuth();
  const [allFeatures, setAllFeatures] = useState([]);
  const [userFeatures, setUserFeatures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchFeatures();
    if (user?.role?.id) {
      fetchUserRoleFeatures();
    }
  }, [user?.role?.id]);

  const fetchFeatures = async () => {
    try {
      const response = await apiClient.get('/features/');
      setAllFeatures(response.data.results || response.data);
      setError(null);
    } catch (err) {
      setError('Failed to load features');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserRoleFeatures = async () => {
    try {
      // Get role details to fetch associated features
      const response = await apiClient.get(`/roles/${user.role.id}/`);
      setUserFeatures(response.data.features || []);
    } catch (err) {
      console.error('Error fetching user features:', err);
    }
  };

  const isFeatureEnabled = (featureId) => {
    return userFeatures.some(f => f.id === featureId || f === featureId);
  };

  const getFeatureCategory = (featureCode) => {
    if (!featureCode) return 'General';
    if (featureCode.startsWith('permit_')) return 'Permit Management';
    if (featureCode.startsWith('user_')) return 'User Management';
    if (featureCode.startsWith('role_')) return 'Role Management';
    if (featureCode.startsWith('report_')) return 'Reports';
    return 'General';
  };

  const featuresByCategory = allFeatures.reduce((acc, feature) => {
    const category = getFeatureCategory(feature.code);
    if (!acc[category]) acc[category] = [];
    acc[category].push(feature);
    return acc;
  }, {});

  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper sx={{ p: 4, backgroundColor: '#fff', mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 2, color: '#1976d2' }}>
          Feature List
        </Typography>
        <Typography variant="caption" sx={{ color: 'textSecondary', display: 'block', mb: 3 }}>
          Complete list of all available features in the system
        </Typography>
        <Divider sx={{ mb: 3 }} />

        {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

        <Box sx={{ mb: 4 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2, color: '#333' }}>
            Your Assigned Features
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {userFeatures.length > 0 ? (
              userFeatures.map((feature, idx) => (
                <Chip
                  key={idx}
                  icon={<CheckCircleIcon />}
                  label={typeof feature === 'string' ? feature : feature.name || feature.code}
                  color="primary"
                  variant="outlined"
                  sx={{ fontWeight: 600 }}
                />
              ))
            ) : (
              <Typography variant="body2" sx={{ color: 'textSecondary' }}>
                No features assigned to your role
              </Typography>
            )}
          </Box>
        </Box>

        <Divider sx={{ my: 3 }} />

        <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 3, color: '#333' }}>
          Complete Feature List (Read-Only)
        </Typography>

        {Object.entries(featuresByCategory).map(([category, features]) => (
          <Box key={category} sx={{ mb: 4 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 2, color: '#1976d2', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {category}
            </Typography>

            <TableContainer component={Paper} sx={{ backgroundColor: '#fafafa', border: '1px solid #e0e0e0' }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                    <TableCell sx={{ fontWeight: 700, width: '40%' }}>Feature Name</TableCell>
                    <TableCell sx={{ fontWeight: 700, width: '45%' }}>Description</TableCell>
                    <TableCell sx={{ fontWeight: 700, width: '15%', textAlign: 'center' }}>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {features.map((feature) => {
                    const enabled = isFeatureEnabled(feature.id);
                    return (
                      <TableRow
                        key={feature.id}
                        sx={{
                          backgroundColor: enabled ? '#e8f5e9' : '#fafafa',
                          '&:hover': {
                            backgroundColor: enabled ? '#e0f2f1' : '#f0f0f0',
                          },
                          transition: 'background-color 0.2s',
                        }}
                      >
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: '#333' }}>
                            {feature.name || feature.code}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ color: 'textSecondary' }}>
                            {feature.description || '-'}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ textAlign: 'center' }}>
                          {enabled ? (
                            <Chip
                              icon={<CheckCircleIcon />}
                              label="Assigned"
                              size="small"
                              color="success"
                              variant="outlined"
                              sx={{ fontWeight: 600 }}
                            />
                          ) : (
                            <Chip
                              icon={<LockIcon />}
                              label="Not Assigned"
                              size="small"
                              variant="outlined"
                              sx={{
                                fontWeight: 600,
                                color: '#999',
                                borderColor: '#ddd'
                              }}
                            />
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        ))}

        <Divider sx={{ my: 3 }} />

        <Alert severity="info" sx={{ mt: 3 }}>
          <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
            ℹ️ Read-Only Information
          </Typography>
          <Typography variant="body2" sx={{ color: 'textSecondary' }}>
            This feature list is for informational purposes only. Features cannot be edited or deleted here.
            To manage role features, please contact your system administrator.
          </Typography>
        </Alert>
      </Paper>
    </Container>
  );
}

export default FeatureList;
