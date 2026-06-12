// Step 7 (Feature 16 — Security): HTTP hardening via helmet, strict CORS, and
// auth rate limiting before route handlers run.
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();

// Security headers (XSS protection, HSTS, content-type sniffing, etc.)
app.use(helmet());

// Only allow requests from the frontend origin
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173').split(',');
app.use(cors({
  origin: (origin, cb) => {
    // Allow server-to-server / Postman requests (no Origin header) in dev
    if (!origin || ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
    cb(new Error('CORS: origin not allowed'));
  },
  credentials: true,
}));

app.use(express.json());

// Brute-force protection on auth endpoints
const authLimiter = rateLimit({
  windowMs: 60 * 1000,   // 1 minute
  max: 10,               // 10 requests per IP per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many attempts, please try again later.' },
});

app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/auth',     authLimiter, require('./routes/authRoutes'));
app.use('/api/cart',     require('./routes/cartRoutes'));
app.use('/api/reviews',  require('./routes/reviewRoutes'));
app.use('/api/orders',   require('./routes/orderRoutes'));
app.use('/api/invoices',   require('./routes/invoiceRoutes'));
app.use('/api/favorites', require('./routes/favoriteRoutes'));
app.use('/api/refunds',   require('./routes/refundRoutes'));
app.use('/api/categories', require('./routes/categoryRoutes'));

app.get('/', (_req, res) => res.json({ message: 'SUFashion API çalışıyor' }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Sunucu ${PORT} portunda çalışıyor`));

module.exports = app;