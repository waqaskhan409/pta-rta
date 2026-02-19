import React, { useState, useEffect } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  LinearProgress,
  CircularProgress,
  TableContainer,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Chip,
  Toolbar,
  Alert,
  Tabs,
  Tab,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  CheckCircle as CheckCircleIcon,
  PendingActions as PendingIcon,
  Cancel as CancelIcon,
  Inventory as InventoryIcon,
  Apps as AppsIcon,
  EventBusy as ExpiredIcon,
  ToggleOff as InactiveIcon,
  Security as SecurityIcon,
} from '@mui/icons-material';
import apiClient from '../services/apiClient';
import { useAuth } from '../context/AuthContext';
import '../styles/page.css';

// Helper functions for dashboard metrics
const calculateStatistics = (stats) => {
  const total = stats.totalPermits || 1;
  return {
    activeRate: Math.round((stats.activePermits / total) * 100),
    pendingRate: Math.round((stats.pendingPermits / total) * 100),
    expiredRate: Math.round((stats.expiredPermits / total) * 100),
    cancelledRate: Math.round((stats.cancelledPermits / total) * 100),
    inactiveRate: Math.round((stats.inactivePermits / total) * 100),
    healthScore: Math.round((stats.activePermits / total) * 100), // Overall health
  };
};

const getHealthStatus = (score) => {
  if (score >= 80) return { status: 'Excellent', color: '#4caf50', severity: 'success' };
  if (score >= 60) return { status: 'Good', color: '#ff9800', severity: 'warning' };
  if (score >= 40) return { status: 'Fair', color: '#ff9800', severity: 'warning' };
  return { status: 'Poor', color: '#f44336', severity: 'error' };
};

function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalPermits: 0,
    activePermits: 0,
    inactivePermits: 0,
    cancelledPermits: 0,
    expiredPermits: 0,
    pendingPermits: 0,
  });
  const [recentPermits, setRecentPermits] = useState([]);
  const [userFeatures, setUserFeatures] = useState([]);
  const [currentTab, setCurrentTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user && user.id) {
      console.log(`[Dashboard] User authenticated: ${user.username}, fetching data...`);
      console.log('[Dashboard] User object:', user);
      fetchStats();
      fetchRecentPermits();
      // Use features directly from user object instead of making separate API call
      if (user?.features && Array.isArray(user.features)) {
        console.log('[Dashboard] Features from user object:', user.features);
        setUserFeatures(user.features);
      } else {
        console.log('[Dashboard] No features found in user object');
        setUserFeatures([]);
      }
    } else {
      console.log('[Dashboard] User not authenticated');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, user?.username, user?.features]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      // Add cache-busting timestamp to force fresh data
      const response = await apiClient.get('/permits/stats/', {
        params: { t: Date.now() }
      });
      setStats(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to load dashboard data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentPermits = async () => {
    try {
      // Add cache-busting timestamp to force fresh data
      const response = await apiClient.get('/permits/', {
        params: { ordering: '-issued_date', limit: 5, t: Date.now() }
      });
      setRecentPermits(response.data.results || response.data.slice(0, 5));
    } catch (err) {
      console.error('Error fetching recent permits:', err);
    }
  };

  const fetchUserFeatures = async () => {
    try {
      const response = await apiClient.get(`/roles/${user.role.id}/`);
      setUserFeatures(response.data.features || []);
    } catch (err) {
      console.error('Error fetching user features:', err);
    }
  };



  const StatCard = ({ title, value, icon: Icon, color, percentage }) => (
    <Card sx={{
      height: '100%',
      position: 'relative',
      overflow: 'hidden',
      minHeight: '200px',
      background: `linear-gradient(135deg, ${color}08 0%, ${color}04 100%)`,
      border: `1.5px solid ${color}20`,
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      '&:hover': {
        transform: 'translateY(-4px)',
        boxShadow: `0 12px 24px ${color}15`,
        border: `1.5px solid ${color}40`,
      }
    }}>
      <CardContent sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography color="textSecondary" gutterBottom variant="caption" sx={{ fontWeight: 700, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {title}
            </Typography>
            <Typography variant="h3" sx={{ fontWeight: 'bold', color, mt: 2, mb: 1 }}>
              {value}
            </Typography>
            {percentage !== undefined && (
              <Typography variant="body2" color="textSecondary" sx={{ mt: 1, fontWeight: 500 }}>
                {percentage}% of total
              </Typography>
            )}
          </Box>
          <Box sx={{
            background: `linear-gradient(135deg, ${color}20 0%, ${color}10 100%)`,
            borderRadius: '16px',
            p: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Icon sx={{ fontSize: 48, color, opacity: 0.8 }} />
          </Box>
        </Box>
        {percentage !== undefined && (
          <LinearProgress
            variant="determinate"
            value={percentage}
            sx={{
              mt: 2,
              backgroundColor: '#e0e0e0',
              height: 6,
              borderRadius: 3,
              '& .MuiLinearProgress-bar': {
                background: `linear-gradient(90deg, ${color} 0%, ${color}80 100%)`,
              }
            }}
          />
        )}
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  const totalPermits = stats.totalPermits || 1; // Avoid division by zero
  const activePercentage = Math.round((stats.activePermits / totalPermits) * 100);
  const pendingPercentage = Math.round((stats.pendingPermits / totalPermits) * 100);
  const cancelledPercentage = Math.round((stats.cancelledPermits / totalPermits) * 100);
  const statistics = calculateStatistics(stats);
  const healthStatus = getHealthStatus(statistics.healthScore);

  return (
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
      <Toolbar sx={{ pl: 0, pr: 0, mb: 3 }}>
        <Typography variant="h5" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
          📊 Dashboard Overview
        </Typography>
      </Toolbar>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {/* Tabs Section */}
      <Card sx={{ mb: 4, boxShadow: 0, border: '1px solid #e0e0e0' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={currentTab} onChange={(e, newValue) => setCurrentTab(newValue)}>
            <Tab label="📊 Overview" />
            <Tab label="🔐 My Roles" />
          </Tabs>
        </Box>

        {/* Overview Tab */}
        {currentTab === 0 && (
          <CardContent sx={{ p: 0 }}>
            {/* This will show the regular dashboard content */}
          </CardContent>
        )}

        {/* My Roles Tab */}
        {currentTab === 1 && (
          <CardContent sx={{ p: 3 }}>
            <Box>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
                <SecurityIcon sx={{ fontSize: 24, color: '#1976d2' }} />
                Roles Assigned to You
              </Typography>

              {user && user.role ? (
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6} md={4}>
                    <Card sx={{
                      background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
                      color: '#1976d2',
                      cursor: 'pointer',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: '0 12px 20px rgba(25, 118, 210, 0.3)',
                      },
                      transition: 'all 0.3s ease'
                    }}>
                      <CardContent sx={{ textAlign: 'center', py: 3 }}>
                        <SecurityIcon sx={{ fontSize: 48, mb: 2 }} />
                        <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
                          {typeof user.role === 'string'
                            ? user.role.charAt(0).toUpperCase() + user.role.slice(1)
                            : user.role.name?.charAt(0).toUpperCase() + user.role.name?.slice(1) || 'Unknown'}
                        </Typography>
                        <Typography variant="body2" sx={{ opacity: 0.9 }}>
                          Primary Role
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              ) : (
                <Alert severity="info">No role currently assigned to your account.</Alert>
              )}

              {/* User Features Section */}
              {userFeatures && userFeatures.length > 0 && (
                <Box sx={{ mt: 4 }}>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                    Permissions & Features
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {userFeatures.map((feature, index) => {
                      // Handle both string and object formats
                      let displayName = '';
                      if (typeof feature === 'string') {
                        displayName = feature.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                      } else if (feature.display_name) {
                        // Use display_name if available (from backend)
                        displayName = feature.display_name;
                      } else if (feature.name) {
                        // Fallback to name and format it
                        displayName = feature.name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                      } else {
                        displayName = 'Feature';
                      }

                      return (
                        <Chip
                          key={index}
                          icon={<AppsIcon />}
                          label={displayName}
                          color="primary"
                          variant="outlined"
                          sx={{
                            fontWeight: 500,
                            '&:hover': {
                              background: 'rgba(25, 118, 210, 0.08)'
                            }
                          }}
                        />
                      );
                    })}
                  </Box>
                </Box>
              )}
            </Box>
          </CardContent>
        )}
      </Card>

      {/* Render overview content only when Overview tab is selected */}
      {currentTab === 0 && (
        <>
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} md={6}>
              <Card sx={{
                background: `linear-gradient(135deg, ${healthStatus.color}15 0%, ${healthStatus.color}05 100%)`,
                border: `2px solid ${healthStatus.color}30`,
                borderRadius: '12px',
              }}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Box>
                      <Typography variant="overline" sx={{ fontSize: '0.75rem', fontWeight: 700, color: 'textSecondary', letterSpacing: '0.5px' }}>
                        System Health Status
                      </Typography>
                      <Typography variant="h4" sx={{ fontWeight: 'bold', color: healthStatus.color, mt: 1 }}>
                        {healthStatus.status}
                      </Typography>
                    </Box>
                    <Box sx={{
                      width: 100,
                      height: 100,
                      borderRadius: '50%',
                      background: `linear-gradient(135deg, ${healthStatus.color} 0%, ${healthStatus.color}80 100%)`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: '32px',
                      fontWeight: 'bold'
                    }}>
                      {statistics.healthScore}%
                    </Box>
                  </Box>
                  <Box sx={{ mt: 2 }}>
                    <LinearProgress
                      variant="determinate"
                      value={statistics.healthScore}
                      sx={{
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: '#e0e0e0',
                        mb: 2,
                        '& .MuiLinearProgress-bar': {
                          background: `linear-gradient(90deg, ${healthStatus.color} 0%, ${healthStatus.color}80 100%)`,
                        }
                      }}
                    />
                    <Typography variant="caption" color="textSecondary">
                      Active permits: {statistics.activeRate}% | Pending: {statistics.pendingRate}% | Expired: {statistics.expiredRate}%
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Quick Stats Summary */}
            <Grid item xs={12} md={6}>
              <Card sx={{
                background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
                borderRadius: '12px',
              }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="overline" sx={{ fontSize: '0.75rem', fontWeight: 700, color: 'textSecondary', letterSpacing: '0.5px', mb: 2, display: 'block' }}>
                    Quick Overview
                  </Typography>
                  <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                    <Box>
                      <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 600 }}>Active</Typography>
                      <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#4caf50', mt: 0.5 }}>
                        {stats.activePermits} ({statistics.activeRate}%)
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 600 }}>Pending</Typography>
                      <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#ff9800', mt: 0.5 }}>
                        {stats.pendingPermits} ({statistics.pendingRate}%)
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 600 }}>Expired</Typography>
                      <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#d32f2f', mt: 0.5 }}>
                        {stats.expiredPermits} ({statistics.expiredRate}%)
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 600 }}>Cancelled</Typography>
                      <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#f44336', mt: 0.5 }}>
                        {stats.cancelledPermits} ({statistics.cancelledRate}%)
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Key Statistics Cards */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={4} lg={3}>
              <StatCard
                title="Total Permits"
                value={stats.totalPermits}
                icon={InventoryIcon}
                color="#1976d2"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4} lg={3}>
              <StatCard
                title="Active Permits"
                value={stats.activePermits}
                icon={CheckCircleIcon}
                color="#4caf50"
                percentage={activePercentage}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4} lg={3}>
              <StatCard
                title="Pending Permits"
                value={stats.pendingPermits}
                icon={PendingIcon}
                color="#ff9800"
                percentage={pendingPercentage}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4} lg={3}>
              <StatCard
                title="Cancelled Permits"
                value={stats.cancelledPermits}
                icon={CancelIcon}
                color="#f44336"
                percentage={cancelledPercentage}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4} lg={3}>
              <StatCard
                title="Expired Permits"
                value={stats.expiredPermits}
                icon={ExpiredIcon}
                color="#d32f2f"
                percentage={stats.totalPermits > 0 ? Math.round((stats.expiredPermits / stats.totalPermits) * 100) : 0}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4} lg={3}>
              <StatCard
                title="Inactive Permits"
                value={stats.inactivePermits}
                icon={InactiveIcon}
                color="#757575"
                percentage={stats.totalPermits > 0 ? Math.round((stats.inactivePermits / stats.totalPermits) * 100) : 0}
              />
            </Grid>
          </Grid>

          {/* User Features Section */}
          {userFeatures.length > 0 && (
            <Box sx={{ mb: 4 }}>
              <Toolbar sx={{ pl: 0, pr: 0, mb: 2 }}>
                <AppsIcon sx={{ mr: 2, color: '#1976d2', fontSize: 28 }} />
                <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#0f172a' }}>
                  Your Assigned Features ({userFeatures.length})
                </Typography>
              </Toolbar>
              <Box sx={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 1.5,
                p: 3,
                backgroundColor: '#f9fafb',
                borderRadius: '12px',
                border: '1px solid #e5e7eb',
              }}>
                {userFeatures.map((feature, idx) => (
                  <Chip
                    key={idx}
                    icon={<CheckCircleIcon />}
                    label={typeof feature === 'string' ? feature : feature.name || feature.code}
                    sx={{
                      backgroundColor: '#e3f2fd',
                      color: '#1976d2',
                      fontWeight: 600,
                      border: '1px solid #1976d2',
                      '& .MuiChip-icon': {
                        color: '#4caf50',
                      },
                      px: 2,
                      py: 2.5,
                      fontSize: '13px',
                    }}
                  />
                ))}
              </Box>
            </Box>
          )}

          {/* Detailed Status Breakdown */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} md={4}>
              <Card sx={{
                boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                minHeight: '320px',
                border: '1px solid #e2e8f0',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                  boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                }
              }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 3, color: '#0f172a' }}>
                    📊 Status Breakdown
                  </Typography>

                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                    {[
                      { label: 'Active', value: stats.activePermits, color: '#4caf50' },
                      { label: 'Inactive', value: stats.inactivePermits, color: '#9e9e9e' },
                      { label: 'Pending', value: stats.pendingPermits, color: '#ff9800' },
                      { label: 'Cancelled', value: stats.cancelledPermits, color: '#f44336' },
                      { label: 'Expired', value: stats.expiredPermits, color: '#757575' },
                    ].map((item) => (
                      <Box key={item.label}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.8, alignItems: 'center' }}>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: '#475569' }}>{item.label}</Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Chip
                              label={item.value}
                              size="small"
                              sx={{
                                background: `${item.color}20`,
                                color: item.color,
                                fontWeight: 'bold',
                                height: '28px'
                              }}
                            />
                            <Typography variant="caption" sx={{ fontWeight: 'bold', color: '#64748b' }}>
                              {stats.totalPermits > 0 ? Math.round((item.value / stats.totalPermits) * 100) : 0}%
                            </Typography>
                          </Box>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={(item.value / (totalPermits || 1)) * 100}
                          sx={{
                            height: 8,
                            borderRadius: 2,
                            backgroundColor: '#e2e8f0',
                            '& .MuiLinearProgress-bar': {
                              backgroundColor: item.color,
                              borderRadius: 2,
                            },
                          }}
                        />
                      </Box>
                    ))}
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Statistics Summary */}
            <Grid item xs={12} md={4}>
              <Card sx={{
                boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                minHeight: '320px',
                border: '1px solid #e2e8f0',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                  boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                }
              }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 3, color: '#0f172a' }}>
                    📈 Key Metrics
                  </Typography>

                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Box sx={{ p: 2.5, backgroundColor: '#e3f2fd', borderRadius: 2, border: '1.5px solid #90caf9' }}>
                      <Typography variant="caption" sx={{ fontWeight: 700, color: '#1565c0', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Completion Rate
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1.5, mt: 1.5 }}>
                        <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#1565c0' }}>
                          {stats.totalPermits > 0
                            ? Math.round(
                              ((stats.activePermits + stats.inactivePermits) /
                                stats.totalPermits) *
                              100
                            )
                            : 0}
                          %
                        </Typography>
                        <TrendingUpIcon sx={{ color: '#4caf50', fontSize: 24 }} />
                      </Box>
                      <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 500 }}>
                        {stats.activePermits + stats.inactivePermits} of {stats.totalPermits} permits
                      </Typography>
                    </Box>

                    <Box sx={{ p: 2.5, backgroundColor: '#fff3e0', borderRadius: 2, border: '1.5px solid #ffe0b2' }}>
                      <Typography variant="caption" sx={{ fontWeight: 700, color: '#e65100', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Pending Rate
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1.5, mt: 1.5 }}>
                        <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#e65100' }}>
                          {stats.totalPermits > 0
                            ? Math.round((stats.pendingPermits / stats.totalPermits) * 100)
                            : 0}
                          %
                        </Typography>
                        <PendingIcon sx={{ color: '#ff9800', fontSize: 24 }} />
                      </Box>
                      <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 500 }}>
                        {stats.pendingPermits} awaiting action
                      </Typography>
                    </Box>

                    <Box sx={{ p: 2.5, backgroundColor: '#f3e5f5', borderRadius: 2, border: '1.5px solid #e1bee7' }}>
                      <Typography variant="caption" sx={{ fontWeight: 700, color: '#6a1b9a', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        System Status
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mt: 1.5 }}>
                        <Chip
                          label="Operational"
                          size="small"
                          color="success"
                          variant="filled"
                          sx={{ fontWeight: 'bold', height: '32px' }}
                        />
                      </Box>
                      <Typography variant="caption" color="textSecondary" sx={{ mt: 1.5, display: 'block', fontWeight: 500 }}>
                        All services running smoothly
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Additional Analytics */}
            <Grid item xs={12} md={4}>
              <Card sx={{
                boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                minHeight: '320px',
                border: '1px solid #e2e8f0',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                  boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                }
              }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 3, color: '#0f172a' }}>
                    📉 Additional Analytics
                  </Typography>

                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                    <Box sx={{ p: 2, backgroundColor: '#f0f9ff', borderRadius: 2 }}>
                      <Typography variant="caption" sx={{ fontWeight: 600, color: '#0369a1', fontSize: '11px' }}>
                        ACTIVE RATE
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, mt: 1 }}>
                        <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#0369a1' }}>
                          {stats.totalPermits > 0
                            ? Math.round((stats.activePermits / stats.totalPermits) * 100)
                            : 0}
                          %
                        </Typography>
                      </Box>
                    </Box>

                    <Box sx={{ p: 2, backgroundColor: '#fef3c7', borderRadius: 2 }}>
                      <Typography variant="caption" sx={{ fontWeight: 600, color: '#b45309', fontSize: '11px' }}>
                        CANCELLATION RATE
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, mt: 1 }}>
                        <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#b45309' }}>
                          {stats.totalPermits > 0
                            ? Math.round((stats.cancelledPermits / stats.totalPermits) * 100)
                            : 0}
                          %
                        </Typography>
                      </Box>
                    </Box>

                    <Box sx={{ p: 2, backgroundColor: '#fee2e2', borderRadius: 2 }}>
                      <Typography variant="caption" sx={{ fontWeight: 600, color: '#991b1b', fontSize: '11px' }}>
                        EXPIRATION RATE
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, mt: 1 }}>
                        <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#991b1b' }}>
                          {stats.totalPermits > 0
                            ? Math.round((stats.expiredPermits / stats.totalPermits) * 100)
                            : 0}
                          %
                        </Typography>
                      </Box>
                    </Box>

                    <Box sx={{ p: 2, backgroundColor: '#e0f2fe', borderRadius: 2 }}>
                      <Typography variant="caption" sx={{ fontWeight: 600, color: '#0c4a6e', fontSize: '11px' }}>
                        OVERALL HEALTH
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                        <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#0c4a6e' }}>
                          {stats.totalPermits > 0
                            ? Math.round(
                              ((stats.activePermits + stats.inactivePermits) / stats.totalPermits) * 100 +
                              100 - (Math.round((stats.pendingPermits / stats.totalPermits) * 100))
                            ) / 2
                            : 0}
                          %
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Recent Permits Table */}
          <Card sx={{
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
            border: '1px solid #e2e8f0',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
            }
          }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 3, color: '#0f172a' }}>
                📋 Recently Added Permits
              </Typography>

              <TableContainer>
                <Table>
                  <TableHead sx={{
                    backgroundColor: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)'
                  }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold', color: 'white', fontSize: '14px' }}>Permit #</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', color: 'white', fontSize: '14px' }}>Vehicle</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', color: 'white', fontSize: '14px' }}>Owner</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', color: 'white', fontSize: '14px' }}>Status</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', color: 'white', fontSize: '14px' }}>Added</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {recentPermits.length > 0 ? (
                      recentPermits.map((permit, idx) => (
                        <TableRow
                          key={permit.id}
                          hover
                          sx={{
                            '&:hover': {
                              backgroundColor: '#f8fafc',
                            },
                            borderBottom: '1px solid #e2e8f0',
                          }}
                        >
                          <TableCell sx={{ fontWeight: '600', color: '#0f172a' }}>
                            {permit.permit_number}
                          </TableCell>
                          <TableCell sx={{ color: '#475569' }}>{permit.vehicle_number}</TableCell>
                          <TableCell sx={{ color: '#475569' }}>{permit.owner_name}</TableCell>
                          <TableCell>
                            <Chip
                              label={permit.status?.charAt(0).toUpperCase() + permit.status?.slice(1)}
                              size="small"
                              color={
                                permit.status === 'active'
                                  ? 'success'
                                  : permit.status === 'pending'
                                    ? 'warning'
                                    : 'error'
                              }
                              variant="outlined"
                              sx={{ fontWeight: '600' }}
                            />
                          </TableCell>
                          <TableCell sx={{ color: '#64748b', fontSize: '13px' }}>
                            {new Date(permit.issued_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} sx={{ textAlign: 'center', py: 4 }}>
                          <Typography color="textSecondary" sx={{ fontWeight: 500 }}>No permits found</Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </>
      )}
    </Box>
  );
}

export default Dashboard;
