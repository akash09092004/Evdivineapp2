const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  recipientType: { type: String, enum: ['user', 'admin'], required: true },
  recipient: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  title: { type: String, required: true },
  body: { type: String, required: true },
  type: { type: String, default: 'general' },
  bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', default: null, index: true },
  meta: { type: Object, default: {} },
  isRead: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Notification', schema);
