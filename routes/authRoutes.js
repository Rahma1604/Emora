
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");

const User = require("../models/User");

const {
  uploadProfile,
  uploadDoctorDocs,
} = require("../config/cloudinary");

const {
  checkToken,
  checkDoctorVerificationToken,
} = require("../middleware/authMiddleware");

const router = express.Router();

/* =====================================================
   EMAIL CONFIGURATION
===================================================== */

const EMAIL_USER =
  process.env.EMAIL_USER ||
  "202227086@std.sci.cu.edu.eg";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/* =====================================================
   HELPERS
===================================================== */

const normalizeEmail = (email) => {
  return String(email || "")
    .trim()
    .toLowerCase();
};

const createLoginToken = (userId) => {
  return jwt.sign(
    {
      id: userId,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "1d",
    }
  );
};

const createDoctorVerificationToken = (
  doctorId
) => {
  return jwt.sign(
    {
      id: doctorId,
      purpose: "doctor_verification",
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "7d",
    }
  );
};

const createResetPasswordToken = (
  userId
) => {
  return jwt.sign(
    {
      id: userId,
      purpose: "reset_password",
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "10m",
    }
  );
};

const getUploadedFileUrl = (
  files,
  fieldName
) => {
  const file =
    files?.[fieldName]?.[0];

  if (!file) {
    return "";
  }

  return (
    file.path ||
    file.secure_url ||
    file.url ||
    ""
  );
};

const publicUserData = (user) => {
  return {
    id: user._id,
    name: user.fullName,
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    profilePic:
      user.profilePic || "",
    phone:
      user.phone || "",
    city:
      user.city || "",
    bio:
      user.bio || "",
    isVerified:
      user.isVerified,
    verificationStatus:
      user.verificationStatus,
    verificationStep:
      user.verificationStep,
    specialization:
      user.specialization || "",
    professionalType:
      user.professionalType || "",
  };
};

/* =====================================================
   UPLOAD HANDLERS
===================================================== */

const handleProfileUpload = (
  req,
  res,
  next
) => {
  uploadProfile.single(
    "profilePic"
  )(req, res, (error) => {
    if (!error) {
      return next();
    }

    console.error(
      "PROFILE IMAGE UPLOAD ERROR:",
      error
    );

    if (
      error.code ===
      "LIMIT_FILE_SIZE"
    ) {
      return res.status(400).json({
        success: false,
        msg:
          "Profile image must be 5 MB or less",
      });
    }

    if (
      error.code ===
      "LIMIT_UNEXPECTED_FILE"
    ) {
      return res.status(400).json({
        success: false,
        msg:
          "Invalid profile image field",
      });
    }

    return res.status(400).json({
      success: false,
      msg:
        error.message ||
        "Could not upload profile image",
    });
  });
};

const handleDoctorDocumentsUpload = (
  req,
  res,
  next
) => {
  uploadDoctorDocs(
    req,
    res,
    (error) => {
      if (!error) {
        return next();
      }

      console.error(
        "DOCTOR DOCUMENT UPLOAD ERROR:",
        error
      );

      if (
        error.code ===
        "LIMIT_FILE_SIZE"
      ) {
        return res.status(400).json({
          success: false,
          msg:
            "Each document must be 5 MB or less",
        });
      }

      if (
        error.code ===
        "LIMIT_FILE_COUNT"
      ) {
        return res.status(400).json({
          success: false,
          msg:
            "Too many documents were uploaded",
        });
      }

      if (
        error.code ===
        "LIMIT_UNEXPECTED_FILE"
      ) {
        return res.status(400).json({
          success: false,
          msg:
            "An unsupported document field was uploaded",
        });
      }

      return res.status(400).json({
        success: false,
        msg:
          error.message ||
          "Could not upload the documents",
      });
    }
  );
};

/* =====================================================
   REGISTER DOCTOR
   POST /api/auth/register-doctor
===================================================== */

router.post(
  "/register-doctor",
  async (req, res) => {
    try {
      const {
        fullName,
        email,
        specialization,
        password,
        confirmPassword,
      } = req.body;

      const cleanFullName =
        String(
          fullName || ""
        ).trim();

      const cleanEmail =
        normalizeEmail(email);

      const cleanSpecialization =
        String(
          specialization || ""
        ).trim();

      if (
        !cleanFullName ||
        !cleanEmail ||
        !cleanSpecialization ||
        !password ||
        !confirmPassword
      ) {
        return res.status(400).json({
          success: false,
          msg:
            "Full name, email, specialization, password and confirm password are required",
        });
      }

      if (
        cleanFullName.length < 3
      ) {
        return res.status(400).json({
          success: false,
          msg:
            "Full name must be at least 3 characters",
        });
      }

      const emailRegex =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (
        !emailRegex.test(
          cleanEmail
        )
      ) {
        return res.status(400).json({
          success: false,
          msg:
            "Please enter a valid email address",
        });
      }

      if (
        cleanSpecialization.length <
        3
      ) {
        return res.status(400).json({
          success: false,
          msg:
            "Please enter a valid specialization",
        });
      }

      if (
        password.length < 8
      ) {
        return res.status(400).json({
          success: false,
          msg:
            "Password must be at least 8 characters",
        });
      }

      if (
        password !==
        confirmPassword
      ) {
        return res.status(400).json({
          success: false,
          msg:
            "Passwords do not match",
        });
      }

      const existingUser =
        await User.findOne({
          email:
            cleanEmail,
        });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          msg:
            "Email already exists. Please use another email or login.",
        });
      }

      const hashedPassword =
        await bcrypt.hash(
          password,
          10
        );

      const newDoctor =
        await User.create({
          fullName:
            cleanFullName,

          email:
            cleanEmail,

          password:
            hashedPassword,

          role:
            "doctor",

          isVerified:
            false,

          verificationStatus:
            "not_started",

          verificationStep:
            "intro",

          professionalType:
            "Child Psychiatrist",

          specialization:
            cleanSpecialization,
        });

      const verificationToken =
        createDoctorVerificationToken(
          newDoctor._id
        );

      try {
        await transporter.sendMail({
          from:
            `"Emora App" <${EMAIL_USER}>`,

          to:
            cleanEmail,

          subject:
            "Continue Your Professional Verification - Emora App",

          text:
            `Hi Dr. ${newDoctor.fullName},\n\n` +
            "Your Emora doctor account has been created successfully.\n\n" +
            "Please continue the professional verification steps and upload the required documents.",
        });
      } catch (mailError) {
        console.error(
          "REGISTER DOCTOR EMAIL ERROR:",
          mailError.message
        );
      }

      return res.status(201).json({
        success: true,

        status:
          "VERIFICATION_NOT_STARTED",

        message:
          "Doctor account created. Please complete professional verification.",

        verificationToken,

        doctor:
          publicUserData(
            newDoctor
          ),
      });
    } catch (error) {
      console.error(
        "REGISTER DOCTOR ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        msg:
          error.message ||
          "Doctor registration failed",
      });
    }
  }
);

/* =====================================================
   GET DOCTOR VERIFICATION PROFILE
===================================================== */

router.get(
  "/doctor-verification/profile",
  checkDoctorVerificationToken,
  async (req, res) => {
    try {
      const doctor =
        req.user;

      return res.status(200).json({
        success: true,

        doctor: {
          id:
            doctor._id,

          fullName:
            doctor.fullName,

          email:
            doctor.email,

          role:
            doctor.role,

          professionalType:
            doctor.professionalType ||
            "Child Psychiatrist",

          nationalId:
            doctor.nationalIdNumber ||
            "",

          specialization:
            doctor.specialization ||
            "",

          licenseNumber:
            doctor.practiceLicenseNumber ||
            "",

          syndicateNumber:
            doctor.syndicateRegistrationNumber ||
            "",

          university:
            doctor.university ||
            "",

          graduationYear:
            doctor.graduationYear ===
              null ||
            doctor.graduationYear ===
              undefined
              ? ""
              : String(
                  doctor.graduationYear
                ),

          experienceYears:
            doctor.yearsOfExperience ===
              null ||
            doctor.yearsOfExperience ===
              undefined
              ? ""
              : String(
                  doctor.yearsOfExperience
                ),

          verificationStatus:
            doctor.verificationStatus,

          verificationStep:
            doctor.verificationStep,
        },
      });
    } catch (error) {
      console.error(
        "GET DOCTOR PROFILE ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        msg:
          "Could not load doctor profile",
      });
    }
  }
);

/* =====================================================
   SAVE DOCTOR PROFESSIONAL INFORMATION
===================================================== */

router.put(
  "/doctor-verification/professional-info",
  checkDoctorVerificationToken,
  async (req, res) => {
    try {
      if (
        [
          "pending",
          "approved",
        ].includes(
          req.user
            .verificationStatus
        )
      ) {
        return res.status(409).json({
          success: false,
          msg:
            "Professional information cannot be edited after submission or approval",
        });
      }

      const {
        fullName,
        nationalId,
        specialization,
        licenseNumber,
        syndicateNumber,
        university,
        graduationYear,
        experienceYears,
      } = req.body;

      const cleanFullName =
        String(
          fullName || ""
        ).trim();

      const cleanNationalId =
        String(
          nationalId || ""
        ).replace(
          /\D/g,
          ""
        );

      const cleanSpecialization =
        String(
          specialization || ""
        ).trim();

      const cleanLicenseNumber =
        String(
          licenseNumber || ""
        ).trim();

      const cleanSyndicateNumber =
        String(
          syndicateNumber || ""
        ).trim();

      const cleanUniversity =
        String(
          university || ""
        ).trim();

      const graduationYearNumber =
        Number(
          graduationYear
        );

      const experienceYearsNumber =
        Number(
          experienceYears
        );

      const currentYear =
        new Date().getFullYear();

      if (
        cleanFullName.length < 3
      ) {
        return res.status(400).json({
          success: false,
          msg:
            "Please enter your complete legal name",
        });
      }

      if (
        !/^\d{14}$/.test(
          cleanNationalId
        )
      ) {
        return res.status(400).json({
          success: false,
          msg:
            "National ID must contain 14 digits",
        });
      }

      if (
        cleanSpecialization.length <
        3
      ) {
        return res.status(400).json({
          success: false,
          msg:
            "Please enter a valid specialization",
        });
      }

      if (
        !cleanLicenseNumber ||
        !cleanSyndicateNumber ||
        !cleanUniversity
      ) {
        return res.status(400).json({
          success: false,
          msg:
            "License number, syndicate number and university are required",
        });
      }

      if (
        !Number.isInteger(
          graduationYearNumber
        ) ||
        graduationYearNumber <
          1950 ||
        graduationYearNumber >
          currentYear
      ) {
        return res.status(400).json({
          success: false,
          msg:
            "Please enter a valid graduation year",
        });
      }

      if (
        !Number.isInteger(
          experienceYearsNumber
        ) ||
        experienceYearsNumber <
          0 ||
        experienceYearsNumber >
          70
      ) {
        return res.status(400).json({
          success: false,
          msg:
            "Please enter valid years of experience",
        });
      }

      const updatedDoctor =
        await User.findByIdAndUpdate(
          req.user._id,
          {
            $set: {
              fullName:
                cleanFullName,

              nationalIdNumber:
                cleanNationalId,

              professionalType:
                "Child Psychiatrist",

              specialization:
                cleanSpecialization,

              practiceLicenseNumber:
                cleanLicenseNumber,

              syndicateRegistrationNumber:
                cleanSyndicateNumber,

              university:
                cleanUniversity,

              graduationYear:
                graduationYearNumber,

              yearsOfExperience:
                experienceYearsNumber,

              verificationStatus:
                "draft",

              verificationStep:
                "documents",
            },
          },
          {
            new: true,
            runValidators: true,
          }
        ).select("-password");

      if (!updatedDoctor) {
        return res.status(404).json({
          success: false,
          msg:
            "Doctor account was not found",
        });
      }

      return res.status(200).json({
        success: true,

        message:
          "Professional information saved successfully",

        nextStep:
          "documents",

        doctor:
          publicUserData(
            updatedDoctor
          ),
      });
    } catch (error) {
      console.error(
        "SAVE PROFESSIONAL INFO ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        msg:
          error.message ||
          "Could not save professional information",
      });
    }
  }
);

/* =====================================================
   GET DOCTOR DOCUMENTS
===================================================== */

router.get(
  "/doctor-verification/documents",
  checkDoctorVerificationToken,
  async (req, res) => {
    try {
      const documents =
        req.user
          .doctorDocuments ||
        {};

      return res.status(200).json({
        success: true,

        documents: {
          nationalIdFront:
            documents.nationalIdFront ||
            "",

          nationalIdBack:
            documents.nationalIdBack ||
            "",

          practiceLicense:
            documents.practiceLicense ||
            "",

          syndicateCard:
            documents.syndicateCardFront ||
            "",

          graduationCertificate:
            documents.graduationCertificate ||
            "",

          specializationCertificate:
            documents.specializationCertificate ||
            "",

          selfie:
            documents.recentSelfie ||
            "",
        },

        verificationStatus:
          req.user
            .verificationStatus,

        verificationStep:
          req.user
            .verificationStep,
      });
    } catch (error) {
      console.error(
        "GET DOCUMENTS ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        msg:
          "Could not load doctor documents",
      });
    }
  }
);

/* =====================================================
   UPLOAD DOCTOR DOCUMENTS
===================================================== */

router.put(
  "/doctor-verification/documents",
  checkDoctorVerificationToken,
  handleDoctorDocumentsUpload,
  async (req, res) => {
    try {
      if (
        [
          "pending",
          "approved",
        ].includes(
          req.user
            .verificationStatus
        )
      ) {
        return res.status(409).json({
          success: false,
          msg:
            "Documents cannot be edited after submission or approval",
        });
      }

      if (
        !req.user
          .nationalIdNumber ||
        !req.user
          .practiceLicenseNumber ||
        !req.user
          .syndicateRegistrationNumber ||
        !req.user.university
      ) {
        return res.status(409).json({
          success: false,
          msg:
            "Please complete your professional information first",
        });
      }

      const currentDocuments =
        req.user
          .doctorDocuments ||
        {};

      const doctorDocuments = {
        nationalIdFront:
          getUploadedFileUrl(
            req.files,
            "nationalIdFront"
          ) ||
          currentDocuments
            .nationalIdFront ||
          "",

        nationalIdBack:
          getUploadedFileUrl(
            req.files,
            "nationalIdBack"
          ) ||
          currentDocuments
            .nationalIdBack ||
          "",

        practiceLicense:
          getUploadedFileUrl(
            req.files,
            "practiceLicense"
          ) ||
          currentDocuments
            .practiceLicense ||
          "",

        syndicateCardFront:
          getUploadedFileUrl(
            req.files,
            "syndicateCard"
          ) ||
          currentDocuments
            .syndicateCardFront ||
          "",

        syndicateCardBack:
          currentDocuments
            .syndicateCardBack ||
          "",

        graduationCertificate:
          getUploadedFileUrl(
            req.files,
            "graduationCertificate"
          ) ||
          currentDocuments
            .graduationCertificate ||
          "",

        specializationCertificate:
          getUploadedFileUrl(
            req.files,
            "specializationCertificate"
          ) ||
          currentDocuments
            .specializationCertificate ||
          "",

        recentSelfie:
          getUploadedFileUrl(
            req.files,
            "selfie"
          ) ||
          currentDocuments
            .recentSelfie ||
          "",
      };

      const requiredDocuments = {
        nationalIdFront:
          doctorDocuments
            .nationalIdFront,

        nationalIdBack:
          doctorDocuments
            .nationalIdBack,

        practiceLicense:
          doctorDocuments
            .practiceLicense,

        syndicateCard:
          doctorDocuments
            .syndicateCardFront,

        graduationCertificate:
          doctorDocuments
            .graduationCertificate,

        specializationCertificate:
          doctorDocuments
            .specializationCertificate,

        selfie:
          doctorDocuments
            .recentSelfie,
      };

      const missingDocuments =
        Object.entries(
          requiredDocuments
        )
          .filter(
            ([, value]) =>
              !value
          )
          .map(
            ([name]) =>
              name
          );

      if (
        missingDocuments.length >
        0
      ) {
        return res.status(400).json({
          success: false,

          msg:
            "Please upload all required documents",

          missingDocuments,
        });
      }

      const updatedDoctor =
        await User.findByIdAndUpdate(
          req.user._id,
          {
            $set: {
              doctorDocuments,

              verificationStatus:
                "draft",

              verificationStep:
                "review",
            },
          },
          {
            new: true,
            runValidators: true,
          }
        ).select("-password");

      if (!updatedDoctor) {
        return res.status(404).json({
          success: false,
          msg:
            "Doctor account was not found",
        });
      }

      return res.status(200).json({
        success: true,

        message:
          "Documents uploaded successfully",

        nextStep:
          "review",

        doctor:
          publicUserData(
            updatedDoctor
          ),

        documents: {
          nationalIdFront:
            updatedDoctor
              .doctorDocuments
              .nationalIdFront,

          nationalIdBack:
            updatedDoctor
              .doctorDocuments
              .nationalIdBack,

          practiceLicense:
            updatedDoctor
              .doctorDocuments
              .practiceLicense,

          syndicateCard:
            updatedDoctor
              .doctorDocuments
              .syndicateCardFront,

          graduationCertificate:
            updatedDoctor
              .doctorDocuments
              .graduationCertificate,

          specializationCertificate:
            updatedDoctor
              .doctorDocuments
              .specializationCertificate,

          selfie:
            updatedDoctor
              .doctorDocuments
              .recentSelfie,
        },
      });
    } catch (error) {
      console.error(
        "UPLOAD DOCUMENTS ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        msg:
          error.message ||
          "Could not save doctor documents",
      });
    }
  }
);

/* =====================================================
   SUBMIT DOCTOR VERIFICATION
   AUTO APPROVE TEMPORARILY
===================================================== */

router.post(
  "/doctor-verification/submit",
  checkDoctorVerificationToken,
  async (req, res) => {
    try {
      const doctor =
        await User.findById(
          req.user._id
        );

      if (!doctor) {
        return res.status(404).json({
          success: false,
          msg:
            "Doctor account was not found",
        });
      }

      if (
        doctor.role !==
        "doctor"
      ) {
        return res.status(403).json({
          success: false,
          msg:
            "Doctor access only",
        });
      }

      if (
        doctor
          .verificationStatus ===
        "approved"
      ) {
        const token =
          createLoginToken(
            doctor._id
          );

        return res.status(200).json({
          success: true,

          status:
            "VERIFICATION_APPROVED",

          message:
            "Your doctor account is already approved.",

          token,

          user:
            publicUserData(
              doctor
            ),
        });
      }

      const requiredInformation = {
        fullName:
          doctor.fullName,

        nationalId:
          doctor.nationalIdNumber,

        specialization:
          doctor.specialization,

        licenseNumber:
          doctor.practiceLicenseNumber,

        syndicateNumber:
          doctor.syndicateRegistrationNumber,

        university:
          doctor.university,

        graduationYear:
          doctor.graduationYear,

        experienceYears:
          doctor.yearsOfExperience,
      };

      const missingInformation =
        Object.entries(
          requiredInformation
        )
          .filter(
            ([, value]) =>
              value ===
                undefined ||
              value === null ||
              value === ""
          )
          .map(
            ([name]) =>
              name
          );

      if (
        missingInformation.length >
        0
      ) {
        return res.status(400).json({
          success: false,

          msg:
            "Please complete all professional information before submitting",

          missingInformation,
        });
      }

      const documents =
        doctor
          .doctorDocuments ||
        {};

      const requiredDocuments = {
        nationalIdFront:
          documents
            .nationalIdFront,

        nationalIdBack:
          documents
            .nationalIdBack,

        practiceLicense:
          documents
            .practiceLicense,

        syndicateCard:
          documents
            .syndicateCardFront,

        graduationCertificate:
          documents
            .graduationCertificate,

        specializationCertificate:
          documents
            .specializationCertificate,

        selfie:
          documents
            .recentSelfie,
      };

      const missingDocuments =
        Object.entries(
          requiredDocuments
        )
          .filter(
            ([, value]) =>
              !value
          )
          .map(
            ([name]) =>
              name
          );

      if (
        missingDocuments.length >
        0
      ) {
        return res.status(400).json({
          success: false,

          msg:
            "Please upload all required documents before submitting",

          missingDocuments,
        });
      }

      const currentDate =
        new Date();

      doctor.verificationStatus =
        "approved";

      doctor.verificationStep =
        "submitted";

      doctor.verificationSubmittedAt =
        currentDate;

      doctor.approvedAt =
        currentDate;

      doctor.isVerified =
        true;

      doctor.documentsVerification = {
        nationalIdFront:
          true,

        nationalIdBack:
          true,

        syndicateCardFront:
          true,

        syndicateCardBack:
          false,

        graduationCertificate:
          true,

        specializationCertificate:
          true,

        practiceLicense:
          true,

        recentSelfie:
          true,
      };

      await doctor.save();

      const token =
        createLoginToken(
          doctor._id
        );

      return res.status(200).json({
        success: true,

        status:
          "VERIFICATION_APPROVED",

        message:
          "Doctor verification submitted and approved successfully.",

        token,

        user:
          publicUserData(
            doctor
          ),
      });
    } catch (error) {
      console.error(
        "SUBMIT VERIFICATION ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        msg:
          error.message ||
          "Could not submit doctor verification",
      });
    }
  }
);

/* =====================================================
   REGISTER PARENT
===================================================== */

router.post(
  "/register",
  async (req, res) => {
    try {
      const {
        fullName,
        email,
        password,
        confirmPassword,
      } = req.body;

      const cleanFullName =
        String(
          fullName || ""
        ).trim();

      const cleanEmail =
        normalizeEmail(email);

      if (
        !cleanFullName ||
        !cleanEmail ||
        !password ||
        !confirmPassword
      ) {
        return res.status(400).json({
          success: false,
          msg:
            "Please fill all required fields",
        });
      }

      if (
        cleanFullName.length < 3
      ) {
        return res.status(400).json({
          success: false,
          msg:
            "Full name must be at least 3 characters",
        });
      }

      const emailRegex =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (
        !emailRegex.test(
          cleanEmail
        )
      ) {
        return res.status(400).json({
          success: false,
          msg:
            "Please enter a valid email address",
        });
      }

      if (
        password.length < 8
      ) {
        return res.status(400).json({
          success: false,
          msg:
            "Password must be at least 8 characters",
        });
      }

      if (
        password !==
        confirmPassword
      ) {
        return res.status(400).json({
          success: false,
          msg:
            "Passwords do not match",
        });
      }

      const existingUser =
        await User.findOne({
          email:
            cleanEmail,
        });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          msg:
            "Email already exists. Please use another email or login.",
        });
      }

      const hashedPassword =
        await bcrypt.hash(
          password,
          10
        );

      const verificationCode =
        Math.floor(
          1000 +
          Math.random() *
            9000
        ).toString();

      const newUser =
        await User.create({
          fullName:
            cleanFullName,

          email:
            cleanEmail,

          password:
            hashedPassword,

          role:
            "parent",

          isVerified:
            false,

          verificationCode,
        });

      try {
        await transporter.sendMail({
          from:
            `"Emora App" <${EMAIL_USER}>`,

          to:
            cleanEmail,

          subject:
            "Verification Code - Emora App",

          text:
            `Hi ${cleanFullName}, your verification code is: ${verificationCode}`,
        });
      } catch (mailError) {
        console.error(
          "REGISTER PARENT EMAIL ERROR:",
          mailError.message
        );
      }

      return res.status(201).json({
        success: true,

        message:
          "User registered. Please verify your email.",

        userId:
          newUser._id,
      });
    } catch (error) {
      console.error(
        "REGISTER PARENT ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        msg:
          error.message ||
          "Registration failed",
      });
    }
  }
);

/* =====================================================
   VERIFY PARENT OTP
===================================================== */

router.post(
  "/verify",
  async (req, res) => {
    try {
      const cleanEmail =
        normalizeEmail(
          req.body.email
        );

      const cleanCode =
        String(
          req.body.code ||
          ""
        ).trim();

      if (
        !cleanEmail ||
        !cleanCode
      ) {
        return res.status(400).json({
          success: false,
          msg:
            "Email and verification code are required",
        });
      }

      const user =
        await User.findOne({
          email:
            cleanEmail,
        });

      if (!user) {
        return res.status(404).json({
          success: false,
          msg:
            "User not found",
        });
      }

      if (
        user.role !==
        "parent"
      ) {
        return res.status(400).json({
          success: false,
          msg:
            "Email OTP verification is only available for parent accounts",
        });
      }

      if (
        user.isVerified
      ) {
        return res.status(200).json({
          success: true,
          message:
            "Account is already verified",
        });
      }

      const savedCode =
        String(
          user.verificationCode ||
          ""
        ).trim();

      if (
        savedCode !==
        cleanCode
      ) {
        return res.status(400).json({
          success: false,
          msg:
            "Invalid verification code",
        });
      }

      user.isVerified =
        true;

      user.verificationCode =
        undefined;

      await user.save();

      return res.status(200).json({
        success: true,

        message:
          "Account verified successfully",

        user:
          publicUserData(
            user
          ),
      });
    } catch (error) {
      console.error(
        "VERIFY ACCOUNT ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        msg:
          error.message ||
          "Verification failed",
      });
    }
  }
);

/* =====================================================
   LOGIN
===================================================== */

router.post(
  "/login",
  async (req, res) => {
    try {
      const cleanEmail =
        normalizeEmail(
          req.body.email
        );

      const password =
        req.body.password;

      if (
        !cleanEmail ||
        !password
      ) {
        return res.status(400).json({
          success: false,
          msg:
            "Email and password are required",
        });
      }

      const user =
        await User.findOne({
          email:
            cleanEmail,
        });

      if (!user) {
        return res.status(400).json({
          success: false,
          msg:
            "Account not found",
        });
      }

      const isMatch =
        await bcrypt.compare(
          password,
          user.password
        );

      if (!isMatch) {
        return res.status(400).json({
          success: false,
          msg:
            "Wrong password",
        });
      }

      if (
        user.role ===
        "doctor"
      ) {
        if (
          [
            "not_started",
            "draft",
          ].includes(
            user.verificationStatus
          )
        ) {
          return res.status(202).json({
            success: true,

            status:
              "VERIFICATION_INCOMPLETE",

            msg:
              "Please complete your professional verification.",

            verificationToken:
              createDoctorVerificationToken(
                user._id
              ),

            user:
              publicUserData(
                user
              ),
          });
        }

        if (
          user.verificationStatus ===
          "pending"
        ) {
          return res.status(202).json({
            success: true,

            status:
              "PENDING_VERIFICATION",

            msg:
              "Your application is under review. Please wait for approval.",

            user:
              publicUserData(
                user
              ),
          });
        }

        if (
          user.verificationStatus ===
          "rejected"
        ) {
          return res.status(403).json({
            success: false,

            status:
              "VERIFICATION_REJECTED",

            msg:
              "Your application was rejected.",

            verificationToken:
              createDoctorVerificationToken(
                user._id
              ),

            user:
              publicUserData(
                user
              ),
          });
        }

        if (
          user.verificationStatus !==
          "approved"
        ) {
          return res.status(403).json({
            success: false,

            status:
              "VERIFICATION_REQUIRED",

            msg:
              "Your doctor account is not approved.",
          });
        }
      }

      if (
        user.role ===
          "parent" &&
        !user.isVerified
      ) {
        return res.status(400).json({
          success: false,
          msg:
            "Please verify your email first",
        });
      }

      const token =
        createLoginToken(
          user._id
        );

      return res.status(200).json({
        success: true,

        token,

        user:
          publicUserData(
            user
          ),
      });
    } catch (error) {
      console.error(
        "LOGIN ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        msg:
          error.message ||
          "Login failed",
      });
    }
  }
);

/* =====================================================
   GET PROFILE
===================================================== */

router.get(
  "/profile",
  checkToken,
  async (req, res) => {
    try {
      return res.status(200).json(
        req.user
      );
    } catch (error) {
      console.error(
        "GET PROFILE ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        msg:
          "Could not load profile",
      });
    }
  }
);

/* =====================================================
   UPDATE PROFILE
===================================================== */

router.put(
  "/update-profile",
  checkToken,
  handleProfileUpload,
  async (req, res) => {
    try {
      const {
        fullName,
        email,
        phone,
        city,
        bio,
      } = req.body;

      const updates = {};

      if (
        fullName !==
        undefined
      ) {
        const cleanFullName =
          String(
            fullName || ""
          ).trim();

        if (
          cleanFullName.length <
            3 ||
          cleanFullName.length >
            80
        ) {
          return res.status(400).json({
            success: false,
            msg:
              "Full name must be between 3 and 80 characters",
          });
        }

        updates.fullName =
          cleanFullName;
      }

      if (
        email !==
        undefined
      ) {
        const cleanEmail =
          normalizeEmail(
            email
          );

        const emailRegex =
          /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (
          !emailRegex.test(
            cleanEmail
          )
        ) {
          return res.status(400).json({
            success: false,
            msg:
              "Please enter a valid email address",
          });
        }

        const existingUser =
          await User.findOne({
            email:
              cleanEmail,

            _id: {
              $ne:
                req.user._id,
            },
          });

        if (existingUser) {
          return res.status(400).json({
            success: false,
            msg:
              "Email already in use",
          });
        }

        updates.email =
          cleanEmail;
      }

      if (
        phone !==
        undefined
      ) {
        updates.phone =
          String(
            phone || ""
          ).trim();
      }

      if (
        city !==
        undefined
      ) {
        updates.city =
          String(
            city || ""
          ).trim();
      }

      if (
        bio !==
        undefined
      ) {
        updates.bio =
          String(
            bio || ""
          ).trim();
      }

      if (req.file) {
        updates.profilePic =
          req.file.path ||
          req.file
            .secure_url ||
          req.file.url ||
          "";
      }

      if (
        Object.keys(
          updates
        ).length === 0
      ) {
        return res.status(400).json({
          success: false,
          msg:
            "No profile changes were provided",
        });
      }

      const updatedUser =
        await User.findByIdAndUpdate(
          req.user._id,
          {
            $set:
              updates,
          },
          {
            new: true,
            runValidators: true,
          }
        ).select(
          "-password -verificationCode -resetPasswordToken -resetPasswordExpires"
        );

      if (!updatedUser) {
        return res.status(404).json({
          success: false,
          msg:
            "User not found",
        });
      }

      return res.status(200).json({
        success: true,

        message:
          "Profile updated successfully",

        user:
          updatedUser,
      });
    } catch (error) {
      console.error(
        "UPDATE PROFILE ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        msg:
          error.message ||
          "Profile update failed",
      });
    }
  }
);

/* =====================================================
   RESEND OTP
===================================================== */

router.post(
  "/resend-code",
  async (req, res) => {
    try {
      const cleanEmail =
        normalizeEmail(
          req.body.email
        );

      if (!cleanEmail) {
        return res.status(400).json({
          success: false,
          msg:
            "Please provide an email",
        });
      }

      const user =
        await User.findOne({
          email:
            cleanEmail,
        });

      if (!user) {
        return res.status(404).json({
          success: false,
          msg:
            "User not found with this email",
        });
      }

      if (
        user.role !==
        "parent"
      ) {
        return res.status(400).json({
          success: false,
          msg:
            "Email OTP verification is only available for parent accounts",
        });
      }

      if (
        user.isVerified
      ) {
        return res.status(400).json({
          success: false,
          msg:
            "Your account is already verified",
        });
      }

      const verificationCode =
        Math.floor(
          1000 +
          Math.random() *
            9000
        ).toString();

      user.verificationCode =
        verificationCode;

      await user.save();

      await transporter.sendMail({
        from:
          `"Emora App" <${EMAIL_USER}>`,

        to:
          user.email,

        subject:
          "New Verification Code - Emora App",

        text:
          `Your new verification code is: ${verificationCode}`,
      });

      return res.status(200).json({
        success: true,
        message:
          "A new code has been sent to your email",
      });
    } catch (error) {
      console.error(
        "RESEND CODE ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        msg:
          error.message ||
          "Could not resend verification code",
      });
    }
  }
);

/* =====================================================
   FORGOT PASSWORD
===================================================== */

router.post(
  "/forgot-password",
  async (req, res) => {
    try {
      const cleanEmail =
        normalizeEmail(
          req.body.email
        );

      if (!cleanEmail) {
        return res.status(400).json({
          success: false,
          msg:
            "Please provide an email",
        });
      }

      const user =
        await User.findOne({
          email:
            cleanEmail,
        });

      if (!user) {
        return res.status(404).json({
          success: false,
          msg:
            "Email not found",
        });
      }

      const otp =
        Math.floor(
          1000 +
          Math.random() *
            9000
        ).toString();

      user.resetPasswordToken =
        otp;

      user.resetPasswordExpires =
        new Date(
          Date.now() +
          10 * 60 * 1000
        );

      await user.save();

      await transporter.sendMail({
        from:
          `"Emora App" <${EMAIL_USER}>`,

        to:
          user.email,

        subject:
          "Password Reset Code - Emora App",

        text:
          `Your password reset code is: ${otp}. It expires in 10 minutes.`,
      });

      return res.status(200).json({
        success: true,
        message:
          "OTP sent to your email",
      });
    } catch (error) {
      console.error(
        "FORGOT PASSWORD ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        msg:
          error.message ||
          "Could not send password reset code",
      });
    }
  }
);

/* =====================================================
   VERIFY RESET OTP
===================================================== */

router.post(
  "/verify-otp",
  async (req, res) => {
    try {
      const cleanEmail =
        normalizeEmail(
          req.body.email
        );

      const otp =
        String(
          req.body.otp ||
          ""
        ).trim();

      if (
        !cleanEmail ||
        !otp
      ) {
        return res.status(400).json({
          success: false,
          msg:
            "Email and OTP are required",
        });
      }

      const user =
        await User.findOne({
          email:
            cleanEmail,

          resetPasswordToken:
            otp,

          resetPasswordExpires: {
            $gt:
              new Date(),
          },
        });

      if (!user) {
        return res.status(400).json({
          success: false,
          msg:
            "Invalid or expired OTP",
        });
      }

      const resetToken =
        createResetPasswordToken(
          user._id
        );

      user.resetPasswordToken =
        undefined;

      user.resetPasswordExpires =
        undefined;

      await user.save();

      return res.status(200).json({
        success: true,

        message:
          "OTP verified successfully",

        resetToken,
      });
    } catch (error) {
      console.error(
        "VERIFY RESET OTP ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        msg:
          error.message ||
          "OTP verification failed",
      });
    }
  }
);

/* =====================================================
   RESET PASSWORD
===================================================== */

router.post(
  "/reset-password",
  async (req, res) => {
    try {
      const {
        email,
        newPassword,
        confirmPassword,
        resetToken,
      } = req.body;

      const cleanEmail =
        normalizeEmail(
          email
        );

      if (
        !cleanEmail ||
        !newPassword ||
        !resetToken
      ) {
        return res.status(400).json({
          success: false,
          msg:
            "Email, new password and reset token are required",
        });
      }

      if (
        newPassword.length <
        8
      ) {
        return res.status(400).json({
          success: false,
          msg:
            "Password must be at least 8 characters",
        });
      }

      if (
        confirmPassword !==
          undefined &&
        newPassword !==
          confirmPassword
      ) {
        return res.status(400).json({
          success: false,
          msg:
            "Passwords do not match",
        });
      }

      let decoded;

      try {
        decoded =
          jwt.verify(
            resetToken,
            process.env
              .JWT_SECRET
          );
      } catch (error) {
        return res.status(401).json({
          success: false,
          msg:
            "Invalid or expired password reset session",
        });
      }

      if (
        decoded.purpose !==
        "reset_password"
      ) {
        return res.status(401).json({
          success: false,
          msg:
            "Invalid password reset token",
        });
      }

      const user =
        await User.findOne({
          _id:
            decoded.id,

          email:
            cleanEmail,
        });

      if (!user) {
        return res.status(404).json({
          success: false,
          msg:
            "User not found",
        });
      }

      user.password =
        await bcrypt.hash(
          newPassword,
          10
        );

      user.resetPasswordToken =
        undefined;

      user.resetPasswordExpires =
        undefined;

      await user.save();

      return res.status(200).json({
        success: true,
        message:
          "Password reset successfully",
      });
    } catch (error) {
      console.error(
        "RESET PASSWORD ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        msg:
          error.message ||
          "Password reset failed",
      });
    }
  }
);

module.exports = router;

