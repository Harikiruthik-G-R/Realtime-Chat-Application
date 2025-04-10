import React, { useState, useEffect, useRef } from 'react';
import { useChat } from '../context/ChatContext';
import { useAuth } from '../context/AuthContext';
import {
  Box,
  Grid,
  Typography,
  Paper,
  Divider,
  CircularProgress,
  useMediaQuery,
  IconButton,
  Drawer,
  AppBar,
  Toolbar
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { Menu as MenuIcon } from '@mui/icons-material';

// Components
import Sidebar from '../components/Sidebar';
import ChatMessage from '../components/ChatMessage';
import MessageInput from '../components/MessageInput';
import Header from '../components/Header';

const Chat = () => {
  const { currentRoom, messages, loading, typingUsers } = useChat();
  const { currentUser } = useAuth();
  const messagesEndRef = useRef(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const toggleDrawer = () => {
    setDrawerOpen(!drawerOpen);
  };

  // Render typing indicators
  const renderTypingIndicators = () => {
    const typingUsersList = Object.values(typingUsers);
    if (typingUsersList.length === 0) return null;

    return (
      <Box sx={{ p: 1, color: 'text.secondary', fontStyle: 'italic' }}>
        {typingUsersList.length === 1 ? (
          <Typography variant="body2">{typingUsersList[0].username} is typing...</Typography>
        ) : typingUsersList.length === 2 ? (
          <Typography variant="body2">{typingUsersList[0].username} and {typingUsersList[1].username} are typing...</Typography>
        ) : (
          <Typography variant="body2">Several people are typing...</Typography>
        )}
      </Box>
    );
  };

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Main Header - Always visible */}
      <Header title="Agora Chat" />
      
      {/* Mobile Room Header */}
      {isMobile && currentRoom && (
        <AppBar position="static" color="default" elevation={0}>
          <Toolbar>
            <IconButton
              edge="start"
              color="inherit"
              aria-label="menu"
              onClick={toggleDrawer}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" noWrap component="div">
              {currentRoom?.name}
            </Typography>
          </Toolbar>
        </AppBar>
      )}

      <Grid container sx={{ flexGrow: 1, overflow: 'hidden' }}>
        {/* Sidebar - responsive */}
        {isMobile ? (
          <Drawer
            anchor="left"
            open={drawerOpen}
            onClose={toggleDrawer}
            sx={{
              width: 320,
              flexShrink: 0,
              '& .MuiDrawer-paper': {
                width: 320,
                boxSizing: 'border-box',
              },
            }}
          >
            <Sidebar />
          </Drawer>
        ) : (
          <Grid item xs={12} md={4} lg={3} sx={{ height: '100%' }}>
            <Sidebar />
          </Grid>
        )}

        {/* Chat Area */}
        <Grid item xs={12} md={8} lg={9} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          {currentRoom ? (
            <>
              {/* Chat Header */}
              <Paper 
                elevation={0} 
                sx={{ 
                  p: 2, 
                  borderBottom: 1, 
                  borderColor: 'divider',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <Typography variant="h6">{currentRoom.name}</Typography>
                {currentRoom.description && (
                  <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
                    {currentRoom.description}
                  </Typography>
                )}
              </Paper>

              {/* Messages Area */}
              <Box 
                sx={{ 
                  flexGrow: 1, 
                  overflow: 'auto', 
                  p: 2,
                  display: 'flex',
                  flexDirection: 'column',
                  bgcolor: 'background.default'
                }}
              >
                {loading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                    <CircularProgress />
                  </Box>
                ) : messages.length > 0 ? (
                  messages.map((message) => (
                    <ChatMessage key={message._id} message={message} />
                  ))
                ) : (
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                    <Typography variant="body1" color="text.secondary">
                      No messages yet. Start the conversation!
                    </Typography>
                  </Box>
                )}
                {renderTypingIndicators()}
                <div ref={messagesEndRef} />
              </Box>

              {/* Message Input */}
              <MessageInput />
            </>
          ) : (
            <Box 
              sx={{ 
                display: 'flex', 
                flexDirection: 'column',
                justifyContent: 'center', 
                alignItems: 'center', 
                height: '100%',
                bgcolor: 'background.default',
                p: 3
              }}
            >
              <Typography variant="h5" gutterBottom>
                Welcome to RealChat, {currentUser?.username}!
              </Typography>
              <Typography variant="body1" color="text.secondary" align="center">
                Select a room from the sidebar or create a new one to start chatting.
              </Typography>
              {isMobile && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" color="primary" sx={{ cursor: 'pointer' }} onClick={toggleDrawer}>
                    Open Sidebar
                  </Typography>
                </Box>
              )}
            </Box>
          )}
        </Grid>
      </Grid>
    </Box>
  );
};

export default Chat;