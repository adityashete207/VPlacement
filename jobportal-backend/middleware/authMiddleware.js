const jwt = require('jsonwebtoken');
const pool = require('../db'); // Assuming your user data is managed by this pool

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from the database and attach to request
      const [rows] = await pool.execute('SELECT id, name, email, role FROM users WHERE id = ?', [decoded.id]);
      if (rows.length === 0) {
        return res.status(401).json({ message: 'Not authorized, user not found' });
      }
      req.user = rows[0];
      next();
    } catch (error) {
      console.error(error);
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};

const authorize = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ message: `User role ${req.user ? req.user.role : 'none'} is not authorized to access this route` });
  }
  next();
};

module.exports = { protect, authorize };