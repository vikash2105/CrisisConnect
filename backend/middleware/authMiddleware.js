const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  const authHeader = req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Access denied, token missing or malformed' });
  }

  const token = authHeader.split(' ')[1];

  try {
<<<<<<< HEAD
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Adds { id: userId } to the request object
    next();
  } catch (ex) {
    console.error('[Auth] Token verification failed:', ex.message);
=======
    const secret = process.env.JWT_SECRET || 'secretkey';
    const decoded = jwt.verify(token, secret);
    req.user = decoded; // Adds { id: userId } to the request object
    next();
  } catch (ex) {
>>>>>>> 094577356ad464c43002570066975adc57e46fb2
    res.status(400).json({ message: 'Invalid token.' });
  }
};

<<<<<<< HEAD
module.exports = authMiddleware;
=======
module.exports = authMiddleware;
>>>>>>> 094577356ad464c43002570066975adc57e46fb2
