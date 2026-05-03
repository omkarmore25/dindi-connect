const express = require('express');
const router = express.Router();
const Group = require('../models/Group');
const Report = require('../models/Report');
const Competition = require('../models/Competition');
const CommunityEvent = require('../models/CommunityEvent');
const Booking = require('../models/Booking');
const User = require('../models/User');
const Event = require('../models/Event');

// Middleware to check if admin is authenticated
const requireAdmin = (req, res, next) => {
  if (req.session && req.session.isAdmin) {
    return next();
  }
  res.status(401).json({ error: 'Unauthorized: Admin access required' });
};

// POST /api/admin/login
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
    req.session.isAdmin = true;
    res.json({ message: 'Logged in successfully' });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

// POST /api/admin/logout
router.post('/logout', (req, res) => {
  req.session.destroy();
  res.json({ message: 'Logged out successfully' });
});

// GET /api/admin/check
router.get('/check', (req, res) => {
  if (req.session && req.session.isAdmin) {
    res.json({ isAdmin: true });
  } else {
    res.json({ isAdmin: false });
  }
});

// GET /api/admin/stats
router.get('/stats', requireAdmin, async (req, res) => {
  try {
    const [groups, bookings, reports, competitions, communityEvents, users] = await Promise.all([
      Group.countDocuments(),
      Booking.countDocuments(),
      Report.countDocuments(),
      Competition.countDocuments(),
      CommunityEvent.countDocuments(),
      User.countDocuments()
    ]);
    res.json({ groups, bookings, reports, competitions, communityEvents, users });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- Entities Management ---

// GROUPS
router.get('/groups', requireAdmin, async (req, res) => {
  try {
    const groups = await Group.find().sort({ createdAt: -1 });
    res.json(groups);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/groups/:id', requireAdmin, async (req, res) => {
  try {
    const groupId = req.params.id;
    console.log(`[ADMIN] Deleting group ${groupId} and its reports...`);
    
    await Group.findByIdAndDelete(groupId);
    const deleteResult = await Report.deleteMany({ groupId: groupId });
    
    console.log(`[ADMIN] Deleted ${deleteResult.deletedCount} reports for group ${groupId}`);
    res.json({ message: 'Group and reports cleaned up' });
  } catch (error) {
    console.error(`[ADMIN] Delete Error:`, error);
    res.status(500).json({ error: error.message });
  }
});

// REPORTS
router.get('/reports', requireAdmin, async (req, res) => {
  try {
    const reports = await Report.find().sort({ createdAt: -1 });
    res.json(reports);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/reports/:id', requireAdmin, async (req, res) => {
  try {
    await Report.findByIdAndDelete(req.params.id);
    res.json({ message: 'Report dismissed' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// COMPETITIONS
router.get('/competitions', requireAdmin, async (req, res) => {
  try {
    const competitions = await Competition.find().sort({ date: 1 }).populate('organizerId', 'displayName');
    res.json(competitions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/competitions/:id', requireAdmin, async (req, res) => {
  try {
    await Competition.findByIdAndDelete(req.params.id);
    res.json({ message: 'Competition deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// COMMUNITY EVENTS
router.get('/community-events', requireAdmin, async (req, res) => {
  try {
    const events = await CommunityEvent.find().sort({ date: 1 }).populate('userId', 'displayName');
    res.json(events);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/community-events/:id', requireAdmin, async (req, res) => {
  try {
    await CommunityEvent.findByIdAndDelete(req.params.id);
    res.json({ message: 'Community event deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// BOOKINGS
router.get('/bookings', requireAdmin, async (req, res) => {
  try {
    const bookings = await Booking.find().sort({ createdAt: -1 }).populate('groupId', 'groupName');
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/bookings/:id', requireAdmin, async (req, res) => {
  try {
    await Booking.findByIdAndDelete(req.params.id);
    res.json({ message: 'Booking deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// USERS
router.get('/users', requireAdmin, async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/users/:id', requireAdmin, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PERFORMANCES (Events)
router.get('/performances', requireAdmin, async (req, res) => {
  try {
    const events = await Event.find().sort({ date: 1 }).populate('performingGroupId', 'groupName');
    res.json(events);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/performances/:id', requireAdmin, async (req, res) => {
  try {
    await Event.findByIdAndDelete(req.params.id);
    res.json({ message: 'Performance deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
