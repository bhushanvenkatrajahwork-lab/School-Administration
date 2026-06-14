const jwt = require('jsonwebtoken');
const models = require('../models');

// Authenticates any logged in user
const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authorization token missing or malformed' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    
    // Find user
    const user = await models.User.findById(decoded.userId);
    if (!user || !user.active) {
      return res.status(401).json({ message: 'User not found or suspended' });
    }

    req.user = {
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      name: user.name
    };
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired authorization token' });
  }
};

// Restricts access to specific roles
const authorize = (allowedRoles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthenticated request' });
    }

    // Super admin has access to everything
    if (req.user.role === 'SUPER_ADMIN') {
      return next();
    }

    if (allowedRoles.includes(req.user.role)) {
      return next();
    }

    return res.status(403).json({ message: 'Access denied: insufficient permissions' });
  };
};

module.exports = {
  authenticate,
  authorize
};
