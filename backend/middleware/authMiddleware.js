const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  const authHeader = req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Access denied, token missing or malformed' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Adds { id: userId } to the request object
    next();
  } catch (ex) {
    console.error('[Auth] Token verification failed:', ex.message);
    res.status(400).json({ message: 'Invalid token.' });
  }
};

module.exports = authMiddleware;
