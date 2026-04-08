const jwt = require('jsonwebtoken');
const User = require('../models/User');

const checkToken = async(req, res, next) => {
    let token=req.header('x-auth-token');
    if(req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token=req.headers.authorization.split(' ')[1];
    }
  if (!token) {
        return res.status(401).json({ message: 'Please login first' });
    }
  
      try {
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');
    next();
  } catch (error) {
    res.status(400).json({ message: 'Invalid token.' });
  
};
if (!token) {
  res.status(401).json({ message: 'Please login first' });
}
};
module.exports = { checkToken };