const express = require('express');
const router = express.Router();
const Group = require('../models/Group');
const Booking = require('../models/Booking');
const Event = require('../models/Event');
const { sendBookingEmail } = require('../utils/mailer');

// Middleware to ensure user is logged in
const ensureAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) return next();
  res.status(401).json({ error: 'Please login to access this feature.' });
};

// POST /api/bookings - Create a new booking request
router.post('/', async (req, res) => {
  try {
    const { groupId, name, phone, date, purpose, message } = req.body;
    
    if (!groupId || !name || !phone || !date || !purpose) {
      return res.status(400).json({ error: 'Missing required booking fields.' });
    }

    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ error: 'Group not found' });

    // Check for existing confirmed booking for this group on the same date
    const bookingDate = new Date(date);
    bookingDate.setHours(0,0,0,0);
    const endDate = new Date(bookingDate);
    endDate.setDate(endDate.getDate() + 1);

    const existingConfirmed = await Booking.findOne({
      groupId,
      eventDate: { $gte: bookingDate, $lt: endDate },
      status: 'confirmed'
    });

    if (existingConfirmed) {
      return res.status(400).json({ error: 'This group is already booked for the selected date.' });
    }

    // Save to DB
    const booking = new Booking({
      name,
      whatsappNumber: phone,
      eventDate: date,
      purpose,
      additionalMessage: message,
      groupId,
      groupName: group.groupName,
      status: 'new'
    });

    await booking.save();
    
    // Send email in background
    if (group.email) {
      sendBookingEmail(group.email, group.groupName, { name, phone, date, purpose, message: message || 'No additional details.' }).catch(err => {
        console.error('Background Booking Email Error:', err);
      });
    }

    res.json({ message: 'Booking request saved and notification sent.', bookingId: booking._id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/bookings/my-group - Get bookings for the current user's group(s)
router.get('/my-group', ensureAuthenticated, async (req, res) => {
  try {
    const groups = await Group.find({ ownerId: req.user._id });
    if (!groups || groups.length === 0) {
      return res.json({ groups: [], bookings: [] });
    }

    const groupIds = groups.map(g => g._id);
    const bookings = await Booking.find({ groupId: { $in: groupIds } }).sort({ createdAt: -1 });
    res.json({ 
        groups,
        bookings 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PATCH /api/bookings/:id/status - Update booking status
router.patch('/:id/status', ensureAuthenticated, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['confirmed', 'pending', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    
    if (booking.status === status) {
      return res.status(400).json({ error: `This booking is already ${status}` });
    }

    // Verify ownership
    const group = await Group.findById(booking.groupId);
    if (group.ownerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // If accepting, check for double booking again and create calendar event
    if (status === 'confirmed') {
      const bDate = new Date(booking.eventDate);
      bDate.setHours(0,0,0,0);
      const eDate = new Date(bDate);
      eDate.setDate(eDate.getDate() + 1);

      const alreadyBooked = await Booking.findOne({
        groupId: booking.groupId,
        _id: { $ne: booking._id },
        eventDate: { $gte: bDate, $lt: eDate },
        status: 'confirmed'
      });

      if (alreadyBooked) {
        return res.status(400).json({ error: 'You already have a confirmed booking for this date.' });
      }

      // Create Event for Public Calendar
      const newEvent = new Event({
        templeName: booking.purpose, // Mapping purpose to templeName for display
        village: group.village,
        date: booking.eventDate,
        performingGroupId: group._id
      });
      await newEvent.save();
    }

    booking.status = status;
    await booking.save();

    res.json({ message: `Booking ${status} successfully.`, booking });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
