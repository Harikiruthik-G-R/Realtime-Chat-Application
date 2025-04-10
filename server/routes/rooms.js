const express = require('express');
const router = express.Router();
const Room = require('../models/Room');
const User = require('../models/User');
const auth = require('../middleware/auth');


router.post('/', auth, async (req, res) => {
  try {
    const { name, description, isPrivate } = req.body;

    // Create new room
    const newRoom = new Room({
      name,
      description,
      isPrivate: isPrivate || false,
      creator: req.user.id,
      members: [req.user.id]
    });

    // Save room to database
    const room = await newRoom.save();

    // Add room to user's rooms
    await User.findByIdAndUpdate(
      req.user.id,
      { $push: { rooms: room._id } }
    );

    res.json(room);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/rooms
// @desc    Get all public rooms
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const rooms = await Room.find({ isPrivate: false })
      .populate('creator', 'username')
      .populate('lastMessage')
      .sort({ updatedAt: -1 });
    res.json(rooms);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/rooms/my
// @desc    Get all rooms user is a member of
// @access  Private
router.get('/my', auth, async (req, res) => {
  try {
    const rooms = await Room.find({ members: req.user.id })
      .populate('creator', 'username')
      .populate({
        path: 'lastMessage',
        populate: {
          path: 'sender',
          select: 'username'
        }
      })
      .sort({ updatedAt: -1 });
    res.json(rooms);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/rooms/:id
// @desc    Get room by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const room = await Room.findById(req.params.id)
      .populate('creator', 'username')
      .populate('members', 'username email avatar status');

    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    // Check if user is a member of private room
    if (room.isPrivate && !room.members.some(member => member._id.toString() === req.user.id)) {
      return res.status(403).json({ message: 'Not authorized to access this room' });
    }

    res.json(room);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Room not found' });
    }
    res.status(500).send('Server error');
  }
});

// @route   PUT api/rooms/:id/join
// @desc    Join a room
// @access  Private
router.put('/:id/join', auth, async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);

    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    // Check if user is already a member
    if (room.members.includes(req.user.id)) {
      return res.status(400).json({ message: 'Already a member of this room' });
    }

    // Check if room is private
    if (room.isPrivate) {
      return res.status(403).json({ message: 'Cannot join private room without invitation' });
    }

    // Add user to room members
    room.members.push(req.user.id);
    await room.save();

    // Add room to user's rooms
    await User.findByIdAndUpdate(
      req.user.id,
      { $push: { rooms: room._id } }
    );

    res.json(room);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Room not found' });
    }
    res.status(500).send('Server error');
  }
});

// @route   PUT api/rooms/:id/leave
// @desc    Leave a room
// @access  Private
router.put('/:id/leave', auth, async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);

    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    // Check if user is a member
    if (!room.members.includes(req.user.id)) {
      return res.status(400).json({ message: 'Not a member of this room' });
    }

    // Remove user from room members
    room.members = room.members.filter(member => member.toString() !== req.user.id);
    await room.save();

    // Remove room from user's rooms
    await User.findByIdAndUpdate(
      req.user.id,
      { $pull: { rooms: room._id } }
    );

    res.json({ message: 'Left room successfully' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Room not found' });
    }
    res.status(500).send('Server error');
  }
});

// @route   DELETE api/rooms/:id
// @desc    Delete a room
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);

    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    // Check if user is the creator of the room
    if (room.creator.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized to delete this room' });
    }

    // Remove room from all members' rooms array
    await User.updateMany(
      { _id: { $in: room.members } },
      { $pull: { rooms: room._id } }
    );

    // Delete room
    await room.remove();

    res.json({ message: 'Room deleted successfully' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Room not found' });
    }
    res.status(500).send('Server error');
  }
});

module.exports = router;