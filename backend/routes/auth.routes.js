const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { isMongoReady } = require('../config/mongo');

let JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET environment variable is required in production');
  }
  JWT_SECRET = 'fallback_secret_for_demo_purposes_only';
}
const JWT_EXPIRES_IN = '24h';

// ── Demo/mock account ────────────────────────────────────────────────────────
// These credentials always work regardless of MongoDB status.
// This ensures Vercel (or any deployment without a seeded DB) can still demo.
const DEMO_EMAIL    = 'doctor@biotwin.ai';
const DEMO_PASSWORD = 'password123';
const DEMO_USER     = { id: 'demo-doc-001', role: 'doctor', name: 'Dr. Gregory House', email: DEMO_EMAIL };

const signToken = (payload) =>
  new Promise((resolve, reject) =>
    jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN }, (err, token) =>
      err ? reject(err) : resolve(token)
    )
  );

// ── POST /api/auth/login ─────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // 1. Demo credentials — always accepted, no DB needed
    if (email === DEMO_EMAIL && password === DEMO_PASSWORD) {
      const token = await signToken({ user: DEMO_USER });
      return res.json({ token, user: DEMO_USER });
    }

    // 2. Real DB lookup (only if MongoDB is available)
    if (!isMongoReady()) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(401).json({ error: 'Invalid credentials' });

    const token = await signToken({ user: { id: user.id, role: user.role, name: user.name } });
    return res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role }
    });

  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error during login' });
  }
});

// ── POST /api/auth/seed ──────────────────────────────────────────────────────
// Always returns success. If MongoDB is available, creates/upserts the real
// doctor document. If not (cold start, no Atlas, etc.), mock credentials work anyway.
router.post('/seed', async (req, res) => {
  try {
    // If MongoDB is not available, demo credentials still work via /login
    if (!isMongoReady()) {
      return res.status(201).json({
        message: 'Demo credentials are ready (mock mode).',
        email: DEMO_EMAIL,
        password: DEMO_PASSWORD
      });
    }

    // Upsert — avoids duplicate-key error if called twice.
    // Must hash password manually since pre('save') hook doesn't fire on findOneAndUpdate.
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(DEMO_PASSWORD, salt);

    await User.findOneAndUpdate(
      { email: DEMO_EMAIL },
      {
        $setOnInsert: {
          name: 'Dr. Gregory House',
          email: DEMO_EMAIL,
          password: hashedPassword,
          role: 'doctor'
        }
      },
      { upsert: true, new: true }
    );

    return res.status(201).json({
      message: 'Demo doctor account is ready.',
      email: DEMO_EMAIL,
      password: DEMO_PASSWORD
    });

  } catch (err) {
    // Even if DB seed fails, tell the client demo credentials will work
    console.error('Seed error (non-fatal):', err.message);
    return res.status(201).json({
      message: 'Demo credentials are available regardless of DB state.',
      email: DEMO_EMAIL,
      password: DEMO_PASSWORD
    });
  }
});

module.exports = router;
