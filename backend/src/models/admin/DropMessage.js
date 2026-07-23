const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, default: '', trim: true, lowercase: true },
  phone: { type: String, default: '', trim: true },
  subject: { type: String, default: '', trim: true },
  message: { type: String, required: true, trim: true },
  status: { type: String, enum: ['new', 'read', 'archived', 'replied'], default: 'new' },
  note: { type: String, default: '' },
  reply: { type: String, default: '', trim: true },
  adminReply: { type: String, default: '', trim: true },
  replyMessage: { type: String, default: '', trim: true },
  response: { type: String, default: '', trim: true },
  replyAt: { type: Date, default: null },
  replyEmailSent: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('DropMessage', schema);
