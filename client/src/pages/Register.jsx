import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Alert,
  CircularProgress,
  InputAdornment,
  IconButton,
  Grid,
  useMediaQuery
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { Visibility, VisibilityOff, Email, Lock, Person } from '@mui/icons-material';

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [formError, setFormError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { register, loading, error } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleTogglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleToggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    // Basic validation
    if (!formData.username || !formData.email || !formData.password || !formData.confirmPassword) {
      setFormError('Please fill in all fields');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setFormError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setFormError('Password must be at least 6 characters');
      return;
    }

    try {
      // Remove confirmPassword before sending to API
      const { confirmPassword, ...registerData } = formData;
      await register(registerData);
      navigate('/');
    } catch (err) {
      // Error is handled by the AuthContext
      console.error('Registration error:', err);
    }
  };

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', bgcolor: 'background.default' }}>
      <Paper
        elevation={5}
        sx={{
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          width: '100%',
          maxWidth: isMobile ? '100%' : '1000px',
          mx: 'auto',
          my: isMobile ? 0 : 4,
          height: isMobile ? '100vh' : 'calc(100vh - 64px)',
          borderRadius: 4,
          overflow: 'hidden'
        }}
      >
        {/* Left Panel - Colored Side */}
        <Box
          sx={{
            width: isMobile ? '100%' : '40%',
            bgcolor: '#40C0E7',
            color: 'white',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            p: 4,
            position: 'relative',
            borderRadius: isMobile ? 0 : '16px 0 0 16px'
          }}
        >
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              maxWidth: '300px'
            }}
          >
            <Box
              component="img"
              src="/chat-icon.svg"
              alt="Agora Logo"
              sx={{
                width: 80,
                height: 80,
                mb: 3,
                filter: 'brightness(0) invert(1)'
              }}
            />
            <Typography variant="h4" component="h1" sx={{ fontWeight: 700, mb: 2, textAlign: 'center' }}>
              Welcome to Agora!
            </Typography>
            <Typography variant="body1" sx={{ mb: 4, textAlign: 'center' }}>
              Already have an account? Sign in to continue the conversation
            </Typography>
            <Button
              component={Link}
              to="/login"
              variant="outlined"
              sx={{
                color: 'white',
                borderColor: 'white',
                borderRadius: 50,
                px: 4,
                py: 1,
                '&:hover': {
                  borderColor: 'white',
                  bgcolor: 'rgba(255, 255, 255, 0.1)'
                }
              }}
            >
              SIGN IN
            </Button>
          </Box>
        </Box>

        {/* Right Panel - Form Side */}
        <Box
          sx={{
            width: isMobile ? '100%' : '60%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            p: { xs: 3, sm: 6 },
            bgcolor: 'background.paper'
          }}
        >
            <Typography 
              variant="h4" 
              component="h1" 
              align="center" 
              gutterBottom
              sx={{ 
                fontWeight: 700,
                color: '#40C0E7',
                mb: 1
              }}
            >
              Create Account
            </Typography>
            <Typography 
              variant="body1" 
              align="center" 
              color="text.secondary" 
              sx={{ mb: 4 }}
            >
              Register to join the conversation
            </Typography>

            {(error || formError) && (
              <Alert severity="error" sx={{ mb: 3, borderRadius: 1 }}>
                {formError || error}
              </Alert>
            )}

            <Box component="form" onSubmit={handleSubmit} noValidate sx={{ width: '100%', maxWidth: '400px', mx: 'auto' }}>
              <TextField
                margin="normal"
                required
                fullWidth
                id="username"
                label="Username"
                name="username"
                autoComplete="username"
                autoFocus
                value={formData.username}
                onChange={handleChange}
                disabled={loading}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Person color="primary" />
                    </InputAdornment>
                  ),
                }}
                sx={{ mb: 2 }}
              />
              <TextField
                margin="normal"
                required
                fullWidth
                id="email"
                label="Email Address"
                name="email"
                autoComplete="email"
                value={formData.email}
                onChange={handleChange}
                disabled={loading}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Email color="primary" />
                    </InputAdornment>
                  ),
                }}
                sx={{ mb: 2 }}
              />
              <TextField
                margin="normal"
                required
                fullWidth
                name="password"
                label="Password"
                type={showPassword ? 'text' : 'password'}
                id="password"
                autoComplete="new-password"
                value={formData.password}
                onChange={handleChange}
                disabled={loading}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock color="primary" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={handleTogglePasswordVisibility}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{ mb: 2 }}
              />
              <TextField
                margin="normal"
                required
                fullWidth
                name="confirmPassword"
                label="Confirm Password"
                type={showConfirmPassword ? 'text' : 'password'}
                id="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                disabled={loading}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock color="primary" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle confirm password visibility"
                        onClick={handleToggleConfirmPasswordVisibility}
                        edge="end"
                      >
                        {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{ mb: 3 }}
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ 
                  mt: 1, 
                  mb: 3,
                  py: 1.5,
                  fontWeight: 600,
                  borderRadius: 50,
                  boxShadow: 2,
                  bgcolor: '#40C0E7',
                  '&:hover': {
                    boxShadow: 4,
                    bgcolor: '#2EAAD3'
                  }
                }}
                disabled={loading}
              >
                {loading ? <CircularProgress size={24} /> : 'SIGN UP'}
              </Button>
              <Box sx={{ textAlign: 'center', mt: 2 }}>
                <Typography variant="body2">
                  Already have an account?{' '}
                  <Link to="/login" style={{ 
                    textDecoration: 'none', 
                    color: '#40C0E7',
                    fontWeight: 600,
                    '&:hover': {
                      textDecoration: 'underline'
                    }
                  }}>
                    sign in
                  </Link>
                </Typography>
              </Box>
            </Box>
          </Box>
        </Paper>
      </Box>
  );
};

export default Register;