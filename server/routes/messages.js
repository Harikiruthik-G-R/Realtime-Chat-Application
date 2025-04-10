const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const Room = require('../models/Room');
const auth = require('../middleware/auth');


router.post('/', auth, async (req, res) => {
  try {
    const { content, roomId, attachments } = req.body;

    // Check if room exists
    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    // Check if user is a member of the room
    if (!room.members.includes(req.user.id)) {
      return res.status(403).json({ message: 'Not authorized to send messages in this room' });
    }

    // Create new message
    const newMessage = new Message({
      content,
      sender: req.user.id,
      room: roomId,
      readBy: [req.user.id],
      attachments: attachments || []
    });

    // Save message to database
    const message = await newMessage.save();

    // Update room's lastMessage
    room.lastMessage = message._id;
    await room.save();

    // Populate sender info
    await message.populate('sender', 'username avatar');

    res.json(message);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/messages/room/:roomId
// @desc    Get messages for a room
// @access  Private
router.get('/room/:roomId', auth, async (req, res) => {
  try {
    const roomId = req.params.roomId;
    
    // Check if room exists
    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    // Check if user is a member of the room
    if (!room.members.includes(req.user.id)) {
      return res.status(403).json({ message: 'Not authorized to view messages in this room' });
    }

    // Get pagination parameters
    const page = parseInt(req.query.page) || 0;
    const limit = parseInt(req.query.limit) || 50;

    // Get messages for the room
    const messages = await Message.find({ room: roomId })
      .populate('sender', 'username avatar')
      .sort({ createdAt: -1 })
      .skip(page * limit)
      .limit(limit);

    // Mark messages as read by current user
    await Message.updateMany(
      { 
        room: roomId, 
        sender: { $ne: req.user.id },
        readBy: { $ne: req.user.id }
      },
      { $push: { readBy: req.user.id } }
    );

    res.json(messages.reverse()); // Return in chronological order
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Room not found' });
    }
    res.status(500).send('Server error');
  }
});

// @route   DELETE api/messages/:id
// @desc    Delete a message
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);

    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Check if user is the sender of the message
    if (message.sender.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized to delete this message' });
    }

    // Delete message
    await message.remove();

    // Update room's lastMessage if needed
    const room = await Room.findById(message.room);
    if (room && room.lastMessage && room.lastMessage.toString() === req.params.id) {
      // Find the new last message
      const lastMessage = await Message.findOne({ room: room._id })
        .sort({ createdAt: -1 });
      
      room.lastMessage = lastMessage ? lastMessage._id : null;
      await room.save();
    }

    res.json({ message: 'Message deleted successfully' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Message not found' });
    }
    res.status(500).send('Server error');
  }
});

// @route   PUT api/messages/:id/read
// @desc    Mark a message as read
// @access  Private
router.put('/:id/read', auth, async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);

    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Check if user is a member of the room
    const room = await Room.findById(message.room);
    if (!room.members.includes(req.user.id)) {
      return res.status(403).json({ message: 'Not authorized to access messages in this room' });
    }

    // Check if message is already read by user
    if (message.readBy.includes(req.user.id)) {
      return res.json(message);
    }

    // Mark message as read
    message.readBy.push(req.user.id);
    await message.save();

    res.json(message);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Message not found' });
    }
    res.status(500).send('Server error');
  }
});

module.exports = router;