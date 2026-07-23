const mongoose = require("mongoose");
const User = require("../../models/user/User");
const ChatSession = require("../../models/chat/ChatSession");
const { asyncHandler } = require("../../utils/asyncHandler");
const AppError = require("../../utils/AppError");
const { sendResponse } = require("../../utils/responseHandler");
const { getIO } = require("../../sockets/socket");
const {
  clearRequestExpiry,
  resolvePendingRequest,
  sweepExpiredRequests,
} = require("../../services/chatRequestRealtimeService");
const { getChatFreeSeconds } = require("../../services/configService");

const buildChatroomId = (userId) => `chat_${String(userId)}_${Date.now()}`;
const getCurrentChatFreeMinutes = async () => {
  const freeSeconds = await getChatFreeSeconds();
  return Math.max(0, Math.round(Number(freeSeconds || 0) / 60));
};

const normalizeDecision = (value) => String(value || "").trim().toLowerCase();

const extractRequestId = (req) => {
  const bodyCandidates = [
    req.body?.id,
    req.body?.requestId,
    req.body?.userId,
    req.query?.id,
  ];
  const pathCandidates = String(req.path || "")
    .split("/")
    .map((part) => part.trim())
    .filter(Boolean);

  const candidates = [...pathCandidates, ...bodyCandidates];
  const matched = candidates.find((value) => mongoose.isValidObjectId(value));

  if (matched) {
    return matched;
  }

  return "";
};

const extractDecisionStatus = (req, fallbackStatus = "") => {
  const segments = String(req.path || "")
    .split("/")
    .map((part) => part.trim().toLowerCase())
    .filter(Boolean);

  if (segments.includes("reject")) return "rejected";
  if (segments.includes("approve") || segments.includes("accept")) return "approved";

  const bodyStatus = normalizeDecision(
    req.body?.status || req.body?.chatAccessStatus
  );
  if (bodyStatus === "approved" || bodyStatus === "rejected") {
    return bodyStatus;
  }

  return fallbackStatus;
};

const requireValidRequestId = (id) => {
  if (!mongoose.isValidObjectId(id)) {
    throw new AppError("Invalid chat access request id", 400, "INVALID_REQUEST_ID");
  }
  return id;
};

const readDecisionBody = (req, expectedStatus) => {
  const bodyStatus = normalizeDecision(
    req.body?.status || req.body?.chatAccessStatus
  );
  const status = bodyStatus || expectedStatus;
  if (status !== expectedStatus) {
    throw new AppError(
      `Invalid status for ${expectedStatus} endpoint`,
      400,
      "INVALID_REQUEST_STATUS"
    );
  }

  return {
    status,
    reason: String(req.body?.reason || "").trim(),
  };
};

const processDecision = async (req, res, expectedStatus) => {
  const requestId = requireValidRequestId(extractRequestId(req));
  const { reason } = readDecisionBody(req, expectedStatus);
  const nextStatus = extractDecisionStatus(req, expectedStatus);

  if (nextStatus !== expectedStatus) {
    throw new AppError(
      `Invalid status for ${expectedStatus} endpoint`,
      400,
      "INVALID_REQUEST_STATUS"
    );
  }

  const user = await updateStatus(requestId, expectedStatus, req.auth.id, reason);
  const freeMinutes = await getCurrentChatFreeMinutes();
  let session = await ChatSession.findOne({
    user: user._id,
    status: { $in: ["pending", "approved", "active"] },
  }).sort({ createdAt: -1 });

  if (!session) {
    session = await ChatSession.create({
      chatroomId: buildChatroomId(user._id),
      user: user._id,
      userId: String(user._id),
      hostId: String(req.auth.id || ""),
      adminId: String(req.auth.id || ""),
      adminName: req.auth.name || "Admin",
      status: expectedStatus,
      approvedAt: expectedStatus === "approved" ? new Date() : undefined,
      rejectedAt: expectedStatus === "rejected" ? new Date() : undefined,
      rejectionReason: expectedStatus === "rejected" ? reason : "",
      requestedAt: user.chatAccessRequestedAt || new Date(),
      freeMinutes,
      startedAt: expectedStatus === "approved" ? new Date() : undefined,
    });
  } else {
    if (!session.chatroomId) session.chatroomId = buildChatroomId(user._id);
    session.userId = session.userId || String(user._id);
    session.hostId = String(req.auth.id || "");
    session.adminId = String(req.auth.id || "");
    session.adminName = req.auth.name || "Admin";
    session.status = expectedStatus;
    session.approvedAt = expectedStatus === "approved" ? new Date() : session.approvedAt;
    session.rejectedAt = expectedStatus === "rejected" ? new Date() : session.rejectedAt;
    session.rejectionReason = expectedStatus === "rejected" ? reason : "";
    session.freeMinutes = freeMinutes;
    session.startedAt =
      expectedStatus === "approved" ? session.startedAt || new Date() : session.startedAt;
    await session.save();
  }

  clearRequestExpiry(session._id);
  const io = getIO();
  if (io) {
    await resolvePendingRequest({
      sessionId: session._id,
      io,
      status: expectedStatus,
      reason: expectedStatus === "rejected" ? reason : "",
    });
    io.to(`user:${user._id.toString()}`).emit("chat:access-updated", {
      status: expectedStatus,
      reason: expectedStatus === "rejected" ? reason : "",
      session: session.toObject(),
    });
    io.to(`chatroom:${session.chatroomId}`).emit("chat:session-updated", {
      status: expectedStatus,
      reason: expectedStatus === "rejected" ? reason : "",
      session: session.toObject(),
    });
  }

  return res.status(200).json(
    buildDecisionResponse(
      expectedStatus === "approved" ? "Chat access approved" : "Chat access rejected",
      user,
      session
    )
  );
};

const baseProjection = {
  name: 1,
  email: 1,
  phone: 1,
  otpVerified: 1,
  chatAccessStatus: 1,
  chatAccessRequestedAt: 1,
  chatAccessReviewedAt: 1,
  chatAccessReviewedBy: 1,
  chatAccessReason: 1,
  createdAt: 1,
  updatedAt: 1,
};

const listRequests = asyncHandler(async (req, res) => {
  const io = getIO();
  const status = String(req.query.status || "pending").toLowerCase();
  const allowed = ["pending", "approved", "rejected", "none", "all"];
  if (!allowed.includes(status)) {
    throw new AppError("Invalid status filter", 400, "VALIDATION_ERROR");
  }

  if (io) {
    // Opportunistically expire stale requests before returning the list.
    // This keeps the admin queue clean even if the server was restarted.
    await sweepExpiredRequests(io);
  }

  const filter = status === "all" ? {} : { chatAccessStatus: status };
  const requests = await User.find(filter)
    .sort({ updatedAt: -1 })
    .select(baseProjection)
    .lean();

  return sendResponse(res, {
    data: {
      requests,
      count: requests.length,
    },
  });
});

const updateStatus = async (userId, nextStatus, reviewedBy, reason = "") => {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError("User not found", 404, "USER_NOT_FOUND");
  }

  user.chatAccessStatus = nextStatus;
  user.chatAccessReviewedAt = new Date();
  user.chatAccessReviewedBy = mongoose.isValidObjectId(reviewedBy)
    ? reviewedBy
    : undefined;
  user.chatAccessReason = reason;
  await user.save();
  return user;
};

const buildDecisionResponse = (message, user, session) => ({
  success: true,
  message,
  request: user.toObject(),
  session: session.toObject(),
  data: {
    request: user.toObject(),
    session: session.toObject(),
  },
});

const approveRequest = asyncHandler(async (req, res) => {
  console.log(
    "[adminChatAccess] approveRequest hit",
    req.method,
    req.originalUrl,
    req.params.id || req.body?.id || req.body?.requestId || req.body?.userId
  );
  return processDecision(req, res, "approved");
});

const rejectRequest = asyncHandler(async (req, res) => {
  console.log(
    "[adminChatAccess] rejectRequest hit",
    req.method,
    req.originalUrl,
    req.params.id || req.body?.id || req.body?.requestId || req.body?.userId
  );
  return processDecision(req, res, "rejected");
});

const handleDecisionRoute = asyncHandler(async (req, res) => {
  const path = String(req.path || "")
    .split("/")
    .map((part) => part.trim().toLowerCase())
    .filter(Boolean);

  if (path.includes("reject") || normalizeDecision(req.body?.status || req.body?.chatAccessStatus) === "rejected") {
    return processDecision(req, res, "rejected");
  }

  if (path.includes("approve") || path.includes("accept") || normalizeDecision(req.body?.status || req.body?.chatAccessStatus) === "approved") {
    return processDecision(req, res, "approved");
  }

  throw new AppError("Unsupported chat access action", 400, "INVALID_REQUEST_STATUS");
});

module.exports = { listRequests, approveRequest, rejectRequest, handleDecisionRoute };
