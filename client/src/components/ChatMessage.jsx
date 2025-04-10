import React from 'react';
import { Box, Avatar, Typography, Paper } from '@mui/material';
import { format } from 'timeago.js';
import { useAuth } from '../context/AuthContext';

const ChatMessage = ({ message }) => {
  const { currentUser } = useAuth();
  const isOwnMessage = message.sender._id === currentUser?._id;

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: isOwnMessage ? 'row-reverse' : 'row',
        mb: 2,
        maxWidth: '80%',
        alignSelf: isOwnMessage ? 'flex-end' : 'flex-start'
      }}
    >
      {!isOwnMessage && (
        <Avatar
          src={message.sender.avatar}
          alt={message.sender.username}
          sx={{ mr: 1, width: 36, height: 36 }}
        >
          {message.sender.username.charAt(0).toUpperCase()}
        </Avatar>
      )}
      <Box sx={{ maxWidth: '100%' }}>
        {!isOwnMessage && (
          <Typography variant="subtitle2" sx={{ ml: 1 }}>
            {message.sender.username}
          </Typography>
        )}
        <Paper
          elevation={1}
          sx={{
            p: 1.5,
            borderRadius: 2,
            bgcolor: isOwnMessage ? 'primary.light' : 'background.paper',
            color: isOwnMessage ? 'primary.contrastText' : 'text.primary',
            ml: isOwnMessage ? 0 : 1,
            mr: isOwnMessage ? 1 : 0,
            maxWidth: '100%',
            wordBreak: 'break-word'
          }}
        >
          <Typography variant="body1">{message.content}</Typography>
          {message.attachments && message.attachments.length > 0 && (
            <Box sx={{ mt: 1 }}>
              {message.attachments.map((attachment, index) => (
                <Box key={index} sx={{ mt: 1 }}>
                  {attachment.type.startsWith('image/') ? (
                    <img 
                      src={attachment.url} 
                      alt="attachment" 
                      style={{ maxWidth: '100%', maxHeight: 200, borderRadius: 4 }} 
                    />
                  ) : (
                    <a href={attachment.url} target="_blank" rel="noopener noreferrer">
                      {attachment.filename || 'Download attachment'}
                    </a>
                  )}
                </Box>
              ))}
            </Box>
          )}
        </Paper>
        <Typography 
          variant="caption" 
          color="text.secondary"
          sx={{ 
            display: 'block', 
            mt: 0.5, 
            ml: isOwnMessage ? 0 : 1,
            mr: isOwnMessage ? 1 : 0,
            textAlign: isOwnMessage ? 'right' : 'left'
          }}
        >
          {format(message.createdAt)}
        </Typography>
      </Box>
    </Box>
  );
};

export default ChatMessage;