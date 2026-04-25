const express = require('express');
const router = express.Router();
const passport = require('passport');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../utils/mailer');
const { validateRegister, validateLogin, isValidEmail } = require('../middleware/sanitize');

// --- Auth Routes ---

// Google OAuth
router.get('/google',
  passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get('/google/callback', 
  passport.authenticate('google', { failureRedirect: '/auth.html?error=google_failed' }),
  (req, res) => {
    // Successful authentication, redirect to directory
    res.redirect('/');
  });

// Email/Password Registration
router.post('/register', validateRegister, async (req, res) => {
  try {
    const { email, password, username } = req.body;
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ error: 'User already exists' });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    user = new User({ email, username, password: hashedPassword, isVerified: false });
    await user.save();

    const token = jwt.sign({ userId: user._id.toString() }, process.env.JWT_SECRET, { expiresIn: '1d' });
    const url = `${process.env.APP_URL}/api/auth/verify/${token}`;

    try {
      await sendVerificationEmail(email, url, username);
    } catch (emailError) {
      console.error("Error sending email:", emailError.message);
    }

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

    try {
      await sendVerificationEmail(email, url, user.username || 'User');
      res.json({ message: 'Verification link has been resent to your email!' });
    } catch (emailError) {
      res.status(500).json({ error: 'Failed to send email' });
    }
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
    
    try {
      await sendPasswordResetEmail(user.email, resetLink, user.username || 'User');
    } catch (err) {
      console.error('Error sending reset email:', err);
      // Reset token if email fails
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save();
      return res.status(500).json({ error: 'Failed to send password reset email. Please try again.' });
    }

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

// Current User Info
router.get('/current_user', (req, res) => {
  if (req.isAuthenticated()) {
    res.json({ isAuthenticated: true, user: req.user });
  } else {
    res.json({ isAuthenticated: false });
  }
});

module.exports = router;
