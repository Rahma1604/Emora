const jwt = require("jsonwebtoken");
const User = require("../models/User");

/* =====================================================
   GET TOKEN FROM REQUEST
===================================================== */

const getTokenFromRequest = (req) => {
  const authorizationHeader =
    req.headers.authorization || "";

  if (
    authorizationHeader.startsWith(
      "Bearer "
    )
  ) {
    return authorizationHeader
      .slice(7)
      .trim();
  }

  const customToken =
    req.headers["x-auth-token"];

  if (customToken) {
    return String(customToken).trim();
  }

  return "";
};

/* =====================================================
   CHECK NORMAL LOGIN TOKEN
===================================================== */

const checkToken = async (
  req,
  res,
  next
) => {
  try {
    const token =
      getTokenFromRequest(req);

    if (!token) {
      return res.status(401).json({
        success: false,
        msg: "No authentication token provided",
      });
    }

    if (!process.env.JWT_SECRET) {
      console.error(
        "JWT_SECRET is missing from .env"
      );

      return res.status(500).json({
        success: false,
        msg: "Server authentication configuration is missing",
      });
    }

    let decoded;

    try {
      decoded = jwt.verify(
        token,
        process.env.JWT_SECRET
      );
    } catch (error) {
      if (
        error.name ===
        "TokenExpiredError"
      ) {
        return res.status(401).json({
          success: false,
          msg: "Session expired. Please login again.",
        });
      }

      return res.status(401).json({
        success: false,
        msg: "Invalid authentication token",
      });
    }

    const userId =
      decoded.id ||
      decoded.userId ||
      decoded._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        msg: "Invalid token payload",
      });
    }

    const user =
      await User.findById(userId).select(
        "-password -verificationCode -resetPasswordToken -resetPasswordExpires"
      );

    if (!user) {
      return res.status(401).json({
        success: false,
        msg: "User associated with this token was not found",
      });
    }

    req.user = user;
    req.token = token;

    return next();
  } catch (error) {
    console.error(
      "AUTH MIDDLEWARE ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      msg: "Authentication failed",
    });
  }
};

/* =====================================================
   CHECK ADMIN ROLE
===================================================== */

const isAdmin = (
  req,
  res,
  next
) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      msg: "Authentication required",
    });
  }

  if (req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      msg: "Admin access only",
    });
  }

  return next();
};

/* =====================================================
   CHECK DOCTOR VERIFICATION TOKEN
===================================================== */

const checkDoctorVerificationToken =
  async (
    req,
    res,
    next
  ) => {
    try {
      const token =
        getTokenFromRequest(req);

      if (!token) {
        return res.status(401).json({
          success: false,
          msg: "Doctor verification token is required",
        });
      }

      if (!process.env.JWT_SECRET) {
        console.error(
          "JWT_SECRET is missing from .env"
        );

        return res.status(500).json({
          success: false,
          msg: "Server authentication configuration is missing",
        });
      }

      let decoded;

      try {
        decoded = jwt.verify(
          token,
          process.env.JWT_SECRET
        );
      } catch (error) {
        if (
          error.name ===
          "TokenExpiredError"
        ) {
          return res.status(401).json({
            success: false,
            msg: "Doctor verification session expired",
          });
        }

        return res.status(401).json({
          success: false,
          msg: "Invalid doctor verification token",
        });
      }

      if (
        decoded.purpose !==
        "doctor_verification"
      ) {
        return res.status(401).json({
          success: false,
          msg: "Invalid verification token purpose",
        });
      }

      const doctorId =
        decoded.id ||
        decoded.userId ||
        decoded._id;

      if (!doctorId) {
        return res.status(401).json({
          success: false,
          msg: "Invalid doctor verification token",
        });
      }

      const doctor =
        await User.findById(
          doctorId
        ).select(
          "-password -verificationCode -resetPasswordToken -resetPasswordExpires"
        );

      if (!doctor) {
        return res.status(404).json({
          success: false,
          msg: "Doctor account was not found",
        });
      }

      if (
        doctor.role !==
        "doctor"
      ) {
        return res.status(403).json({
          success: false,
          msg: "Doctor access only",
        });
      }

      req.user = doctor;
      req.token = token;

      return next();
    } catch (error) {
      console.error(
        "DOCTOR VERIFICATION MIDDLEWARE ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        msg: "Doctor verification failed",
      });
    }
  };

module.exports = {
  checkToken,
  isAdmin,
  checkDoctorVerificationToken,
};