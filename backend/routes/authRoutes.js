const express = require('express');
const router = express.Router();

// Import the register and login functions from your controller
const { register, login } = require('../controllers/authController');

// Route for user registration
// This will handle POST requests to /api/auth/register
router.post('/register', register);

// Route for user login
// This will handle POST requests to /api/auth/login
router.post('/login', login);

module.exports = router;