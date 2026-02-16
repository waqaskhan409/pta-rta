import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, requiredRole, requireAdmin }) => {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Check for admin-only access
  if (requireAdmin) {
    const isAdmin = user && (
      user?.role?.name === 'admin' ||
      user?.role === 'admin' ||
      user?.is_staff === true
    );
    if (!isAdmin) {
      return <Navigate to="/" replace />;
    }
  }

  // Check for specific role access
  if (requiredRole) {
    const userRole = user?.role?.name || user?.role;
    const hasRequiredRole = userRole?.toLowerCase() === requiredRole.toLowerCase();
    const isAdmin = user && (
      user?.role?.name === 'admin' ||
      user?.role === 'admin' ||
      user?.is_staff === true
    );

    if (!hasRequiredRole && !isAdmin) {
      return <Navigate to="/" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;
