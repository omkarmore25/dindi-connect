const express = require('express');
const router = express.Router();
const Competition = require('../models/Competition');
const Group = require('../models/Group');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const { validateCompetition, validateObjectIdParam, isValidObjectId } = require('../middleware/sanitize');

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

// Authentication middleware check
const isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) return next();
  res.status(401).json({ error: 'Unauthorized' });
};

// GET /api/competitions - Fetch all upcoming competitions
router.get('/', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const comps = await Competition.find({ date: { $gte: today } })
                                   .populate('registeredGroups', 'groupName village ownerId')
                                   .sort({ date: 1 });
    res.json(comps);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/competitions/my-competitions - Fetch comps organized by logged in user
router.get('/my-competitions', isAuthenticated, async (req, res) => {
  try {
    const comps = await Competition.find({ organizerId: req.user._id })
                                   .populate('registeredGroups', 'groupName village leaderName contactNumber');
    res.json(comps);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/competitions/:id - Fetch a single competition
router.get('/:id', validateObjectIdParam('id'), async (req, res) => {
  try {
    const comp = await Competition.findById(req.params.id);
    if (!comp) return res.status(404).json({ error: 'Competition not found' });
    
    // Check if the user is the organizer
    const isOrganizer = req.isAuthenticated() && req.user && comp.organizerId.toString() === req.user._id.toString();
    
    // If organizer, populate contact info. If not, only basic info.
    const populateFields = isOrganizer ? 'groupName village leaderName contactNumber' : 'groupName village ownerId';
    await comp.populate('registeredGroups', populateFields);
    
    res.json(comp);
  } catch (error) {
    if (error.kind === 'ObjectId') return res.status(404).json({ error: 'Competition not found' });
    res.status(500).json({ error: error.message });
  }
});

// POST /api/competitions - Create a new competition (JSON only for details)
router.post('/', isAuthenticated, validateCompetition, async (req, res) => {
  try {
    if (!req.body || typeof req.body !== 'object') {
      return res.status(400).json({ error: 'Invalid request body' });
    }

    const { title, description, location, date, registrationDeadline } = req.body;
    
    if (!title) return res.status(400).json({ error: 'Title is required' });

    const compData = {
      title,
      description,
      location,
      date,
      registrationDeadline,
      organizerId: req.user._id,
      registeredGroups: [],
      photos: [] 
    };

    if (req.body.locationCoordinates && req.body.locationCoordinates.lat !== undefined && req.body.locationCoordinates.lng !== undefined) {
      compData.locationCoordinates = req.body.locationCoordinates;
    }

    const comp = new Competition(compData);
    await comp.save();
    res.status(201).json(comp);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/competitions/:id/register - Register a group for a competition
router.post('/:id/register', isAuthenticated, validateObjectIdParam('id'), async (req, res) => {
  try {
    const { groupId } = req.body;
    if (!groupId || !isValidObjectId(groupId)) {
      return res.status(400).json({ error: 'A valid group ID is required.' });
    }
    // Verify group exists and belongs to the user
    const group = await Group.findOne({ _id: groupId, ownerId: req.user._id });
    if (!group) {
      return res.status(403).json({ error: 'You do not own this group or it does not exist' });
    }

    const comp = await Competition.findById(req.params.id);
    if (!comp) {
      return res.status(404).json({ error: 'Competition not found' });
    }
    
    if (new Date() > new Date(comp.registrationDeadline)) {
      return res.status(400).json({ error: 'The registration deadline for this event has passed.' });
    }

    if (comp.registeredGroups.includes(groupId)) {
      return res.status(400).json({ error: 'Group is already registered for this competition' });
    }

    comp.registeredGroups.push(groupId);
    await comp.save();
    res.json({ message: 'Registration successful', comp });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/competitions/:id/withdraw - Withdraw a group
router.post('/:id/withdraw', isAuthenticated, validateObjectIdParam('id'), async (req, res) => {
  try {
    const { groupId } = req.body;
    if (!groupId || !isValidObjectId(groupId)) {
      return res.status(400).json({ error: 'A valid group ID is required.' });
    }
    const group = await Group.findOne({ _id: groupId, ownerId: req.user._id });
    if (!group) return res.status(403).json({ error: 'You do not own this group' });

    const comp = await Competition.findById(req.params.id);
    if (!comp) return res.status(404).json({ error: 'Competition not found' });

    if (new Date() > new Date(comp.registrationDeadline)) {
      return res.status(400).json({ error: 'Cannot withdraw after the registration deadline.' });
    }

    if (!comp.registeredGroups.some(id => id.toString() === groupId.toString())) {
      return res.status(400).json({ error: 'Group is not registered.' });
    }

    comp.registeredGroups = comp.registeredGroups.filter(id => id.toString() !== groupId.toString());
    await comp.save();
    res.json({ message: 'Withdrawal successful', comp });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/competitions/:id - Edit a competition
// PUT /api/competitions/:id - Edit competition details (JSON)
router.put('/:id', isAuthenticated, validateObjectIdParam('id'), async (req, res) => {
  try {
    const comp = await Competition.findOne({ _id: req.params.id, organizerId: req.user._id });
    if (!comp) return res.status(404).json({ error: 'Competition not found or unauthorized' });

    if (req.body) {
      const { title, description, location, date, registrationDeadline, deletePhotos } = req.body;
      if (title) comp.title = title;
      if (description) comp.description = description;
      if (location) comp.location = location;
      if (date) comp.date = date;
      if (registrationDeadline) comp.registrationDeadline = registrationDeadline;
      if (req.body.locationCoordinates !== undefined) {
        comp.locationCoordinates = req.body.locationCoordinates;
      }
      // Handle photo deletions
      if (deletePhotos) {
        const toDelete = Array.isArray(deletePhotos) ? deletePhotos : [deletePhotos];
        toDelete.forEach(photoUrl => {
          const idx = comp.photos.indexOf(photoUrl);
          if (idx !== -1) {
            comp.photos.splice(idx, 1);
            const filePath = path.join(__dirname, '../public', photoUrl);
            if (fs.existsSync(filePath)) {
              fs.unlink(filePath, (err) => {
                if (err) console.error('[FILE CLEANUP] Error:', err);
              });
            }
          }
        });
      }
    }

    await comp.save();
    res.json(comp);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/competitions/:id/photos - Upload a single photo
router.post('/:id/photos', isAuthenticated, validateObjectIdParam('id'), upload.single('photo'), async (req, res) => {
   try {
     console.log('[PHOTO UPLOAD] id:', req.params.id, 'File:', req.file ? req.file.filename : 'MISSING');
     const comp = await Competition.findOne({ _id: req.params.id, organizerId: req.user._id });
     if (!comp) return res.status(404).json({ error: 'Competition not found' });
     if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

     const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
     const filename = `poster-${uniqueSuffix}.webp`;
     const dir = path.join(__dirname, '../public/uploads/competitions/');
     if (!fs.existsSync(dir)){
         fs.mkdirSync(dir, { recursive: true });
     }
     const outputPath = path.join(dir, filename);

     // Optimize image using Sharp
     await sharp(req.file.buffer)
       .resize(1200, null, { withoutEnlargement: true }) // Max width 1200, auto height
       .webp({ quality: 80 }) // Compress to 80% quality WebP
       .toFile(outputPath);

     const photoUrl = '/uploads/competitions/' + filename;
     comp.photos.push(photoUrl);
     await comp.save();
     console.log('[PHOTO UPLOAD] Success:', photoUrl);
     res.json({ photoUrl, comp });
   } catch(e) {
     console.error('[PHOTO UPLOAD] Error:', e.message);
     res.status(500).json({ error: e.message });
   }
});

// DELETE /api/competitions/:id - Delete a competition
router.delete('/:id', isAuthenticated, validateObjectIdParam('id'), async (req, res) => {
  try {
    const comp = await Competition.findOne({ _id: req.params.id, organizerId: req.user._id });
    if (!comp) return res.status(404).json({ error: 'Competition not found or unauthorized' });

    // Delete all photo files
    if (comp.photos && comp.photos.length > 0) {
      comp.photos.forEach(photoUrl => {
        const filePath = path.join(__dirname, '../public', photoUrl);
        if (fs.existsSync(filePath)) {
          fs.unlink(filePath, (err) => {
            if (err) console.error('[FILE CLEANUP] Error:', err);
          });
        }
      });
    }

    await Competition.deleteOne({ _id: req.params.id });
    res.json({ message: 'Competition deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
