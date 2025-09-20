require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const passport = require('passport');
const userRoutes = require('./routes/userRoutes');

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

app.use(passport.initialize());
require('./config/passport');

const authRoutes = require('./routes/authRoutes');
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

app.get('/', (req, res) => res.send('API is running'));

app.use((err, req, res, next) => {
  if (err.message.startsWith('CORS')) {
    return res.status(403).json({ error: err.message });
  }
  console.error(err);
  res.status(500).json({ error: 'Internal Server Error' });
});

module.exports = app;
