const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from .env.local and .env
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const apiRoutes = require('./routes');
const { initDatabase } = require('./db');
const { initTiDBDatabase } = require('./tidb');

// Initialize database schema and seeds (TiDB Cloud if configured, SQLite fallback)
initDatabase();
initTiDBDatabase().catch(err => console.warn('TiDB background init:', err.message));

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api', apiRoutes);

// Ensure HTML and service worker are never cached inappropriately by browsers
app.use((req, res, next) => {
  if (req.path === '/' || req.path === '/index.html' || req.path === '/sw.js') {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
  next();
});

// Serve static frontend assets (HTML, CSS, JS, Images)
const publicDir = path.join(__dirname, '..');
app.use(express.static(publicDir));


// Fallback to index.html for single-page style navigation
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(publicDir, 'index.html'));
});

// Central Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({ error: 'An unexpected internal error occurred.' });
});

module.exports = app;
