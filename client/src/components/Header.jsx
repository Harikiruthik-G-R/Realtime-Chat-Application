import React from 'react';
import { Box, Typography, useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useCustomTheme } from '../context/ThemeContext';

const Header = ({ title = 'Agora' }) => {
  const theme = useTheme();
  const { mode } = useCustomTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        padding: isMobile ? '0.75rem 1rem' : '1rem 1.5rem',
        borderBottom: 1,
        borderColor: 'divider',
        backgroundColor: 'background.paper',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <Box
          component="img"
          src="/chat-icon.svg"
          alt="Agora Logo"
          sx={{
            width: isMobile ? 28 : 32,
            height: isMobile ? 28 : 32,
            mr: 1.5,
            filter: mode === 'dark' ? 'brightness(0.8)' : 'none',
          }}
        />
        <Typography
          variant={isMobile ? 'h6' : 'h5'}
          component="h1"
          sx={{
            fontWeight: 600,
            color: mode === 'dark' ? 'white' : 'black',
            letterSpacing: '0.5px',
          }}
        >
          {title}
        </Typography>
      </Box>
    </Box>
  );
};

export default Header;