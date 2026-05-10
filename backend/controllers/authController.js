const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const register = async (req, res) => {
  try {
    const { fullname, email, phone, password, serviceLocations } = req.body;

    if (!fullname || !email || !phone || !password) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    if (!serviceLocations || !Array.isArray(serviceLocations) || serviceLocations.length === 0) {
      return res.status(400).json({ message: 'At least one location is required' });
    }

    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: 'Email already registered' });

    const hashed = await bcrypt.hash(password, 10);

    const user = new User({
      fullname,
      email,
      phone,
      password: hashed,
      serviceLocations
    });

    await user.save();

    return res.status(201).json({ message: 'User registered' });
  } catch (err) {
    console.error('[Auth] Registration failed:', err.message);
    return res.status(500).json({ message: 'Server error' });
  }
};

// LOGIN (Updated with specific error messages)
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) return res.status(400).json({ message: 'Missing credentials' });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found.' });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ message: 'Incorrect password. Please try again.' });

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.json({
      token,
      user: {
        id: user._id,
        fullname: user.fullname,
        email: user.email,
        phone: user.phone,
        serviceLocations: user.serviceLocations
      }
    });
  } catch (err) {
    console.error('[Auth] Login failed:', err.message);
    return res.status(500).json({ message: 'Server error' });
  }
};

// EXPORT BOTH FUNCTIONS
module.exports = { register, login };
