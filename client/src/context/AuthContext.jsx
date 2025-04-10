import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Set auth token for axios requests
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['x-auth-token'] = token;
    } else {
      delete axios.defaults.headers.common['x-auth-token'];
    }
  }, [token]);

  // Load user data if token exists
  useEffect(() => {
    const loadUser = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const res = await axios.get('/api/auth/user');
        setCurrentUser(res.data);
        setLoading(false);
      } catch (err) {
        console.error('Error loading user:', err.response?.data?.message || err.message);
        localStorage.removeItem('token');
        setToken(null);
        setCurrentUser(null);
        setLoading(false);
      }
    };

    loadUser();
  }, [token]);

  // Register user
  const register = async (userData) => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.post('/api/auth/register', userData);
      localStorage.setItem('token', res.data.token);
      setToken(res.data.token);
      setCurrentUser(res.data.user);
      return res.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Login user
  const login = async (userData) => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.post('/api/auth/login', userData);
      localStorage.setItem('token', res.data.token);
      setToken(res.data.token);
      setCurrentUser(res.data.user);
      return res.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Logout user
  const logout = async () => {
    setLoading(true);
    try {
      if (token) {
        await axios.put('/api/auth/logout');
      }
    } catch (err) {
      console.error('Logout error:', err.response?.data?.message || err.message);
    } finally {
      localStorage.removeItem('token');
      setToken(null);
      setCurrentUser(null);
      setLoading(false);
    }
  };

  // Update user status
  const updateStatus = async (status) => {
    try {
      const res = await axios.put('/api/auth/status', { status });
      setCurrentUser({ ...currentUser, status: res.data.status });
      return res.data;
    } catch (err) {
      console.error('Update status error:', err.response?.data?.message || err.message);
      throw err;
    }
  };

  const value = {
    currentUser,
    loading,
    error,
    isAuthenticated: !!token,
    register,
    login,
    logout,
    updateStatus
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};