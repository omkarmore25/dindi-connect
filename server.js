const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const cors = require('cors');
const session = require('express-session');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('./models/User');
require('dotenv').config();

// Passport Config
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL,
    passReqToCallback: true
  },
  async (req, accessToken, refreshToken, profile, done) => {
    try {
      const email = profile.emails[0].value;
      let user = await User.findOne({ googleId: profile.id });
      
      if (!user) {
        user = await User.findOne({ email });
        if (user) {
          user.googleId = profile.id;
          await user.save();
        } else {
          user = new User({
            googleId: profile.id,
            email: email,
            username: profile.displayName,
            isVerified: true
          });
          await user.save();
        }
      }
      return done(null, user);
    } catch (err) {
      return done(err, null);
    }
  }
));

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

// Route Imports
const authRoutes = require('./routes/auth');
const groupRoutes = require('./routes/groups');
const bookingRoutes = require('./routes/bookings');
const eventRoutes = require('./routes/events');
const competitionRoutes = require('./routes/competitions');
const reportRoutes = require('./routes/reports');
const adminRoutes = require('./routes/admin');
const communityEventRoutes = require('./routes/community-events');
const donationRoutes = require('./routes/donations');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session Configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'vandan-secret-dev',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
    secure: process.env.NODE_ENV === 'production'
  }
}));

// Passport Middleware
app.use(passport.initialize());
app.use(passport.session());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/competitions', competitionRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/community-events', communityEventRoutes);
app.use('/api/donations', donationRoutes);

// Serve static files from 'public' directory
app.use(express.static(path.join(__dirname, 'public'), {
  maxAge: '1d',
  setHeaders: (res, path) => {
    if (path.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    }
  }
}));

// Database Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('[INIT] Connected to MongoDB Atlas'))
  .catch(err => console.error('[INIT] MongoDB Connection Error:', err));

const PORT = process.env.PORT || 3000;
const maskedEmail = process.env.EMAIL_USER.replace(/(.{2})(.*)(?=@)/, (gp1, gp2, gp3) => {
  for(let i = 0; i < gp3.length; i++){ gp2 += "*"; } return gp2;
});
console.log(`[INIT] Mailer configured for: ${maskedEmail}`);
app.listen(PORT, () => {
  console.log(`[INIT] Server running on port ${PORT}`);
});