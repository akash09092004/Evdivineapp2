const mongoose = require("mongoose");
const User = require("../../models/user/User");
const Booking = require("../../models/booking/Booking");
const ChatSession = require("../../models/chat/ChatSession");
const ChatMessage = require("../../models/chat/ChatMessage");
const { asyncHandler } = require("../../utils/asyncHandler");
const AppError = require("../../utils/AppError");
const { sendResponse } = require("../../utils/responseHandler");
const {
  getChatFreeSeconds,
  getSessionRate,
} = require("../../services/configService");
const { debitWallet } = require("../../services/walletService");
const { getIO } = require("../../sockets/socket");
const {
  cancelPendingRequest,
  emitRequestEvent,
  scheduleRequestExpiry,
} = require("../../services/chatRequestRealtimeService");
const {
  toPublicFileUrl,
  toStoredUploadPath,
} = require("../../services/localUploadService");

const buildChatroomId = (userId) => `chat_${String(userId)}_${Date.now()}`;
const fallbackChatroomId = (sessionId) => `chat_${String(sessionId)}`;
const getCurrentChatFreeMinutes = async () => {
  const freeSeconds = await getChatFreeSeconds();
  return Math.max(0, Math.round(Number(freeSeconds || 0) / 60));
};

const getSessionLookupQuery = (identifier, userId) => {
  const trimmed = String(identifier || "").trim();
  const or = [{ chatroomId: trimmed }];
  if (mongoose.isValidObjectId(trimmed)) {
    or.unshift({ _id: trimmed });
  }
  const query = { user: userId, $or: or };
  return query;
};

const sessionProjection = {
  chatroomId: 1,
  user: 1,
  userId: 1,
  adminId: 1,
  hostId: 1,
  adminName: 1,
  status: 1,
  requestedAt: 1,
  approvedAt: 1,
  rejectedAt: 1,
  endedAt: 1,
  rejectionReason: 1,
  freeMinutes: 1,
  lastMessageAt: 1,
  startedAt: 1,
  createdAt: 1,
  updatedAt: 1,
};

const ensureChatAllowed = async (userId) => {
  const user = await User.findById(userId);
  if (!user) throw new AppError("User not found", 404, "USER_NOT_FOUND");
  if (!["approved", "pending"].includes(user.chatAccessStatus)) {
    throw new AppError(
      "Chat access is not approved yet",
      403,
      "CHAT_ACCESS_NOT_APPROVED"
    );
  }
  return user;
};

const serializeMessage = (message) => ({
  ...message,
  id: message._id?.toString?.() || message.id,
});

const serializeUpload = (req, file) => {
  const storedPath = toStoredUploadPath(file?.filename || "");
  return {
    fileName: file?.originalname || file?.filename || "",
    mimeType: file?.mimetype || "",
    size: Number(file?.size || 0),
    mediaUrl: toPublicFileUrl(req, storedPath),
    storedPath,
  };
};

const getSessionStartTime = (session) => {
  const start =
    session?.startedAt ||
    session?.approvedAt ||
    session?.requestedAt ||
    session?.createdAt;
  const startDate = new Date(start || Date.now());
  if (Number.isNaN(startDate.getTime())) {
    return new Date();
  }
  return startDate;
};

const buildChatBilling = async (session) => {
  const freeSeconds = await getChatFreeSeconds();
  const ratePerMinute = await getSessionRate("chat");
  const sessionStart = getSessionStartTime(session);
  const elapsedSeconds = Math.max(
    0,
    Math.floor((Date.now() - sessionStart.getTime()) / 1000)
  );
  const remainingFreeSeconds = Math.max(0, freeSeconds - elapsedSeconds);
  const requiresWallet = elapsedSeconds >= freeSeconds;
  const chargeAmount = Math.max(Number(ratePerMinute || 0), 1);

  return {
    freeSeconds,
    ratePerMinute,
    elapsedSeconds,
    remainingFreeSeconds,
    requiresWallet,
    chargeAmount,
  };
};

const requestChat = asyncHandler(async (req, res) => {
  const user = await User.findById(req.auth.id);
  if (!user) throw new AppError("User not found", 404, "USER_NOT_FOUND");
  const reason = String(req.body.reason || "").trim();
  const freeMinutes = await getCurrentChatFreeMinutes();

  user.chatAccessStatus = "pending";
  user.chatAccessRequestedAt = new Date();
  user.chatAccessReason = reason;
  await user.save();

  let session = await ChatSession.findOne({
    user: user._id,
    status: { $in: ["pending", "approved", "active"] },
  }).sort({ createdAt: -1 });

  let shouldNotifyAdmins = false;
  if (!session) {
    session = await ChatSession.create({
      chatroomId: buildChatroomId(user._id),
      user: user._id,
      userId: String(user._id),
      hostId: "",
      status: "pending",
      requestedAt: new Date(),
      freeMinutes,
      metadata: {
        requestReason: reason,
      },
    });
    shouldNotifyAdmins = true;
  } else if (session.status === "rejected") {
    session.status = "pending";
    session.requestedAt = new Date();
    session.rejectionReason = "";
    session.freeMinutes = freeMinutes;
    session.metadata = {
      ...(session.metadata || {}),
      requestReason: reason,
    };
    if (!session.chatroomId) session.chatroomId = buildChatroomId(user._id);
    session.userId = session.userId || String(user._id);
    await session.save();
    shouldNotifyAdmins = true;
  }

  const io = getIO();
  if (io && shouldNotifyAdmins) {
    await emitRequestEvent({
      io,
      eventName: "chat:request:new",
      session,
      user,
      status: "pending",
      reason,
    });
    scheduleRequestExpiry({ io, session, user });
  }

  return sendResponse(res, {
    message: "Chat request sent",
    data: {
      session: session.toObject(),
      chatAccessStatus: user.chatAccessStatus,
    },
  });
});

const cancelChatRequest = asyncHandler(async (req, res) => {
  const user = await User.findById(req.auth.id);
  if (!user) throw new AppError("User not found", 404, "USER_NOT_FOUND");

  const session = await ChatSession.findOne({
    user: user._id,
    status: "pending",
  }).sort({ createdAt: -1 });

  if (!session) {
    throw new AppError("Chat request not found", 404, "CHAT_REQUEST_NOT_FOUND");
  }

  session.status = "ended";
  session.endedAt = new Date();
  session.metadata = {
    ...(session.metadata || {}),
    requestStatus: "cancelled",
    requestEndedAt: new Date(),
  };
  await session.save();

  user.chatAccessStatus = "none";
  user.chatAccessRequestedAt = undefined;
  user.chatAccessReason = "";
  await user.save();

  const io = getIO();
  if (io) {
    await emitRequestEvent({
      io,
      eventName: "chat:request:cancelled",
      session,
      user,
      status: "cancelled",
      reason: String(req.body.reason || "Request cancelled").trim(),
    });
  }

  return sendResponse(res, {
    message: "Chat request cancelled",
    data: {
      session: session.toObject(),
      chatAccessStatus: user.chatAccessStatus,
    },
  });
});

const endMySession = asyncHandler(async (req, res) => {
  const identifier = String(req.params.sessionId || req.params.chatroomId || "").trim();
  if (!identifier) {
    throw new AppError("sessionId is required", 400, "VALIDATION_ERROR");
  }

  const session = await ChatSession.findOne(
    getSessionLookupQuery(identifier, req.auth.id)
  );

  if (!session) {
    throw new AppError("Chat session not found", 404, "CHAT_SESSION_NOT_FOUND");
  }

  if (["ended", "completed", "cancelled", "expired"].includes(session.status)) {
    return sendResponse(res, {
      message: "Chat session already ended",
      data: session.toObject(),
    });
  }

  const user = await User.findById(req.auth.id);
  if (!user) throw new AppError("User not found", 404, "USER_NOT_FOUND");

  const endedAt = new Date();
  const reason = String(req.body.reason || "Ended by user").trim();

  session.status = "ended";
  session.endedAt = endedAt;
  session.endedBy = "user";
  session.endReason = reason;
  session.metadata = {
    ...(session.metadata || {}),
    endedBy: "user",
    endedAt,
    endReason: reason,
  };
  await session.save();

  user.chatAccessStatus = "none";
  user.chatAccessRequestedAt = undefined;
  user.chatAccessReason = "";
  await user.save();

  const io = getIO();
  if (io) {
    io.to(`chatroom:${session.chatroomId}`).emit("chat:session-ended", {
      sessionId: String(session._id),
      chatRoomId: session.chatroomId,
      reason,
      endedBy: "user",
      endedAt,
    });
    io.to(`user:${String(req.auth.id)}`).emit("chat:session-ended", {
      sessionId: String(session._id),
      chatRoomId: session.chatroomId,
      reason,
      endedBy: "user",
      endedAt,
    });
  }

  return sendResponse(res, {
    message: "Chat session ended",
    data: {
      session: session.toObject(),
      chatAccessStatus: user.chatAccessStatus,
    },
  });
});

const myChatStatus = asyncHandler(async (req, res) => {
  const user = await User.findById(req.auth.id).lean();
  if (!user) throw new AppError("User not found", 404, "USER_NOT_FOUND");

  const session = await ChatSession.findOne({ user: user._id })
    .sort({ createdAt: -1 })
    .lean();
  const booking = session?.bookingId
    ? await Booking.findById(session.bookingId).populate("slotPlanId").lean()
    : null;
  const chatBilling = await buildChatBilling(session);

  return sendResponse(res, {
    data: {
      chatAccessStatus: user.chatAccessStatus,
      chatAccessReason: user.chatAccessReason || "",
      session: session || null,
      booking: booking || null,
      userName: user.name || "",
      walletBalance: Number(user.walletBalance || 0),
      chatBilling,
    },
  });
});

const listMySessions = asyncHandler(async (req, res) => {
  const sessions = await ChatSession.find({ user: req.auth.id })
    .sort({ createdAt: -1 })
    .lean();
  return sendResponse(res, { data: sessions });
});

const getMySessionMessages = asyncHandler(async (req, res) => {
  const identifier = req.params.sessionId || req.params.chatroomId;
  const session = await ChatSession.findOne(
    getSessionLookupQuery(identifier, req.auth.id)
  ).lean();
  if (!session)
    throw new AppError("Chat session not found", 404, "CHAT_SESSION_NOT_FOUND");

  const messages = await ChatMessage.find({ session: session._id })
    .sort({ createdAt: 1 })
    .lean();
  return sendResponse(res, { data: { session, messages } });
});

const sendMyMessage = asyncHandler(async (req, res) => {
  const {
    text = "",
    type = "text",
    mediaUrl = "",
    transcription = "",
    metadata = {},
  } = req.body;
  const identifier = req.params.sessionId || req.params.chatroomId;
  const session = await ChatSession.findOne(
    getSessionLookupQuery(identifier, req.auth.id)
  );
  if (!session)
    throw new AppError("Chat session not found", 404, "CHAT_SESSION_NOT_FOUND");
  if (!["approved", "active"].includes(session.status)) {
    throw new AppError("Chat is not active yet", 403, "CHAT_NOT_ACTIVE");
  }

  const trimmedText = String(text || "").trim();
  if (type === "text" && !trimmedText) {
    throw new AppError("Message text is required", 400, "VALIDATION_ERROR");
  }

  const user = await ensureChatAllowed(req.auth.id);
  const chatBilling = await buildChatBilling(session);
  if (chatBilling.requiresWallet) {
    const balance = Number(user.walletBalance || 0);
    if (balance < chatBilling.chargeAmount) {
      throw new AppError(
        "Insufficient wallet balance",
        402,
        "INSUFFICIENT_BALANCE"
      );
    }

    await debitWallet({
      ownerType: "user",
      ownerId: req.auth.id,
      amount: chatBilling.chargeAmount,
      type: "chat",
      reference: String(session._id),
      meta: {
        sessionId: String(session._id),
        chatroomId: String(session.chatroomId || ""),
        freeSeconds: chatBilling.freeSeconds,
        ratePerMinute: chatBilling.ratePerMinute,
        elapsedSeconds: chatBilling.elapsedSeconds,
      },
    });
  }

  const message = await ChatMessage.create({
    session: session._id,
    chatroomId: session.chatroomId || fallbackChatroomId(session._id),
    senderRole: "user",
    senderId: String(req.auth.id),
    senderName: user.name || "",
    type,
    text: trimmedText,
    mediaUrl,
    transcription,
    metadata,
  });

  session.status = session.status === "approved" ? "active" : session.status;
  session.startedAt = session.startedAt || new Date();
  session.lastMessageAt = new Date();
  if (!session.chatroomId) session.chatroomId = fallbackChatroomId(session._id);
  if (!session.userId) session.userId = String(user._id);
  await session.save();

  const io = getIO();
  if (io) {
    io.to(`chatroom:${session.chatroomId}`).emit("chat:new-message", {
      sessionId: String(session._id),
      chatroomId: session.chatroomId,
      message: message.toObject(),
    });
  }

  return sendResponse(res, {
    message: "Message sent",
    data: serializeMessage(message.toObject()),
  });
});

const uploadChatAttachment = asyncHandler(async (req, res) => {
  if (!req.file?.filename) {
    throw new AppError("File is required", 400, "FILE_REQUIRED");
  }

  return sendResponse(res, {
    message: "Upload successful",
    data: serializeUpload(req, req.file),
  });
});

module.exports = {
  requestChat,
  cancelChatRequest,
  myChatStatus,
  listMySessions,
  getMySessionMessages,
  sendMyMessage,
  endMySession,
  uploadChatAttachment,
};
