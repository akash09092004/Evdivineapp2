const User = require('../../models/user/User');
const Notification = require('../../models/common/Notification');
const { asyncHandler } = require('../../utils/asyncHandler');
const AppError = require('../../utils/AppError');
const { sendResponse } = require('../../utils/responseHandler');
const { createNotification } = require('../../services/notificationService');

const listNotifications = asyncHandler(async (req, res) => {
  const rows = await Notification.find({
    recipientType: 'admin',
    recipient: req.auth.id
  }).sort({ createdAt: -1 }).lean();

  return sendResponse(res, { data: rows });
});

const createAdminNotification = asyncHandler(async (req, res) => {
  const recipientType = String(req.body.recipientType || 'admin').toLowerCase();
  const recipient = String(req.body.recipient || req.auth.id || '').trim();
  const title = String(req.body.title || '').trim();
  const body = String(req.body.body || '').trim();
  const type = String(req.body.type || 'general').trim() || 'general';
  const meta = req.body.meta && typeof req.body.meta === 'object' ? req.body.meta : {};
  const token = String(req.body.token || '').trim();

  if (!title || !body) {
    throw new AppError('title and body are required', 400, 'NOTIFICATION_BODY_REQUIRED');
  }

  if (!recipient) {
    throw new AppError('recipient is required', 400, 'RECIPIENT_REQUIRED');
  }

  let pushToken = token;
  if (recipientType === 'user' && !pushToken) {
    const user = await User.findById(recipient).lean();
    if (!user) throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    pushToken = user.fcmToken || '';
  }

  const notification = await createNotification({
    recipientType,
    recipient,
    title,
    body,
    type,
    meta,
    token: pushToken
  });

  return sendResponse(res, {
    message: 'Notification created',
    data: notification.toObject()
  });
});

const markRead = asyncHandler(async (req, res) => {
  const ids = Array.isArray(req.body.ids) ? req.body.ids : [];
  const filter = { recipientType: 'admin', recipient: req.auth.id };
  if (ids.length) {
    filter._id = { $in: ids };
  } else {
    filter.isRead = false;
  }

  const result = await Notification.updateMany(filter, { isRead: true });
  return sendResponse(res, {
    message: 'Notifications marked as read',
    data: { modifiedCount: result.modifiedCount || 0 }
  });
});

const deleteNotification = asyncHandler(async (req, res) => {
  const notification = await Notification.findOneAndDelete({
    _id: req.params.id,
    recipientType: 'admin',
    recipient: req.auth.id
  });

  if (!notification) {
    throw new AppError('Notification not found', 404, 'NOTIFICATION_NOT_FOUND');
  }

  return sendResponse(res, { message: 'Notification deleted' });
});

module.exports = {
  listNotifications,
  createAdminNotification,
  markRead,
  deleteNotification
};
