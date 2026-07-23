const User = require('../../models/user/User');
const { asyncHandler } = require('../../utils/asyncHandler');
const { sendResponse } = require('../../utils/responseHandler');
const AppError = require('../../utils/AppError');

const getAuthUserId = (req) =>
  req.auth?.id || req.auth?._id || req.auth?.userId || req.auth?.sub || '';

const sanitizeUser = (user) => {
  if (!user) return null;
  const plain = user.toObject ? user.toObject() : { ...user };
  delete plain.passwordHash;
  return plain;
};

const getMe = asyncHandler(async (req, res) => {
  const userId = getAuthUserId(req);
  if (!userId) throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');

  const user = await User.findById(userId).lean();
  if (!user) throw new AppError('User not found', 404, 'USER_NOT_FOUND');
  sendResponse(res, { data: sanitizeUser(user) });
});

const updateMe = asyncHandler(async (req, res) => {
  const userId = getAuthUserId(req);
  if (!userId) throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');

  const updated = await User.findByIdAndUpdate(userId, req.body, {
    new: true,
    runValidators: true
  }).lean();

  if (!updated) throw new AppError('User not found', 404, 'USER_NOT_FOUND');
  sendResponse(res, { message: 'Profile updated', data: sanitizeUser(updated) });
});
module.exports = { getMe, updateMe };
