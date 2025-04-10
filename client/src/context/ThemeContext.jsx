import React, { createContext, useContext, useState, useEffect } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

const ThemeContext = createContext();

export const useCustomTheme = () => useContext(ThemeContext);

export const CustomThemeProvider = ({ children }) => {
  // Get theme preference from localStorage or default to 'light'
  const [mode, setMode] = useState(
    localStorage.getItem('themeMode') || 'light'
  );

  // Update localStorage when theme changes
  useEffect(() => {
    localStorage.setItem('themeMode', mode);
  }, [mode]);

  // Toggle theme function
  const toggleTheme = () => {
    setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
  };

  // Create theme based on current mode
  const theme = createTheme({
    palette: {
      mode,
      primary: {
        main: '#4F46E5',
      },
      secondary: {
        main: '#10B981',
      },
      background: {
        default: mode === 'light' ? '#F5F7FB' : '#121212',
        paper: mode === 'light' ? '#FFFFFF' : '#1E1E1E',
      },
    },
    typography: {
      fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
      button: {
        textTransform: 'none',
      },
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
          },
        },
      },
    },
  });

  const value = {
    mode,
    toggleTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ThemeContext.Provider>
  );
};