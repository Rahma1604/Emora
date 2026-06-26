const jwt = require('jsonwebtoken');
const User = require('../models/User');

const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    return next();
  }
  return res.status(403).json({ message: 'Access denied. Admins only.' });
};

const checkToken = async(req, res, next) => {
  let token=req.header('x-auth-token');
  if(req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token=req.headers.authorization.split(' ')[1];
  }
  if (!token) {
    return res.status(401).json({ message: 'Please login first' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');
    if (!req.user) {
      return res.status(401).json({ message: 'User account not found' });
      }
    return next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token.' });
  }
};
module.exports = { checkToken, isAdmin };