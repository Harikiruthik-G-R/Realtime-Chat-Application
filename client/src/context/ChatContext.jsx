import React, { createContext, useContext, useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import axios from 'axios';
import { useAuth } from './AuthContext';

const ChatContext = createContext();

export const useChat = () => useContext(ChatContext);

export const ChatProvider = ({ children }) => {
  const { currentUser, isAuthenticated } = useAuth();
  const [socket, setSocket] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [currentRoom, setCurrentRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [typingUsers, setTypingUsers] = useState({});

  // Initialize socket connection - optimized to prevent unnecessary reconnections
  useEffect(() => {
    if (isAuthenticated && currentUser?._id) {
      const newSocket = io('http://localhost:5000', {
        query: { userId: currentUser._id },
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 10000
      });

      setSocket(newSocket);

      // Socket event listeners
      newSocket.on('connect', () => {
        console.log('Connected to socket server');
        // Refresh rooms when socket reconnects - with debounce to prevent rapid loading
        setTimeout(() => {
          if (newSocket.connected) {
            fetchRooms().catch(err => console.error('Error fetching rooms on reconnect:', err));
          }
        }, 300);
      });

      newSocket.on('disconnect', () => {
        console.log('Disconnected from socket server');
      });

      newSocket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
      });

      newSocket.on('reconnect_attempt', (attemptNumber) => {
        console.log(`Socket reconnection attempt ${attemptNumber}`);
      });

      newSocket.on('reconnect', (attemptNumber) => {
        console.log(`Socket reconnected after ${attemptNumber} attempts`);
      });

      newSocket.on('reconnect_error', (error) => {
        console.error('Socket reconnection error:', error);
      });

      newSocket.on('reconnect_failed', () => {
        console.error('Socket reconnection failed');
      });

      // Clean up on unmount
      return () => {
        newSocket.disconnect();
      };
    }
    // Only depend on the user ID, not the entire user object
  }, [isAuthenticated, currentUser?._id]);

  // Listen for incoming messages - optimized to prevent constant reloading
  useEffect(() => {
    if (!socket) return;

    const handleReceiveMessage = (data) => {
      if (data.roomId === currentRoom?._id) {
        // Only add the message if it's not from the current user or not already in the messages array
        // This prevents duplicate messages when the sender receives their own message back
        setMessages((prevMessages) => {
          // Check if message with this ID already exists in the messages array
          const messageExists = prevMessages.some(msg => msg._id === data._id);
          if (messageExists) {
            return prevMessages; // Don't add duplicate message
          }
          return [...prevMessages, data];
        });
      }
    };

    const handleUserTyping = (data) => {
      if (data.roomId === currentRoom?._id && data.user._id !== currentUser?._id) {
        setTypingUsers((prev) => ({
          ...prev,
          [data.user._id]: {
            ...data.user,
            timestamp: Date.now()
          }
        }));
      }
    };

    // Set up event listeners
    socket.on('receive_message', handleReceiveMessage);
    socket.on('user_typing', handleUserTyping);

    // Clean up function
    return () => {
      socket.off('receive_message', handleReceiveMessage);
      socket.off('user_typing', handleUserTyping);
    };
    // Only re-attach listeners when socket or currentRoom._id changes, not the entire currentRoom object
  }, [socket, currentRoom?._id, currentUser?._id]);

  // Clear typing indicator after 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setTypingUsers((prev) => {
        const updated = { ...prev };
        Object.keys(updated).forEach((userId) => {
          if (now - updated[userId].timestamp > 3000) {
            delete updated[userId];
          }
        });
        return updated;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Cache for rooms data with timestamp
  const [roomsCache, setRoomsCache] = useState({
    data: [],
    timestamp: 0,
    lastFetchTime: 0
  });

  // Fetch user's rooms with retry mechanism and caching
  const fetchRooms = async (retryCount = 0, maxRetries = 3, forceRefresh = false) => {
    if (!isAuthenticated) return;
    
    // Check if we have cached data and it's not a forced refresh
    const now = Date.now();
    const cacheAge = now - roomsCache.timestamp;
    const fetchCooldown = now - roomsCache.lastFetchTime;
    
    // Use cache if it's less than 2 minutes old and not forcing refresh
    // Also prevent fetching if last fetch was less than 5 seconds ago (prevents rapid consecutive calls)
    if (!forceRefresh && roomsCache.data.length > 0 && cacheAge < 120000 && fetchCooldown < 5000) {
      return roomsCache.data;
    }
    
    // Update last fetch time to prevent rapid consecutive calls
    setRoomsCache(prev => ({ ...prev, lastFetchTime: now }));
    
    // Only set loading state if we don't have cached data or it's very old
    if (roomsCache.data.length === 0 || cacheAge > 300000) {
      setLoading(true);
    }
    
    setError(null);
    try {
      const res = await axios.get('/api/rooms/my');
      
      // Update rooms state and cache
      setRooms(res.data);
      setRoomsCache({
        data: res.data,
        timestamp: Date.now(),
        lastFetchTime: Date.now()
      });
      
      return res.data;
    } catch (err) {
      console.error('Error fetching rooms:', err);
      
      // Implement retry logic with improved backoff
      if (retryCount < maxRetries) {
        console.log(`Retrying fetchRooms (${retryCount + 1}/${maxRetries})...`);
        // Exponential backoff: 1s, 2s, 4s, etc.
        const backoffTime = Math.min(1000 * Math.pow(2, retryCount), 8000);
        
        return new Promise((resolve, reject) => {
          setTimeout(() => {
            fetchRooms(retryCount + 1, maxRetries)
              .then(resolve)
              .catch(e => {
                console.error('Retry failed:', e);
                reject(e);
              });
          }, backoffTime);
        });
      } else {
        // If all retries fail but we have cached data, use it as fallback
        if (roomsCache.data.length > 0) {
          console.log('Using cached rooms data as fallback after fetch failure');
          return roomsCache.data;
        }
        
        setError(err.response?.data?.message || 'Failed to fetch rooms');
        throw err;
      }
    } finally {
      if (retryCount === 0) {
        setLoading(false);
      }
    }
  };

  // Fetch public rooms
  const fetchPublicRooms = async () => {
    if (!isAuthenticated) return;

    setLoading(true);
    setError(null);
    try {
      const res = await axios.get('/api/rooms');
      return res.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch public rooms');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Create a new room
  const createRoom = async (roomData) => {
    if (!isAuthenticated) return;

    setLoading(true);
    setError(null);
    try {
      const res = await axios.post('/api/rooms', roomData);
      setRooms((prevRooms) => [...prevRooms, res.data]);
      return res.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create room');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Join a room
  const joinRoom = async (roomId) => {
    if (!isAuthenticated || !socket) return;

    setLoading(true);
    setError(null);
    try {
      const res = await axios.put(`/api/rooms/${roomId}/join`);
      setRooms((prevRooms) => {
        if (!prevRooms.some((room) => room._id === res.data._id)) {
          return [...prevRooms, res.data];
        }
        return prevRooms;
      });
      return res.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to join room');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Leave a room
  const leaveRoom = async (roomId) => {
    if (!isAuthenticated || !socket) return;

    setLoading(true);
    setError(null);
    try {
      await axios.put(`/api/rooms/${roomId}/leave`);
      setRooms((prevRooms) => prevRooms.filter((room) => room._id !== roomId));
      if (currentRoom?._id === roomId) {
        setCurrentRoom(null);
        setMessages([]);
      }
      return true;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to leave room');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Select a room and fetch its messages
  const selectRoom = async (room) => {
    if (!isAuthenticated || !socket) return;

    // Leave current room if any
    if (currentRoom) {
      socket.emit('leave_room', currentRoom._id);
    }

    setCurrentRoom(room);
    setMessages([]);
    setTypingUsers({});

    // Join new room
    socket.emit('join_room', room._id);

    // Fetch messages for the room
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(`/api/messages/room/${room._id}`);
      setMessages(res.data);
      return res.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch messages');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Send a message
  const sendMessage = async (content, attachments = []) => {
    if (!isAuthenticated || !socket || !currentRoom) return;

    try {
      const messageData = {
        content,
        roomId: currentRoom._id,
        attachments
      };

      const res = await axios.post('/api/messages', messageData);
      const newMessage = res.data;

      // Emit message to room via socket
      socket.emit('send_message', {
        ...newMessage,
        sender: {
          _id: currentUser._id,
          username: currentUser.username,
          avatar: currentUser.avatar
        },
        roomId: currentRoom._id
      });

      setMessages((prevMessages) => [...prevMessages, newMessage]);
      return newMessage;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send message');
      throw err;
    }
  };

  // Send typing indicator
  const sendTypingIndicator = () => {
    if (!isAuthenticated || !socket || !currentRoom || !currentUser) return;

    socket.emit('typing', {
      roomId: currentRoom._id,
      user: {
        _id: currentUser._id,
        username: currentUser.username
      }
    });
  };

  const value = {
    socket,
    rooms,
    currentRoom,
    messages,
    loading,
    error,
    typingUsers,
    fetchRooms,
    fetchPublicRooms,
    createRoom,
    joinRoom,
    leaveRoom,
    selectRoom,
    sendMessage,
    sendTypingIndicator
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};