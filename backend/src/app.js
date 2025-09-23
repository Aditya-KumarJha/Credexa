require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const passport = require('passport');
const userRoutes = require('./routes/userRoutes');
const credentialRoutes = require('./routes/credentialRoutes');

const app = express();

const allowedOrigins = [
  process.env.CLIENT_URL,
  process.env.VERCEL_CLIENT_URL,
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      return callback(new Error('CORS policy: This origin is not allowed'));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));

app.use(express.json());
app.use(cookieParser());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path} - ${new Date().toISOString()}`);
  if (req.method === 'DELETE') {
    console.log('DELETE request details:', {
      path: req.path,
      params: req.params,
      headers: req.headers.authorization ? 'Auth header present' : 'No auth header'
    });
  }
  next();
});

app.use(passport.initialize());
require('./config/passport');

const authRoutes = require('./routes/authRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const instituteRoutes = require('./routes/instituteRoutes');
const leaderboardRoutes = require('./routes/leaderboardRoutes');
const platformsRoutes = require('./routes/platformsRoutes');
const jobRoutes = require('./routes/jobRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/credentials', credentialRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/institute', instituteRoutes);
app.use('/api', leaderboardRoutes);
app.use('/api/platforms', platformsRoutes);
app.use('/api/jobs', jobRoutes);

app.get('/', (req, res) => res.send('API is running'));

app.get('/test', (req, res) => {
  console.log('Test endpoint hit!');
  res.json({ message: 'Backend is working!', timestamp: new Date().toISOString() });
});

app.use((err, req, res, next) => {
  if (err.message.startsWith('CORS')) {
    return res.status(403).json({ error: err.message });
  }
  console.error(err);
  res.status(500).json({ error: 'Internal Server Error' });
});

module.exports = app;
