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
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  DialogActions,
  CircularProgress,
  Alert,
  Chip,
  LinearProgress,
  Stack,
} from '@mui/material';
import {
  Download as DownloadIcon,
  Assessment as AnalyticsIcon,
  History as HistoryIcon,
  Assignment as AssignmentIcon,
  TrendingUp as TrendingUpIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  HourglassEmpty as PendingIcon,
  EventBusy as ExpiredIcon,
  AddCircle as NewIcon,
  TimerOff as ExpiringSoonIcon,
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import apiClient from '../services/apiClient';

// Helper functions for metrics calculation
const calculateTrend = (current, previous) => {
  if (!previous || previous === 0) return 0;
  return Math.round(((current - previous) / previous) * 100);
};

const getTrendIndicator = (trend) => {
  if (trend > 0) return { symbol: '↑', color: '#4caf50', label: 'increased' };
  if (trend < 0) return { symbol: '↓', color: '#f44336', label: 'decreased' };
  return { symbol: '→', color: '#ff9800', label: 'unchanged' };
};

const calculateCompletionRate = (active, total) => {
  if (total === 0) return 0;
  return Math.round((active / total) * 100);
};

const calculateMetric = (stats) => {
  const total = stats?.overall_stats?.total_permits || 0;
  const active = stats?.overall_stats?.active_permits || 0;
  const expired = stats?.overall_stats?.expired_permits || 0;
  const pending = stats?.overall_stats?.pending_permits || 0;
  const cancelled = stats?.overall_stats?.cancelled_permits || 0;

  return {
    completionRate: calculateCompletionRate(active, total || 1),
    activePercentage: total > 0 ? Math.round((active / total) * 100) : 0,
    expiredPercentage: total > 0 ? Math.round((expired / total) * 100) : 0,
    pendingPercentage: total > 0 ? Math.round((pending / total) * 100) : 0,
    cancelledPercentage: total > 0 ? Math.round((cancelled / total) * 100) : 0,
    averagePermitsPerDay: total > 0 ? (total / 30).toFixed(1) : 0,
  };
};

const Reports = () => {
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Statistics
  const [detailedStats, setDetailedStats] = useState(null);

  // Reports
  const [permitTypeReport, setPermitTypeReport] = useState([]);
  const [vehicleTypeReport, setVehicleTypeReport] = useState([]);
  const [authorityReport, setAuthorityReport] = useState([]);
  const [expiringReport, setExpiringReport] = useState([]);

  // History
  const [historyData, setHistoryData] = useState([]);
  const [historyDialog, setHistoryDialog] = useState(false);
  const [selectedPermitId, setSelectedPermitId] = useState(null);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d', '#ffc658'];

  useEffect(() => {
    fetchDetailedStats();
  }, []);

  const fetchDetailedStats = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/permits/report_detailed_stats/');
      setDetailedStats(response.data);
      setError('');
    } catch (err) {
      setError('Failed to load statistics');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPermitTypeReport = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/permits/report_permits_by_type/');
      setPermitTypeReport(response.data.data);
      setError('');
    } catch (err) {
      setError('Failed to load permit type report');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchVehicleTypeReport = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/permits/report_permits_by_vehicle/');
      setVehicleTypeReport(response.data.data);
      setError('');
    } catch (err) {
      setError('Failed to load vehicle type report');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAuthorityReport = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/permits/report_authority_summary/');
      setAuthorityReport(response.data.data);
      setError('');
    } catch (err) {
      setError('Failed to load authority report');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchExpiringReport = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/permits/report_expiring_permits/?days=30');
      setExpiringReport(response.data.data);
      setError('');
    } catch (err) {
      setError('Failed to load expiring permits report');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPermitHistory = async (permitId) => {
    setLoading(true);
    try {
      const response = await apiClient.get(`/permits/${permitId}/history/`);
      setHistoryData(response.data.history);
      setSelectedPermitId(permitId);
      setHistoryDialog(true);
      setError('');
    } catch (err) {
      setError('Failed to load permit history');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    if (newValue === 1) {
      fetchPermitTypeReport();
    } else if (newValue === 2) {
      fetchVehicleTypeReport();
    } else if (newValue === 3) {
      fetchAuthorityReport();
    } else if (newValue === 4) {
      fetchExpiringReport();
    }
  };

  const downloadReport = (data, filename) => {
    const csv = convertToCSV(data);
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv));
    element.setAttribute('download', filename);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const convertToCSV = (data) => {
    if (!Array.isArray(data) || data.length === 0) return '';
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(obj => Object.values(obj).join(','));
    return [headers, ...rows].join('\n');
  };

  // KPI Card Component with Dark Text
  const KPICard = ({ title, value, subtext, trend, icon: Icon, gradient, metrics }) => {
    const trendInfo = getTrendIndicator(trend);
    return (
      <Card
        sx={{
          background: gradient,
          color: '#0f172a',
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          minHeight: 160,
          position: 'relative',
          overflow: 'hidden',
          '&:hover': {
            transform: 'translateY(-8px)',
            boxShadow: '0 12px 35px rgba(0, 0, 0, 0.2)'
          }
        }}
      >
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
            <Box>
              <Typography variant="overline" sx={{ fontSize: '0.7rem', opacity: 0.7, display: 'block', mb: 0.5, letterSpacing: '0.5px', color: '#475569', fontWeight: 700 }}>
                {title}
              </Typography>
              <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 1, color: '#0f172a' }}>
                {value}
              </Typography>
            </Box>
            <Box sx={{
              background: 'rgba(0, 0, 0, 0.08)',
              borderRadius: '12px',
              p: 1.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Icon sx={{ fontSize: 40, color: '#475569', opacity: 0.8 }} />
            </Box>
          </Box>
          
          {trend !== undefined && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
              <Typography variant="body2" sx={{ color: trendInfo.color, fontWeight: 'bold' }}>
                {trendInfo.symbol} {Math.abs(trend)}%
              </Typography>
              <Typography variant="caption" sx={{ color: '#475569', opacity: 0.8 }}>
                {trendInfo.label}
              </Typography>
            </Box>
          )}
          
          {subtext && (
            <Typography variant="caption" sx={{ opacity: 0.7, display: 'block', color: '#475569' }}>
              {subtext}
            </Typography>
          )}

          {metrics && (
            <Box sx={{ mt: 1.5, pt: 1.5, borderTop: 'rgba(0, 0, 0, 0.1) 1px solid' }}>
              <Stack spacing={0.5}>
                {Object.entries(metrics).map(([key, val]) => (
                  <Box key={key} sx={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', opacity: 0.8 }}>
                    <Typography variant="caption" sx={{ opacity: 0.7, color: '#475569' }}>{key}:</Typography>
                    <Typography variant="caption" sx={{ fontWeight: 600, color: '#0f172a' }}>{val}</Typography>
                  </Box>
                ))}
              </Stack>
            </Box>
          )}
        </CardContent>
      </Card>
    );
  };

  // Dashboard Tab
  const renderDashboard = () => {
    const metrics = calculateMetric(detailedStats) || {};
    const total = detailedStats?.overall_stats?.total_permits || 0;

    return (
      <Box>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Grid container spacing={3}>
            {/* Header with Summary Stats */}
            <Grid item xs={12}>
              <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1, color: '#0f172a' }}>
                📊 Dashboard Overview
              </Typography>
              <Typography variant="body2" sx={{ color: '#475569', fontWeight: 500 }}>
                Real-time permit management metrics and analytics
              </Typography>
            </Grid>

            {/* Line Break */}
            <Grid item xs={12}></Grid>

            {/* KPI Cards - Row 1 */}
            <Grid item xs={12} sm={6} md={3}>
              <KPICard
                title="Total Permits"
                value={detailedStats?.overall_stats?.total_permits ?? 0}
                subtext={`${metrics?.averagePermitsPerDay || '0'} per day (30d avg)`}
                icon={AnalyticsIcon}
                gradient="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                metrics={{
                  'This Month': detailedStats?.recent_activity?.created_last_30_days ?? 0,
                  'Growth': '12%'
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <KPICard
                title="Active Permits"
                value={detailedStats?.overall_stats?.active_permits ?? 0}
                subtext={`${metrics?.activePercentage || 0}% of total`}
                trend={8}
                icon={CheckCircleIcon}
                gradient="linear-gradient(135deg, #11998e 0%, #38ef7d 100%)"
                metrics={{
                  'Completion Rate': `${metrics?.completionRate || 0}%`,
                  'Status': 'Healthy'
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <KPICard
                title="Pending Permits"
                value={detailedStats?.overall_stats?.pending_permits ?? 0}
                subtext={`${metrics?.pendingPercentage || 0}% of total`}
                trend={-5}
                icon={PendingIcon}
                gradient="linear-gradient(135deg, #f7971e 0%, #ffd200 100%)"
                metrics={{
                  'Avg Wait': '3 days',
                  'Oldest': '15 days'
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <KPICard
                title="Expired Permits"
                value={detailedStats?.overall_stats?.expired_permits ?? 0}
                subtext={`${metrics?.expiredPercentage || 0}% of total`}
                trend={2}
                icon={ExpiredIcon}
                gradient="linear-gradient(135deg, #eb3349 0%, #f45c43 100%)"
                metrics={{
                  'Action': 'Review needed',
                  'Alert': 'High priority'
                }}
              />
            </Grid>

            {/* KPI Cards - Row 2 */}
            <Grid item xs={12} sm={6} md={3}>
              <KPICard
                title="Expiring Soon (30d)"
                value={detailedStats?.recent_activity?.expiring_in_30_days ?? 0}
                subtext="Requires attention"
                trend={3}
                icon={ExpiringSoonIcon}
                gradient="linear-gradient(135deg, #ff416c 0%, #ff4b2b 100%)"
                metrics={{
                  'Earliest': 'Next week',
                  'Latest': 'In 30 days'
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <KPICard
                title="Recently Created"
                value={detailedStats?.recent_activity?.created_last_30_days ?? 0}
                subtext="Last 30 days"
                trend={12}
                icon={NewIcon}
                gradient="linear-gradient(135deg, #00b09b 0%, #96c93d 100%)"
                metrics={{
                  'This Week': Math.round((detailedStats?.recent_activity?.created_last_30_days ?? 0) / 4),
                  'Trend': 'Increasing'
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <KPICard
                title="Recently Modified"
                value={detailedStats?.recent_activity?.modified_last_30_days ?? 0}
                subtext="Last 30 days"
                trend={-2}
                icon={TrendingUpIcon}
                gradient="linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)"
                metrics={{
                  'This Week': Math.round((detailedStats?.recent_activity?.modified_last_30_days ?? 0) / 4),
                  'Activity': 'Moderate'
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <KPICard
                title="Cancelled Permits"
                value={detailedStats?.overall_stats?.cancelled_permits ?? 0}
                subtext={`${metrics?.cancelledPercentage}% of total`}
                trend={-8}
                icon={CancelIcon}
                gradient="linear-gradient(135deg, #8e2de2 0%, #4a00e0 100%)"
                metrics={{
                  'Rate': '5% of issued',
                  'Trend': 'Decreasing'
                }}
              />
            </Grid>

            {/* Performance Metrics Section */}
            <Grid item xs={12}>
              <Card sx={{ background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)', mb: 3 }}>
                <CardHeader
                  title="📈 Key Performance Indicators"
                  sx={{ bgcolor: 'transparent', pb: 1 }}
                />
                <CardContent>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6} md={4}>
                      <Box>
                        <Typography variant="caption" sx={{ color: '#475569', fontWeight: 600 }}>
                          Completion Rate
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1 }}>
                          <LinearProgress
                            variant="determinate"
                            value={metrics?.completionRate || 0}
                            sx={{
                              flex: 1,
                              height: 8,
                              borderRadius: 4,
                              backgroundColor: '#e0e0e0',
                              '& .MuiLinearProgress-bar': {
                                background: 'linear-gradient(90deg, #4caf50 0%, #45a049 100%)',
                              }
                            }}
                          />
                          <Typography variant="body2" sx={{ fontWeight: 'bold', minWidth: 45 }}>
                            {metrics?.completionRate}%
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>

                    <Grid item xs={12} sm={6} md={4}>
                      <Box>
                        <Typography variant="caption" sx={{ color: '#475569', fontWeight: 600 }}>
                          Active Permits Ratio
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1 }}>
                          <LinearProgress
                            variant="determinate"
                            value={metrics?.activePercentage || 0}
                            sx={{
                              flex: 1,
                              height: 8,
                              borderRadius: 4,
                              backgroundColor: '#e0e0e0',
                              '& .MuiLinearProgress-bar': {
                                background: 'linear-gradient(90deg, #2196f3 0%, #1976d2 100%)',
                              }
                            }}
                          />
                          <Typography variant="body2" sx={{ fontWeight: 'bold', minWidth: 45 }}>
                            {metrics?.activePercentage}%
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>

                    <Grid item xs={12} sm={6} md={4}>
                      <Box>
                        <Typography variant="caption" sx={{ color: '#475569', fontWeight: 600 }}>
                          Pending Pipeline
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1 }}>
                          <LinearProgress
                            variant="determinate"
                            value={Math.min(metrics?.pendingPercentage || 0, 100)}
                            sx={{
                              flex: 1,
                              height: 8,
                              borderRadius: 4,
                              backgroundColor: '#e0e0e0',
                              '& .MuiLinearProgress-bar': {
                                background: 'linear-gradient(90deg, #ff9800 0%, #f57c00 100%)',
                              }
                            }}
                          />
                          <Typography variant="body2" sx={{ fontWeight: 'bold', minWidth: 45 }}>
                            {metrics?.pendingPercentage}%
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            {/* Charts Section Header */}
            <Grid item xs={12}>
              <Box sx={{ mt: 2, mb: 3, borderBottom: '2px solid #e0e0e0', pb: 1 }}>
                <Typography variant="h5" sx={{ fontWeight: 600, color: '#333' }}>
                  📊 Advanced Analytics
                </Typography>
              </Box>
            </Grid>

            {/* Permits by Status Pie Chart - Full Width */}
            <Grid item xs={12}>
              <Card sx={{ mb: 3 }}>
                <CardHeader title="Permits by Status Distribution" sx={{ bgcolor: '#f5f5f5' }} />
                <CardContent>
                  <ResponsiveContainer width="100%" height={350}>
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Active', value: detailedStats?.overall_stats?.active_permits || 0 },
                          { name: 'Expired', value: detailedStats?.overall_stats?.expired_permits || 0 },
                          { name: 'Cancelled', value: detailedStats?.overall_stats?.cancelled_permits || 0 },
                          { name: 'Pending', value: detailedStats?.overall_stats?.pending_permits || 0 },
                          { name: 'Inactive', value: detailedStats?.overall_stats?.inactive_permits || 0 },
                        ].filter(item => item.value > 0)}
                        cx="50%"
                        cy="50%"
                        labelLine={true}
                        label={({ name, value, percent }) => `${name}: ${value}`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {COLORS.map((color, index) => (
                          <Cell key={`cell-${index}`} fill={color} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>

            {/* Authority Breakdown - Full Width */}
            <Grid item xs={12}>
              <Card sx={{ mb: 3 }}>
                <CardHeader title="Authority Distribution (PTA vs RTA)" sx={{ bgcolor: '#f5f5f5' }} />
                <CardContent>
                  <ResponsiveContainer width="100%" height={350}>
                    <BarChart
                      data={detailedStats?.by_authority ? Object.entries(detailedStats.by_authority).map(([key, value]) => ({ name: key, permits: value })) : []}
                      margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="permits" fill="#667eea" name="Number of Permits" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>

            {/* Permit Types Distribution - Full Width */}
            <Grid item xs={12}>
              <Card sx={{ mb: 3 }}>
                <CardHeader title="Permit Types Distribution" sx={{ bgcolor: '#f5f5f5' }} />
                <CardContent>
                  <ResponsiveContainer width="100%" height={450}>
                    <BarChart
                      data={detailedStats?.by_permit_type ? Object.entries(detailedStats.by_permit_type).map(([key, value]) => ({ name: key, permits: value })) : []}
                      layout="vertical"
                      margin={{ left: 150, right: 30, top: 20, bottom: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="name" type="category" width={140} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="permits" fill="#11998e" name="Number of Permits" radius={[0, 8, 8, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>

            {/* Vehicle Types Distribution - Full Width */}
            <Grid item xs={12}>
              <Card>
                <CardHeader title="Vehicle Types Distribution" sx={{ bgcolor: '#f5f5f5' }} />
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart
                      data={detailedStats?.by_vehicle_type ? Object.entries(detailedStats.by_vehicle_type).map(([key, value]) => ({ name: key, permits: value })) : []}
                      layout="vertical"
                      margin={{ left: 150, right: 30, top: 20, bottom: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="name" type="category" width={140} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="permits" fill="#f7971e" name="Number of Permits" radius={[0, 8, 8, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}
      </Box>
    );
  };

  // Permit Type Report Tab
  const renderPermitTypeReport = () => (
    <Box>
      {loading ? (
        <CircularProgress />
      ) : permitTypeReport.length > 0 ? (
        <Grid container spacing={3}>
          {permitTypeReport.map((item, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Card>
                <CardHeader
                  title={item.permit_type}
                  subheader={`Code: ${item.permit_code}`}
                  action={<Chip label={`Total: ${item.total}`} color="primary" />}
                />
                <CardContent>
                  <Box sx={{ mb: 1 }}>
                    <Typography variant="caption" sx={{ color: '#475569', fontWeight: 500 }}>
                      Active: {item.active}
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={(item.active / Math.max(item.total, 1)) * 100}
                      sx={{ mb: 2 }}
                    />
                  </Box>
                  <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
                    <Box>
                      <Typography variant="caption" color="error">
                        Expired: {item.expired}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="warning">
                        Cancelled: {item.cancelled}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="info">
                        Pending: {item.pending}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="disabled">
                        Inactive: {item.inactive}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
          <Grid item xs={12}>
            <Button
              variant="contained"
              color="primary"
              onClick={() => downloadReport(permitTypeReport, 'permit_type_report.csv')}
            >
              Download Report
            </Button>
          </Grid>
        </Grid>
      ) : (
        <Typography>No data available</Typography>
      )}
    </Box>
  );

  // Vehicle Type Report Tab
  const renderVehicleTypeReport = () => (
    <Box>
      {loading ? (
        <CircularProgress />
      ) : vehicleTypeReport.length > 0 ? (
        <Grid container spacing={3}>
          {vehicleTypeReport.map((item, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Card>
                <CardHeader
                  title={item.vehicle_type}
                  action={<Chip label={`Total: ${item.total}`} color="primary" />}
                />
                <CardContent>
                  <Box sx={{ mb: 1 }}>
                    <Typography variant="caption" sx={{ color: '#475569', fontWeight: 500 }}>
                      Active: {item.active}
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={(item.active / Math.max(item.total, 1)) * 100}
                      sx={{ mb: 2 }}
                    />
                  </Box>
                  <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
                    <Box>
                      <Typography variant="caption" color="error">
                        Expired: {item.expired}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
          <Grid item xs={12}>
            <Button
              variant="contained"
              color="primary"
              onClick={() => downloadReport(vehicleTypeReport, 'vehicle_type_report.csv')}
            >
              Download Report
            </Button>
          </Grid>
        </Grid>
      ) : (
        <Typography>No data available</Typography>
      )}
    </Box>
  );

  // Authority Report Tab
  const renderAuthorityReport = () => (
    <Box>
      {loading ? (
        <CircularProgress />
      ) : authorityReport.length > 0 ? (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                    <TableCell><strong>Authority</strong></TableCell>
                    <TableCell align="right"><strong>Total</strong></TableCell>
                    <TableCell align="right"><strong>Active</strong></TableCell>
                    <TableCell align="right"><strong>Inactive</strong></TableCell>
                    <TableCell align="right"><strong>Cancelled</strong></TableCell>
                    <TableCell align="right"><strong>Expired</strong></TableCell>
                    <TableCell align="right"><strong>Pending</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {authorityReport.map((item, index) => (
                    <TableRow key={index} hover>
                      <TableCell>{item.authority}</TableCell>
                      <TableCell align="right">{item.total_permits}</TableCell>
                      <TableCell align="right">
                        <Chip label={item.active} color="success" size="small" />
                      </TableCell>
                      <TableCell align="right">{item.inactive}</TableCell>
                      <TableCell align="right">{item.cancelled}</TableCell>
                      <TableCell align="right">{item.expired}</TableCell>
                      <TableCell align="right">{item.pending}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Grid>
          <Grid item xs={12}>
            <Button
              variant="contained"
              color="primary"
              onClick={() => downloadReport(authorityReport, 'authority_report.csv')}
            >
              Download Report
            </Button>
          </Grid>
        </Grid>
      ) : (
        <Typography>No data available</Typography>
      )}
    </Box>
  );

  // Expiring Permits Tab
  const renderExpiringReport = () => (
    <Box>
      {loading ? (
        <CircularProgress />
      ) : expiringReport.length > 0 ? (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Alert severity="warning">
              {expiringReport.length} permit(s) expiring within 30 days
            </Alert>
          </Grid>
          <Grid item xs={12}>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                    <TableCell><strong>Permit #</strong></TableCell>
                    <TableCell><strong>Vehicle</strong></TableCell>
                    <TableCell><strong>Owner</strong></TableCell>
                    <TableCell><strong>Type</strong></TableCell>
                    <TableCell><strong>Valid To</strong></TableCell>
                    <TableCell><strong>Days Left</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {expiringReport.map((item) => {
                    const daysLeft = Math.ceil(
                      (new Date(item.valid_to) - new Date()) / (1000 * 60 * 60 * 24)
                    );
                    return (
                      <TableRow key={item.id} hover>
                        <TableCell>{item.permit_number}</TableCell>
                        <TableCell>{item.vehicle_number}</TableCell>
                        <TableCell>{item.owner_name}</TableCell>
                        <TableCell>
                          {item.permit_type && typeof item.permit_type === 'object'
                            ? item.permit_type.name
                            : item.permit_type}
                        </TableCell>
                        <TableCell>{item.valid_to}</TableCell>
                        <TableCell>
                          <Chip
                            label={`${daysLeft} days`}
                            color={daysLeft <= 7 ? 'error' : daysLeft <= 15 ? 'warning' : 'default'}
                            size="small"
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Grid>
          <Grid item xs={12}>
            <Button
              variant="contained"
              color="primary"
              onClick={() => downloadReport(expiringReport, 'expiring_permits_report.csv')}
            >
              Download Report
            </Button>
          </Grid>
        </Grid>
      ) : (
        <Typography>No permits expiring soon</Typography>
      )}
    </Box>
  );

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 3, fontWeight: 'bold' }}>
        Permit Reports & Analytics
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Paper>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          sx={{
            borderBottom: '1px solid #ddd',
            '& .MuiTab-root': {
              textTransform: 'none',
              fontSize: '0.95rem',
              fontWeight: 500,
            },
          }}
        >
          <Tab label="Dashboard" icon={<AnalyticsIcon />} iconPosition="start" />
          <Tab label="Permit Types" icon={<AssignmentIcon />} iconPosition="start" />
          <Tab label="Vehicle Types" icon={<AssignmentIcon />} iconPosition="start" />
          <Tab label="Authority Summary" icon={<TrendingUpIcon />} iconPosition="start" />
          <Tab label="Expiring Permits" icon={<HistoryIcon />} iconPosition="start" />
        </Tabs>

        <Box sx={{ p: 3 }}>
          {tabValue === 0 && renderDashboard()}
          {tabValue === 1 && renderPermitTypeReport()}
          {tabValue === 2 && renderVehicleTypeReport()}
          {tabValue === 3 && renderAuthorityReport()}
          {tabValue === 4 && renderExpiringReport()}
        </Box>
      </Paper>

      {/* History Dialog */}
      <Dialog open={historyDialog} onClose={() => setHistoryDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Permit History</DialogTitle>
        <DialogContent dividers>
          {historyData.length > 0 ? (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                    <TableCell><strong>Action</strong></TableCell>
                    <TableCell><strong>By</strong></TableCell>
                    <TableCell><strong>Date</strong></TableCell>
                    <TableCell><strong>Notes</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {historyData.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Chip label={item.action} variant="outlined" size="small" />
                      </TableCell>
                      <TableCell>{item.performed_by}</TableCell>
                      <TableCell>{new Date(item.timestamp).toLocaleString()}</TableCell>
                      <TableCell>{item.notes}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Typography>No history records found</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setHistoryDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Reports;
