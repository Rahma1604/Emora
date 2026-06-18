const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');


cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const createStorage = (folderName,resourceType) => {
  return new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: folderName, 
      resource_type:resourceType,
      allowed_formats:resourceType==='image' ? ['jpg', 'png', 'jpeg'] : ['mp3', 'wav', 'm4a', 'ogg'],

    },
  });
};

const uploadProfile = multer({ storage: createStorage('Emora_Profiles', 'image') });
const uploadDrawings = multer({ storage: createStorage('Emora_Children_Drawings', 'image') });
const uploadVoices = multer({ storage: createStorage('Emora_Children_Voices', 'video') });
const uploadDoctorDocsStorage = createStorage('Emora_Doctor_Documents', 'image');
const uploadDoctorDocs = multer({ storage: uploadDoctorDocsStorage }).fields([
    { name: 'nationalIdFront', maxCount: 1 },
    { name: 'nationalIdBack', maxCount: 1 },
    { name: 'syndicateCardFront', maxCount: 1 },
    { name: 'syndicateCardBack', maxCount: 1 },
    { name: 'graduationCertificate', maxCount: 1 },
    { name: 'practiceLicense', maxCount: 1 },
    { name: 'recentSelfie', maxCount: 1 }
]);
module.exports = { cloudinary, uploadProfile, uploadDrawings ,uploadVoices,uploadDoctorDocs};