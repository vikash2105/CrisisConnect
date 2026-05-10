const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

<<<<<<< HEAD
=======
// REGISTER (No changes needed here)
>>>>>>> 094577356ad464c43002570066975adc57e46fb2
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
<<<<<<< HEAD
    console.error('[Auth] Registration failed:', err.message);
=======
    console.error(err);
>>>>>>> 094577356ad464c43002570066975adc57e46fb2
    return res.status(500).json({ message: 'Server error' });
  }
};

// LOGIN (Updated with specific error messages)
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) return res.status(400).json({ message: 'Missing credentials' });

    const user = await User.findOne({ email });
<<<<<<< HEAD
    if (!user) return res.status(404).json({ message: 'User not found.' });

    const ok = await bcrypt.compare(password, user.password);
=======
    // CHANGE 1: Return a specific "user not found" message with a 404 status.
    if (!user) return res.status(404).json({ message: 'User not found.' });

    const ok = await bcrypt.compare(password, user.password);
    // CHANGE 2: Return a specific "incorrect password" message with a 401 status.
>>>>>>> 094577356ad464c43002570066975adc57e46fb2
    if (!ok) return res.status(401).json({ message: 'Incorrect password. Please try again.' });

    const token = jwt.sign(
      { id: user._id },
<<<<<<< HEAD
      process.env.JWT_SECRET,
=======
      process.env.JWT_SECRET || 'secretkey',
>>>>>>> 094577356ad464c43002570066975adc57e46fb2
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
<<<<<<< HEAD
    console.error('[Auth] Login failed:', err.message);
=======
    console.error(err);
>>>>>>> 094577356ad464c43002570066975adc57e46fb2
    return res.status(500).json({ message: 'Server error' });
  }
};

// EXPORT BOTH FUNCTIONS
<<<<<<< HEAD
module.exports = { register, login };
=======
module.exports = { register, login };
>>>>>>> 094577356ad464c43002570066975adc57e46fb2
