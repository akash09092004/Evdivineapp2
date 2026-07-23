const fs = require('fs');
const path = require('path');
const cloudinary = require('../config/cloudinary');
const { uploadBufferToCloudinary } = require('./uploadService');
const {
  ensureUploadsDir,
  toPublicFileUrl,
  toStoredUploadPath,
  removeStoredUpload,
} = require('./localUploadService');

const BLOG_FOLDER = 'evdivine/blogs';
const CATEGORY_FOLDER = 'evdivine/blog-categories';

const toImageObject = (result, altText = '') => ({
  url: result?.secure_url || result?.url || '',
  publicId: result?.public_id || '',
  altText: String(altText || '').trim(),
});

const getSafeFileExtension = (file = {}) => {
  const originalName = String(file?.originalname || '').trim();
  const mime = String(file?.mimetype || '').toLowerCase();
  const extFromName = path.extname(originalName).toLowerCase();

  if (extFromName && extFromName.length <= 6) {
    return extFromName;
  }

  if (mime.includes('png')) return '.png';
  if (mime.includes('webp')) return '.webp';
  if (mime.includes('gif')) return '.gif';
  if (mime.includes('jpg') || mime.includes('jpeg')) return '.jpg';
  if (mime.includes('avif')) return '.avif';

  return '.jpg';
};

const saveBufferLocally = async (file, { folder = BLOG_FOLDER, altText = '' } = {}) => {
  if (!file?.buffer) {
    return null;
  }

  const uploadsDir = ensureUploadsDir();
  const safeFolder = String(folder || BLOG_FOLDER).replace(/[^a-z0-9/_-]/gi, '');
  const relativeFolder = safeFolder.replace(/^\/+/, '');
  const destinationDir = path.join(uploadsDir, relativeFolder);

  if (!fs.existsSync(destinationDir)) {
    fs.mkdirSync(destinationDir, { recursive: true });
  }

  const fileName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${getSafeFileExtension(file)}`;
  const absolutePath = path.join(destinationDir, fileName);
  fs.writeFileSync(absolutePath, file.buffer);

  const publicPath = toStoredUploadPath(path.posix.join(relativeFolder, fileName));
  return {
    url: toPublicFileUrl(null, publicPath),
    publicId: publicPath,
    altText: String(altText || '').trim(),
  };
};

const uploadBlogImage = async (file, { folder = BLOG_FOLDER, altText = '' } = {}) => {
  if (!file?.buffer) {
    return null;
  }

  if ((process.env.NODE_ENV || 'development') !== 'production') {
    // Keep local development independent from Cloudinary/network flakiness.
    return saveBufferLocally(file, { folder, altText });
  }

  try {
    const result = await uploadBufferToCloudinary(file.buffer, folder);
    return toImageObject(result, altText);
  } catch (error) {
    return saveBufferLocally(file, { folder, altText });
  }
};

const deleteBlogImage = async (publicId) => {
  const id = String(publicId || '').trim();
  if (!id) return false;

  if (id.startsWith('/uploads/')) {
    return removeStoredUpload(id);
  }

  if (!cloudinary?.uploader?.destroy) {
    return false;
  }

  await cloudinary.uploader.destroy(id, { invalidate: true });
  return true;
};

module.exports = {
  BLOG_FOLDER,
  CATEGORY_FOLDER,
  uploadBlogImage,
  deleteBlogImage,
  toImageObject,
};
