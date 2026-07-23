const Notification = require('../../models/common/Notification');
const { asyncHandler } = require('../../utils/asyncHandler');
const { sendResponse } = require('../../utils/responseHandler');
const AppError = require('../../utils/AppError');

const listNotifications = asyncHandler(async (req, res) => {
  const rows = await Notification.find({ recipientType: 'user', recipient: req.auth.id }).sort({ createdAt: -1 }).lean();
  sendResponse(res, { data: rows });
});

const markRead = asyncHandler(async (req, res) => {
  const ids = Array.isArray(req.body.ids) ? req.body.ids : [];
  const filter = { recipientType: 'user', recipient: req.auth.id };
  if (ids.length) {
    filter._id = { $in: ids };
  } else {
    filter.isRead = false;
  }
  const result = await Notification.updateMany(filter, { isRead: true });
  sendResponse(res, { message: 'Notifications marked as read', data: { modifiedCount: result.modifiedCount || 0 } });
});

const deleteNotification = asyncHandler(async (req, res) => {
  const notification = await Notification.findOneAndDelete({
    _id: req.params.id,
    recipientType: 'user',
    recipient: req.auth.id
  });
  if (!notification) throw new AppError('Notification not found', 404, 'NOTIFICATION_NOT_FOUND');
  sendResponse(res, { message: 'Notification deleted' });
});

module.exports = { listNotifications, markRead, deleteNotification };
