const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  chatroomId: { type: String, required: true, unique: true, index: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  userId: { type: String, required: true, index: true },
  adminId: { type: String, default: '', index: true },
  hostId: { type: String, default: '', index: true },
  adminName: { type: String, default: '' },
  bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', default: null, index: true },
  bookingNumber: { type: String, default: '', index: true },
  slotPlanId: { type: mongoose.Schema.Types.ObjectId, ref: 'SlotPlan', default: null, index: true },
  scheduledStartAt: { type: Date, default: null },
  scheduledEndAt: { type: Date, default: null },
  actualStartedAt: { type: Date, default: null },
  actualEndedAt: { type: Date, default: null },
  durationMinutes: { type: Number, default: 0 },
  extensionMinutes: { type: Number, default: 0 },
  userJoinedAt: { type: Date, default: null },
  adminJoinedAt: { type: Date, default: null },
  endedBy: { type: String, default: '' },
  endReason: { type: String, default: '' },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'active', 'ended', 'scheduled', 'waiting', 'completed', 'cancelled', 'expired', 'waiting_for_admin', 'in_progress', 'ready'],
    default: 'pending',
    index: true
  },
  requestedAt: { type: Date, default: Date.now },
  approvedAt: { type: Date },
  rejectedAt: { type: Date },
  endedAt: { type: Date },
  rejectionReason: { type: String, default: '' },
  freeMinutes: { type: Number, default: 5 },
  lastMessageAt: { type: Date },
  startedAt: { type: Date },
  metadata: { type: Object, default: {} }
}, { timestamps: true });

schema.index({ user: 1, status: 1, createdAt: -1 });
schema.index({ chatroomId: 1, createdAt: -1 });

module.exports = mongoose.model('ChatSession', schema);
