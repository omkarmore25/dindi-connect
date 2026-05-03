const express = require('express');
const router = express.Router();
const CommunityEvent = require('../models/CommunityEvent');
const { validateObjectIdParam } = require('../middleware/sanitize');
const multer = require('multer');
const path = require('path');
const sharp = require('sharp');
const cloudinary = require('../utils/cloudinary');

// Middleware to check if user is authenticated
const requireAuth = (req, res, next) => {
  if (req.isAuthenticated()) return next();
  res.status(401).json({ error: 'You must be logged in to perform this action' });
};

// Configure Multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25 MB max
  fileFilter: (req, file, cb) => {
    const allowed = /\.(jpg|jpeg|png|gif|webp)$/i;
    if (!allowed.test(path.extname(file.originalname))) {
      return cb(new Error('Only image files are allowed.'));
    }
    cb(null, true);
  }
});

// GET /api/community-events - Fetch all events
router.get('/', async (req, res) => {
  try {
    let filter = {};
    const searchQuery = req.query.search;
    if (searchQuery) {
      filter.$or = [
        { eventName: { $regex: new RegExp(searchQuery, 'i') } },
        { venue: { $regex: new RegExp(searchQuery, 'i') } }
      ];
    }

    if (req.query.type && req.query.type !== 'All') {
      filter.eventType = req.query.type;
    }
    
    const events = await CommunityEvent.find(filter).sort({ date: 1 });
    
    // Auto-delete events that have fully passed (use endDate if set, else date)
    const now = new Date();
    const futureEvents = events.filter(event => {
      const endDate = event.endDate ? new Date(event.endDate) : new Date(event.date);
      return endDate >= now;
    });
    const pastEvents = events.filter(event => {
      const endDate = event.endDate ? new Date(event.endDate) : new Date(event.date);
      return endDate < now;
    });
    
    // Delete past events asynchronously
    pastEvents.forEach(async (event) => {
       await CommunityEvent.findByIdAndDelete(event._id);
    });

    res.json(futureEvents);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/community-events/my-events - Fetch logged in user's events
router.get('/my-events', requireAuth, async (req, res) => {
  try {
    const events = await CommunityEvent.find({ userId: req.user._id }).sort({ date: 1 });
    res.json(events);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/community-events/:id - Fetch a single event
router.get('/:id', validateObjectIdParam('id'), async (req, res) => {
  try {
    const event = await CommunityEvent.findById(req.params.id);
    if (!event) return res.status(404).json({ error: 'Event not found' });
    res.json(event);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/community-events - Create a new event
router.post('/', requireAuth, async (req, res) => {
  try {
    const newEvent = new CommunityEvent({
      ...req.body,
      userId: req.user._id
    });
    await newEvent.save();
    res.status(201).json(newEvent);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/community-events/:id/photos - Upload a photo for an event
router.post('/:id/photos', requireAuth, validateObjectIdParam('id'), upload.single('photo'), async (req, res) => {
  try {
    const event = await CommunityEvent.findOne({ _id: req.params.id, userId: req.user._id });
    if (!event) return res.status(404).json({ error: 'Event not found or unauthorized' });
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    // Optimize image using Sharp
    const webpBuffer = await sharp(req.file.buffer)
      .resize(1200, null, { withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer();

    // Upload to Cloudinary
    const uploadToCloudinary = (buffer) => {
      return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          { folder: 'dindi-community-events', format: 'webp' },
          (error, result) => {
            if (result) resolve(result);
            else reject(error);
          }
        );
        uploadStream.end(buffer);
      });
    };

    const cloudinaryResult = await uploadToCloudinary(webpBuffer);
    const photoUrl = cloudinaryResult.secure_url;

    event.photos.push(photoUrl);
    await event.save();
    res.json({ photoUrl, event });
  } catch (e) {
    console.error('[CE PHOTO UPLOAD] Error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// PUT /api/community-events/:id - Update an event
router.put('/:id', requireAuth, validateObjectIdParam('id'), async (req, res) => {
  try {
    const event = await CommunityEvent.findById(req.params.id);
    if (!event) return res.status(404).json({ error: 'Event not found' });
    if (event.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Unauthorized to edit this event' });
    }

    // Handle photo deletions
    if (req.body.deletePhotos) {
      const toDelete = Array.isArray(req.body.deletePhotos) ? req.body.deletePhotos : [req.body.deletePhotos];
      event.photos = event.photos.filter(p => !toDelete.includes(p));
      delete req.body.deletePhotos;
    }

    Object.assign(event, req.body);
    await event.save();
    res.json(event);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/community-events/:id - Delete an event
router.delete('/:id', requireAuth, validateObjectIdParam('id'), async (req, res) => {
  try {
    const event = await CommunityEvent.findById(req.params.id);
    if (!event) return res.status(404).json({ error: 'Event not found' });
    if (event.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Unauthorized to delete this event' });
    }

    await CommunityEvent.findByIdAndDelete(req.params.id);
    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
