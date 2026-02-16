import React, { createContext, useState, useContext, useEffect } from 'react';
import apiClient from '../services/apiClient';

const AuthContext = createContext();

// Helper function to extract error message from various error formats
const extractErrorMessage = (errorData, fallbackMessage = 'An error occurred') => {
  if (!errorData) return fallbackMessage;

  // If it's already a string, return it
  if (typeof errorData === 'string') return errorData;

  // If it's an array, join the messages
  if (Array.isArray(errorData)) {
    return errorData.map(e => typeof e === 'string' ? e : JSON.stringify(e)).join(', ');
  }

  // If it's an object, extract messages from common error keys
  if (typeof errorData === 'object') {
    // Check for common Django REST Framework error keys
    if (errorData.non_field_errors) {
      return Array.isArray(errorData.non_field_errors)
        ? errorData.non_field_errors.join(', ')
        : errorData.non_field_errors;
    }
    if (errorData.detail) {
      return errorData.detail;
    }
    if (errorData.message) {
      return errorData.message;
    }
    if (errorData.error) {
      return typeof errorData.error === 'string' ? errorData.error : JSON.stringify(errorData.error);
    }

    // Collect all field-level errors
    const fieldErrors = Object.entries(errorData)
      .filter(([key]) => key !== 'non_field_errors')
      .map(([field, errors]) => {
        const errorMessages = Array.isArray(errors) ? errors.join(', ') : errors;
        return `${field}: ${errorMessages}`;
      });

    if (fieldErrors.length > 0) {
      return fieldErrors.join('; ');
    }
  }

  return fallbackMessage;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check if user is logged in on mount
  useEffect(() => {
    const checkAuthStatus = async () => {
      const savedToken = localStorage.getItem('token');
      if (savedToken) {
        try {
          const response = await apiClient.get('/auth/user/');
          setUser(response.data.user);
          setToken(savedToken);
        } catch (err) {
          console.error('Auth check failed:', err);
          localStorage.removeItem('token');
          setToken(null);
        }
      }
      setLoading(false);
    };

    checkAuthStatus();
  }, []);

  const register = async (username, email, password, password2, firstName = '', lastName = '') => {
    try {
      setError(null);
      const response = await apiClient.post('/auth/register/', {
        username,
        email,
        password,
        password2,
        first_name: firstName,
        last_name: lastName,
      });
      const { user: userData, token: newToken } = response.data;
      localStorage.setItem('token', newToken);
      setToken(newToken);
      setUser(userData);
      return { success: true, user: userData, token: newToken };
    } catch (err) {
      const errorMsg = extractErrorMessage(
        err.response?.data?.errors || err.response?.data,
        err.message || 'Registration failed'
      );
      setError(errorMsg);
      return { success: false, error: errorMsg };
    }
  };

  const login = async (username, password) => {
    try {
      setError(null);
      console.log('Attempting login with username:', username);
      const response = await apiClient.post('/auth/login/', {
        username,
        password,
      });
      console.log('Login response:', response.data);
      const { user: userData, token: newToken } = response.data;
      localStorage.setItem('token', newToken);
      setToken(newToken);
      setUser(userData);
      return { success: true, user: userData, token: newToken };
    } catch (err) {
      console.error('Login error:', err);
      const errorMsg = extractErrorMessage(
        err.response?.data?.errors || err.response?.data,
        err.response?.data?.message || 'Invalid username or password'
      );
      setError(errorMsg);
      return { success: false, error: errorMsg };
    }
  };

  const logout = async () => {
    try {
      await apiClient.post('/auth/logout/');
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      localStorage.removeItem('token');
      setToken(null);
      setUser(null);
      setError(null);
    }
  };

  const isAuthenticated = !!token && !!user;

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        error,
        isAuthenticated,
        register,
        login,
        logout,
        setError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
