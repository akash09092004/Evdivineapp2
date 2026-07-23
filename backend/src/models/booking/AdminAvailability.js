const mongoose = require("mongoose");
const { DEFAULTS } = require("../../utils/bookingConstants");

const shiftSchema = new mongoose.Schema(
  {
    startTime: { type: String, required: true, trim: true },
    endTime: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const schema = new mongoose.Schema(
  {
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", required: true, index: true },
    dayOfWeek: { type: Number, required: true, min: 0, max: 6, index: true },
    isAvailable: { type: Boolean, default: true },
    shifts: { type: [shiftSchema], default: [] },
    timezone: { type: String, default: DEFAULTS.TIMEZONE },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", default: null },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", default: null },
  },
  { timestamps: true }
);

schema.index({ adminId: 1, dayOfWeek: 1 }, { unique: true });

module.exports = mongoose.model("AdminAvailability", schema);
