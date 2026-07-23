const mongoose = require("mongoose");

const chatRoomSchema = new mongoose.Schema(
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

    status: {
      type: String,
      enum: ["requested", "accepted", "active", "ended"],
      default: "requested",
    },

    initiatedBy: {
      type: String,
      enum: ["user", "host"],
      default: "user",
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
    },

    chargePerMinute: {
      type: Number,
      default: 0,
    },

    totalCoinsDeducted: {
      type: Number,
      default: 0,
    },

    hostEarningCoins: {
      type: Number,
      default: 0,
    },

    platformCommissionCoins: {
      type: Number,
      default: 0,
    },

    lastMessage: {
      type: String,
      default: "",
    },

    lastMessageAt: {
      type: Date,
      default: null,
    },

    endedBy: {
      type: String,
      enum: ["user", "host", "system", ""],
      default: "",
    },

    endReason: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

chatRoomSchema.index({ userId: 1, updatedAt: -1 });
chatRoomSchema.index({ hostId: 1, updatedAt: -1 });

module.exports = mongoose.model("ChatRoom", chatRoomSchema);