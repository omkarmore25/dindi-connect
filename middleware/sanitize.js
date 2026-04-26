/**
 * Input sanitization & validation middleware.
 * - Strips HTML tags from all string fields in req.body
 * - Enforces max-length limits per field
 * - Validates email, phone, and ObjectId formats
 * - Rejects oversized payloads early
 */

const mongoose = require('mongoose');
const mongoSanitize = require('express-mongo-sanitize');

// ── Helpers ──────────────────────────────────────────────

/** Strip HTML tags from a string while preserving emojis and all unicode characters */
const stripTags = (str) => str.replace(/<\/?[a-zA-Z][^>]*>/g, '');

/** Trim and strip tags from all string values in an object (shallow) */
const sanitizeStrings = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;
  const clean = { ...obj };
  for (const [key, val] of Object.entries(clean)) {
    if (typeof val === 'string') {
      clean[key] = stripTags(val).trim();
    }
  }
  return clean;
};

/** Validate email format */
const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

/** Validate phone (digits, optional leading +, 7-15 chars) */
const isValidPhone = (phone) => /^\+?\d{7,15}$/.test(phone);

/** Validate Mongoose ObjectId */
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// ── Field length limits (characters) ─────────────────────
const FIELD_LIMITS = {
  email:                256,
  password:             128,
  username:              50,
  groupName:            100,
  village:              100,
  leaderName:           100,
  contactNumber:         20,
  description:         2000,
  message:             1000,
  templeName:           200,
  title:                200,
  location:             200,
  donorName:            100,
  donorEmail:           256,
  donorPhone:            20,
  registrationId:        50,
};

// ── Middleware: sanitize req.body strings ─────────────────
const sanitizeBody = (req, res, next) => {
  if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) {
    // Prevent NoSQL Injection
    mongoSanitize.sanitize(req.body);

    req.body = sanitizeStrings(req.body);

    // Sanitize string arrays (e.g. achievements)
    for (const [key, val] of Object.entries(req.body)) {
      if (Array.isArray(val)) {
        req.body[key] = val.map(item =>
          typeof item === 'string' ? stripTags(item).trim() : item
        );
      }
    }
  }
  next();
};

// ── Middleware: enforce field length limits ───────────────
const enforceLimits = (req, res, next) => {
  if (!req.body || typeof req.body !== 'object') return next();

  for (const [field, maxLen] of Object.entries(FIELD_LIMITS)) {
    const val = req.body[field];
    // Use Array.from() to correctly count emoji and unicode characters (not UTF-16 code units)
    if (typeof val === 'string' && Array.from(val).length > maxLen) {
      return res.status(400).json({
        error: `Field '${field}' exceeds maximum length of ${maxLen} characters.`
      });
    }
  }

  // Check array field lengths (achievements, photos)
  if (Array.isArray(req.body.achievements) && req.body.achievements.length > 20) {
    return res.status(400).json({ error: 'Maximum 20 achievements allowed.' });
  }
  if (Array.isArray(req.body.photos) && req.body.photos.length > 10) {
    return res.status(400).json({ error: 'Maximum 10 photos allowed.' });
  }
  if (Array.isArray(req.body.achievements)) {
    for (const a of req.body.achievements) {
      if (typeof a === 'string' && a.length > 500) {
        return res.status(400).json({ error: 'Each achievement must be under 500 characters.' });
      }
    }
  }

  next();
};

// ── Route-specific validators ────────────────────────────

const validateRegister = (req, res, next) => {
  const { email, password, username } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }
  if (!isValidEmail(email)) {
    return res.status(400).json({ error: 'Invalid email format.' });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters.' });
  }
  if (username && !/^[a-zA-Z0-9_.\- ]+$/.test(username)) {
    return res.status(400).json({ error: 'Username contains invalid characters.' });
  }
  next();
};

const validateLogin = (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }
  if (!isValidEmail(email)) {
    return res.status(400).json({ error: 'Invalid email format.' });
  }
  next();
};

const validateGroup = (req, res, next) => {
  const { groupName, village, leaderName, contactNumber, memberCount } = req.body;

  if (!groupName || !village || !leaderName || !contactNumber) {
    return res.status(400).json({ error: 'Group name, village, leader name, and contact number are required.' });
  }
  if (memberCount !== undefined) {
    const count = Number(memberCount);
    if (!Number.isInteger(count) || count < 1 || count > 10000) {
      return res.status(400).json({ error: 'Member count must be a whole number between 1 and 10,000.' });
    }
  }
  if (!isValidPhone(contactNumber.replace(/[\s\-]/g, ''))) {
    return res.status(400).json({ error: 'Invalid contact number format.' });
  }
  next();
};

const validateEvent = (req, res, next) => {
  const { templeName, village, date, performingGroupId } = req.body;

  if (!templeName || !village || !date || !performingGroupId) {
    return res.status(400).json({ error: 'Temple name, village, date, and performing group are required.' });
  }
  if (isNaN(Date.parse(date))) {
    return res.status(400).json({ error: 'Invalid date format.' });
  }
  if (!isValidObjectId(performingGroupId)) {
    return res.status(400).json({ error: 'Invalid group ID format.' });
  }
  if (req.body.locationCoordinates) {
    const { lat, lng } = req.body.locationCoordinates;
    if (lat !== undefined && lng !== undefined) {
      if (isNaN(Number(lat)) || isNaN(Number(lng))) {
        return res.status(400).json({ error: 'Invalid map coordinates.' });
      }
    }
  }
  next();
};

const validateCompetition = (req, res, next) => {
  const { title, description, location, date, registrationDeadline } = req.body;

  if (!title || !description || !location || !date || !registrationDeadline) {
    return res.status(400).json({ error: 'Title, description, location, date, and registration deadline are required.' });
  }
  if (isNaN(Date.parse(date)) || isNaN(Date.parse(registrationDeadline))) {
    return res.status(400).json({ error: 'Invalid date format.' });
  }
  if (new Date(registrationDeadline) > new Date(date)) {
    return res.status(400).json({ error: 'Registration deadline must be before the competition date.' });
  }
  if (req.body.locationCoordinates) {
    const { lat, lng } = req.body.locationCoordinates;
    if (lat !== undefined && lng !== undefined) {
      if (isNaN(Number(lat)) || isNaN(Number(lng))) {
        return res.status(400).json({ error: 'Invalid map coordinates.' });
      }
    }
  }
  next();
};

const validateDonation = (req, res, next) => {
  const { amount, donorName, donorEmail, donorPhone } = req.body;

  if (!amount || !donorName || !donorEmail || !donorPhone) {
    return res.status(400).json({ error: 'Amount, name, email, and phone are required.' });
  }
  const numAmount = Number(amount);
  if (isNaN(numAmount) || numAmount < 1 || numAmount > 1000000) {
    return res.status(400).json({ error: 'Amount must be between ₹1 and ₹10,00,000.' });
  }
  if (!isValidEmail(donorEmail)) {
    return res.status(400).json({ error: 'Invalid email format.' });
  }
  if (!isValidPhone(donorPhone.replace(/[\s\-]/g, ''))) {
    return res.status(400).json({ error: 'Invalid phone number format.' });
  }
  next();
};

const validateObjectIdParam = (paramName) => (req, res, next) => {
  if (!isValidObjectId(req.params[paramName])) {
    return res.status(400).json({ error: `Invalid ${paramName} format.` });
  }
  next();
};

module.exports = {
  sanitizeBody,
  enforceLimits,
  validateRegister,
  validateLogin,
  validateGroup,
  validateEvent,
  validateCompetition,
  validateDonation,
  validateObjectIdParam,
  isValidEmail,
  isValidPhone,
  isValidObjectId,
  escapeRegex: (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
};
