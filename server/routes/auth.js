const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// @route   POST https://finlytix-server.onrender.com/
// @desc    Register a new user

const authenticateToken = require('../middleware/auth');

router.get('/me', authenticateToken, async (req, res) => {
  res.json({ message: 'Access granted', user: req.user });
});

router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: 'User already exists' });
    }

    // Hash the password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const newUser = new User({ name, email, password: hashedPassword });
    await newUser.save();

    res.status(201).json({ message: 'User registered successfully', user: newUser });
  } catch (error) {
    console.error('Error in Register:', error);
    res.status(500).json({ message: 'Server error' });
  }
});



// @route   POST https://finlytix-server.onrender.com/
// @desc    Login user and return basic info
// Login route with JWT
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Create JWT token
    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });

  } catch (error) {
    console.error('Error in Login:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// In your server routes (e.g., auth.js)
router.post('/logout', (req, res) => {
  // If you're using sessions, you might destroy the session here
  // For JWT, the client just needs to remove the token
  res.status(200).json({ message: 'Logged out successfully' });
});
module.exports = router;