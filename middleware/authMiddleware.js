
<<<<<<< Updated upstream
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
=======
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const getTokenFromRequest = (req) => {
  const authorizationHeader =
    req.headers.authorization;

  if (
    authorizationHeader &&
    authorizationHeader.startsWith("Bearer ")
  ) {
    return authorizationHeader.split(" ")[1];
  }

  return req.header("x-auth-token") || null;
};

const checkToken = async (req, res, next) => {
  try {
    const token = getTokenFromRequest(req);

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Please login first",
      });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    const user = await User.findById(
      decoded.id
    ).select("-password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message:
          "The user associated with this token was not found",
      });
    }

    req.user = user;

    next();
  } catch (error) {
    console.error(
      "AUTHENTICATION ERROR:",
      error.message
    );

    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};

const checkDoctorVerificationToken = async (
  req,
  res,
  next
) => {
  try {
    const token = getTokenFromRequest(req);

    if (!token) {
      return res.status(401).json({
        success: false,
        message:
          "Doctor verification session is missing",
      });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    if (
      decoded.purpose !==
      "doctor_verification"
    ) {
      return res.status(401).json({
        success: false,
        message:
          "Invalid doctor verification token",
      });
    }

    const doctor = await User.findById(
      decoded.id
    ).select("-password");

    if (
      !doctor ||
      doctor.role !== "doctor"
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Doctor verification access only",
      });
    }

    req.user = doctor;
    req.verificationToken = token;

    next();
  } catch (error) {
    console.error(
      "DOCTOR VERIFICATION TOKEN ERROR:",
      error.message
    );

    return res.status(401).json({
      success: false,
      message:
        "Doctor verification session has expired. Please login again.",
    });
  }
};

module.exports = {
  checkToken,
  checkDoctorVerificationToken,
};

>>>>>>> Stashed changes
