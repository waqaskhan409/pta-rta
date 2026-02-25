import React, { useState, useEffect, useCallback } from 'react';
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Box,
  TextField,
  CircularProgress,
  Alert,
  Chip,
  Toolbar,
  Typography,
  Tooltip,
  Badge,
  TablePagination,
} from '@mui/material';
import { Visibility as ViewIcon, History as HistoryIcon, Description as DescriptionIcon, Print as PrintIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import apiClient from '../services/apiClient';
import PermitModal from '../components/PermitModal';
import { isColumnVisible, getVisibleColumnCount, hasFeature } from '../utils/permissions';
import '../styles/page.css';

function PermitList() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [permits, setPermits] = useState([]);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('pending');
  const [authorityFilter, setAuthorityFilter] = useState('RTA');
  const [typeFilter, setTypeFilter] = useState('all');
  const [assignedFilter, setAssignedFilter] = useState('all');
  const [selectedPermit, setSelectedPermit] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [historyTabActive, setHistoryTabActive] = useState(false);
  const [showPrintCertificateOnOpen, setShowPrintCertificateOnOpen] = useState(false);
  const [permitTypes, setPermitTypes] = useState([]);
  const [assignedUsers, setAssignedUsers] = useState([]);

  // Pagination state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [totalCount, setTotalCount] = useState(0);

  // Debounce timer ref
  const debounceTimerRef = React.useRef(null);

  // Track if we've initialized the assigned filter to avoid resetting on every render
  const initializedAssignedFilterRef = React.useRef(false);

  const fetchPermitTypes = useCallback(async () => {
    try {
      const response = await apiClient.get('/permit-types/');
      const types = response.data.results || response.data;
      console.log('Permit types fetched:', types);
      setPermitTypes(types);
    } catch (err) {
      console.error('Error fetching permit types:', err);
      setPermitTypes([]);
    }
  }, []);

  const fetchAssignedUsers = useCallback(async () => {
    try {
      const response = await apiClient.get('/permits/all_employees/');
      let users = response.data.results || response.data || [];

      // Ensure users is an array
      if (!Array.isArray(users)) {
        users = [];
      }

      console.log('All employees fetched:', users);
      setAssignedUsers(users);
    } catch (err) {
      console.error('Error fetching employees:', err);
      setAssignedUsers([]);
    }
  }, []);

  const fetchPermits = useCallback(async (pageNum = 0) => {
    try {
      // Build query parameters for backend filtering
      const params = {
        page: pageNum + 1, // Backend uses 1-based pagination
        page_size: rowsPerPage,
        t: Date.now() // Cache buster
      };

      // Add filter parameters
      if (statusFilter && statusFilter !== 'all') {
        params.status = statusFilter;
      }
      if (authorityFilter && authorityFilter !== 'all') {
        params.authority = authorityFilter;
      }
      if (typeFilter && typeFilter !== 'all') {
        params.permit_type = typeFilter;
      }
      if (assignedFilter && assignedFilter !== 'all') {
        if (assignedFilter === 'unassigned') {
          params.assigned_to__isnull = 'true';
        } else {
          params.assigned_to = assignedFilter;
        }
      }
      if (searchTerm.trim()) {
        params.search = searchTerm.trim();
      }

      console.log('[PermitList] Fetching with params:', params);

      const response = await apiClient.get('/permits/', { params });
      const data = response.data.results || response.data;

      console.log(`[PermitList] API Response:`, {
        totalCount: response.data.count,
        resultsLength: data.length,
        currentPage: pageNum + 1,
        pageSize: rowsPerPage
      });

      setPermits(data);
      setTotalCount(response.data.count || 0);
      setError(null);

      // Mark initial load complete
      if (isInitialLoad) {
        setIsInitialLoad(false);
      }
    } catch (err) {
      setError('Failed to load permits');
      console.error('[PermitList] Error:', err);

      // Mark initial load complete even on error
      if (isInitialLoad) {
        setIsInitialLoad(false);
      }
    } finally {
      // Loading state removed - not used in render
    }
  }, [statusFilter, authorityFilter, typeFilter, assignedFilter, searchTerm, rowsPerPage, isInitialLoad]);

  // Debounce search - only fetch after user stops typing for 500ms
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      setPage(0); // Reset to first page when search/filters change
      fetchPermits(0);
    }, 500);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [searchTerm, fetchPermits]);

  // Fetch permits when user changes (login/logout) or component mounts
  useEffect(() => {
    if (user && user.id) {
      console.log(`[PermitList] User authenticated: ${user.username}, refetching permits...`);
      setPage(0);
      fetchPermits(0);
      fetchPermitTypes();
      fetchAssignedUsers();
      // Set assigned filter to current user by default ONLY on first login (and only if they're an employee)
      if (!initializedAssignedFilterRef.current) {
        if (hasFeature(user, 'employee') || user?.is_staff) {
          setAssignedFilter(String(user.id));
        } else {
          setAssignedFilter('all');
        }
        initializedAssignedFilterRef.current = true;
      }
    } else {
      console.log('[PermitList] User not authenticated, skipping fetch');
      setPermits([]);
      setAssignedFilter('all');
      initializedAssignedFilterRef.current = false;
    }
  }, [user, fetchPermits, fetchPermitTypes, fetchAssignedUsers]);

  // Fetch permits when non-search filters change (without debounce)
  useEffect(() => {
    setPage(0);
    fetchPermits(0);
  }, [statusFilter, authorityFilter, typeFilter, assignedFilter, fetchPermits]);

  const handleViewPermit = async (permit, isPrint = false) => {
    try {
      // Fetch full permit details including history
      const permitId = permit.id || permit.pk;
      const response = await apiClient.get(`/permits/${permitId}/`);
      console.log('Permit data with history:', response.data);
      setSelectedPermit(response.data);
      setIsEditMode(false);
      setShowPrintCertificateOnOpen(isPrint);
      setModalOpen(true);
    } catch (err) {
      console.error('Failed to load permit details:', err);
      // Fallback to showing the basic permit data
      setSelectedPermit(permit);
      setIsEditMode(false);
      setShowPrintCertificateOnOpen(isPrint);
      setModalOpen(true);
    }
  };

  const handleViewHistory = async (permit) => {
    try {
      // Fetch full permit details including history
      const permitId = permit.id || permit.pk;
      const response = await apiClient.get(`/permits/${permitId}/`);
      console.log('Opening history for permit:', response.data);
      setSelectedPermit(response.data);
      setIsEditMode(false);
      setModalOpen(true);
      // Signal modal to open on History tab
      setTimeout(() => {
        setHistoryTabActive(true);
      }, 100);
    } catch (err) {
      console.error('Failed to load permit history:', err);
      setSelectedPermit(permit);
      setIsEditMode(false);
      setModalOpen(true);
      setTimeout(() => {
        setHistoryTabActive(true);
      }, 100);
    }
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setSelectedPermit(null);
    setHistoryTabActive(false);
    setShowPrintCertificateOnOpen(false);
  };

  const handleSavePermit = () => {
    setPage(0);
    fetchPermits(0);
  };

  const handlePageChange = (event, newPage) => {
    setPage(newPage);
    fetchPermits(newPage);
    // Scroll to top of table
    document.querySelector('[role="table"]')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleRowsPerPageChange = (event) => {
    const newRowsPerPage = parseInt(event.target.value, 10);
    setRowsPerPage(newRowsPerPage);
    setPage(0);
    fetchPermits(0);
  };

  const getStatusColor = (status) => {
    const colors = {
      'active': 'success',
      'inactive': 'default',
      'pending': 'warning',
      'cancelled': 'error',
      'expired': 'error',
    };
    return colors[status] || 'default';
  };

  const getLastAction = (permit) => {
    if (!permit.history || permit.history.length === 0) {
      return { action: 'Created', time: new Date(permit.issued_date) };
    }
    const lastRecord = permit.history[0];
    return {
      action: lastRecord.action.charAt(0).toUpperCase() + lastRecord.action.slice(1),
      time: new Date(lastRecord.timestamp)
    };
  };

  const getActionColor = (action) => {
    const colors = {
      'created': 'info',
      'updated': 'default',
      'activated': 'success',
      'deactivated': 'warning',
      'cancelled': 'error',
      'renewed': 'success',
    };
    return colors[action.toLowerCase()] || 'default';
  };

  const formatTimeAgo = (date) => {
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  if (isInitialLoad) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
      <Toolbar sx={{ pl: 0, pr: 0, mb: 2 }}>
        <Typography variant="h5" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
          📋 Permits Management
        </Typography>
        <Typography variant="caption" sx={{ color: '#666' }}>
          {permits.length} of {totalCount} permits (Page {page + 1})
        </Typography>
      </Toolbar>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Search and Filters Section */}
      <Paper sx={{ mb: 2, p: 2 }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '2fr 1fr 1fr 1fr 1fr' }, gap: 2 }}>
          {/* Search Box */}
          <TextField
            label="🔍 Search Permits"
            placeholder="Permit #, Vehicle, Owner, Email, Phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            size="small"
            fullWidth
            variant="outlined"
            helperText={searchTerm ? `Searching... (results updated with 500ms debounce)` : ''}
          />

          {/* Status Filter */}
          <TextField
            label="Status"
            select
            SelectProps={{ native: true }}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            size="small"
            fullWidth
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="pending">Pending</option>
            <option value="cancelled">Cancelled</option>
            <option value="expired">Expired</option>
          </TextField>

          {/* Authority Filter */}
          <TextField
            label="Authority"
            select
            SelectProps={{ native: true }}
            value={authorityFilter}
            size="small"
            fullWidth
            disabled={true}
          >
            <option value="all">All Authority</option>
            <option value="PTA">PTA</option>
            <option value="RTA">RTA</option>
          </TextField>

          {/* Type Filter */}
          <TextField
            label="Permit Type"
            select
            SelectProps={{ native: true }}
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            size="small"
            fullWidth
          >
            <option value="all">All Types</option>
            {permitTypes.map((type) => (
              <option key={type.id} value={type.code}>
                {type.name} ({type.code})
              </option>
            ))}
          </TextField>

          {/* Assigned To Filter - Only show if user is employee */}
          {(hasFeature(user, 'employee') || user?.is_staff) && (
            <TextField
              label="Assigned To"
              select
              SelectProps={{ native: true }}
              value={assignedFilter}
              onChange={(e) => setAssignedFilter(e.target.value)}
              size="small"
              fullWidth
            >
              <option value="all">All Assignments</option>
              <option value="unassigned">Unassigned</option>
              {assignedUsers.map((user) => (
                <option key={user.id} value={String(user.id)}>
                  {user.full_name} ({user.role.toUpperCase()})
                </option>
              ))}
            </TextField>
          )}
        </Box>

        {/* Active Filters Display */}
        {(searchTerm || statusFilter !== 'pending' || typeFilter !== 'all' || String(assignedFilter) !== String(user?.id)) && (
          <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
            <Typography variant="caption" sx={{ fontWeight: 'bold' }}>Active Filters:</Typography>
            {searchTerm && (
              <Chip
                label={`Search: "${searchTerm}"`}
                onDelete={() => setSearchTerm('')}
                size="small"
                color="primary"
              />
            )}
            {statusFilter !== 'pending' && (
              <Chip
                label={`Status: ${statusFilter}`}
                onDelete={() => setStatusFilter('pending')}
                size="small"
              />
            )}
            {authorityFilter !== 'all' && (
              <Chip
                label={`Authority: ${authorityFilter} (Locked)`}
                size="small"
                disabled={true}
              />
            )}
            {typeFilter !== 'all' && (
              <Chip
                label={`Type: ${typeFilter}`}
                onDelete={() => setTypeFilter('all')}
                size="small"
              />
            )}
            {(hasFeature(user, 'employee') || user?.is_staff) && assignedFilter !== 'all' && String(assignedFilter) !== String(user?.id) && (
              <Chip
                label={`Assigned: ${assignedFilter === 'unassigned' ? 'Unassigned' : assignedFilter}`}
                onDelete={() => setAssignedFilter(String(user?.id))}
                size="small"
              />
            )}
            <Button
              size="small"
              variant="outlined"
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('pending');
                setAuthorityFilter('RTA');
                setTypeFilter('all');
                setAssignedFilter(String(user?.id));
              }}
            >
              Clear All
            </Button>
          </Box>
        )}
      </Paper>

      <TableContainer component={Paper} sx={{ boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <Table>
          <TableHead sx={{ backgroundColor: '#1976d2' }}>
            <TableRow>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Permit #</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Vehicle</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Owner</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Authority</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Type</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Status</TableCell>
              {isColumnVisible(user, 'assignedTo') && <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Assigned To</TableCell>}
              {isColumnVisible(user, 'lastAction') && <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Last Action</TableCell>}
              <TableCell sx={{ color: 'white', fontWeight: 'bold', textAlign: 'center' }}>Renewal Status</TableCell>
              {isColumnVisible(user, 'changes') && <TableCell sx={{ color: 'white', fontWeight: 'bold', textAlign: 'center' }}>Changes</TableCell>}
              {isColumnVisible(user, 'modified') && <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Modified</TableCell>}
              <TableCell sx={{ color: 'white', fontWeight: 'bold', textAlign: 'center' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {permits.length > 0 ? (
              permits.map((permit) => {
                const lastAction = getLastAction(permit);
                const historyCount = permit.history ? permit.history.length : 0;
                return (
                  <TableRow key={permit.id} hover sx={{ '&:hover': { backgroundColor: '#f5f5f5' } }}>
                    <TableCell sx={{ fontWeight: '500' }}>{permit.permit_number}</TableCell>
                    <TableCell>{permit.vehicle_number}</TableCell>
                    <TableCell>{permit.owner_name}</TableCell>
                    <TableCell>{permit.authority}</TableCell>
                    <TableCell sx={{ textTransform: 'capitalize' }}>
                      {permit.permit_type && typeof permit.permit_type === 'object'
                        ? permit.permit_type.name
                        : permit.permit_type}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={permit.status}
                        color={getStatusColor(permit.status)}
                        variant="outlined"
                        size="small"
                      />
                    </TableCell>
                    {isColumnVisible(user, 'assignedTo') && (
                      <TableCell>
                        {permit.assigned_to_full_name ? (
                          <Tooltip title={`Assigned to: ${permit.assigned_to_full_name}`}>
                            <Chip
                              label={permit.assigned_to_full_name}
                              variant="outlined"
                              size="small"
                              color="primary"
                            />
                          </Tooltip>
                        ) : (
                          <span style={{ fontSize: '0.85rem', color: '#999' }}>Unassigned</span>
                        )}
                      </TableCell>
                    )}
                    {isColumnVisible(user, 'lastAction') && (
                      <TableCell>
                        <Tooltip title={new Date(lastAction.time).toLocaleString()}>
                          <Chip
                            icon={<HistoryIcon />}
                            label={lastAction.action}
                            color={getActionColor(lastAction.action)}
                            variant="outlined"
                            size="small"
                          />
                        </Tooltip>
                      </TableCell>
                    )}
                    <TableCell sx={{ textAlign: 'center' }}>
                      {permit.has_previous_permits ? (
                        <Tooltip title={`This permit is a renewal from expired permit${permit.previous_permits?.length > 1 ? 's' : ''}: ${permit.previous_permits?.map(p => p.permit_number).join(', ') || 'Unknown'}`}>
                          <Chip
                            label="Renewal"
                            color="warning"
                            size="small"
                            sx={{
                              backgroundColor: '#ff9800',
                              color: 'white',
                              fontWeight: 'bold',
                              cursor: 'pointer'
                            }}
                          />
                        </Tooltip>
                      ) : (
                        <Chip
                          label="New"
                          color="default"
                          size="small"
                          variant="outlined"
                        />
                      )}
                    </TableCell>
                    {isColumnVisible(user, 'changes') && (
                      <TableCell sx={{ textAlign: 'center' }}>
                        <Badge
                          badgeContent={historyCount}
                          color="primary"
                          sx={{
                            '& .MuiBadge-badge': {
                              fontSize: '0.75rem',
                              height: '20px',
                              minWidth: '20px',
                              borderRadius: '50%',
                            }
                          }}
                        >
                          <Chip
                            label="History"
                            size="small"
                            variant="outlined"
                            color="primary"
                            onClick={() => handleViewHistory(permit)}
                            sx={{
                              minWidth: '80px',
                              cursor: 'pointer',
                              '&:hover': {
                                backgroundColor: '#e3f2fd',
                                fontWeight: 'bold'
                              }
                            }}
                          />
                        </Badge>
                      </TableCell>
                    )}
                    {isColumnVisible(user, 'modified') && <TableCell sx={{ fontSize: '0.85rem', color: '#666' }}>
                      {formatTimeAgo(lastAction.time)}
                    </TableCell>}
                    <TableCell sx={{ textAlign: 'center' }}>
                      <Tooltip title="View Details">
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<DescriptionIcon />}
                          onClick={() => navigate(`/permit-details/${permit.id}`)}
                          sx={{ mr: 1 }}
                        >
                          Details
                        </Button>
                      </Tooltip>
                      <Tooltip title="View Permit">
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<ViewIcon />}
                          onClick={() => handleViewPermit(permit)}
                          sx={{ mr: 1 }}
                        >
                          View
                        </Button>
                      </Tooltip>
                      {permit.status === 'active' && (
                        <Tooltip title="Print Certificate">
                          <Button
                            variant="outlined"
                            size="small"
                            color="info"
                            startIcon={<PrintIcon />}
                            onClick={() => handleViewPermit(permit, true)}
                            sx={{ mr: 1 }}
                          >
                            Print
                          </Button>
                        </Tooltip>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={getVisibleColumnCount(user)} sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant="body1" color="textSecondary">
                    No permits found
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        rowsPerPageOptions={[10, 20, 50, 100]}
        component="div"
        count={totalCount}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handlePageChange}
        onRowsPerPageChange={handleRowsPerPageChange}
        sx={{ display: 'flex', justifyContent: 'flex-end', backgroundColor: '#f5f5f5', mt: 1 }}
      />

      <PermitModal
        open={modalOpen}
        permit={selectedPermit}
        onClose={handleModalClose}
        onSave={handleSavePermit}
        isEditMode={isEditMode}
        showHistoryTab={historyTabActive}
        showPrintCertificateOnOpen={showPrintCertificateOnOpen}
      />
    </Box>
  );
}

export default PermitList;
