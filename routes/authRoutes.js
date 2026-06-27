
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

const getErrorMessage = (
  error,
  fallbackMessage
) => {
  return (
    error?.message ||
    fallbackMessage ||
    "An unexpected error occurred"
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

/*
  يرجع رابط الملف الذي رفعه Multer
  إلى Cloudinary.
*/
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

/*
  تشغيل Multer مع إرجاع رسالة خطأ
  واضحة بدل سقوط السيرفر.
*/
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
          msg:
            "Each document must be 5 MB or less",
        });
      }

      if (
        error.code ===
        "LIMIT_FILE_COUNT"
      ) {
        return res.status(400).json({
          msg:
            "Too many documents were uploaded",
        });
      }

      if (
        error.code ===
        "LIMIT_UNEXPECTED_FILE"
      ) {
        return res.status(400).json({
          msg:
            "An unsupported document field was uploaded",
        });
      }

      return res.status(400).json({
        msg:
          error.message ||
          "Could not upload the documents",
      });
    }
  );
};




/* =====================================================
   PROFILE IMAGE UPLOAD HANDLER
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
        msg:
          "Profile image must be 5 MB or less",
      });
    }

<<<<<<< Updated upstream
    const emailReal = /^[a-zA-Z0-9._%+-]+@(gmail|yahoo|icloud)\.com$/;
    if (!emailReal.test(cleanEmail)) {
      return res.status(400).json({ msg: 'please use right email' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ msg: "Pass don't match" });
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    
    const files = req.files || {};
    const doctorDocuments = {
      nationalIdFront: files['nationalIdFront'] ? files['nationalIdFront'][0].path : "",
      nationalIdBack: files['nationalIdBack'] ? files['nationalIdBack'][0].path : "",
      syndicateCardFront: files['syndicateCardFront'] ? files['syndicateCardFront'][0].path : "",
      syndicateCardBack: files['syndicateCardBack'] ? files['syndicateCardBack'][0].path : "",
      graduationCertificate: files['graduationCertificate'] ? files['graduationCertificate'][0].path : "",
      specializationCertificate: files['specializationCertificate'] ? files['specializationCertificate'][0].path : "",
      practiceLicense: files['practiceLicense'] ? files['practiceLicense'][0].path : "",
      recentSelfie: files['recentSelfie'] ? files['recentSelfie'][0].path : "",
     };

    await transporter.sendMail({
      from: '"Emora App"<202227086@std.sci.cu.edu.eg>',
      to: cleanEmail,
      subject: 'Application Received - Emora App',
      text: `Hi Dr. ${fullName},\n\nThank you for registering with Emora. Your documents have been uploaded successfully and our team/AI is currently reviewing your application.\n\nWe will notify you as soon as your account is activated.`,
    });

    const newDoctor = new User({
      fullName,
      email: cleanEmail,
      password: hashedPassword,
      role: 'doctor', 
      verificationStatus: 'pending',
      verificationStep: 'submitted',
      isVerified: false, 
      nationalIdNumber,
      specialization,
      practiceLicenseNumber,
      syndicateRegistrationNumber,
      university,
      graduationYear: Number(graduationYear) || null,
      yearsOfExperience: Number(yearsOfExperience) || 0,
      doctorDocuments 
    });

    await newDoctor.save();

    res.status(201).json({
      status: 'PENDING_VERIFICATION',
      message: 'Registration successful. Your application is under review.',
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router.post('/register', async (req, res) => {
  try {
    const { fullName, email, password, confirmPassword, role } = req.body;
    const cleanEmail = email.trim().toLowerCase();

    const existingUser = await User.findOne({ email: cleanEmail });
    if (existingUser) {
=======
    if (
      error.code ===
      "LIMIT_UNEXPECTED_FILE"
    ) {
>>>>>>> Stashed changes
      return res.status(400).json({
        msg:
          "Invalid profile image field",
      });
    }

    return res.status(400).json({
      msg:
        error.message ||
        "Could not upload profile image",
    });
  });
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

      const cleanFullName = String(
        fullName || ""
      ).trim();

      const cleanEmail =
        normalizeEmail(email);

      const cleanSpecialization = String(
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
          msg:
            "Full name, email, specialization, password and confirm password are required",
        });
      }

      if (cleanFullName.length < 3) {
        return res.status(400).json({
          msg:
            "Full name must be at least 3 characters",
        });
      }

      const emailRegex =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!emailRegex.test(cleanEmail)) {
        return res.status(400).json({
          msg:
            "Please enter a valid email address",
        });
      }

      if (
        cleanSpecialization.length < 3
      ) {
        return res.status(400).json({
          msg:
            "Please enter a valid specialization",
        });
      }

      if (password.length < 8) {
        return res.status(400).json({
          msg:
            "Password must be at least 8 characters",
        });
      }

      if (
        password !== confirmPassword
      ) {
        return res.status(400).json({
          msg: "Passwords do not match",
        });
      }

      const existingUser =
        await User.findOne({
          email: cleanEmail,
        });

      if (existingUser) {
        return res.status(400).json({
          msg:
            "Email already exists. Please use another email or login.",
        });
      }

      const salt =
        await bcrypt.genSalt(10);

      const hashedPassword =
        await bcrypt.hash(
          password,
          salt
        );

      const newDoctor = new User({
        fullName: cleanFullName,

        email: cleanEmail,

        password: hashedPassword,

        role: "doctor",

        isVerified: false,

        verificationStatus:
          "not_started",

        verificationStep: "intro",

        professionalType:
          "Child Psychiatrist",

        specialization:
          cleanSpecialization,
      });

      await newDoctor.save();

      const verificationToken =
        createDoctorVerificationToken(
          newDoctor._id
        );

      /*
        لا نوقف التسجيل إذا فشل
        إرسال الإيميل مؤقتًا.
      */
      try {
        await transporter.sendMail({
          from:
            `"Emora App" <${EMAIL_USER}>`,

          to: cleanEmail,

          subject:
            "Continue Your Professional Verification - Emora App",

          text: `Hi Dr. ${newDoctor.fullName},

Your Emora doctor account has been created successfully.

Please continue the professional verification steps and upload the required documents.

You will be able to access child cases after your application is approved.`,
        });
      } catch (mailError) {
        console.error(
          "REGISTER DOCTOR EMAIL ERROR:",
          mailError.message
        );
      }

      return res.status(201).json({
        status:
          "VERIFICATION_NOT_STARTED",

        message:
          "Doctor account created. Please complete professional verification.",

        verificationToken,

        doctor: {
          id: newDoctor._id,

          fullName:
            newDoctor.fullName,

          email: newDoctor.email,

          role: newDoctor.role,

          specialization:
            newDoctor.specialization,

          verificationStatus:
            newDoctor.verificationStatus,

          verificationStep:
            newDoctor.verificationStep,
        },
      });
    } catch (error) {
      console.error(
        "REGISTER DOCTOR ERROR:",
        error
      );

      return res.status(500).json({
        error: getErrorMessage(
          error,
          "Doctor registration failed"
        ),
      });
    }
  }
);

/* =====================================================
   GET DOCTOR VERIFICATION PROFILE
   GET /api/auth/doctor-verification/profile
===================================================== */

router.get(
  "/doctor-verification/profile",
  checkDoctorVerificationToken,
  async (req, res) => {
    try {
      const doctor = req.user;

      return res.status(200).json({
        doctor: {
          id: doctor._id,

          fullName:
            doctor.fullName,

          email: doctor.email,

          role: doctor.role,

          professionalType:
            doctor.professionalType ||
            "Child Psychiatrist",

          nationalId:
            doctor.nationalIdNumber ||
            "",

          specialization:
            doctor.specialization || "",

          licenseNumber:
            doctor.practiceLicenseNumber ||
            "",

          syndicateNumber:
            doctor.syndicateRegistrationNumber ||
            "",

          university:
            doctor.university || "",

          graduationYear:
            doctor.graduationYear !==
              undefined &&
            doctor.graduationYear !== null
              ? String(
                  doctor.graduationYear
                )
              : "",

          experienceYears:
            doctor.yearsOfExperience !==
              undefined &&
            doctor.yearsOfExperience !==
              null
              ? String(
                  doctor.yearsOfExperience
                )
              : "",

          verificationStatus:
            doctor.verificationStatus,

          verificationStep:
            doctor.verificationStep,
        },
      });
    } catch (error) {
      console.error(
        "GET DOCTOR VERIFICATION PROFILE ERROR:",
        error
      );

      return res.status(500).json({
        error: getErrorMessage(
          error,
          "Could not load doctor verification profile"
        ),
      });
    }
  }
);

/* =====================================================
   SAVE DOCTOR PROFESSIONAL INFORMATION
   PUT /api/auth/doctor-verification/professional-info
===================================================== */

router.put(
  "/doctor-verification/professional-info",
  checkDoctorVerificationToken,
  async (req, res) => {
    try {
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

      if (
        req.user.verificationStatus ===
          "pending" ||
        req.user.verificationStatus ===
          "approved"
      ) {
        return res.status(409).json({
          msg:
            "Professional information cannot be edited after submission or approval",
        });
      }

      const cleanFullName = String(
        fullName || ""
      ).trim();

      const cleanNationalId = String(
        nationalId || ""
      )
        .replace(/\D/g, "")
        .trim();

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

      const cleanUniversity = String(
        university || ""
      ).trim();

      const graduationYearNumber =
        Number(graduationYear);

      const experienceYearsNumber =
        Number(experienceYears);

      const currentYear =
        new Date().getFullYear();

      if (
        !cleanFullName ||
        cleanFullName.length < 3
      ) {
        return res.status(400).json({
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
          msg:
            "National ID must contain 14 digits",
        });
      }

      if (
        !cleanSpecialization ||
        cleanSpecialization.length < 3
      ) {
        return res.status(400).json({
          msg:
            "Please enter a valid medical specialty",
        });
      }

      if (!cleanLicenseNumber) {
        return res.status(400).json({
          msg:
            "Practice license number is required",
        });
      }

      if (!cleanSyndicateNumber) {
        return res.status(400).json({
          msg:
            "Medical syndicate number is required",
        });
      }

      if (!cleanUniversity) {
        return res.status(400).json({
          msg:
            "University name is required",
        });
      }

      if (
        !Number.isInteger(
          graduationYearNumber
        ) ||
        graduationYearNumber < 1950 ||
        graduationYearNumber >
          currentYear
      ) {
        return res.status(400).json({
          msg:
            "Please enter a valid graduation year",
        });
      }

      if (
        !Number.isInteger(
          experienceYearsNumber
        ) ||
        experienceYearsNumber < 0 ||
        experienceYearsNumber > 70
      ) {
        return res.status(400).json({
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
          msg:
            "Doctor account was not found",
        });
      }

      return res.status(200).json({
        message:
          "Professional information saved successfully",

        nextStep: "documents",

        doctor: {
          id: updatedDoctor._id,

          fullName:
            updatedDoctor.fullName,

          email:
            updatedDoctor.email,

          professionalType:
            updatedDoctor.professionalType,

          nationalId:
            updatedDoctor.nationalIdNumber,

          specialization:
            updatedDoctor.specialization,

          licenseNumber:
            updatedDoctor.practiceLicenseNumber,

          syndicateNumber:
            updatedDoctor.syndicateRegistrationNumber,

          university:
            updatedDoctor.university,

          graduationYear: String(
            updatedDoctor.graduationYear
          ),

          experienceYears: String(
            updatedDoctor.yearsOfExperience
          ),

          verificationStatus:
            updatedDoctor.verificationStatus,

          verificationStep:
            updatedDoctor.verificationStep,
        },
      });
    } catch (error) {
      console.error(
        "SAVE DOCTOR PROFESSIONAL INFO ERROR:",
        error
      );

      return res.status(500).json({
        error: getErrorMessage(
          error,
          "Could not save professional information"
        ),
      });
    }
  }
);

/* =====================================================
   GET DOCTOR DOCUMENTS
   GET /api/auth/doctor-verification/documents
===================================================== */

router.get(
  "/doctor-verification/documents",
  checkDoctorVerificationToken,
  async (req, res) => {
    try {
      const doctor =
        await User.findById(
          req.user._id
        ).select(
          "doctorDocuments verificationStatus verificationStep"
        );

      if (!doctor) {
        return res.status(404).json({
          msg:
            "Doctor account was not found",
        });
      }

      const documents =
        doctor.doctorDocuments || {};

      return res.status(200).json({
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
          doctor.verificationStatus,

        verificationStep:
          doctor.verificationStep,
      });
    } catch (error) {
      console.error(
        "GET DOCTOR DOCUMENTS ERROR:",
        error
      );

      return res.status(500).json({
        error: getErrorMessage(
          error,
          "Could not load doctor documents"
        ),
      });
    }
  }
);

/* =====================================================
   UPLOAD DOCTOR DOCUMENTS
   PUT /api/auth/doctor-verification/documents

   FormData fields:
   nationalIdFront
   nationalIdBack
   practiceLicense
   syndicateCard
   graduationCertificate
   specializationCertificate
   selfie
===================================================== */

router.put(
  "/doctor-verification/documents",
  checkDoctorVerificationToken,
  handleDoctorDocumentsUpload,
  async (req, res) => {
    try {
      if (
        req.user.verificationStatus ===
          "pending" ||
        req.user.verificationStatus ===
          "approved"
      ) {
        return res.status(409).json({
          msg:
            "Documents cannot be edited after submission or approval",
        });
      }

      /*
        يجب إنهاء بيانات الطبيب
        قبل رفع المستندات.
      */
      if (
        !req.user.nationalIdNumber ||
        !req.user.practiceLicenseNumber ||
        !req.user.syndicateRegistrationNumber ||
        !req.user.university
      ) {
        return res.status(409).json({
          msg:
            "Please complete your professional information first",
        });
      }

      const currentDocuments =
        req.user.doctorDocuments || {};

      const uploadedNationalIdFront =
        getUploadedFileUrl(
          req.files,
          "nationalIdFront"
        );

      const uploadedNationalIdBack =
        getUploadedFileUrl(
          req.files,
          "nationalIdBack"
        );

      const uploadedPracticeLicense =
        getUploadedFileUrl(
          req.files,
          "practiceLicense"
        );

      const uploadedSyndicateCard =
        getUploadedFileUrl(
          req.files,
          "syndicateCard"
        );

      const uploadedGraduationCertificate =
        getUploadedFileUrl(
          req.files,
          "graduationCertificate"
        );

      const uploadedSpecializationCertificate =
        getUploadedFileUrl(
          req.files,
          "specializationCertificate"
        );

      const uploadedSelfie =
        getUploadedFileUrl(
          req.files,
          "selfie"
        );

      /*
        نحتفظ بالمستند القديم إذا لم
        يرفع المستخدم بديلًا جديدًا.
      */
      const documentValues = {
        nationalIdFront:
          uploadedNationalIdFront ||
          currentDocuments.nationalIdFront ||
          "",

        nationalIdBack:
          uploadedNationalIdBack ||
          currentDocuments.nationalIdBack ||
          "",

        practiceLicense:
          uploadedPracticeLicense ||
          currentDocuments.practiceLicense ||
          "",

        /*
          الفرونت يرسل syndicateCard واحد.
          نخزنه في syndicateCardFront
          الموجود بالفعل داخل الموديل.
        */
        syndicateCardFront:
          uploadedSyndicateCard ||
          currentDocuments.syndicateCardFront ||
          "",

        syndicateCardBack:
          currentDocuments.syndicateCardBack ||
          "",

        graduationCertificate:
          uploadedGraduationCertificate ||
          currentDocuments.graduationCertificate ||
          "",

        specializationCertificate:
          uploadedSpecializationCertificate ||
          currentDocuments.specializationCertificate ||
          "",

        /*
          الفرونت يسمي الملف selfie،
          والموديل يسميه recentSelfie.
        */
        recentSelfie:
          uploadedSelfie ||
          currentDocuments.recentSelfie ||
          "",
      };

      const missingDocuments = [];

      if (
        !documentValues.nationalIdFront
      ) {
        missingDocuments.push(
          "nationalIdFront"
        );
      }

      if (
        !documentValues.nationalIdBack
      ) {
        missingDocuments.push(
          "nationalIdBack"
        );
      }

      if (
        !documentValues.practiceLicense
      ) {
        missingDocuments.push(
          "practiceLicense"
        );
      }

      if (
        !documentValues.syndicateCardFront
      ) {
        missingDocuments.push(
          "syndicateCard"
        );
      }

      if (
        !documentValues.graduationCertificate
      ) {
        missingDocuments.push(
          "graduationCertificate"
        );
      }

      if (
        !documentValues.specializationCertificate
      ) {
        missingDocuments.push(
          "specializationCertificate"
        );
      }

      if (
        !documentValues.recentSelfie
      ) {
        missingDocuments.push(
          "selfie"
        );
      }

      if (
        missingDocuments.length > 0
      ) {
        return res.status(400).json({
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
              doctorDocuments:
                documentValues,

              documentsVerification: {
                nationalIdFront: false,

                nationalIdBack: false,

                syndicateCardFront: false,

                syndicateCardBack: false,

                graduationCertificate:
                  false,

                specializationCertificate:
                  false,

                practiceLicense: false,

                recentSelfie: false,
              },

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
        ).select(
          "doctorDocuments verificationStatus verificationStep"
        );

      if (!updatedDoctor) {
        return res.status(404).json({
          msg:
            "Doctor account was not found",
        });
      }

      return res.status(200).json({
        message:
          "Documents uploaded successfully",

        nextStep: "review",

        verificationStatus:
          updatedDoctor.verificationStatus,

        verificationStep:
          updatedDoctor.verificationStep,

        documents: {
          nationalIdFront:
            updatedDoctor.doctorDocuments
              .nationalIdFront,

          nationalIdBack:
            updatedDoctor.doctorDocuments
              .nationalIdBack,

          practiceLicense:
            updatedDoctor.doctorDocuments
              .practiceLicense,

          syndicateCard:
            updatedDoctor.doctorDocuments
              .syndicateCardFront,

          graduationCertificate:
            updatedDoctor.doctorDocuments
              .graduationCertificate,

          specializationCertificate:
            updatedDoctor.doctorDocuments
              .specializationCertificate,

          selfie:
            updatedDoctor.doctorDocuments
              .recentSelfie,
        },
      });
    } catch (error) {
      console.error(
        "SAVE DOCTOR DOCUMENTS ERROR:",
        error
      );

      return res.status(500).json({
        error: getErrorMessage(
          error,
          "Could not save doctor documents"
        ),
      });
    }
  }
);


/* =====================================================
   SUBMIT AND AUTO-APPROVE DOCTOR VERIFICATION
   POST /api/auth/doctor-verification/submit

   ملاحظة:
   هذا الـRoute يقبل الدكتور تلقائيًا حاليًا
   حتى نتمكن من تجربة فلو حساب الدكتور كاملًا.
===================================================== */

router.post(
  "/doctor-verification/submit",
  checkDoctorVerificationToken,
  async (req, res) => {
    try {
      const doctor = await User.findById(
        req.user._id
      );

      if (!doctor) {
        return res.status(404).json({
          msg: "Doctor account was not found",
        });
      }

      if (doctor.role !== "doctor") {
        return res.status(403).json({
          msg:
            "Only doctor accounts can submit professional verification",
        });
      }

      /*
        لو الحساب اتقبل قبل كده، نرجع له
        Token عادي بدون تكرار التعديل.
      */
      if (
        doctor.verificationStatus ===
        "approved"
      ) {
        const token =
          createLoginToken(doctor._id);

        return res.status(200).json({
          status:
            "VERIFICATION_APPROVED",

          message:
            "Your doctor account is already approved.",

          token,

          user: {
            id: doctor._id,

            name: doctor.fullName,

            fullName:
              doctor.fullName,

            email: doctor.email,

            role: doctor.role,

            profilePic:
              doctor.profilePic,

            specialization:
              doctor.specialization,

            professionalType:
              doctor.professionalType,

            isVerified:
              doctor.isVerified,

            verificationStatus:
              doctor.verificationStatus,

            verificationStep:
              doctor.verificationStep,
          },
        });
      }

      /*
        التأكد من أن البيانات المهنية
        تم إدخالها قبل إرسال الطلب.
      */
      const missingInformation = [];

      if (!doctor.fullName) {
        missingInformation.push(
          "fullName"
        );
      }

      if (!doctor.nationalIdNumber) {
        missingInformation.push(
          "nationalId"
        );
      }

      if (!doctor.specialization) {
        missingInformation.push(
          "specialization"
        );
      }

      if (
        !doctor.practiceLicenseNumber
      ) {
        missingInformation.push(
          "licenseNumber"
        );
      }

      if (
        !doctor.syndicateRegistrationNumber
      ) {
        missingInformation.push(
          "syndicateNumber"
        );
      }

      if (!doctor.university) {
        missingInformation.push(
          "university"
        );
      }

      if (
        doctor.graduationYear ===
          undefined ||
        doctor.graduationYear === null
      ) {
        missingInformation.push(
          "graduationYear"
        );
      }

      if (
        doctor.yearsOfExperience ===
          undefined ||
        doctor.yearsOfExperience === null
      ) {
        missingInformation.push(
          "experienceYears"
        );
      }

      if (
        missingInformation.length > 0
      ) {
        return res.status(400).json({
          msg:
            "Please complete all professional information before submitting",

          missingInformation,
        });
      }

      /*
        التأكد من أن كل المستندات المطلوبة
        موجودة بالفعل في Cloudinary.
      */
      const documents =
        doctor.doctorDocuments || {};

      const missingDocuments = [];

      if (!documents.nationalIdFront) {
        missingDocuments.push(
          "nationalIdFront"
        );
      }

      if (!documents.nationalIdBack) {
        missingDocuments.push(
          "nationalIdBack"
        );
      }

      if (!documents.practiceLicense) {
        missingDocuments.push(
          "practiceLicense"
        );
      }

      if (
        !documents.syndicateCardFront
      ) {
        missingDocuments.push(
          "syndicateCard"
        );
      }

      if (
        !documents.graduationCertificate
      ) {
        missingDocuments.push(
          "graduationCertificate"
        );
      }

      if (
        !documents.specializationCertificate
      ) {
        missingDocuments.push(
          "specializationCertificate"
        );
      }

      if (!documents.recentSelfie) {
        missingDocuments.push(
          "selfie"
        );
      }

      if (
        missingDocuments.length > 0
      ) {
        return res.status(400).json({
          msg:
            "Please upload all required documents before submitting",

          missingDocuments,
        });
      }

      const submittedAt = new Date();

      /*
        قبول تلقائي مؤقتًا حتى نكمل
        تجربة فلو حساب الدكتور بالكامل.
      */
      doctor.verificationStatus =
        "approved";

      doctor.verificationStep =
        "submitted";

      doctor.verificationSubmittedAt =
        submittedAt;

      doctor.isVerified = true;

      /*
        بما أن الحساب تم قبوله تلقائيًا،
        نعتبر المستندات مقبولة حاليًا.
      */
      doctor.documentsVerification = {
        nationalIdFront: true,

        nationalIdBack: true,

        syndicateCardFront: true,

        syndicateCardBack: false,

        graduationCertificate: true,

        specializationCertificate: true,

        practiceLicense: true,

        recentSelfie: true,
      };

      await doctor.save();

      /*
        إصدار Token تسجيل دخول عادي،
        لأن verificationToken مخصص فقط
        لخطوات التوثيق.
      */
      const token =
        createLoginToken(doctor._id);

      return res.status(200).json({
        status:
          "VERIFICATION_APPROVED",

        message:
          "Doctor verification submitted and approved successfully.",

        token,

        verificationStatus:
          doctor.verificationStatus,

        verificationStep:
          doctor.verificationStep,

        verificationSubmittedAt:
          doctor.verificationSubmittedAt,

        user: {
          id: doctor._id,

          name: doctor.fullName,

          fullName:
            doctor.fullName,

          email: doctor.email,

          role: doctor.role,

          profilePic:
            doctor.profilePic,

          specialization:
            doctor.specialization,

          professionalType:
            doctor.professionalType,

          isVerified:
            doctor.isVerified,

          verificationStatus:
            doctor.verificationStatus,

          verificationStep:
            doctor.verificationStep,
        },
      });
    } catch (error) {
      console.error(
        "SUBMIT DOCTOR VERIFICATION ERROR:",
        error
      );

      return res.status(500).json({
        error: getErrorMessage(
          error,
          "Could not submit doctor verification"
        ),
      });
    }
  }
);


/* =====================================================
   REGISTER PARENT
   POST /api/auth/register
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

      const cleanFullName = String(
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
          msg:
            "Please fill all required fields",
        });
      }

      if (cleanFullName.length < 3) {
        return res.status(400).json({
          msg:
            "Full name must be at least 3 characters",
        });
      }

      const emailRegex =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!emailRegex.test(cleanEmail)) {
        return res.status(400).json({
          msg:
            "Please enter a valid email address",
        });
      }

      if (password.length < 8) {
        return res.status(400).json({
          msg:
            "Password must be at least 8 characters",
        });
      }

      if (
        password !== confirmPassword
      ) {
        return res.status(400).json({
          msg: "Passwords do not match",
        });
      }

      const existingUser =
        await User.findOne({
          email: cleanEmail,
        });

      if (existingUser) {
        return res.status(400).json({
          msg:
            "Email already exists. Please use another email or login.",
        });
      }

      const salt =
        await bcrypt.genSalt(10);

      const hashedPassword =
        await bcrypt.hash(
          password,
          salt
        );

      const verificationCode =
        Math.floor(
          1000 +
            Math.random() * 9000
        ).toString();

      await transporter.sendMail({
        from:
          `"Emora App" <${EMAIL_USER}>`,

        to: cleanEmail,

        subject:
          "Verification Code - Emora App",

        text:
          `Hi ${cleanFullName}, ` +
          `your verification code is: ${verificationCode}`,
      });

      const newUser = new User({
        fullName:
          cleanFullName,

        email: cleanEmail,

        password:
          hashedPassword,

        role: "parent",

        isVerified: false,

        verificationCode,
      });

      await newUser.save();

      return res.status(201).json({
        message:
          "User registered. Please verify your email.",
      });
    } catch (error) {
      console.error(
        "REGISTER PARENT ERROR:",
        error
      );

      return res.status(500).json({
        error: getErrorMessage(
          error,
          "Registration failed"
        ),
      });
    }
  }
);

/* =====================================================
   VERIFY PARENT ACCOUNT OTP
   POST /api/auth/verify
===================================================== */

router.post(
  "/verify",
  async (req, res) => {
    try {
      const cleanEmail =
        normalizeEmail(
          req.body.email
        );

      const cleanCode = String(
        req.body.code || ""
      ).trim();

      if (
        !cleanEmail ||
        !cleanCode
      ) {
        return res.status(400).json({
          msg:
            "Email and verification code are required",
        });
      }

      const user =
        await User.findOne({
          email: cleanEmail,
        });

      if (!user) {
        return res.status(404).json({
          msg: "User not found",
        });
      }

      if (user.role !== "parent") {
        return res.status(400).json({
          msg:
            "Email OTP verification is only available for parent accounts",
        });
      }

      if (
        user.isVerified === true
      ) {
        return res.status(200).json({
          msg:
            "Account is already verified",

          isVerified: true,
        });
      }

      const savedCode = String(
        user.verificationCode || ""
      ).trim();

      if (
        savedCode !== cleanCode
      ) {
        return res.status(400).json({
          msg:
            "Invalid verification code",
        });
      }

      const updatedUser =
        await User.findOneAndUpdate(
          {
            _id: user._id,

            verificationCode:
              savedCode,
          },
          {
            $set: {
              isVerified: true,
            },

            $unset: {
              verificationCode: 1,
            },
          },
          {
            new: true,
            runValidators: true,
          }
        );

      if (!updatedUser) {
        return res.status(500).json({
          msg:
            "Account verification was not saved",
        });
      }

      return res.status(200).json({
        msg:
          "Account verified successfully",

        isVerified:
          updatedUser.isVerified,

        user: {
          id: updatedUser._id,

          fullName:
            updatedUser.fullName,

          email:
            updatedUser.email,

          role:
            updatedUser.role,
        },
      });
    } catch (error) {
      console.error(
        "VERIFY ACCOUNT ERROR:",
        error
      );

      return res.status(500).json({
        error: getErrorMessage(
          error,
          "Verification failed"
        ),
      });
    }
  }
);

/* =====================================================
   LOGIN
   POST /api/auth/login
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
          msg:
            "Email and password are required",
        });
      }

      const user =
        await User.findOne({
          email: cleanEmail,
        });

      if (!user) {
        return res.status(400).json({
          msg: "Account not found",
        });
      }

      const isMatch =
        await bcrypt.compare(
          password,
          user.password
        );

      if (!isMatch) {
        return res.status(400).json({
          msg: "Wrong password",
        });
      }

      if (user.role === "doctor") {
        if (
          user.verificationStatus ===
            "not_started" ||
          user.verificationStatus ===
            "draft"
        ) {
          const verificationToken =
            createDoctorVerificationToken(
              user._id
            );

          return res.status(202).json({
            status:
              "VERIFICATION_INCOMPLETE",

            msg:
              "Please complete your professional verification.",

            verificationToken,

            user: {
              id: user._id,

              fullName:
                user.fullName,

              email:
                user.email,

              role:
                user.role,

              specialization:
                user.specialization,

              verificationStatus:
                user.verificationStatus,

              verificationStep:
                user.verificationStep,
            },
          });
        }

        if (
          user.verificationStatus ===
          "pending"
        ) {
          return res.status(202).json({
            status:
              "PENDING_VERIFICATION",

            msg:
              "Your application is under review. Please wait for approval.",

            user: {
              id: user._id,

              fullName:
                user.fullName,

              email:
                user.email,

              role:
                user.role,

              verificationStatus:
                user.verificationStatus,

              verificationStep:
                user.verificationStep,
            },
          });
        }

        if (
          user.verificationStatus ===
          "rejected"
        ) {
          const verificationToken =
            createDoctorVerificationToken(
              user._id
            );

          return res.status(403).json({
            status:
              "VERIFICATION_REJECTED",

            msg:
              "Your application was rejected. You can review the result and resubmit.",

            verificationToken,

            user: {
              id: user._id,

              fullName:
                user.fullName,

              email:
                user.email,

              role:
                user.role,

              specialization:
                user.specialization,

              verificationStatus:
                user.verificationStatus,

              verificationStep:
                user.verificationStep,
            },
          });
        }

        if (
          user.verificationStatus !==
          "approved"
        ) {
          return res.status(403).json({
            status:
              "VERIFICATION_REQUIRED",

            msg:
              "Your doctor account is not approved.",
          });
        }
      }

      if (
        user.role === "parent" &&
        user.isVerified !== true
      ) {
        return res.status(400).json({
          msg:
            "Please verify your email first",
        });
      }

      const token =
        createLoginToken(user._id);

      return res.status(200).json({
        token,

        user: {
          id: user._id,

          name: user.fullName,

          fullName:
            user.fullName,

          email: user.email,

          role: user.role,

          profilePic:
            user.profilePic,

          isVerified:
            user.isVerified,

          verificationStatus:
            user.verificationStatus,

          verificationStep:
            user.verificationStep,

          specialization:
            user.specialization,
        },
      });
    } catch (error) {
      console.error(
        "LOGIN ERROR:",
        error
      );

      return res.status(500).json({
        error: getErrorMessage(
          error,
          "Login failed"
        ),
      });
    }
  }
);

/* =====================================================
   GET PROFILE
   GET /api/auth/profile
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
        error:
          "Could not load profile",
      });
    }
  }
);

/* =====================================================
   UPDATE PROFILE
   PUT /api/auth/update-profile
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
        fullName !== undefined
      ) {
        const cleanFullName =
          String(
            fullName || ""
          ).trim();

        if (
          cleanFullName.length < 3
        ) {
          return res.status(400).json({
            msg:
              "Full name must be at least 3 characters",
          });
        }

        if (
          cleanFullName.length > 80
        ) {
          return res.status(400).json({
            msg:
              "Full name must not exceed 80 characters",
          });
        }

        updates.fullName =
          cleanFullName;
      }

      if (email !== undefined) {
        const cleanEmail =
          normalizeEmail(email);

        const emailRegex =
          /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (
          !emailRegex.test(
            cleanEmail
          )
        ) {
          return res.status(400).json({
            msg:
              "Please enter a valid email address",
          });
        }

        const existingUser =
          await User.findOne({
            email: cleanEmail,

            _id: {
              $ne: req.user._id,
            },
          });

        if (existingUser) {
          return res.status(400).json({
            msg:
              "Email already in use by another account",
          });
        }

        updates.email =
          cleanEmail;
      }

      if (phone !== undefined) {
        const cleanPhone =
          String(phone || "")
            .replace(/[^\d+]/g, "")
            .trim();

        const phoneDigits =
          cleanPhone.replace(
            /\D/g,
            ""
          );

        if (
          cleanPhone &&
          (phoneDigits.length < 10 ||
            phoneDigits.length > 15)
        ) {
          return res.status(400).json({
            msg:
              "Please enter a valid phone number",
          });
        }

        updates.phone =
          cleanPhone;
      }

      if (city !== undefined) {
        const cleanCity =
          String(city || "").trim();

        if (
          cleanCity.length > 60
        ) {
          return res.status(400).json({
            msg:
              "City must not exceed 60 characters",
          });
        }

        updates.city =
          cleanCity;
      }

      if (bio !== undefined) {
        const cleanBio =
          String(bio || "").trim();

        if (
          cleanBio.length > 500
        ) {
          return res.status(400).json({
            msg:
              "Bio must not exceed 500 characters",
          });
        }

        updates.bio =
          cleanBio;
      }

      if (req.file) {
        updates.profilePic =
          req.file.path ||
          req.file.secure_url ||
          req.file.url ||
          "";
      }

      if (
        Object.keys(updates).length ===
        0
      ) {
        return res.status(400).json({
          msg:
            "No profile changes were provided",
        });
      }

      const updatedUser =
        await User.findByIdAndUpdate(
          req.user._id,
          {
            $set: updates,
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
          msg: "User not found",
        });
      }

      return res.status(200).json({
        success: true,

        msg:
          "Profile updated successfully",

        user: updatedUser,
      });
    } catch (error) {
      console.error(
        "UPDATE PROFILE ERROR:",
        error
      );

      if (
        error?.code === 11000
      ) {
        return res.status(400).json({
          msg:
            "Email already in use by another account",
        });
      }

      return res.status(500).json({
        error: getErrorMessage(
          error,
          "Profile update failed"
        ),
      });
    }
  }
);
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
          msg:
            "Please provide an email",
        });
      }

      const user =
        await User.findOne({
          email: cleanEmail,
        });

      if (!user) {
        return res.status(404).json({
          msg:
            "User not found with this email",
        });
      }

      if (user.role !== "parent") {
        return res.status(400).json({
          msg:
            "Email OTP verification is only available for parent accounts",
        });
      }

      if (
        user.isVerified === true
      ) {
        return res.status(400).json({
          msg:
            "Your account is already verified. Please login.",
        });
      }

      const verificationCode =
        Math.floor(
          1000 +
            Math.random() * 9000
        ).toString();

      await User.findByIdAndUpdate(
        user._id,
        {
          $set: {
            verificationCode,

            isVerified: false,
          },
        }
      );

      await transporter.sendMail({
        from:
          `"Emora App" <${EMAIL_USER}>`,

        to: user.email,

        subject:
          "New Verification Code - Emora App",

        text:
          `Your new verification code is: ` +
          verificationCode,
      });

      return res.status(200).json({
        msg:
          "A new code has been sent to your email",
      });
    } catch (error) {
      console.error(
        "RESEND CODE ERROR:",
        error
      );

      return res.status(500).json({
        error: getErrorMessage(
          error,
          "Could not resend verification code"
        ),
      });
    }
  }
);

/* =====================================================
   FORGOT PASSWORD
   POST /api/auth/forgot-password
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
          msg:
            "Please provide an email",
        });
      }

      const user =
        await User.findOne({
          email: cleanEmail,
        });

      if (!user) {
        return res.status(404).json({
          msg: "Email not found",
        });
      }

      const otp =
        Math.floor(
          1000 +
            Math.random() * 9000
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

        to: user.email,

        subject:
          "Password Reset Code - Emora App",

        text:
          `Your password reset code is: ${otp}. ` +
          "It expires in 10 minutes.",
      });

      return res.status(200).json({
        msg:
          "OTP sent to your email",
      });
    } catch (error) {
      console.error(
        "FORGOT PASSWORD ERROR:",
        error
      );

      return res.status(500).json({
        error: getErrorMessage(
          error,
          "Could not send password reset code"
        ),
      });
    }
  }
);

/* =====================================================
   VERIFY RESET PASSWORD OTP
   POST /api/auth/verify-otp
===================================================== */

router.post(
  "/verify-otp",
  async (req, res) => {
    try {
      const cleanEmail =
        normalizeEmail(
          req.body.email
        );

      const otp = String(
        req.body.otp || ""
      ).trim();

      if (
        !cleanEmail ||
        !otp
      ) {
        return res.status(400).json({
          msg:
            "Email and OTP are required",
        });
      }

      const user =
        await User.findOne({
          email: cleanEmail,

          resetPasswordToken:
            otp,

          resetPasswordExpires: {
            $gt: new Date(),
          },
        });

      if (!user) {
        return res.status(400).json({
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
        msg:
          "OTP verified successfully",

        resetToken,
      });
    } catch (error) {
      console.error(
        "VERIFY RESET OTP ERROR:",
        error
      );

      return res.status(500).json({
        error: getErrorMessage(
          error,
          "OTP verification failed"
        ),
      });
    }
  }
);

/* =====================================================
   RESET PASSWORD
   POST /api/auth/reset-password
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
        normalizeEmail(email);

      if (
        !cleanEmail ||
        !newPassword ||
        !resetToken
      ) {
        return res.status(400).json({
          msg:
            "Email, new password and reset token are required",
        });
      }

<<<<<<< Updated upstream
    if (user.role === 'parent'&& !user.isVerified) {
      return res.status(400).json({ msg: 'Please verify your email first' });
    }
    const token = jwt.sign(
    { id: user._id },
    process.env.JWT_SECRET,
    { expiresIn: '1d' }
);

    res.json({
      token,
      user: {
        name: user.fullName,
        email: user.email,
        role: user.role,
        verificationStatus: user.verificationStatus // إضافية: عشان الفرونت إند يعرف حالة الدكتور
      },
    });
  } catch (err) {
    res.status(500).json({ error: 'Login failed' });
  }

});

router.get('/profile', checkToken, async (req, res) => {
  try {
    res.json(req.user);
  } catch (error) {
    res.status(500).send('Server Error');
  }

});

router.put('/update-profile', checkToken, uploadProfile.single('profilePic'), async (req, res) => {
  try {
    const { fullName, email } = req.body;
    const updates = {};

    if (fullName) updates.fullName = fullName;
    if (req.file) updates.profilePic = req.file.path;

    if (email) {
      const cleanEmail = email.trim();
      const existingUser = await User.findOne({ email: cleanEmail });

      if (existingUser && existingUser._id.toString() !== req.user._id.toString()) {
        return res.status(400).json({ msg: 'Email already in use by another account' });
=======
      if (
        newPassword.length < 8
      ) {
        return res.status(400).json({
          msg:
            "Password must be at least 8 characters",
        });
>>>>>>> Stashed changes
      }

      if (
        confirmPassword !==
          undefined &&
        newPassword !==
          confirmPassword
      ) {
        return res.status(400).json({
          msg:
            "Passwords do not match",
        });
      }

      let decoded;

      try {
        decoded = jwt.verify(
          resetToken,
          process.env.JWT_SECRET
        );
      } catch {
        return res.status(401).json({
          msg:
            "Invalid or expired password reset session",
        });
      }

      if (
        decoded.purpose !==
        "reset_password"
      ) {
        return res.status(401).json({
          msg:
            "Invalid password reset token",
        });
      }

      const user =
        await User.findOne({
          _id: decoded.id,

          email: cleanEmail,
        });

      if (!user) {
        return res.status(404).json({
          msg: "User not found",
        });
      }

      const salt =
        await bcrypt.genSalt(10);

      user.password =
        await bcrypt.hash(
          newPassword,
          salt
        );

      user.resetPasswordToken =
        undefined;

      user.resetPasswordExpires =
        undefined;

      await user.save();

      return res.status(200).json({
        msg:
          "Password reset successfully",
      });
    } catch (error) {
      console.error(
        "RESET PASSWORD ERROR:",
        error
      );

      return res.status(500).json({
        error: getErrorMessage(
          error,
          "Password reset failed"
        ),
      });
    }
  }
);

module.exports = router;

