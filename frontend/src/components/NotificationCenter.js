import React, { useState, useEffect } from 'react';
import {
  Badge,
  IconButton,
  Menu,
  Typography,
  List,
  ListItem,
  ListItemButton,
  Divider,
  Box,
  Button,
  CircularProgress,
  Chip,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Close as CloseIcon,
  MarkEmailRead as MarkReadIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

const NotificationCenter = () => {
  const { isAuthenticated, token } = useAuth();
  const [anchorEl, setAnchorEl] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const open = Boolean(anchorEl);

  // Fetch unread count
  const fetchUnreadCount = async () => {
    if (!isAuthenticated || !token) {
      console.warn('Not authenticated, skipping fetch');
      return;
    }

    try {
      console.log(`Fetching unread count from ${API_BASE_URL}/notifications/unread_count/`);
      const response = await axios.get(`${API_BASE_URL}/notifications/unread_count/`, {
        headers: {
          Authorization: `Token ${token}`,
          'Content-Type': 'application/json',
        },
      });
      console.log('Unread count response:', response.data);
      setUnreadCount(response.data.unread_count);
    } catch (err) {
      console.error('Error fetching unread count:', err.response?.data || err.message);
    }
  };

  // Fetch notifications
  const fetchNotifications = async () => {
    if (!isAuthenticated || !token) return;

    setLoading(true);
    try {
      console.log('Fetching notifications...');
      const response = await axios.get(`${API_BASE_URL}/notifications/`, {
        headers: {
          Authorization: `Token ${token}`,
          'Content-Type': 'application/json',
        },
      });
      console.log('Notifications response:', response.data);
      setNotifications(response.data.results || response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching notifications:', err.response?.data || err.message);
      setError('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  // Mark notification as read
  const markAsRead = async (notificationId) => {
    try {
      await axios.post(`${API_BASE_URL}/notifications/${notificationId}/mark_as_read/`, {}, {
        headers: {
          Authorization: `Token ${token}`,
          'Content-Type': 'application/json',
        },
      });
      // Refresh notifications
      fetchNotifications();
      fetchUnreadCount();
    } catch (err) {
      console.error('Error marking notification as read:', err.response?.data || err.message);
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      await axios.post(`${API_BASE_URL}/notifications/mark_all_as_read/`, {}, {
        headers: {
          Authorization: `Token ${token}`,
          'Content-Type': 'application/json',
        },
      });
      fetchNotifications();
      fetchUnreadCount();
    } catch (err) {
      console.error('Error marking all as read:', err.response?.data || err.message);
    }
  };

  // Clear read notifications
  const clearReadNotifications = async () => {
    try {
      await axios.delete(`${API_BASE_URL}/notifications/clear_read/`, {
        headers: {
          Authorization: `Token ${token}`,
          'Content-Type': 'application/json',
        },
      });
      fetchNotifications();
      fetchUnreadCount();
    } catch (err) {
      console.error('Error clearing read notifications:', err.response?.data || err.message);
    }
  };

  // Handle menu open
  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
    fetchNotifications();
  };

  // Handle menu close
  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  // Effect to fetch initial data and set up polling
  useEffect(() => {
    if (isAuthenticated) {
      fetchUnreadCount();

      // Set up polling interval (every 30 seconds)
      const interval = setInterval(() => {
        fetchUnreadCount();
      }, 30000);

      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return null;
  }

  // Determine icon color based on unread count
  const notificationColor = unreadCount > 0 ? 'error' : 'inherit';

  return (
    <>
      {/* Notification Bell Icon */}
      <IconButton
        onClick={handleMenuOpen}
        color={notificationColor}
        sx={{
          position: 'relative',
          ml: 1,
        }}
        title="Notifications"
      >
        <Badge badgeContent={unreadCount} color="error">
          <NotificationsIcon />
        </Badge>
      </IconButton>

      {/* Notification Dropdown Menu */}
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleMenuClose}
        PaperProps={{
          sx: {
            width: '400px',
            maxHeight: '600px',
            boxShadow: 3,
          },
        }}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        {/* Header */}
        <Box
          sx={{
            p: 2,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: 1,
            borderColor: 'divider',
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            Notifications
          </Typography>
          <IconButton size="small" onClick={handleMenuClose}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>

        {/* Loading State */}
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        )}

        {/* Error State */}
        {error && !loading && (
          <Box sx={{ p: 2 }}>
            <Typography color="error" variant="body2">
              {error}
            </Typography>
          </Box>
        )}

        {/* Notifications List */}
        {!loading && !error && notifications.length > 0 ? (
          <List sx={{ maxHeight: '400px', overflow: 'auto' }}>
            {notifications.map((notification, index) => (
              <React.Fragment key={notification.id}>
                <ListItem
                  disablePadding
                  sx={{
                    backgroundColor: notification.is_read ? 'transparent' : '#f5f5f5',
                    '&:hover': {
                      backgroundColor: '#efefef',
                    },
                  }}
                >
                  <ListItemButton
                    sx={{
                      py: 1.5,
                      px: 2,
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                    }}
                    onClick={() => {
                      if (!notification.is_read) {
                        markAsRead(notification.id);
                      }
                      if (notification.action_url) {
                        window.location.href = notification.action_url;
                      }
                    }}
                  >
                    <Box sx={{ display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box sx={{ flex: 1 }}>
                        <Typography
                          variant="subtitle2"
                          sx={{
                            fontWeight: notification.is_read ? 'normal' : 'bold',
                            color: 'text.primary',
                          }}
                        >
                          {notification.title}
                        </Typography>
                        <Typography
                          variant="body2"
                          color="textSecondary"
                          sx={{
                            mt: 0.5,
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                          }}
                        >
                          {notification.message}
                        </Typography>
                      </Box>
                      {!notification.is_read && (
                        <Box
                          sx={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            backgroundColor: '#1976d2',
                            ml: 1,
                            flexShrink: 0,
                          }}
                        />
                      )}
                    </Box>
                    <Box sx={{ mt: 1, display: 'flex', gap: 0.5, width: '100%' }}>
                      <Chip
                        label={notification.notification_type.replace(/_/g, ' ')}
                        size="small"
                        variant="outlined"
                      />
                      <Typography variant="caption" color="textSecondary">
                        {new Date(notification.created_at).toLocaleDateString()}
                      </Typography>
                    </Box>
                  </ListItemButton>
                </ListItem>
                {index < notifications.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        ) : (
          !loading && (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="body2" color="textSecondary">
                No notifications
              </Typography>
            </Box>
          )
        )}

        {/* Footer Actions */}
        {notifications.length > 0 && (
          <Box
            sx={{
              p: 1.5,
              display: 'flex',
              gap: 1,
              borderTop: 1,
              borderColor: 'divider',
              backgroundColor: '#fafafa',
            }}
          >
            <Button
              size="small"
              startIcon={<MarkReadIcon />}
              onClick={markAllAsRead}
              sx={{ flex: 1 }}
              variant="text"
            >
              Mark All Read
            </Button>
            <Button
              size="small"
              startIcon={<DeleteIcon />}
              onClick={clearReadNotifications}
              sx={{ flex: 1 }}
              variant="text"
              color="error"
            >
              Clear Read
            </Button>
          </Box>
        )}
      </Menu>
    </>
  );
};

export default NotificationCenter;
