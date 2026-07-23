const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const Admin = require('../../models/admin/Admin');
const { issueToken } = require('../../services/jwtService');
const { asyncHandler } = require('../../utils/asyncHandler');
const AppError = require('../../utils/AppError');
const { sendResponse } = require('../../utils/responseHandler');
const { ROLES } = require('../../utils/constants');

const getFallbackAdminCredentials = () => ({
  email: String(process.env.ADMIN_LOGIN_EMAIL || 'admin@example.com').trim().toLowerCase(),
  password: String(process.env.ADMIN_LOGIN_PASSWORD || 'Admin@123')
});

const buildFallbackAdmin = (email) => ({
  _id: 'local-admin',
  email,
  name: process.env.ADMIN_LOGIN_NAME || 'Admin',
  role: ROLES.ADMIN,
  isActive: true
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const normalizedEmail = String(email || '').trim().toLowerCase();
  const fallback = getFallbackAdminCredentials();

  if (!normalizedEmail || !password) {
    throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
  }

  const dbReady = mongoose.connection.readyState === 1;
  if (dbReady) {
    const admin = await Admin.findOne({ email: normalizedEmail });
    if (admin) {
      const ok = await bcrypt.compare(String(password), admin.passwordHash);
      if (!ok) throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
      admin.role = ROLES.ADMIN;
      sendResponse(res, { message: 'Login successful', data: { token: issueToken(admin), admin } });
      return;
    }
  }

  if (normalizedEmail === fallback.email && String(password) === fallback.password) {
    const admin = buildFallbackAdmin(fallback.email);
    sendResponse(res, { message: 'Login successful', data: { token: issueToken(admin), admin } });
    return;
  }

  throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
});

module.exports = { login };
