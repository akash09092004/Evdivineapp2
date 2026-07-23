const { initializeFirebase, admin } = require('../config/firebase');
const Notification = require('../models/common/Notification');
const { getIO } = require('../sockets/socket');

const roomName = (recipientType, recipientId) => `${recipientType}:${recipientId}`;

const sendPushNotification = async ({ token, title, body, data = {} }) => {
  const app = initializeFirebase();
  if (!app || !token) return { skipped: true };
  return admin.messaging().send({
    token,
    notification: { title, body },
    data: Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v)]))
  });
};

const createNotification = async ({
  recipientType,
  recipient,
  title,
  body,
  type = 'general',
  meta = {},
  bookingId = null,
  token = '',
}) => {
  const notification = await Notification.create({
    recipientType,
    recipient,
    title,
    body,
    type,
    meta,
    bookingId,
  });

  const io = getIO();
  if (io) {
    io.to(roomName(recipientType, recipient)).emit('notification:new', notification);
  }

  if (token) {
    await sendPushNotification({ token, title, body, data: { type, ...meta } });
  }

  return notification;
};

module.exports = { sendPushNotification, createNotification };
