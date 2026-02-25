import React, { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Box,
  Typography,
  Alert,
  CircularProgress,
  Chip,
  Toolbar,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import {
  Add as AddIcon,
} from '@mui/icons-material';
import apiClient from '../services/apiClient';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    role_id: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/users/');
      setUsers(response.data.results || response.data);
      setError('');
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const response = await apiClient.get('/roles/');
      setRoles(response.data.results || response.data);
    } catch (err) {
      console.error('Error fetching roles:', err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await apiClient.post('/users/create-user/', formData);
      setSuccess('User created successfully');
      setShowModal(false);
      setFormData({
        username: '',
        email: '',
        password: '',
        first_name: '',
        last_name: '',
        role_id: ''
      });
      fetchUsers();
    } catch (err) {
      console.error('Error creating user:', err);
      setError(err.response?.data?.error || 'Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignRole = async (userId, roleId) => {
    try {
      setLoading(true);
      await apiClient.post(`/users/${userId}/assign_role/`, {
        role_id: roleId
      });
      setSuccess('Role assigned successfully');
      fetchUsers();
    } catch (err) {
      console.error('Error assigning role:', err);
      setError('Failed to assign role');
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivateUser = async (userId) => {
    if (window.confirm('Are you sure you want to deactivate this user?')) {
      try {
        setLoading(true);
        await apiClient.post(`/users/${userId}/deactivate/`);
        setSuccess('User deactivated successfully');
        fetchUsers();
      } catch (err) {
        console.error('Error deactivating user:', err);
        setError('Failed to deactivate user');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleActivateUser = async (userId) => {
    try {
      setLoading(true);
      await apiClient.post(`/users/${userId}/activate/`);
      setSuccess('User activated successfully');
      fetchUsers();
    } catch (err) {
      console.error('Error activating user:', err);
      setError('Failed to activate user');
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user =>
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
      <Toolbar sx={{ pl: 0, pr: 0, mb: 3 }}>
        <Typography variant="h5" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
          👥 User Management
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => setShowModal(true)}
        >
          Add New User
        </Button>
      </Toolbar>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          placeholder="Search users by username or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          variant="outlined"
          size="small"
          sx={{ maxWidth: 400 }}
        />
      </Box>

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      )}

      <TableContainer component={Paper} sx={{ boxShadow: 2, borderRadius: 1, mb: 4 }}>
        <Table>
          <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold', padding: '16px' }}>Username</TableCell>
              <TableCell sx={{ fontWeight: 'bold', padding: '16px' }}>Email</TableCell>
              <TableCell sx={{ fontWeight: 'bold', padding: '16px' }}>Full Name</TableCell>
              <TableCell sx={{ fontWeight: 'bold', padding: '16px' }}>Role</TableCell>
              <TableCell sx={{ fontWeight: 'bold', padding: '16px' }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 'bold', padding: '16px' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredUsers.length > 0 ? (
              filteredUsers.map(user => (
                <TableRow
                  key={user.id}
                  sx={{
                    backgroundColor: !user.is_active ? '#f0f0f0' : 'inherit',
                    '&:hover': {
                      backgroundColor: '#f9f9f9',
                    },
                  }}
                >
                  <TableCell>{user.username}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.first_name} {user.last_name}</TableCell>
                  <TableCell>
                    {user.role ? (
                      <Chip
                        label={user.role.display_name}
                        color="primary"
                        variant="outlined"
                        size="small"
                      />
                    ) : (
                      <FormControl size="small" sx={{ minWidth: 150 }}>
                        <Select
                          value=""
                          displayEmpty
                          onChange={(e) => handleAssignRole(user.id, e.target.value)}
                        >
                          <MenuItem value="" disabled>Assign Role</MenuItem>
                          {roles.map(role => (
                            <MenuItem key={role.id} value={role.id}>
                              {role.display_name}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={user.is_active ? 'Active' : 'Inactive'}
                      color={user.is_active ? 'success' : 'error'}
                      variant="filled"
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {user.is_active ? (
                      <Button
                        size="small"
                        color="warning"
                        variant="outlined"
                        onClick={() => handleDeactivateUser(user.id)}
                      >
                        Deactivate
                      </Button>
                    ) : (
                      <Button
                        size="small"
                        color="success"
                        variant="outlined"
                        onClick={() => handleActivateUser(user.id)}
                      >
                        Activate
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan="6" sx={{ textAlign: 'center', py: 3 }}>
                  <Typography color="textSecondary">No users found</Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Create User Dialog */}
      <Dialog open={showModal} onClose={() => setShowModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ bgcolor: '#1976d2', color: 'white', fontWeight: 'bold' }}>
          Create New User
        </DialogTitle>
        <DialogContent sx={{ mt: 2, pb: 3 }}>
          <TextField
            fullWidth
            label="Username"
            name="username"
            value={formData.username}
            onChange={handleInputChange}
            margin="normal"
            required
            size="small"
          />
          <TextField
            fullWidth
            label="Email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleInputChange}
            margin="normal"
            required
            size="small"
          />
          <TextField
            fullWidth
            label="Password"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleInputChange}
            margin="normal"
            required
            size="small"
          />
          <TextField
            fullWidth
            label="First Name"
            name="first_name"
            value={formData.first_name}
            onChange={handleInputChange}
            margin="normal"
            size="small"
          />
          <TextField
            fullWidth
            label="Last Name"
            name="last_name"
            value={formData.last_name}
            onChange={handleInputChange}
            margin="normal"
            size="small"
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>Role</InputLabel>
            <Select
              name="role_id"
              value={formData.role_id}
              onChange={handleInputChange}
              label="Role"
              size="small"
            >
              <MenuItem value="">
                <em>Select a role</em>
              </MenuItem>
              {roles.map(role => (
                <MenuItem key={role.id} value={role.id}>
                  {role.display_name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ p: 2, bgcolor: '#f5f5f5' }}>
          <Button onClick={() => setShowModal(false)}>Cancel</Button>
          <Button
            onClick={handleCreateUser}
            variant="contained"
            color="primary"
            disabled={loading || !formData.username.trim()}
          >
            Create User
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UserManagement;
