
const cloudinary = require("cloudinary").v2;

const {
  CloudinaryStorage,
} = require("multer-storage-cloudinary");

const multer = require("multer");

/* =====================================================
   CLOUDINARY CONFIGURATION
===================================================== */

cloudinary.config({
  cloud_name:
    process.env.CLOUDINARY_CLOUD_NAME,

  api_key:
    process.env.CLOUDINARY_API_KEY,

  api_secret:
    process.env.CLOUDINARY_API_SECRET,
});

/* =====================================================
   STORAGE CREATOR
===================================================== */

const createStorage = (
  folderName,
  resourceType,
  allowedFormats
) => {
  return new CloudinaryStorage({
    cloudinary,

    params: {
      folder: folderName,

      resource_type: resourceType,

      allowed_formats: allowedFormats,
    },
  });
};

/* =====================================================
   PROFILE IMAGES
===================================================== */

const uploadProfile = multer({
  storage: createStorage(
    "Emora_Profiles",
    "image",
    ["jpg", "jpeg", "png"]
  ),

  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

/* =====================================================
   CHILD DRAWINGS
===================================================== */

const uploadDrawings = multer({
  storage: createStorage(
    "Emora_Children_Drawings",
    "image",
    ["jpg", "jpeg", "png"]
  ),

  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

/* =====================================================
   CHILD VOICES
===================================================== */

const uploadVoices = multer({
  storage: createStorage(
    "Emora_Children_Voices",
    "video",
    [
      "mp3",
      "wav",
      "m4a",
      "ogg",
    ]
  ),

  limits: {
    fileSize: 15 * 1024 * 1024,
  },
});

/* =====================================================
   DOCTOR VERIFICATION DOCUMENTS

   resource_type: auto
   يسمح برفع الصور وملفات PDF.
===================================================== */

const uploadDoctorDocsStorage =
  createStorage(
    "Emora_Doctor_Documents",
    "auto",
    [
      "jpg",
      "jpeg",
      "png",
      "pdf",
    ]
  );

const uploadDoctorDocs = multer({
  storage: uploadDoctorDocsStorage,

  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 7,
  },
}).fields([
  {
    name: "nationalIdFront",
    maxCount: 1,
  },

  {
    name: "nationalIdBack",
    maxCount: 1,
  },

  {
    name: "practiceLicense",
    maxCount: 1,
  },

  {
    name: "syndicateCard",
    maxCount: 1,
  },

  {
    name: "graduationCertificate",
    maxCount: 1,
  },

  {
    name: "specializationCertificate",
    maxCount: 1,
  },

  {
    name: "selfie",
    maxCount: 1,
  },
]);

module.exports = {
  cloudinary,
  uploadProfile,
  uploadDrawings,
  uploadVoices,
  uploadDoctorDocs,
};

