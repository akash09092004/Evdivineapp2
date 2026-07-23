const mongoose = require("mongoose");
const {
  BOOKING_STATUS,
  PAYMENT_STATUS,
  PAYMENT_METHODS,
  CONSULTATION_TYPES,
  DEFAULTS,
} = require("../../utils/bookingConstants");

const priceSnapshotSchema = new mongoose.Schema(
  {
    planTitle: { type: String, default: "" },
    durationMinutes: { type: Number, default: 0 },
    breakMinutes: { type: Number, default: 0 },
    basePrice: { type: Number, default: 0 },
    offerPrice: { type: Number, default: 0 },
    finalAmount: { type: Number, default: 0 },
    currency: { type: String, default: DEFAULTS.CURRENCY },
  },
  { _id: false }
);

const schema = new mongoose.Schema(
  {
    bookingNumber: { type: String, required: true, unique: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", required: true, index: true },
    slotPlanId: { type: mongoose.Schema.Types.ObjectId, ref: "SlotPlan", required: true, index: true },
    slotLockId: { type: mongoose.Schema.Types.ObjectId, ref: "SlotLock", required: true },
    consultationType: {
      type: String,
      enum: [CONSULTATION_TYPES.CHAT],
      default: CONSULTATION_TYPES.CHAT,
      index: true,
    },
    startAt: { type: Date, required: true, index: true },
    endAt: { type: Date, required: true, index: true },
    busyUntil: { type: Date, required: true, index: true },
    durationMinutes: { type: Number, required: true },
    breakMinutes: { type: Number, default: 0 },
    basePrice: { type: Number, default: 0 },
    offerPrice: { type: Number, default: 0 },
    finalAmount: { type: Number, required: true },
    currency: { type: String, default: DEFAULTS.CURRENCY, uppercase: true, trim: true },
    paymentMethod: { type: String, enum: Object.values(PAYMENT_METHODS), required: true },
    paymentStatus: {
      type: String,
      enum: Object.values(PAYMENT_STATUS),
      default: PAYMENT_STATUS.PENDING,
      index: true,
    },
    bookingStatus: {
      type: String,
      enum: Object.values(BOOKING_STATUS),
      default: BOOKING_STATUS.PAYMENT_PENDING,
      index: true,
    },
    paymentId: { type: mongoose.Schema.Types.ObjectId, ref: "Payment", default: null, index: true },
    chatSessionId: { type: mongoose.Schema.Types.ObjectId, ref: "ChatSession", default: null, index: true },
    chatRoomId: { type: String, default: "", index: true },
    chatRoomStatus: { type: String, default: "scheduled" },
    priceSnapshot: { type: priceSnapshotSchema, default: () => ({}) },
    cancelledBy: { type: String, default: "" },
    cancellationReason: { type: String, default: "" },
    refundStatus: { type: String, default: "none" },
    refundedAmount: { type: Number, default: 0 },
    refundId: { type: mongoose.Schema.Types.ObjectId, ref: "Refund", default: null, index: true },
    reminderFlags: {
      oneHour: { type: Boolean, default: false },
      fifteenMinutes: { type: Boolean, default: false },
      fiveMinutes: { type: Boolean, default: false },
    },
    joinMeta: {
      userJoinedAt: { type: Date, default: null },
      adminJoinedAt: { type: Date, default: null },
      actualStartedAt: { type: Date, default: null },
      actualEndedAt: { type: Date, default: null },
      endedBy: { type: String, default: "" },
      endReason: { type: String, default: "" },
      extensionMinutes: { type: Number, default: 0 },
    },
    idempotencyKey: { type: String, default: "" },
    rawGatewayResponse: { type: Object, default: {} },
  },
  { timestamps: true }
);

schema.index({ userId: 1, bookingStatus: 1, createdAt: -1 });
schema.index({ adminId: 1, bookingStatus: 1, startAt: 1 });
schema.index({ slotLockId: 1 }, { unique: true });
schema.index({ idempotencyKey: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model("Booking", schema);
