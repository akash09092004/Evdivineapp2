const fs = require('fs');
const path = require('path');

const uploadsDir = path.resolve(__dirname, '..', '..', 'uploads');

const ensureUploadsDir = () => {
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  return uploadsDir;
};

const getRequestBaseUrl = (req) => {
  const proto = String(req?.headers?.['x-forwarded-proto'] || req?.protocol || 'http').split(',')[0].trim();
  const host = String(req?.get?.('host') || req?.headers?.host || 'localhost:5000').trim();
  return `${proto}://${host}`;
};

const getFallbackBaseUrl = () => {
  const envBase =
    process.env.PUBLIC_URL ||
    process.env.API_BASE_URL ||
    '';

  if (envBase) {
    return String(envBase).replace(/\/$/, '');
  }

  if ((process.env.NODE_ENV || 'development') !== 'production') {
    return 'http://localhost:5000';
  }

  if (process.env.CLIENT_URL) {
    return String(process.env.CLIENT_URL).replace(/\/$/, '');
  }

  return 'http://localhost:5000';
};

const toPublicFileUrl = (req, value) => {
  const filePath = String(value || '').trim();
  if (!filePath) return '';
  if (/^https?:\/\//i.test(filePath)) return filePath;
  const baseUrl = req ? getRequestBaseUrl(req) : getFallbackBaseUrl();
  if (filePath.startsWith('/uploads/')) return `${baseUrl}${filePath}`;
  if (filePath.startsWith('uploads/')) return `${baseUrl}/${filePath}`;
  return filePath;
};

const toStoredUploadPath = (filename) => `/uploads/${String(filename || '').replace(/^\/+/, '')}`;

const removeStoredUpload = (value) => {
  const filePath = String(value || '').trim();
  if (!filePath || /^https?:\/\//i.test(filePath) || !filePath.startsWith('/uploads/')) return false;

  const absolutePath = path.resolve(uploadsDir, filePath.replace('/uploads/', ''));
  if (!absolutePath.startsWith(uploadsDir)) return false;
  if (fs.existsSync(absolutePath)) {
    fs.unlinkSync(absolutePath);
    return true;
  }
  return false;
};

module.exports = {
  ensureUploadsDir,
  toPublicFileUrl,
  toStoredUploadPath,
  removeStoredUpload
};
