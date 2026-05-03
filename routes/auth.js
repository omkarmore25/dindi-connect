const express = require('express');
const router = express.Router();
const passport = require('passport');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const Group = require('../models/Group');
const Booking = require('../models/Booking');
const Event = require('../models/Event');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../utils/mailer');
const { validateRegister, validateLogin, isValidEmail } = require('../middleware/sanitize');

// --- Auth Routes ---

// Google OAuth
router.get('/google', (req, res, next) => {
  // Save session before redirecting to Google to ensure the 'state' parameter 
  // is persisted even if the mobile browser switches apps.
  req.session.save((err) => {
    if (err) return next(err);
    passport.authenticate('google', { scope: ['profile', 'email'], state: false })(req, res, next);
  });
});

router.get('/google/callback',
  (req, res, next) => {
    // If the mobile browser/PWA double-requests this URL, skip auth for the second hit.
    if (req.isAuthenticated()) {
      console.log(`[DEBUG] Already authenticated. Skipping second auth attempt.`);
      return res.redirect('/dashboard.html');
    }
    console.log(`[DEBUG] Google Callback reached. User-Agent: ${req.headers['user-agent']}`);
    next();
  },
  passport.authenticate('google', { failureRedirect: '/auth.html?error=google_failed', state: false }),
  (req, res) => {
    // Explicitly save session before redirecting to ensure it's persisted 
    // even if the mobile browser pauses during the "Open in App" prompt.
    req.session.save((err) => {
      if (err) {
        console.error('[ERROR] Session save error:', err);
        return res.redirect('/auth.html?error=session_save_failed');
      }
      console.log(`[DEBUG] Google Auth Callback successful. Redirecting user: ${req.user?._id}`);
      res.redirect('/');
    });
  });

// Email/Password Registration
router.post('/register', validateRegister, async (req, res) => {
  try {
    const { email, password, username } = req.body;
    console.log(`[DEBUG] Register attempt for: ${email}`);
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    user = new User({ email, username, password: hashedPassword, isVerified: false });
    await user.save();

    const token = jwt.sign({ userId: user._id.toString() }, process.env.JWT_SECRET, { expiresIn: '1d' });
    const url = `${process.env.APP_URL}/api/auth/verify/${token}`;
    console.log(`[DEBUG] Registration success. Verification URL: ${url}`);

    // Send email in background to prevent UI hang
    sendVerificationEmail(email, url, username).catch(err => console.error("Background Email Error:", err));

    res.status(201).json({ message: 'Registration successful! Please check your email to verify.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Resend Verification Email
router.post('/resend-verification', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || !isValidEmail(email)) {
      return res.status(400).json({ error: 'A valid email is required.' });
    }
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: 'User not found' });
    if (user.isVerified) return res.status(400).json({ error: 'Account is already verified. Please log in.' });

    const token = jwt.sign({ userId: user._id.toString() }, process.env.JWT_SECRET, { expiresIn: '1d' });
    const url = `${process.env.APP_URL}/api/auth/verify/${token}`;

    // Send email in background
    sendVerificationEmail(email, url, user.username || 'User').catch(err => console.error("Background Email Error:", err));
    res.json({ message: 'Verification link has been resent to your email!' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Email/Password Login
router.post('/login', validateLogin, async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user || !user.password) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    if (!user.isVerified) {
      return res.status(400).json({ error: 'Please verify your email first' });
    }

    // Since we're using sessions, log the user in
    req.logIn(user, (err) => {
      if (err) return res.status(500).json({ error: 'Login failed' });
      return res.json({ message: 'Logged in successfully' });
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Forgot Password
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    console.log(`[DEBUG] Forgot Password attempt for: ${email}`);
    if (!email || !isValidEmail(email)) {
      return res.status(400).json({ error: 'A valid email is required.' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      // Return success even if user doesn't exist to prevent email enumeration
      return res.json({ message: 'If that email exists, a reset link has been sent.' });
    }

    if (user.googleId && !user.password) {
      return res.status(400).json({ error: 'This account was created with Google. Please log in with Google.' });
    }

    const token = crypto.randomBytes(20).toString('hex');
    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await user.save();

    const resetLink = `${process.env.APP_URL}/reset-password.html?token=${token}`;

    // Send email in background
    sendPasswordResetEmail(user.email, resetLink, user.username || 'User').catch(err => {
      console.error('Background Reset Email Error:', err);
    });

    res.json({ message: 'If that email exists, a reset link has been sent.' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Reset Password
router.post('/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ error: 'Token and new password are required.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ error: 'Password reset token is invalid or has expired.' });
    }

    user.password = await bcrypt.hash(password, 10);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ message: 'Password has been successfully reset. You can now log in.' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});


// Email Verification
router.get('/verify/:token', async (req, res) => {
  try {
    const decoded = jwt.verify(req.params.token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);
    if (!user) return res.status(400).json({ error: 'Invalid token' });

    user.isVerified = true;
    await user.save();

    // Auto-login the user immediately upon clicking the verification link
    req.logIn(user, (err) => {
      if (err) return res.redirect('/auth.html?error=verification_login_failed');
      return res.redirect('/');
    });
  } catch (error) {
    res.status(400).json({ error: 'Invalid or expired token' });
  }
});

// Logout
router.get('/logout', (req, res) => {
  req.logout((err) => {
    if (err) return res.status(500).json({ error: 'Failed to logout' });
    res.redirect('/');
  });
});

// Permanent Account Deletion
router.delete('/delete-account', async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const userId = req.user._id.toString();
  try {
    // 1. Find all groups owned by this user
    const groups = await Group.find({ ownerId: userId });
    const groupIds = groups.map(g => g._id);

    // 2. Delete all related data for these groups
    await Booking.deleteMany({ groupId: { $in: groupIds } });
    await Event.deleteMany({ performingGroupId: { $in: groupIds } });
    await Group.deleteMany({ ownerId: userId });

    // 3. Delete the user record
    await User.findByIdAndDelete(userId);

    // 4. Manually destroy session to ensure clean exit
    req.session.destroy((err) => {
      if (err) {
        console.error('[ERROR] Session destruction failed:', err);
        return res.status(500).json({ error: 'Failed to fully clear session.' });
      }
      res.clearCookie('connect.sid'); // Clear session cookie
      res.json({ message: 'Account and all related data deleted successfully.' });
    });
  } catch (error) {
    console.error('[ERROR] Account deletion failed:', error);
    res.status(500).json({ error: 'Deletion failed: ' + error.message });
  }
});

// Current User Info
router.get('/current_user', (req, res) => {
  if (req.isAuthenticated()) {
    res.json({ isAuthenticated: true, user: req.user });
  } else {
    res.json({ isAuthenticated: false });
  }
});

module.exports = router;
