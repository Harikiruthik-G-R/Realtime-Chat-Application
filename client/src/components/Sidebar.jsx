import React, { useState, useEffect } from 'react';
import { useChat } from '../context/ChatContext';
import { useAuth } from '../context/AuthContext';
import { useCustomTheme } from '../context/ThemeContext';
import {
  Box,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Typography,
  Divider,
  IconButton,
  TextField,
  InputAdornment,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControlLabel,
  Switch,
  Badge,
  Tooltip
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  ExitToApp as LogoutIcon,
  FiberManualRecord as StatusIcon,
  Brightness4 as DarkModeIcon,
  Brightness7 as LightModeIcon
} from '@mui/icons-material';

const Sidebar = () => {
  const { currentUser, logout, updateStatus } = useAuth();
  const { mode, toggleTheme } = useCustomTheme();
  const {
    rooms,
    currentRoom,
    fetchRooms,
    fetchPublicRooms,
    createRoom,
    joinRoom,
    selectRoom,
    loading
  } = useChat();

  const [searchTerm, setSearchTerm] = useState('');
  const [openNewRoomDialog, setOpenNewRoomDialog] = useState(false);
  const [newRoomData, setNewRoomData] = useState({ name: '', description: '', isPrivate: false });
  const [publicRooms, setPublicRooms] = useState([]);
  const [showPublicRooms, setShowPublicRooms] = useState(false);
  const [userStatus, setUserStatus] = useState(currentUser?.status || 'online');

  // Fetch rooms on component mount and set up periodic refresh - optimized to prevent rapid loading
  useEffect(() => {
    // Track if component is mounted to prevent state updates after unmount
    let isMounted = true;
    
    // Initial fetch with a small delay to prevent rapid loading on mount
    const initialFetchTimer = setTimeout(() => {
      if (isMounted) {
        fetchRooms().catch(err => console.error('Initial room fetch error:', err));
      }
    }, 300);
    
    // Set up periodic refresh every 60 seconds (increased from 30 to reduce frequency)
    const refreshInterval = setInterval(() => {
      if (isMounted && !loading && document.visibilityState === 'visible') {
        // Only fetch if the app is visible and not already loading
        fetchRooms().catch(err => console.error('Periodic room fetch error:', err));
      }
    }, 60000);
    
    // Clean up timers on unmount
    return () => {
      isMounted = false;
      clearTimeout(initialFetchTimer);
      clearInterval(refreshInterval);
    };
  }, [fetchRooms, loading]);

  // Handle room selection
  const handleRoomSelect = (room) => {
    selectRoom(room);
  };

  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  // Filter rooms based on search term
  const filteredRooms = rooms.filter(room =>
    room.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle new room dialog open/close
  const handleOpenNewRoomDialog = () => {
    setOpenNewRoomDialog(true);
  };

  const handleCloseNewRoomDialog = () => {
    setOpenNewRoomDialog(false);
    setNewRoomData({ name: '', description: '', isPrivate: false });
  };

  // Handle new room form change
  const handleNewRoomChange = (e) => {
    const { name, value, checked } = e.target;
    setNewRoomData(prev => ({
      ...prev,
      [name]: name === 'isPrivate' ? checked : value
    }));
  };

  // Handle new room creation
  const handleCreateRoom = async () => {
    try {
      await createRoom(newRoomData);
      handleCloseNewRoomDialog();
    } catch (error) {
      console.error('Error creating room:', error);
    }
  };

  // Toggle between my rooms and public rooms
  const toggleRoomsView = async () => {
    if (!showPublicRooms) {
      try {
        const publicRoomsData = await fetchPublicRooms();
        setPublicRooms(publicRoomsData.filter(room => !rooms.some(r => r._id === room._id)));
      } catch (error) {
        console.error('Error fetching public rooms:', error);
      }
    }
    setShowPublicRooms(!showPublicRooms);
  };

  // Join a public room
  const handleJoinRoom = async (roomId) => {
    try {
      const joinedRoom = await joinRoom(roomId);
      selectRoom(joinedRoom);
      setShowPublicRooms(false);
    } catch (error) {
      console.error('Error joining room:', error);
    }
  };

  // Handle user status change
  const handleStatusChange = async (newStatus) => {
    try {
      await updateStatus(newStatus);
      setUserStatus(newStatus);
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'online': return 'success.main';
      case 'away': return 'warning.main';
      case 'busy': return 'error.main';
      case 'offline': return 'text.disabled';
      default: return 'success.main';
    }
  };

  return (
    <Box
      sx={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'background.paper',
        borderRight: 1,
        borderColor: 'divider'
      }}
    >
      {/* User Profile Section */}
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Badge
            overlap="circular"
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            badgeContent={
              <Tooltip title={`Status: ${userStatus}`}>
                <StatusIcon 
                  sx={{ 
                    fontSize: 12, 
                    color: getStatusColor(userStatus),
                    cursor: 'pointer'
                  }} 
                  onClick={() => {
                    const statuses = ['online', 'away', 'busy', 'offline'];
                    const currentIndex = statuses.indexOf(userStatus);
                    const nextStatus = statuses[(currentIndex + 1) % statuses.length];
                    handleStatusChange(nextStatus);
                  }}
                />
              </Tooltip>
            }
          >
            <Avatar src={currentUser?.avatar} alt={currentUser?.username}>
              {currentUser?.username?.charAt(0).toUpperCase()}
            </Avatar>
          </Badge>
          <Box sx={{ ml: 2 }}>
            <Typography variant="subtitle1" noWrap>
              {currentUser?.username}
            </Typography>
            <Typography variant="body2" color="text.secondary" noWrap>
              {currentUser?.email}
            </Typography>
          </Box>
        </Box>
        <Tooltip title="Logout">
          <IconButton edge="end" onClick={logout}>
            <LogoutIcon />
          </IconButton>
        </Tooltip>
      </Box>
      <Divider />

      {/* Search and Add Room Section */}
      <Box sx={{ p: 2 }}>
        <TextField
          fullWidth
          placeholder="Search rooms..."
          value={searchTerm}
          onChange={handleSearchChange}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          size="small"
          variant="outlined"
        />
        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
          <Button
            variant="outlined"
            size="small"
            onClick={toggleRoomsView}
          >
            {showPublicRooms ? 'My Rooms' : 'Discover'}
          </Button>
          <Button
            variant="contained"
            size="small"
            startIcon={<AddIcon />}
            onClick={handleOpenNewRoomDialog}
          >
            New Room
          </Button>
        </Box>
      </Box>
      <Divider />

      {/* Rooms List */}
      <Box sx={{ flexGrow: 1, overflow: 'auto', p: 1 }}>
        {loading ? (
          <Typography variant="body2" sx={{ p: 2, textAlign: 'center' }}>
            Loading rooms...
          </Typography>
        ) : showPublicRooms ? (
          publicRooms.length > 0 ? (
            <List>
              {publicRooms.map((room) => (
                <ListItem
                  key={room._id}
                  secondaryAction={
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => handleJoinRoom(room._id)}
                    >
                      Join
                    </Button>
                  }
                  sx={{ mb: 1, borderRadius: 1 }}
                >
                  <ListItemAvatar>
                    <Avatar>{room.name.charAt(0).toUpperCase()}</Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={room.name}
                    secondary={room.description || 'No description'}
                    primaryTypographyProps={{ noWrap: true }}
                    secondaryTypographyProps={{ noWrap: true }}
                  />
                </ListItem>
              ))}
            </List>
          ) : (
            <Typography variant="body2" sx={{ p: 2, textAlign: 'center' }}>
              No public rooms available
            </Typography>
          )
        ) : filteredRooms.length > 0 ? (
          <List>
            {filteredRooms.map((room) => (
              <ListItem
                key={room._id}
                button
                selected={currentRoom?._id === room._id}
                onClick={() => handleRoomSelect(room)}
                sx={{
                  mb: 1,
                  borderRadius: 1,
                  bgcolor: currentRoom?._id === room._id ? 'action.selected' : 'transparent',
                  '&:hover': {
                    bgcolor: 'action.hover',
                  },
                }}
              >
                <ListItemAvatar>
                  <Avatar>{room.name.charAt(0).toUpperCase()}</Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={room.name}
                  secondary={room.description || 'No description'}
                  primaryTypographyProps={{ noWrap: true }}
                  secondaryTypographyProps={{ noWrap: true }}
                />
              </ListItem>
            ))}
          </List>
        ) : (
          <Typography variant="body2" sx={{ p: 2, textAlign: 'center' }}>
            No rooms found
          </Typography>
        )}
      </Box>

      {/* Theme Toggle */}
      <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider', display: 'flex', justifyContent: 'center' }}>
        <Tooltip title={`Switch to ${mode === 'light' ? 'dark' : 'light'} mode`}>
          <IconButton onClick={toggleTheme} color="primary">
            {mode === 'light' ? <DarkModeIcon /> : <LightModeIcon />}
          </IconButton>
        </Tooltip>
      </Box>

      {/* New Room Dialog */}
      <Dialog open={openNewRoomDialog} onClose={handleCloseNewRoomDialog}>
        <DialogTitle>Create New Room</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            name="name"
            label="Room Name"
            type="text"
            fullWidth
            variant="outlined"
            value={newRoomData.name}
            onChange={handleNewRoomChange}
          />
          <TextField
            margin="dense"
            name="description"
            label="Description (optional)"
            type="text"
            fullWidth
            variant="outlined"
            value={newRoomData.description}
            onChange={handleNewRoomChange}
            multiline
            rows={2}
          />
          <FormControlLabel
            control={
              <Switch
                name="isPrivate"
                checked={newRoomData.isPrivate}
                onChange={handleNewRoomChange}
                color="primary"
              />
            }
            label="Private Room"
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseNewRoomDialog}>Cancel</Button>
          <Button 
            onClick={handleCreateRoom} 
            variant="contained"
            disabled={!newRoomData.name.trim()}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Sidebar;