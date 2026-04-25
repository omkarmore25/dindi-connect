const express = require('express');
const router = express.Router();
const Group = require('../models/Group');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const { validateGroup, validateObjectIdParam, escapeRegex } = require('../middleware/sanitize');

// Configure Multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25 MB max
  fileFilter: (req, file, cb) => {
    const allowed = /\.(jpg|jpeg|png|gif|webp)$/i;
    if (!allowed.test(path.extname(file.originalname))) {
      return cb(new Error('Only image files (jpg, png, gif, webp) are allowed.'));
    }
    cb(null, true);
  }
});

// Middleware to check if user is authenticated
const requireAuth = (req, res, next) => {
  if (req.isAuthenticated()) return next();
  res.status(401).json({ error: 'You must be logged in to perform this action' });
};

// GET /api/groups - Fetch all groups, with optional village query filter
router.get('/', async (req, res) => {
  try {
    let filter = {};
    if (req.query.village) {
      // Case-insensitive partial match
      filter.village = { $regex: new RegExp(escapeRegex(req.query.village), 'i') };
    }
    const groups = await Group.find(filter).sort({ createdAt: -1 });
    res.json(groups);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/groups/my-groups - Fetch all groups owned by logged in user
router.get('/my-groups', requireAuth, async (req, res) => {
  try {
    const groups = await Group.find({ ownerId: req.user._id });
    res.json(groups);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/groups/:id - Fetch a single group by ID
router.get('/:id', validateObjectIdParam('id'), async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ error: 'Group not found' });
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.json(group);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
// POST /api/groups - Register a new Dindi
router.post('/', requireAuth, validateGroup, async (req, res) => {
  try {
    console.log('[DEBUG] POST /api/groups body:', req.body);
    const { groupName, village, leaderName, contactNumber, memberCount, registrationId, acceptingBookings, description, achievements, photos } = req.body;
    
    const newGroup = new Group({
      groupName,
      village,
      leaderName,
      contactNumber,
      memberCount,
      registrationId: registrationId || null,
      acceptingBookings: acceptingBookings !== undefined ? acceptingBookings : true,
      description: description || '',
      achievements: achievements || [],
      photos: photos || [],
      ownerId: req.user._id
    });

    await newGroup.save();
    res.status(201).json(newGroup);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/groups/:id - Update group details
router.put('/:id', requireAuth, validateObjectIdParam('id'), async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ error: 'Group not found' });
    if (group.ownerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Unauthorized to edit this group' });
    }

    console.log('[DEBUG] PUT /api/groups/:id body:', req.body);
    const { groupName, leaderName, memberCount, contactNumber, registrationId, description, achievements, acceptingBookings, photos } = req.body;
    
    if (groupName !== undefined) group.groupName = groupName;
    if (leaderName !== undefined) group.leaderName = leaderName;
    if (memberCount !== undefined) group.memberCount = memberCount;
    if (contactNumber !== undefined) group.contactNumber = contactNumber;
    if (registrationId !== undefined) group.registrationId = registrationId || null;
    if (description !== undefined) group.description = description;
    if (acceptingBookings !== undefined) group.acceptingBookings = acceptingBookings;
    
    if (achievements !== undefined) {
      if (Array.isArray(achievements)) {
        group.achievements = achievements;
      } else {
         group.achievements = achievements.split(',').map(s => s.trim()).filter(s => s);
      }
    }

    if (photos !== undefined && Array.isArray(photos)) {
      // Identify deleted photos for file cleanup
      const deletedPhotos = group.photos.filter(p => !photos.includes(p));
      deletedPhotos.forEach(photoUrl => {
        if (photoUrl.startsWith('/uploads/')) {
          const filePath = path.join(__dirname, '../public', photoUrl);
          if (fs.existsSync(filePath)) {
            fs.unlink(filePath, (err) => {
              if (err) console.error('[FILE CLEANUP] Error:', err);
            });
          }
        }
      });
      group.photos = photos;
    }

    await group.save();
    res.json(group);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/groups/:id/photos - Upload a photo
router.post('/:id/photos', requireAuth, validateObjectIdParam('id'), upload.single('photo'), async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ error: 'Group not found' });
    if (group.ownerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Unauthorized to edit this group' });
    }

    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const filename = `photo-${uniqueSuffix}.webp`;
    const outputPath = path.join(__dirname, '../public/uploads/', filename);

    // Optimize image using Sharp
    await sharp(req.file.buffer)
      .resize(1200, null, { withoutEnlargement: true }) // Max width 1200, auto height
      .webp({ quality: 80 }) // Compress to 80% quality WebP
      .toFile(outputPath);

    const photoUrl = '/uploads/' + filename;
    group.photos.push(photoUrl);
    await group.save();

    res.json({ photoUrl, group });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Photos are managed via PUT /api/groups/:id
// (Deleted the redundant POST delete endpoint)

// DELETE /api/groups/:id - Delete a group
router.delete('/:id', requireAuth, validateObjectIdParam('id'), async (req, res) => {
  try {
    console.log(`[DELETE] Request for group id: ${req.params.id} by user: ${req.user._id}`);
    const group = await Group.findById(req.params.id);
    if (!group) {
       console.log('[DELETE] Group not found');
       return res.status(404).json({ error: 'Group not found' });
    }
    
    console.log(`[DELETE] Group owner: ${group.ownerId}, Req user: ${req.user._id}`);
    if (group.ownerId.toString() !== req.user._id.toString()) {
      console.log('[DELETE] Authorization failed');
      return res.status(403).json({ error: 'Unauthorized to delete this group' });
    }

    // Import Event here to avoid circular dependency issues at the top level
    const Event = require('../models/Event');
    await Event.deleteMany({ performingGroupId: req.params.id });
    
    const delResult = await Group.deleteOne({ _id: req.params.id });
    console.log(`[DELETE] Deleted count: ${delResult.deletedCount}`);
    res.json({ message: 'Group deleted successfully' });
  } catch (error) {
    console.error('[DELETE] Server error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
