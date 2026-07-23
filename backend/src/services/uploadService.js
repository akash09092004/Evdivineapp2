const cloudinary = require('../config/cloudinary');
const AppError = require('../utils/AppError');

const uploadBufferToCloudinary = async (buffer, folder = 'astrology-app') => {
  if (!cloudinary?.uploader) throw new AppError('Cloudinary not configured', 500, 'CLOUDINARY_NOT_CONFIGURED');
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream({ folder, resource_type: 'auto' }, (error, result) => {
      if (error) return reject(error);
      resolve(result);
    });
    stream.end(buffer);
  });
};

module.exports = { uploadBufferToCloudinary };

