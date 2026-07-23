const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  session: { type: mongoose.Schema.Types.ObjectId, ref: 'ChatSession', required: true, index: true },
  chatroomId: { type: String, default: '', index: true },
  bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', default: null, index: true },
  senderRole: { type: String, enum: ['user', 'admin'], required: true },
  senderId: { type: String, required: true, index: true },
  senderName: { type: String, default: '' },
  type: { type: String, enum: ['text', 'voice', 'image', 'file', 'system'], default: 'text' },
  text: { type: String, default: '' },
  messageType: { type: String, default: 'text' },
  message: { type: String, default: '' },
  isRead: { type: Boolean, default: false },
  readAt: { type: Date, default: null },
  mediaUrl: { type: String, default: '' },
  transcription: { type: String, default: '' },
  metadata: { type: Object, default: {} }
}, { timestamps: true });

schema.index({ session: 1, createdAt: 1 });
schema.index({ chatroomId: 1, createdAt: 1 });

module.exports = mongoose.model('ChatMessage', schema);
