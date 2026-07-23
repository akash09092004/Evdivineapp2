const mongoose = require('mongoose');
const User = require('../../models/user/User');
const { asyncHandler } = require('../../utils/asyncHandler');
const AppError = require('../../utils/AppError');
const { sendResponse } = require('../../utils/responseHandler');

const normalizeVerificationValue = (value) => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value === 1;
  const normalized = String(value ?? '').trim().toLowerCase();
  if (['true', '1', 'yes', 'verified', 'on'].includes(normalized)) return true;
  if (['false', '0', 'no', 'unverified', 'off'].includes(normalized)) return false;
  return null;
};

const serializeUser = (doc) => {
  if (!doc) return null;
  const user = typeof doc.toObject === 'function' ? doc.toObject() : { ...doc };
  return {
    ...user,
    status: user.status || (user.isBlocked ? 'blocked' : 'active'),
    verificationStatus: user.otpVerified ? 'verified' : 'unverified'
  };
};

const findUserOrThrow = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError('Invalid user id', 400, 'VALIDATION_ERROR');
  }

  const user = await User.findById(id);
  if (!user) {
    throw new AppError('User not found', 404, 'USER_NOT_FOUND');
  }

  return user;
};

const listUsers = asyncHandler(async (req, res) => {
  if (mongoose.connection.readyState !== 1) {
    sendResponse(res, { data: [] });
    return;
  }

  const rows = await User.find({}).sort({ createdAt: -1 }).lean();
  sendResponse(res, { data: rows.map((row) => serializeUser(row)) });
});

const blockUser = asyncHandler(async (req, res) => {
  const user = await findUserOrThrow(req.params.id);
  user.isBlocked = true;
  user.status = 'blocked';
  await user.save();
  sendResponse(res, { message: 'User blocked', data: serializeUser(user) });
});

const unblockUser = asyncHandler(async (req, res) => {
  const user = await findUserOrThrow(req.params.id);
  user.isBlocked = false;
  user.status = 'active';
  await user.save();
  sendResponse(res, { message: 'User unblocked', data: serializeUser(user) });
});

const updateUserStatus = asyncHandler(async (req, res) => {
  const user = await findUserOrThrow(req.params.id);
  const nextStatus = String(req.body.status || req.body.value || req.body.accountStatus || '').trim().toLowerCase();

  if (!['active', 'inactive', 'blocked'].includes(nextStatus)) {
    throw new AppError('Invalid user status', 400, 'VALIDATION_ERROR');
  }

  user.status = nextStatus;
  user.isBlocked = nextStatus === 'blocked';
  await user.save();

  sendResponse(res, { message: 'User status updated', data: serializeUser(user) });
});

const updateUserVerification = asyncHandler(async (req, res) => {
  const user = await findUserOrThrow(req.params.id);
  const verified = normalizeVerificationValue(
    req.body.verification ?? req.body.verified ?? req.body.otpVerified ?? req.body.value
  );

  if (verified === null) {
    throw new AppError('Invalid verification value', 400, 'VALIDATION_ERROR');
  }

  user.otpVerified = verified;
  await user.save();

  sendResponse(res, { message: 'User verification updated', data: serializeUser(user) });
});

const deleteUser = asyncHandler(async (req, res) => {
  const user = await findUserOrThrow(req.params.id);
  await user.deleteOne();
  sendResponse(res, { message: 'User deleted' });
});

module.exports = {
  listUsers,
  blockUser,
  unblockUser,
  updateUserStatus,
  updateUserVerification,
  deleteUser
};
