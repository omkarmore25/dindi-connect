require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']); // Use Google DNS to resolve Atlas SRV records
const cors = require('cors');
const session = require('express-session');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const path = require('path');
const User = require('./models/User');
const { generalLimiter, authLimiter } = require('./middleware/rateLimiter');
const { sanitizeBody, enforceLimits } = require('./middleware/sanitize');
const helmet = require('helmet');

// Validate critical environment variables on startup
const REQUIRED_ENV = ['SESSION_SECRET', 'JWT_SECRET', 'MONGODB_URI'];
for (const key of REQUIRED_ENV) {
  if (!process.env[key]) {
    console.error(`FATAL: Missing required environment variable: ${key}`);
    process.exit(1);
  }
}

const app = express();

// Trust proxy for secure cookies behind reverse proxies (like Render)
app.set('trust proxy', 1);

// Security Headers
app.use(helmet({
  contentSecurityPolicy: false, // Disabled locally/temporarily to allow Leaflet/Google maps scripts/CDNs to load
}));

// Middleware — body size limits to reject oversized payloads
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));
app.use(cors());

// Global input sanitization (strip HTML tags, enforce field lengths)
app.use(sanitizeBody);
app.use(enforceLimits);

// GLOBAL DEBUG LOGGING
app.use((req, res, next) => {
  if (req.method === 'POST' || req.method === 'PUT') {
     console.log(`[DEBUG] ${req.method} ${req.url} - Content-Type: ${req.headers['content-type']}`);
     console.log(`[DEBUG] Body Keys:`, Object.keys(req.body || {}));
  }
  next();
});

// Serve static files from 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Session Setup
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production', // Requires HTTPS
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000 // 1 day
  }
}));

// Passport Setup
app.use(passport.initialize());
app.use(passport.session());

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      let user = await User.findOne({ googleId: profile.id });
      if (!user) {
        // Try searching by email
        user = await User.findOne({ email: profile.emails[0].value });
        if (user) {
          user.googleId = profile.id;
          user.isVerified = true;
          await user.save();
        } else {
          user = new User({
            googleId: profile.id,
            email: profile.emails[0].value,
            username: profile.emails[0].value.split('@')[0],
            isVerified: true // Google accounts are implicitly verified
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

passport.serializeUser((user, done) => done(null, user._id));
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

// Routes
const authRoutes = require('./routes/auth');
const groupsRoutes = require('./routes/groups');
const eventsRoutes = require('./routes/events');
const competitionsRoutes = require('./routes/competitions');
const donationsRoutes = require('./routes/donations');

// Rate limiting
app.use('/api', generalLimiter);                    // 100 req / 15 min on all API routes
app.use('/api/auth/login', authLimiter);            // 5 req / 15 min on login
app.use('/api/auth/register', authLimiter);         // 5 req / 15 min on register
app.use('/api/auth/resend-verification', authLimiter); // 5 req / 15 min on resend

app.use('/api/auth', authRoutes);
app.use('/api/groups', groupsRoutes);
app.use('/api/events', eventsRoutes);
app.use('/api/competitions', competitionsRoutes);
app.use('/api/donations', donationsRoutes);

// Fallback to index.html for undefined frontend routes (SPA feel)
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Database Connection & Server Start
const PORT = process.env.PORT || 3000;
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => console.error('MongoDB connection error:', err));
