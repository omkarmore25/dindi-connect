const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const Group = require('../models/Group');
const { validateEvent, validateObjectIdParam } = require('../middleware/sanitize');

// Middleware to check if user is authenticated
const requireAuth = (req, res, next) => {
  if (req.isAuthenticated()) return next();
  res.status(401).json({ error: 'You must be logged in to perform this action' });
};

// GET /api/events - Fetch events
router.get('/', async (req, res) => {
  try {
    let filter = {};
    if (req.query.groupId) {
       filter.performingGroupId = req.query.groupId;
       // When fetching for a specific group (Dashboard view), we might want all events or just future ones.
       // Let's sort them by date descending for dashboard.
       const events = await Event.find(filter)
                                 .populate('performingGroupId', 'groupName contactNumber acceptingBookings')
                                 .sort({ date: -1 });
       return res.json(events.filter(e => e.performingGroupId != null));
    } else {
       // Only fetch events from today onwards for the main calendar
       const today = new Date();
       today.setHours(0, 0, 0, 0);
       filter.date = { $gte: today };
       const events = await Event.find(filter)
                                 .populate('performingGroupId', 'groupName contactNumber acceptingBookings')
                                 .sort({ date: 1 });
       return res.json(events.filter(e => e.performingGroupId != null));
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/events - Create an event
router.post('/', requireAuth, validateEvent, async (req, res) => {
  try {
    const { templeName, village, date, performingGroupId, locationCoordinates } = req.body;
    
    const group = await Group.findById(performingGroupId);
    if (!group) return res.status(404).json({ error: 'Group not found' });
    
    if (group.ownerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Unauthorized to add events for this group' });
    }

    const eventData = {
      templeName,
      village,
      date,
      performingGroupId
    };

    if (locationCoordinates && locationCoordinates.lat !== undefined && locationCoordinates.lng !== undefined) {
      eventData.locationCoordinates = locationCoordinates;
    }

    const newEvent = new Event(eventData);

    await newEvent.save();
    
    // Populate before returning so frontend has the group object structure
    await newEvent.populate('performingGroupId', 'groupName contactNumber acceptingBookings');
    res.status(201).json(newEvent);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/events/:id - Delete an event
router.delete('/:id', requireAuth, validateObjectIdParam('id'), async (req, res) => {
  try {
    const event = await Event.findById(req.params.id).populate('performingGroupId');
    if (!event) return res.status(404).json({ error: 'Event not found' });
    
    if (event.performingGroupId.ownerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Unauthorized to delete this event' });
    }

    await Event.deleteOne({ _id: req.params.id });
    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
