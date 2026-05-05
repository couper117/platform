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
const newsRoutes = require('./routes/news.routes');
const contactRoutes = require('./routes/contacts.routes');
const venueRoutes = require('./routes/venues.routes');
const activityRoutes = require('./routes/activity.routes');
const settingsRoutes = require('./routes/settings.routes');
const akc3Routes = require('./routes/akc3/index');
const adminRoutes = require('./routes/admin.routes');
const adRoutes = require('./routes/ads.routes');
const paymentRoutes = require('./routes/payments.routes');

const app = express();

app.set('trust proxy', 1);

// Security Middleware
app.use(helmet());
app.use(cors({
  origin: (origin, callback) => {
    callback(null, true);
  },
  credentials: true,
}));

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,