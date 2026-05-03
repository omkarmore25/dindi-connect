require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const dns = require('dns');
try {
  dns.setServers(['8.8.8.8', '8.8.4.4']); // Use Google DNS to resolve Atlas SRV records
} catch (e) {
  console.warn('DNS server setting failed, using system defaults.');
}
const cors = require('cors');
const session = require('express-session');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const path = require('path');
const User = require('./models/User');
const { generalLimiter, authLimiter } = require('./middleware/rateLimiter');
const { sanitizeBody, enforceLimits } = require('./middleware/sanitize');
const helmet = require('helmet');
const keepAlive = require('./keep_alive');


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
app.use(express.json({ 
  limit: '1mb',
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));
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

// Cache control middleware - prevent stale HTML and API data
app.use((req, res, next) => {
  const isHtml = req.path.endsWith('.html') || req.path === '/' || !req.path.includes('.');
  const isApi = req.path.startsWith('/api/');
  
  if (isHtml || isApi) {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
  next();
});

// Serve static files from 'public' directory
app.use(express.static(path.join(__dirname, 'public'), {
  maxAge: '1d',
  setHeaders: (res, path) => {
    if (path.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    }
  }
}));

// Session Setup
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: true, // Force session to be saved back to the store
  saveUninitialized: true, // Force a session to be created even if empty
  proxy: true, // Required for secure cookies behind Render/Heroku proxies
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000 // 1 day
  }
}));

// Log email config on startup (obfuscated)
console.log(`[INIT] Mailer configured for: ${process.env.EMAIL_USER ? process.env.EMAIL_USER.replace(/.(?=.{4})/g, '*') : 'MISSING'}`);

// Passport Setup
app.use(passport.initialize());
app.use(passport.session());

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL || "/api/auth/google/callback",
    proxy: true
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      console.log(`[DEBUG] Google Auth Callback for profile ID: ${profile.id}`);
      let user = await User.findOne({ googleId: profile.id });
      
      if (!user) {
        const email = profile.emails && profile.emails.length > 0 ? profile.emails[0].value : null;
        user = new User({
          googleId: profile.id,
          displayName: profile.displayName,
          email: email,
          avatar: profile.photos && profile.photos.length > 0 ? profile.photos[0].value : null
        });
        await user.save();
      }
      return done(null, user);
    } catch (err) {
      return done(err, null);
    }
  }
));

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

// Import and use routes
const authRoutes = require('./routes/auth');
const groupRoutes = require('./routes/groups');
const bookingRoutes = require('./routes/bookings');
const eventRoutes = require('./routes/events');
const competitionRoutes = require('./routes/competitions');

app.use('/api/auth', authRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/competitions', competitionRoutes);

// Database Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('[INIT] Connected to MongoDB Atlas'))
  .catch(err => console.error('[INIT] MongoDB Connection Error:', err));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`[INIT] Server running on port ${PORT}`);
});
