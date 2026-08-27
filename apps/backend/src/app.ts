const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const path = require('path');
const errorHandler = require('./middleware/errorHandler');
const visitorTracker = require('./middleware/visitorTracker');
const env = require('./config/env');

// Route Imports
const authRoutes = require('./routes/auth.routes');
const sportsRoutes = require('./routes/sports.routes');
const federationRoutes = require('./routes/federations.routes');
const leagueRoutes = require('./routes/leagues.routes');
const teamRoutes = require('./routes/teams.routes');
const playerRoutes = require('./routes/players.routes');
const documentRoutes = require('./routes/documents.routes');
const fixtureRoutes = require('./routes/fixtures.routes');
const raceRoutes = require('./routes/races.routes');
const newsRoutes = require('./routes/news.routes');
const contactRoutes = require('./routes/contacts.routes');
const venueRoutes = require('./routes/venues.routes');
const activityRoutes = require('./routes/activity.routes');
const settingsRoutes = require('./routes/settings.routes');
const akc3Routes = require('./routes/akc3/index');
const adminRoutes = require('./routes/admin.routes');
const adRoutes = require('./routes/ads.routes');
const paymentRoutes = require('./routes/payments.routes');
const transferRoutes = require('./routes/transfers.routes');
const officialRoutes = require('./routes/officials.routes');
const suspensionRoutes = require('./routes/suspensions.routes');
const registrationRoutes = require('./routes/registrations.routes');
const privacyRoutes = require('./routes/privacy.routes');
const umugandaRoutes = require('./routes/umuganda.routes');

const app = express();

app.set('trust proxy', 1);

// Security Middleware
app.use(helmet());

// CORS — allow only known origins when credentials are enabled (never reflect all).
const allowedOrigins = [
  env.FRONTEND_URL,
  'http://localhost:5173',
  'http://localhost:5174',
].filter(Boolean);
app.use(cors({
  origin: (origin, callback) => {
    // Non-browser clients (curl, server-to-server) send no Origin — allow them.
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error(`Origin ${origin} not allowed by CORS`));
  },
  credentials: true,
}));

// Rate Limiting — JSON response consistent with the API envelope.
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => res.status(429).json({
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes',
  }),
});
app.use('/api/', limiter);

// Stricter limiter for auth endpoints (brute-force protection).
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => res.status(429).json({
    success: false,
    message: 'Too many authentication attempts, please try again later',
  }),
});
app.use('/api/v1/auth/login', authLimiter);
app.use('/api/v1/auth/refresh', authLimiter);

// Basic Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Tracker after body parsing
app.use(visitorTracker);

// Static Files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/sports', sportsRoutes);
app.use('/api/v1/federations', federationRoutes);
app.use('/api/v1/leagues', leagueRoutes);
app.use('/api/v1/teams', teamRoutes);
app.use('/api/v1/players', playerRoutes);
app.use('/api/v1/documents', documentRoutes);
app.use('/api/v1/fixtures', fixtureRoutes);
app.use('/api/v1/races', raceRoutes);
app.use('/api/v1/news', newsRoutes);
app.use('/api/v1/contacts', contactRoutes);
app.use('/api/v1/venues', venueRoutes);
app.use('/api/v1/activity', activityRoutes);
app.use('/api/v1/settings', settingsRoutes);
app.use('/api/v1/akc3', akc3Routes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/ads', adRoutes);
app.use('/api/v1/payments', paymentRoutes);
app.use('/api/v1/transfers', transferRoutes);
app.use('/api/v1/officials', officialRoutes);
app.use('/api/v1/suspensions', suspensionRoutes);
app.use('/api/v1/registrations', registrationRoutes);
// Data-subject rights under Law N° 058/2021 arts. 18–24.
app.use('/api/v1/privacy', privacyRoutes);
app.use('/api/v1/umuganda', umugandaRoutes);

// Health check
app.get('/api/v1/health', (req, res) => {
  res.status(200).json({ success: true, message: 'RNSP API is healthy' });
});

// Error Handling
app.use(errorHandler);

module.exports = app;
