const mongoose = require("mongoose");
const { SLOT_LOCK_STATUS } = require("../../utils/bookingConstants");

const schema = new mongoose.Schema(
  {
    lockNumber: { type: String, required: true, unique: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", required: true, index: true },
    slotPlanId: { type: mongoose.Schema.Types.ObjectId, ref: "SlotPlan", required: true, index: true },
    bookingId: { type: mongoose.Schema.Types.ObjectId, ref: "Booking", default: null, index: true },
    startAt: { type: Date, required: true, index: true },
    endAt: { type: Date, required: true, index: true },
    busyUntil: { type: Date, required: true, index: true },
    expiresAt: { type: Date, required: true, index: true },
    status: {
      type: String,
      enum: Object.values(SLOT_LOCK_STATUS),
      default: SLOT_LOCK_STATUS.ACTIVE,
      index: true,
    },
    idempotencyKey: { type: String, default: "", index: true },
    releasedAt: { type: Date, default: null },
    convertedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

schema.index(
  { adminId: 1, slotPlanId: 1, startAt: 1, status: 1 },
  { unique: true, partialFilterExpression: { status: SLOT_LOCK_STATUS.ACTIVE } }
);
schema.index({ expiresAt: 1, status: 1 });

module.exports = mongoose.model("SlotLock", schema);
