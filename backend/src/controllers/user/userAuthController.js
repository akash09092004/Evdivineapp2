const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../../models/user/User');
const { issueToken } = require('../../services/jwtService');
const { generateToken } = require('../../utils/generateToken');
const { asyncHandler } = require('../../utils/asyncHandler');
const AppError = require('../../utils/AppError');
const { sendResponse } = require('../../utils/responseHandler');
const { ROLES } = require('../../utils/constants');
const { sendOtp, verifyOtp } = require('../../services/otpService');

const ensureReferralCode = (seed) => `REF${String(seed || '').slice(-6)}${Math.random().toString(36).slice(2, 5).toUpperCase()}`;

const issueRefreshToken = (entity) => generateToken({
  id: entity._id.toString(),
  role: entity.role,
  phone: entity.phone || entity.mobile,
  email: entity.email || undefined,
  tokenType: 'refresh'
}, { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d' });

const sanitizeUser = (user) => {
  if (!user) return null;

  const plain = user.toObject ? user.toObject() : { ...user };
  delete plain.passwordHash;
  return plain;
};

const buildSessionData = (user) => ({
  token: issueToken(user),
  refreshToken: issueRefreshToken(user),
  user: sanitizeUser(user)
});

const maybeAttachDevOtp = (payload, otp) => {
  return payload;
};

const queueChatAccessRequest = async (user) => {
  user.chatAccessStatus = 'pending';
  user.chatAccessRequestedAt = new Date();
  user.chatAccessReviewedAt = undefined;
  user.chatAccessReviewedBy = undefined;
  user.chatAccessReason = '';
  return user;
};

const applyUserPatch = async (user, patch) => {
  Object.entries(patch).forEach(([key, value]) => {
    if (typeof value !== 'undefined') {
      user[key] = value;
    }
  });
  await user.save();
  return user;
};

const guestLogin = asyncHandler(async (req, res) => {
  const deviceId = req.body.deviceId || req.headers['x-device-id'];
  if (!deviceId) throw new AppError('deviceId is required', 400, 'DEVICE_ID_REQUIRED');

  let user = await User.findOne({ deviceId });
  if (!user) {
    user = await User.create({
      deviceId,
      name: 'Guest User',
      phone: '',
      email: '',
      language: 'en',
      fcmToken: '',
      guest: true,
      otpVerified: true,
      role: ROLES.USER,
      referralCode: ensureReferralCode(deviceId)
    });
  } else {
    user.guest = true;
    user.otpVerified = true;
    if (!user.referralCode) user.referralCode = ensureReferralCode(deviceId);
    await user.save();
  }

  return sendResponse(res, { message: 'Guest login successful', data: buildSessionData(user) });
});

const register = asyncHandler(async (req, res) => {
  const { name, email, phone, password, gender = '' } = req.body;

  if (!name || !email || !phone || !password) {
    throw new AppError('name, email, phone and password are required', 400, 'VALIDATION_ERROR');
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  const normalizedPhone = String(phone).trim();
  const trimmedName = String(name).trim();
  const existing = await User.findOne({
    $or: [{ email: normalizedEmail }, { phone: normalizedPhone }]
  });

  if (existing && existing.otpVerified) {
    throw new AppError('This account already exists. Please login instead.', 409, 'ACCOUNT_EXISTS');
  }

  const passwordHash = await bcrypt.hash(String(password), 10);
  const referralCode = existing?.referralCode || ensureReferralCode(normalizedPhone || normalizedEmail);
  const normalizedGender = String(gender || '').trim().toLowerCase();

  let user;
  if (existing) {
    user = await applyUserPatch(existing, {
      name: trimmedName,
      email: normalizedEmail,
      phone: normalizedPhone,
      gender: normalizedGender,
      passwordHash,
      guest: false,
      otpVerified: false,
      referralCode
    });
  } else {
    user = await User.create({
      name: trimmedName,
      email: normalizedEmail,
      phone: normalizedPhone,
      gender: normalizedGender,
      passwordHash,
      guest: false,
      otpVerified: false,
      role: ROLES.USER,
      referralCode
    });
  }

  const { otp, expiresAt } = await sendOtp({ email: normalizedEmail, purpose: 'signup' });

  return sendResponse(res, {
    message: 'Account created. Please verify the OTP sent to your email.',
    data: maybeAttachDevOtp({
      nextStep: 'verify-otp',
      email: normalizedEmail,
      expiresAt,
      user: sanitizeUser(user)
    }, otp)
  });
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new AppError('Email and password are required', 400, 'VALIDATION_ERROR');
  }

  const normalizedEmail = String(email).trim().toLowerCase();

  const adminEmail = String(process.env.ADMIN_LOGIN_EMAIL || 'admin@example.com').trim().toLowerCase();
  const adminPassword = String(process.env.ADMIN_LOGIN_PASSWORD || 'Admin@123');
  if (normalizedEmail === adminEmail && String(password) === adminPassword) {
    const admin = {
      _id: 'local-admin',
      email: adminEmail,
      name: process.env.ADMIN_LOGIN_NAME || 'Admin',
      role: ROLES.ADMIN,
      isActive: true
    };

    return sendResponse(res, {
      message: 'Login successful',
      data: {
        token: issueToken(admin),
        refreshToken: '',
        user: admin,
        admin
      }
    });
  }

  const user = await User.findOne({ email: normalizedEmail });

  if (!user || !user.passwordHash) {
    throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
  }

  const ok = await bcrypt.compare(String(password), user.passwordHash);
  if (!ok) {
    throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
  }

  if (!user.otpVerified) {
    const { otp, expiresAt } = await sendOtp({ email: user.email, purpose: 'login' });
    return sendResponse(res, {
      statusCode: 403,
      success: false,
      message: 'OTP verification required before login',
      data: maybeAttachDevOtp({
        nextStep: 'verify-otp',
        otpRequired: true,
        email: user.email,
        expiresAt
      }, otp)
    });
  }

  return sendResponse(res, {
    message: 'Login successful',
    data: buildSessionData(user)
  });
});

const verifyOtpForUser = asyncHandler(async (req, res) => {
  const { email, otp, purpose = 'login' } = req.body;

  if (!email || !otp) {
    throw new AppError('email and otp are required', 400, 'VALIDATION_ERROR');
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  const user = await User.findOne({ email: normalizedEmail });

  if (!user) {
    throw new AppError('User not found', 404, 'USER_NOT_FOUND');
  }

  if (user.otpVerified) {
    return sendResponse(res, {
      message: 'OTP already verified',
      data: buildSessionData(user)
    });
  }

  const ok = await verifyOtp({ email: normalizedEmail, purpose, otp });
  const fallbackPurpose =
    purpose === 'signup' ? 'login' : purpose === 'login' ? 'signup' : null;
  const fallbackOk =
    !ok && fallbackPurpose
      ? await verifyOtp({ email: normalizedEmail, purpose: fallbackPurpose, otp })
      : false;
  if (!ok && !fallbackOk) {
    throw new AppError('Invalid or expired OTP', 400, 'OTP_INVALID');
  }

  user.otpVerified = true;
  user.guest = false;
  if (email && !user.email) {
    user.email = String(email).trim().toLowerCase();
  }

  if (purpose === 'signup') {
    await queueChatAccessRequest(user);
  }

  await user.save();

  return sendResponse(res, {
    message: 'OTP verified successfully',
    data: buildSessionData(user)
  });
});

const resendOtp = asyncHandler(async (req, res) => {
  const { email, purpose = 'login' } = req.body;

  if (!email) {
    throw new AppError('email is required', 400, 'VALIDATION_ERROR');
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  const user = await User.findOne({ email: normalizedEmail });

  if (!user) {
    throw new AppError('User not found', 404, 'USER_NOT_FOUND');
  }

  const { otp, expiresAt } = await sendOtp({ email: normalizedEmail, purpose });

  return sendResponse(res, {
    message: 'OTP sent successfully',
    data: maybeAttachDevOtp({
      email: normalizedEmail,
      purpose,
      expiresAt
    }, otp)
  });
});

const checkEmail = asyncHandler(async (req, res) => {
  const email = String(req.query.email || '').trim().toLowerCase();

  if (!email) {
    throw new AppError('email is required', 400, 'VALIDATION_ERROR');
  }

  const user = await User.findOne({ email });

  return sendResponse(res, {
    message: 'Email checked',
    data: {
      exists: Boolean(user),
      otpVerified: Boolean(user?.otpVerified)
    }
  });
});

const checkPhone = asyncHandler(async (req, res) => {
  const phone = String(req.query.phone || '').trim();

  if (!phone) {
    throw new AppError('phone is required', 400, 'VALIDATION_ERROR');
  }

  const user = await User.findOne({ phone });

  return sendResponse(res, {
    message: 'Phone checked',
    data: {
      exists: Boolean(user),
      otpVerified: Boolean(user?.otpVerified)
    }
  });
});

const logout = asyncHandler(async (req, res) => {
  return sendResponse(res, { message: 'Logged out' });
});

const refreshToken = asyncHandler(async (req, res) => {
  const incoming = req.body.refreshToken || req.headers['x-refresh-token'] || req.headers.authorization?.replace('Bearer ', '');
  if (!incoming) throw new AppError('Refresh token is required', 400, 'REFRESH_TOKEN_REQUIRED');
  let decoded;
  try {
    decoded = jwt.verify(incoming, process.env.JWT_SECRET);
  } catch (error) {
    throw new AppError('Invalid or expired refresh token', 401, 'REFRESH_TOKEN_INVALID');
  }
  if (decoded.role !== ROLES.USER || decoded.tokenType !== 'refresh') {
    throw new AppError('Invalid refresh token', 401, 'REFRESH_TOKEN_INVALID');
  }
  const user = await User.findById(decoded.id);
  if (!user) throw new AppError('User not found', 404, 'USER_NOT_FOUND');
  return sendResponse(res, {
    message: 'Token refreshed',
    data: buildSessionData(user)
  });
});

const deleteAccount = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndDelete(req.auth.id);
  if (!user) throw new AppError('User not found', 404, 'USER_NOT_FOUND');
  return sendResponse(res, { message: 'Account deleted' });
});

module.exports = {
  register,
  login,
  verifyOtpForUser,
  resendOtp,
  checkEmail,
  checkPhone,
  refreshToken,
  guestLogin,
  logout,
  deleteAccount
};
