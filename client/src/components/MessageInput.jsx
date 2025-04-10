import React, { useState, useRef } from 'react';
import { useChat } from '../context/ChatContext';
import {
  Box,
  TextField,
  IconButton,
  Tooltip,
  CircularProgress,
  Paper,
  Typography
} from '@mui/material';
import {
  Send as SendIcon,
  AttachFile as AttachFileIcon,
  InsertEmoticon as EmojiIcon,
  Close as CloseIcon
} from '@mui/icons-material';

const MessageInput = () => {
  const { currentRoom, sendMessage, sendTypingIndicator } = useChat();
  const [message, setMessage] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Handle message input change
  const handleMessageChange = (e) => {
    setMessage(e.target.value);
    
    // Send typing indicator
    sendTypingIndicator();
    
    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Set new timeout
    typingTimeoutRef.current = setTimeout(() => {
      typingTimeoutRef.current = null;
    }, 2000);
  };

  // Handle file selection
  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    
    // For now, we'll just store the files in state
    // In a real app, you would upload these to your server/cloud storage
    setAttachments(prev => [...prev, ...files]);
    
    // Reset file input
    e.target.value = null;
  };

  // Handle file upload button click
  const handleFileButtonClick = () => {
    fileInputRef.current.click();
  };

  // Remove attachment
  const removeAttachment = (index) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  // Handle message submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if ((!message.trim() && attachments.length === 0) || !currentRoom) return;
    
    try {
      // In a real implementation, you would first upload attachments
      // and then send their URLs with the message
      setIsUploading(true);
      
      // For now, we'll just simulate attachment handling
      // In a real app, you would upload files and get URLs back
      const attachmentUrls = [];
      
      // Send the message with attachment URLs
      await sendMessage(message, attachmentUrls);
      
      // Clear the input and attachments
      setMessage('');
      setAttachments([]);
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Paper
      component="form"
      onSubmit={handleSubmit}
      sx={{
        p: 2,
        display: 'flex',
        flexDirection: 'column',
        borderTop: 1,
        borderColor: 'divider',
        bgcolor: 'background.paper'
      }}
      elevation={0}
    >
      {/* Attachments preview */}
      {attachments.length > 0 && (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', mb: 2, gap: 1 }}>
          {attachments.map((file, index) => (
            <Box
              key={index}
              sx={{
                position: 'relative',
                borderRadius: 1,
                overflow: 'hidden',
                border: '1px solid',
                borderColor: 'divider',
                p: 1,
                display: 'flex',
                alignItems: 'center',
                maxWidth: 200
              }}
            >
              <Typography noWrap sx={{ maxWidth: 150 }}>
                {file.name}
              </Typography>
              <IconButton
                size="small"
                onClick={() => removeAttachment(index)}
                sx={{ ml: 1 }}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>
          ))}
        </Box>
      )}

      {/* Message input */}
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <Tooltip title="Add attachment">
          <IconButton onClick={handleFileButtonClick} disabled={isUploading}>
            <AttachFileIcon />
          </IconButton>
        </Tooltip>
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: 'none' }}
          onChange={handleFileSelect}
          multiple
        />
        <Tooltip title="Add emoji">
          <IconButton disabled={isUploading}>
            <EmojiIcon />
          </IconButton>
        </Tooltip>
        <TextField
          fullWidth
          placeholder="Type a message..."
          variant="outlined"
          size="small"
          value={message}
          onChange={handleMessageChange}
          disabled={isUploading || !currentRoom}
          sx={{ mx: 1 }}
        />
        <Tooltip title="Send message">
          <IconButton
            color="primary"
            type="submit"
            disabled={isUploading || (!message.trim() && attachments.length === 0) || !currentRoom}
          >
            {isUploading ? <CircularProgress size={24} /> : <SendIcon />}
          </IconButton>
        </Tooltip>
      </Box>
    </Paper>
  );
};

export default MessageInput;