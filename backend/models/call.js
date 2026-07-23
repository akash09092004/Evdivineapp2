const mongoose = require("mongoose");

const callSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    hostId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Host",
      required: true,
      index: true,
    },

    callType: {
      type: String,
      enum: ["audio", "video"],
      required: true,
    },

    status: {
      type: String,
      enum: ["requested", "ringing", "accepted", "ongoing", "ended", "rejected", "missed", "failed"],
      default: "requested",
    },

    initiatedBy: {
      type: String,
      enum: ["user", "host"],
      default: "user",
    },

    channelName: {
      type: String,
      default: "",
    },

    rtcToken: {
      type: String,
      default: "",
    },

    requestedAt: {
      type: Date,
      default: Date.now,
    },

    acceptedAt: {
      type: Date,
      default: null,
    },

    startedAt: {
      type: Date,
      default: null,
    },

    endedAt: {
      type: Date,
      default: null,
    },

    durationInSeconds: {
      type: Number,
      default: 0,
      min: 0,
    },

    chargePerMinute: {
      type: Number,
      default: 0,
      min: 0,
    },

    totalCoinsDeducted: {
      type: Number,
      default: 0,
      min: 0,
    },

    hostEarningCoins: {
      type: Number,
      default: 0,
      min: 0,
    },

    platformCommissionCoins: {
      type: Number,
      default: 0,
      min: 0,
    },

    endedBy: {
      type: String,
      enum: ["user", "host", "system", ""],
      default: "",
    },

    endReason: {
      type: String,
      enum: [
        "user_ended",
        "host_ended",
        "low_balance",
        "rejected",
        "missed",
        "network_error",
        "blocked",
        "system",
        "",
      ],
      default: "",
    },
  },
  { timestamps: true }
);

callSchema.index({ userId: 1, createdAt: -1 });
callSchema.index({ hostId: 1, createdAt: -1 });
callSchema.index({ status: 1 });
callSchema.index({ initiatedBy: 1, status: 1 });
callSchema.index({ channelName: 1 });

module.exports = mongoose.model("Call", callSchema);