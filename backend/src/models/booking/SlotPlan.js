const mongoose = require("mongoose");
const { CONSULTATION_TYPES, DEFAULTS } = require("../../utils/bookingConstants");

const schema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    consultationType: {
      type: String,
      enum: [CONSULTATION_TYPES.CHAT],
      default: CONSULTATION_TYPES.CHAT,
      index: true,
    },
    durationMinutes: { type: Number, required: true, min: 1 },
    breakMinutes: { type: Number, default: DEFAULTS.DEFAULT_BREAK_MINUTES, min: 0 },
    basePrice: { type: Number, required: true, min: 0.01 },
    offerPrice: { type: Number, required: true, min: 0.0 },
    currency: { type: String, default: DEFAULTS.CURRENCY, uppercase: true, trim: true },
    isPopular: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true, index: true },
    deletedAt: { type: Date, default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", required: true },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", default: null },
  },
  { timestamps: true }
);

schema.index({ consultationType: 1, isActive: 1, deletedAt: 1 });
schema.index({ title: 1, consultationType: 1 }, { unique: true, partialFilterExpression: { deletedAt: null } });

module.exports = mongoose.model("SlotPlan", schema);
