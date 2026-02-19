import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  TextField,
  Button,
  Box,
  Typography,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  Grid,
  Card,
  CardContent,
  IconButton,
  InputAdornment,
  Divider,
  Avatar,
  Chip,
  Stack,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Person as PersonIcon,
  Lock as LockIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import apiClient from '../services/apiClient';

function TabPanel(props) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`profile-tabpanel-${index}`}
      aria-labelledby={`profile-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

const Profile = () => {
  const { user, logout } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  // Profile form state
  const [profileData, setProfileData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    username: '',
  });

  // Password form state
  const [passwordData, setPasswordData] = useState({
    old_password: '',
    new_password: '',
    confirm_password: '',
  });

  // Password visibility state
  const [showPasswords, setShowPasswords] = useState({
    old_password: false,
    new_password: false,
    confirm_password: false,
  });

  // Initialize profile data from user
  useEffect(() => {
    if (user) {
      setProfileData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
        username: user.username || '',
      });
    }
  }, [user]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    setSuccessMessage('');
    setErrorMessage('');
  };

  // Profile handlers
  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleEditProfile = () => {
    setIsEditingProfile(true);
    setSuccessMessage('');
    setErrorMessage('');
  };

  const handleCancelEdit = () => {
    setIsEditingProfile(false);
    if (user) {
      setProfileData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
        username: user.username || '',
      });
    }
    setErrorMessage('');
  };

  const handleSaveProfile = async () => {
    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const response = await apiClient.put('/auth/update-profile/', {
        first_name: profileData.first_name,
        last_name: profileData.last_name,
        email: profileData.email,
      });

      if (response.data.status === 'success') {
        setSuccessMessage('Profile updated successfully');
        setIsEditingProfile(false);
        // Update user in context if needed
        setTimeout(() => {
          setSuccessMessage('');
        }, 4000);
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Failed to update profile';
      setErrorMessage(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Password handlers
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleTogglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const handleChangePassword = async () => {
    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    // Validation
    if (!passwordData.old_password) {
      setErrorMessage('Please enter your old password');
      setLoading(false);
      return;
    }

    if (!passwordData.new_password) {
      setErrorMessage('Please enter a new password');
      setLoading(false);
      return;
    }

    if (!passwordData.confirm_password) {
      setErrorMessage('Please confirm your new password');
      setLoading(false);
      return;
    }

    if (passwordData.new_password !== passwordData.confirm_password) {
      setErrorMessage('Passwords do not match');
      setLoading(false);
      return;
    }

    if (passwordData.new_password.length < 8) {
      setErrorMessage('Password must be at least 8 characters long');
      setLoading(false);
      return;
    }

    try {
      const response = await apiClient.post('/auth/change-password/', {
        old_password: passwordData.old_password,
        new_password: passwordData.new_password,
        confirm_password: passwordData.confirm_password,
      });

      if (response.data.status === 'success') {
        setSuccessMessage('Password changed successfully. You will be logged out shortly.');
        setPasswordData({
          old_password: '',
          new_password: '',
          confirm_password: '',
        });
        setShowPasswords({
          old_password: false,
          new_password: false,
          confirm_password: false,
        });

        // Update token and logout after a brief delay
        setTimeout(() => {
          if (response.data.token) {
            localStorage.setItem('token', response.data.token);
          }
          logout();
        }, 2000);
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Failed to change password';
      setErrorMessage(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <Container sx={{ py: 4, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress size={60} />
      </Container>
    );
  }

  // Generate initials for avatar
  const initials = `${user.first_name?.charAt(0) || ''}${user.last_name?.charAt(0) || ''}`.toUpperCase();

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      {/* Header Card with User Avatar */}
      <Paper
        elevation={0}
        sx={{
          background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
          borderRadius: '16px',
          p: 4,
          mb: 3,
          textAlign: 'center',
          color: 'white',
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: -50,
            right: -50,
            width: 200,
            height: 200,
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '50%',
          }
        }}
      >
        <Box sx={{ position: 'relative', zIndex: 1 }}>
          <Avatar
            sx={{
              width: 100,
              height: 100,
              margin: '0 auto 16px',
              background: 'rgba(255, 255, 255, 0.3)',
              fontSize: '2.5rem',
              fontWeight: 'bold',
              border: '3px solid rgba(255, 255, 255, 0.5)',
            }}
          >
            {initials || <PersonIcon sx={{ fontSize: 60 }} />}
          </Avatar>
          <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 0.5, color: 'white' }}>
            {user.first_name} {user.last_name}
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.9, color: 'white' }}>
            @{user.username}
          </Typography>
          <Chip
            label={`Member since ${new Date(user.date_joined).toLocaleDateString()}`}
            size="small"
            sx={{
              mt: 2,
              background: 'rgba(255, 255, 255, 0.2)',
              color: 'white',
              fontWeight: 500,
            }}
          />
        </Box>
      </Paper>

      {/* Alert Messages */}
      {successMessage && (
        <Alert
          severity="success"
          icon={<CheckCircleIcon />}
          onClose={() => setSuccessMessage('')}
          sx={{
            mb: 2,
            borderRadius: '12px',
            backgroundColor: '#e8f5e9',
            borderLeft: '4px solid #4caf50',
          }}
        >
          {successMessage}
        </Alert>
      )}

      {errorMessage && (
        <Alert
          severity="error"
          icon={<WarningIcon />}
          onClose={() => setErrorMessage('')}
          sx={{
            mb: 2,
            borderRadius: '12px',
            backgroundColor: '#ffebee',
            borderLeft: '4px solid #f44336',
          }}
        >
          {errorMessage}
        </Alert>
      )}

      {/* Main Content Card */}
      <Paper
        elevation={2}
        sx={{
          borderRadius: '16px',
          overflow: 'hidden',
          background: '#fff',
        }}
      >
        {/* Styled Tabs */}
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          aria-label="profile tabs"
          sx={{
            background: '#f8f9fa',
            borderBottom: '2px solid #e0e0e0',
            '& .MuiTab-root': {
              textTransform: 'none',
              fontSize: '1rem',
              fontWeight: 500,
              py: 2,
              color: '#666',
              transition: 'all 0.3s ease',
              '&:hover': {
                color: '#1976d2',
                background: 'rgba(25, 118, 210, 0.05)',
              },
              '&.Mui-selected': {
                color: '#1976d2',
                fontWeight: 600,
              }
            },
            '& .MuiTabs-indicator': {
              background: 'linear-gradient(90deg, #1976d2, #1565c0)',
              height: 3,
              borderRadius: '3px 3px 0 0',
            }
          }}
        >
          <Tab
            icon={<PersonIcon sx={{ mr: 1 }} />}
            iconPosition="start"
            label="Profile Information"
            id="profile-tab-0"
            aria-controls="profile-tabpanel-0"
          />
          <Tab
            icon={<LockIcon sx={{ mr: 1 }} />}
            iconPosition="start"
            label="Change Password"
            id="profile-tab-1"
            aria-controls="profile-tabpanel-1"
          />
        </Tabs>

        {/* Profile Information Tab */}
        <TabPanel value={tabValue} index={0}>
          <Box sx={{ p: 4 }}>
            <Grid container spacing={3}>
              {/* Account Info Card */}
              <Grid item xs={12}>
                <Card
                  sx={{
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, rgba(25, 118, 210, 0.05) 0%, rgba(25, 118, 210, 0.02) 100%)',
                    border: '1px solid rgba(25, 118, 210, 0.1)',
                    mb: 3,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      boxShadow: '0 8px 24px rgba(25, 118, 210, 0.15)',
                    }
                  }}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <PersonIcon sx={{ color: '#1976d2', mr: 1.5, fontSize: 28 }} />
                      <Typography variant="h6" sx={{ fontWeight: 600, color: '#1976d2' }}>
                        Account Information
                      </Typography>
                    </Box>
                    <Grid container spacing={3}>
                      <Grid item xs={12} sm={6}>
                        <Box>
                          <Typography
                            variant="caption"
                            sx={{
                              color: '#999',
                              fontSize: '0.8rem',
                              textTransform: 'uppercase',
                              letterSpacing: '0.5px',
                              fontWeight: 600,
                            }}
                          >
                            Username
                          </Typography>
                          <Typography variant="body1" sx={{ fontWeight: 500, mt: 0.8, color: '#333' }}>
                            {profileData.username}
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Box>
                          <Typography
                            variant="caption"
                            sx={{
                              color: '#999',
                              fontSize: '0.8rem',
                              textTransform: 'uppercase',
                              letterSpacing: '0.5px',
                              fontWeight: 600,
                            }}
                          >
                            Email
                          </Typography>
                          <Typography variant="body1" sx={{ fontWeight: 500, mt: 0.8, color: '#333' }}>
                            {profileData.email}
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>

              {/* Personal Details Section */}
              <Grid item xs={12}>
                <Box sx={{ mb: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: '#333' }}>
                    Personal Details
                  </Typography>
                  {!isEditingProfile && (
                    <Button
                      variant="contained"
                      startIcon={<EditIcon />}
                      onClick={handleEditProfile}
                      size="small"
                      sx={{
                        background: 'linear-gradient(135deg, #1976d2, #1565c0)',
                        textTransform: 'none',
                        fontWeight: 500,
                        borderRadius: '8px',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: '0 8px 16px rgba(25, 118, 210, 0.3)',
                        }
                      }}
                    >
                      Edit Profile
                    </Button>
                  )}
                </Box>

                <Grid container spacing={2.5}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="First Name"
                      name="first_name"
                      value={profileData.first_name}
                      onChange={handleProfileChange}
                      disabled={!isEditingProfile}
                      variant="outlined"
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: '10px',
                          transition: 'all 0.3s ease',
                          '&:hover fieldset': {
                            borderColor: isEditingProfile ? '#1976d2' : '#ccc',
                          },
                          '&.Mui-disabled fieldset': {
                            borderColor: '#e0e0e0',
                            background: '#f9f9f9',
                          }
                        },
                        '& .MuiOutlinedInput-input': {
                          fontWeight: 500,
                        }
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Last Name"
                      name="last_name"
                      value={profileData.last_name}
                      onChange={handleProfileChange}
                      disabled={!isEditingProfile}
                      variant="outlined"
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: '10px',
                          transition: 'all 0.3s ease',
                          '&:hover fieldset': {
                            borderColor: isEditingProfile ? '#1976d2' : '#ccc',
                          },
                          '&.Mui-disabled fieldset': {
                            borderColor: '#e0e0e0',
                            background: '#f9f9f9',
                          }
                        },
                        '& .MuiOutlinedInput-input': {
                          fontWeight: 500,
                        }
                      }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Email Address"
                      name="email"
                      type="email"
                      value={profileData.email}
                      onChange={handleProfileChange}
                      disabled={!isEditingProfile}
                      variant="outlined"
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: '10px',
                          transition: 'all 0.3s ease',
                          '&:hover fieldset': {
                            borderColor: isEditingProfile ? '#1976d2' : '#ccc',
                          },
                          '&.Mui-disabled fieldset': {
                            borderColor: '#e0e0e0',
                            background: '#f9f9f9',
                          }
                        },
                        '& .MuiOutlinedInput-input': {
                          fontWeight: 500,
                        }
                      }}
                    />
                  </Grid>
                </Grid>

                {isEditingProfile && (
                  <Stack direction="row" spacing={2} sx={{ mt: 3.5 }}>
                    <Button
                      variant="contained"
                      color="success"
                      startIcon={<SaveIcon />}
                      onClick={handleSaveProfile}
                      disabled={loading}
                      sx={{
                        textTransform: 'none',
                        fontWeight: 600,
                        borderRadius: '8px',
                        py: 1.2,
                        px: 3,
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: '0 8px 16px rgba(76, 175, 80, 0.3)',
                        }
                      }}
                    >
                      {loading ? 'Saving...' : 'Save Changes'}
                    </Button>
                    <Button
                      variant="outlined"
                      color="inherit"
                      startIcon={<CancelIcon />}
                      onClick={handleCancelEdit}
                      disabled={loading}
                      sx={{
                        textTransform: 'none',
                        fontWeight: 600,
                        borderRadius: '8px',
                        py: 1.2,
                        border: '2px solid #e0e0e0',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          borderColor: '#d0d0d0',
                          background: '#f9f9f9',
                        }
                      }}
                    >
                      Cancel
                    </Button>
                  </Stack>
                )}
              </Grid>
            </Grid>
          </Box>
        </TabPanel>

        {/* Change Password Tab */}
        <TabPanel value={tabValue} index={1}>
          <Box sx={{ p: 4, maxWidth: 500 }}>
            <Card
              sx={{
                background: 'linear-gradient(135deg, rgba(244, 67, 54, 0.05) 0%, rgba(244, 67, 54, 0.02) 100%)',
                border: '1px solid rgba(244, 67, 54, 0.1)',
                borderRadius: '12px',
                mb: 3,
                p: 2.5,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                <LockIcon sx={{ color: '#f44336', mr: 1.5, mt: 0.5, fontSize: 24 }} />
                <Typography variant="body2" sx={{ color: '#666', lineHeight: 1.6 }}>
                  For security, enter your current password and then choose a new one. After changing your password, you'll be logged out and need to log in again.
                </Typography>
              </Box>
            </Card>

            <Stack spacing={2.5}>
              <TextField
                fullWidth
                label="Current Password"
                name="old_password"
                type={showPasswords.old_password ? 'text' : 'password'}
                value={passwordData.old_password}
                onChange={handlePasswordChange}
                disabled={loading}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => handleTogglePasswordVisibility('old_password')}
                        edge="end"
                        sx={{ mr: -1 }}
                      >
                        {showPasswords.old_password ? <VisibilityOff sx={{ fontSize: 20 }} /> : <Visibility sx={{ fontSize: 20 }} />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '10px',
                    transition: 'all 0.3s ease',
                    '&:hover fieldset': {
                      borderColor: '#1976d2',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#1976d2',
                      boxShadow: '0 0 0 3px rgba(25, 118, 210, 0.1)',
                    }
                  },
                }}
              />

              <Divider sx={{ my: 1, opacity: 0.3 }} />

              <TextField
                fullWidth
                label="New Password"
                name="new_password"
                type={showPasswords.new_password ? 'text' : 'password'}
                value={passwordData.new_password}
                onChange={handlePasswordChange}
                disabled={loading}
                helperText="Minimum 8 characters • Include uppercase & lowercase letters"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => handleTogglePasswordVisibility('new_password')}
                        edge="end"
                        sx={{ mr: -1 }}
                      >
                        {showPasswords.new_password ? <VisibilityOff sx={{ fontSize: 20 }} /> : <Visibility sx={{ fontSize: 20 }} />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '10px',
                    transition: 'all 0.3s ease',
                    '&:hover fieldset': {
                      borderColor: '#1976d2',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#1976d2',
                      boxShadow: '0 0 0 3px rgba(25, 118, 210, 0.1)',
                    }
                  },
                  '& .MuiFormHelperText-root': {
                    fontSize: '0.75rem',
                    marginTop: '6px',
                  }
                }}
              />

              <TextField
                fullWidth
                label="Confirm New Password"
                name="confirm_password"
                type={showPasswords.confirm_password ? 'text' : 'password'}
                value={passwordData.confirm_password}
                onChange={handlePasswordChange}
                disabled={loading}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => handleTogglePasswordVisibility('confirm_password')}
                        edge="end"
                        sx={{ mr: -1 }}
                      >
                        {showPasswords.confirm_password ? <VisibilityOff sx={{ fontSize: 20 }} /> : <Visibility sx={{ fontSize: 20 }} />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '10px',
                    transition: 'all 0.3s ease',
                    '&:hover fieldset': {
                      borderColor: '#1976d2',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#1976d2',
                      boxShadow: '0 0 0 3px rgba(25, 118, 210, 0.1)',
                    }
                  },
                }}
              />
            </Stack>

            <Button
              fullWidth
              variant="contained"
              color="error"
              onClick={handleChangePassword}
              disabled={loading}
              sx={{
                mt: 3.5,
                py: 1.5,
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '1rem',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #f44336, #e53935)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 12px 24px rgba(244, 67, 54, 0.3)',
                }
              }}
            >
              {loading ? 'Changing Password...' : 'Change Password'}
            </Button>

            <Typography
              variant="caption"
              sx={{
                display: 'block',
                textAlign: 'center',
                mt: 2,
                color: '#999',
                fontSize: '0.85rem',
              }}
            >
              ✓ Password strength: Strong security with minimum 8 characters
            </Typography>
          </Box>
        </TabPanel>
      </Paper>
    </Container>
  );
};

export default Profile;
