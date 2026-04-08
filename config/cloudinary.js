const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const createStorage = (folderName) => {
  return new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: folderName, 
      allowed_formats: ['jpg', 'png', 'jpeg']
    },
  });
};

const uploadProfile = multer({ storage: createStorage('Emora_Profiles') });
const uploadDrawings = multer({ storage: createStorage('Emora_Children_Drawings') });

module.exports = { cloudinary, uploadProfile, uploadDrawings };