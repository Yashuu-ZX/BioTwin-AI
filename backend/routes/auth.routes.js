const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { isMongoReady } = require('../config/mongo');

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_for_demo_purposes_only';
const JWT_EXPIRES_IN = '24h';

// Login route
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    if (!isMongoReady()) {
      // Mock DB Login Support
      if (email === 'doctor@biotwin.ai' && password === 'password123') {
        const payload = { user: { id: 'mock-doc-123', role: 'doctor', name: 'Dr. Gregory House' } };
        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
        return res.json({
          token,
          user: { id: 'mock-doc-123', name: 'Dr. Gregory House', email: 'doctor@biotwin.ai', role: 'doctor' }
        });
      }
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token
    const payload = {
      user: {
        id: user.id,
        role: user.role,
        name: user.name
      }
    };

    jwt.sign(
      payload,
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN },
      (err, token) => {
        if (err) throw err;
        res.json({
          token,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role
          }
        });
      }
    );
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error during login' });
  }
});

// Seed a test doctor (useful for demo environments)
router.post('/seed', async (req, res) => {
  try {
    if (!isMongoReady()) {
      // If Mongo is not ready, we can still login with the hardcoded mock credentials
      return res.status(201).json({
        message: 'Mock database active. Test credentials are ready.',
        email: 'doctor@biotwin.ai',
        password: 'password123'
      });
    }

    // Check if a doctor already exists
    let existingDoctor = await User.findOne({ email: 'doctor@biotwin.ai' });
    if (existingDoctor) {
      return res.status(200).json({ message: 'Test doctor already seeded', email: 'doctor@biotwin.ai' });
    }

    const testDoctor = new User({
      name: 'Dr. Gregory House',
      email: 'doctor@biotwin.ai',
      password: 'password123',
      role: 'doctor'
    });

    await testDoctor.save();

    res.status(201).json({
      message: 'Test doctor successfully created',
      email: 'doctor@biotwin.ai',
      password: 'password123'
    });
  } catch (err) {
    console.error('Seed error:', err);
    res.status(500).json({ error: 'Server error during seeding: ' + err.message, stack: err.stack });
  }
});

module.exports = router;
