import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Box,
  CssBaseline,
  IconButton,
  Menu,
  MenuItem,
  Typography,
  Divider,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  FileOpen as PermitIcon,
  Add as AddIcon,
  People as UserIcon,
  Security as RoleIcon,
  Logout as LogoutIcon,
  AccountCircle as AccountIcon,
  Apps as AppsIcon,
  Info as InfoIcon,
  PrivacyTip as PrivacyIcon,
  LocalShipping as VehicleIcon,
  Assessment as ReportIcon,
  Search as SearchIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Receipt as ChalanIcon,
} from '@mui/icons-material';
import './App.css';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import SplashScreen from './components/SplashScreen';
import NotificationCenter from './components/NotificationCenter';
import Dashboard from './pages/Dashboard';
import PermitList from './pages/PermitList';
import NewPermit from './pages/NewPermit';
import Reports from './pages/Reports';
import PermitDetails from './pages/PermitDetails';
import PermitEdit from './pages/PermitEdit';
import PermitSearch from './pages/PermitSearch';
import ChalanList from './pages/ChalanList';
import CreateChalan from './pages/CreateChalan';
import ChalanDetail from './pages/ChalanDetail';
import FeeManagement from './pages/FeeManagement';
import Login from './pages/Login';
import Register from './pages/Register';
import UserManagement from './pages/UserManagement';
import RoleManagement from './pages/RoleManagement';
import FeatureList from './pages/FeatureList';
import TypesManagement from './pages/TypesManagement';
import PrivacyPolicy from './pages/PrivacyPolicy';
import AboutUs from './pages/AboutUs';
import Profile from './pages/Profile';

const drawerWidth = 240;
const collapsedDrawerWidth = 70;

function AppContent() {
  const { isAuthenticated, user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(true);
  const [anchorEl, setAnchorEl] = useState(null);
  const [showSplash, setShowSplash] = useState(true);
  const [activePath, setActivePath] = useState(window.location.pathname || '/');

  // Check if user is admin - handle different role object structures
  const isAdmin = user && (
    user?.role?.name === 'admin' ||
    user?.role === 'admin' ||
    user?.is_staff === true
  );

  // Check if user has a specific role
  const hasRole = (roleName) => {
    if (!user) return false;
    const userRole = user?.role?.name || user?.role;
    return userRole?.toLowerCase() === roleName.toLowerCase();
  };

  // Check if user has a specific feature
  const hasFeature = (featureName) => {
    if (!user || !user.features) return false;
    return user.features.some(f =>
      (f.name?.toLowerCase() === featureName.toLowerCase()) ||
      (f.toLowerCase?.() === featureName.toLowerCase())
    );
  };

  // Check if user can access reports - has report_view feature or is admin

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    handleMenuClose();
    logout();
  };

  const navigationItems = [
    { label: 'Dashboard', icon: <DashboardIcon />, path: '/', adminOnly: false },
    { label: 'My Profile', icon: <AccountIcon />, path: '/profile', adminOnly: false },
    { label: 'View Permits', icon: <PermitIcon />, path: '/permits', adminOnly: false },
    { label: 'New Permit', icon: <AddIcon />, path: '/new-permit', adminOnly: false, excludeEmployees: true },
    { label: 'Search Permits', icon: <SearchIcon />, path: '/search', adminOnly: false },
    { label: 'Reports', icon: <ReportIcon />, path: '/reports', requiredFeature: 'report_view' },
    { label: 'Chalans', icon: <ChalanIcon />, path: '/chalans', adminOnly: false, onlyAdminOrEmployee: true },
    { label: 'Permit Types', icon: <VehicleIcon />, path: '/types', adminOnly: true },
    { label: 'Users', icon: <UserIcon />, path: '/users', adminOnly: true },
    { label: 'Roles', icon: <RoleIcon />, path: '/roles', adminOnly: true },
  ];

  const infoItems = [
    { label: 'Feature List', icon: <AppsIcon />, path: '/features', adminOnly: true },
    { label: 'About Us', icon: <InfoIcon />, path: '/about', adminOnly: false },
    { label: 'Privacy Policy', icon: <PrivacyIcon />, path: '/privacy', adminOnly: false },
    { label: 'Logout', icon: <LogoutIcon />, action: 'logout', adminOnly: false },
  ];

  const drawer = (
    <Box sx={{ width: drawerOpen ? drawerWidth : collapsedDrawerWidth, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: drawerOpen ? 2 : 1, textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: drawerOpen ? 'space-between' : 'center', gap: 1 }}>
        {drawerOpen && (
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#1976d2' }}>
              PTA & RTA
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              Permit Management
            </Typography>
          </Box>
        )}
        <IconButton
          size="small"
          onClick={() => setDrawerOpen(!drawerOpen)}
          sx={{ ml: drawerOpen ? 'auto' : 0 }}
        >
          {drawerOpen ? <ChevronLeftIcon /> : <ChevronRightIcon />}
        </IconButton>
      </Box>
      <Divider />
      <List sx={{ flex: 1, overflow: 'auto' }}>
        {navigationItems
          .filter(item => {
            // Only show for admins or employees if marked with onlyAdminOrEmployee
            if (item.onlyAdminOrEmployee) {
              return isAdmin || hasFeature('employee');
            }
            // Exclude employees from items marked with excludeEmployees
            if (item.excludeEmployees && hasFeature('employee')) {
              return false;
            }
            if (item.requiredFeature) {
              return hasFeature(item.requiredFeature) || isAdmin;
            }
            if (item.requiredRole) {
              return hasRole(item.requiredRole) || isAdmin;
            }
            return !item.adminOnly || isAdmin;
          })
          .map((item) => {
            const isActive = activePath === item.path;
            const isSubItem = !!item.category; // Check if this is a sub-category item
            return (
              <ListItem key={item.path} disablePadding>
                <ListItemButton
                  component="a"
                  href={item.path}
                  onClick={(e) => {
                    e.preventDefault();
                    setActivePath(item.path);
                    setMobileOpen(false);
                    window.history.pushState(null, '', item.path);
                    window.dispatchEvent(new PopStateEvent('popstate'));
                  }}
                  sx={{
                    backgroundColor: isActive ? '#1976d2' : 'transparent',
                    borderLeft: isActive ? '4px solid #1976d2' : '4px solid transparent',
                    pl: isSubItem
                      ? (isActive && drawerOpen ? 3.75 : drawerOpen ? 4 : 1.5)
                      : (isActive && drawerOpen ? 1.75 : drawerOpen ? 2 : 1.5),
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    justifyContent: !drawerOpen ? 'center' : 'flex-start',
                    opacity: isSubItem ? 0.85 : 1,
                    '& .MuiListItemIcon-root': {
                      color: isActive ? 'white' : isSubItem ? '#999' : '#666',
                      transition: 'color 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      minWidth: drawerOpen ? 40 : 0,
                    },
                    '& .MuiListItemText-primary': {
                      color: isActive ? 'white' : isSubItem ? '#666' : '#333',
                      fontWeight: isActive ? 700 : 500,
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      display: drawerOpen ? 'block' : 'none',
                    },
                    '&:hover': {
                      backgroundColor: isActive ? '#1565c0' : '#e3f2fd',
                      '& .MuiListItemIcon-root': {
                        color: isActive ? 'white' : '#1976d2',
                      },
                    },
                  }}
                  title={!drawerOpen ? item.label : ''}
                >
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    {item.icon}
                  </ListItemIcon>
                  {drawerOpen && <ListItemText primary={item.label} />}
                </ListItemButton>
              </ListItem>
            );
          })}
      </List>
      <Divider sx={{ my: 1 }} />
      {drawerOpen && (
        <Typography variant="caption" sx={{ display: 'block', px: 2, py: 1, fontWeight: 600, color: '#666', textTransform: 'uppercase', fontSize: '11px', letterSpacing: '0.5px' }}>
          Information
        </Typography>
      )}
      <List>
        {infoItems
          .filter(item => {
            // Only show for admins or employees if marked with onlyAdminOrEmployee
            if (item.onlyAdminOrEmployee) {
              return isAdmin || hasFeature('employee');
            }
            // Exclude employees from items marked with excludeEmployees
            if (item.excludeEmployees && hasFeature('employee')) {
              return false;
            }
            if (item.requiredFeature) {
              return hasFeature(item.requiredFeature) || isAdmin;
            }
            if (item.requiredRole) {
              return hasRole(item.requiredRole) || isAdmin;
            }
            return !item.adminOnly || isAdmin;
          })
          .map((item) => {
            const isActive = activePath === item.path;
            const handleItemClick = (e) => {
              e.preventDefault();
              if (item.action === 'logout') {
                handleLogout();
              } else {
                setActivePath(item.path);
                setMobileOpen(false);
                window.history.pushState(null, '', item.path);
                window.dispatchEvent(new PopStateEvent('popstate'));
              }
            };
            return (
              <ListItem key={item.path || item.action} disablePadding>
                <ListItemButton
                  component="a"
                  href={item.path || '#'}
                  onClick={handleItemClick}
                  sx={{
                    backgroundColor: isActive ? '#1976d2' : 'transparent',
                    borderLeft: isActive ? '4px solid #1976d2' : '4px solid transparent',
                    pl: isActive && drawerOpen ? 1.75 : drawerOpen ? 2 : 1.5,
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    justifyContent: !drawerOpen ? 'center' : 'flex-start',
                    '& .MuiListItemIcon-root': {
                      color: isActive ? 'white' : item.action === 'logout' ? '#f44336' : '#666',
                      transition: 'color 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      minWidth: drawerOpen ? 40 : 0,
                    },
                    '& .MuiListItemText-primary': {
                      color: isActive ? 'white' : item.action === 'logout' ? '#f44336' : '#333',
                      fontWeight: isActive ? 700 : 500,
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      display: drawerOpen ? 'block' : 'none',
                    },
                    '&:hover': {
                      backgroundColor: isActive ? '#1565c0' : item.action === 'logout' ? '#ffebee' : '#e3f2fd',
                      '& .MuiListItemIcon-root': {
                        color: isActive ? 'white' : item.action === 'logout' ? '#d32f2f' : '#1976d2',
                      },
                    },
                  }}
                  title={!drawerOpen ? item.label : ''}
                >
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    {item.icon}
                  </ListItemIcon>
                  {drawerOpen && <ListItemText primary={item.label} />}
                </ListItemButton>
              </ListItem>
            );
          })}
      </List>
    </Box>
  );

  return (
    <>
      {showSplash && <SplashScreen onComplete={() => setShowSplash(false)} />}
      <Router>
        <CssBaseline />
        <Box sx={{ display: 'flex', backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
          {isAuthenticated && (
            <>
              <AppBar
                position="fixed"
                sx={{
                  zIndex: (theme) => theme.zIndex.drawer + 1,
                  width: { xs: '100%', sm: `calc(100% - ${drawerOpen ? drawerWidth : collapsedDrawerWidth}px)` },
                  ml: { xs: 0, sm: `${drawerOpen ? drawerWidth : collapsedDrawerWidth}px` },
                  backgroundColor: '#1976d2',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
              >
                <Toolbar>
                  <IconButton
                    color="inherit"
                    edge="start"
                    onClick={handleDrawerToggle}
                    sx={{ mr: 2, display: { sm: 'none' } }}
                  >
                    <MenuIcon />
                  </IconButton>
                  <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 600, fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                    PTA & RTA Permit Management System
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0 }}>
                    <NotificationCenter />
                    <IconButton
                      onClick={handleMenuOpen}
                      color="inherit"
                      sx={{ display: 'flex', alignItems: 'center' }}
                    >
                      <AccountIcon sx={{ mr: 1 }} />
                      <Typography variant="body2" sx={{ fontWeight: 500, display: { xs: 'none', sm: 'block' } }}>
                        {user?.username}
                      </Typography>
                    </IconButton>
                    <Menu
                      anchorEl={anchorEl}
                      open={Boolean(anchorEl)}
                      onClose={handleMenuClose}
                    >
                      <MenuItem disabled>
                        <Typography variant="body2">
                          <strong>
                            {user?.role?.display_name ||
                              (typeof user?.role === 'string' ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'User')}
                          </strong>
                        </Typography>
                      </MenuItem>
                      <Divider />
                      <MenuItem
                        onClick={() => {
                          handleMenuClose();
                          setActivePath('/profile');
                          window.history.pushState(null, '', '/profile');
                          window.dispatchEvent(new PopStateEvent('popstate'));
                        }}
                      >
                        <AccountIcon sx={{ mr: 1, fontSize: 20 }} />
                        <Typography variant="body2">My Profile</Typography>
                      </MenuItem>
                      <MenuItem onClick={handleLogout}>
                        <LogoutIcon sx={{ mr: 1, fontSize: 20 }} />
                        <Typography variant="body2">Logout</Typography>
                      </MenuItem>
                    </Menu>
                  </Box>
                </Toolbar>
              </AppBar>

              <Drawer
                variant="temporary"
                open={mobileOpen}
                onClose={handleDrawerToggle}
                sx={{
                  display: { xs: 'block', sm: 'none' },
                  '& .MuiDrawer-paper': {
                    boxSizing: 'border-box',
                    width: drawerWidth,
                    backgroundColor: '#fafafa',
                    borderRight: '1px solid #e0e0e0',
                  },
                }}
              >
                {drawer}
              </Drawer>

              <Drawer
                variant="permanent"
                sx={{
                  display: { xs: 'none', sm: 'block' },
                  '& .MuiDrawer-paper': {
                    boxSizing: 'border-box',
                    width: drawerOpen ? drawerWidth : collapsedDrawerWidth,
                    backgroundColor: '#fafafa',
                    borderRight: '1px solid #e0e0e0',
                    position: 'fixed',
                    height: '100%',
                    top: 0,
                    left: 0,
                    zIndex: (theme) => theme.zIndex.drawer,
                    transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    overflowX: 'hidden',
                  },
                }}
                open
              >
                {drawer}
              </Drawer>
            </>
          )}

          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              width: '100%',
              ml: { xs: 0, sm: `${drawerOpen ? drawerWidth : collapsedDrawerWidth}px` },
              minHeight: '100vh',
              transition: 'margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          >
            <Box component="main" sx={{ flexGrow: 1, pt: 8, px: 0, pb: 0 }}>
              <Routes>
                {/* Auth Routes */}
                <Route path="/login" element={isAuthenticated ? <Navigate to="/" /> : <Login />} />
                <Route path="/register" element={isAuthenticated ? <Navigate to="/" /> : <Register />} />

                {/* Protected Routes */}
                <Route
                  path="/"
                  element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute>
                      <Profile />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/permits"
                  element={
                    <ProtectedRoute>
                      <PermitList />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/new-permit"
                  element={
                    <ProtectedRoute>
                      <NewPermit />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/reports"
                  element={
                    <ProtectedRoute requiredRole="reports">
                      <Reports />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/permit-details/:permitId"
                  element={
                    <ProtectedRoute>
                      <PermitDetails />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/permit-edit/:permitId"
                  element={
                    <ProtectedRoute>
                      <PermitEdit />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/search"
                  element={
                    <ProtectedRoute>
                      <PermitSearch />
                    </ProtectedRoute>
                  }
                />

                {/* Chalan Routes */}
                <Route
                  path="/chalans"
                  element={
                    <ProtectedRoute>
                      <ChalanList />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/chalans/create"
                  element={
                    <ProtectedRoute>
                      <CreateChalan />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/chalans/:id"
                  element={
                    <ProtectedRoute>
                      <ChalanDetail />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/fee-management"
                  element={
                    <ProtectedRoute>
                      <FeeManagement />
                    </ProtectedRoute>
                  }
                />

                {/* Info Routes - Available to all authenticated users */}
                <Route
                  path="/features"
                  element={
                    <ProtectedRoute>
                      <FeatureList />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/about"
                  element={
                    <ProtectedRoute>
                      <AboutUs />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/privacy"
                  element={
                    <ProtectedRoute>
                      <PrivacyPolicy />
                    </ProtectedRoute>
                  }
                />

                {/* Admin Routes */}
                {isAdmin && (
                  <>
                    <Route
                      path="/types"
                      element={
                        <ProtectedRoute>
                          <TypesManagement />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/users"
                      element={
                        <ProtectedRoute>
                          <UserManagement />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/roles"
                      element={
                        <ProtectedRoute>
                          <RoleManagement />
                        </ProtectedRoute>
                      }
                    />
                  </>
                )}

                {/* Redirect unknown routes */}
                <Route path="*" element={<Navigate to={isAuthenticated ? '/' : '/login'} />} />
              </Routes>
            </Box>
          </Box>
        </Box>
      </Router>
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
