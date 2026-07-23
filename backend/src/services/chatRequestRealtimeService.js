const mongoose = require("mongoose");
const ChatSession = require("../models/chat/ChatSession");
const User = require("../models/user/User");

const ADMIN_REQUEST_ROOM = "admin:all";
const REQUEST_EXPIRY_MS = Math.max(
  Number(process.env.CHAT_REQUEST_EXPIRY_MS || 10 * 60 * 1000),
  60 * 1000
);

const expiryTimers = new Map();

const asObject = (value) => {
  if (!value) return {};
  return typeof value.toObject === "function" ? value.toObject() : value;
};

const getUserImage = (user) => {
  const doc = asObject(user);
  return String(doc.profileImage || doc.image || doc.avatar || "");
};

const buildRequestPayload = ({ session, user, status, reason = "" }) => {
  const sessionDoc = asObject(session);
  const userDoc = asObject(user);

  return {
    id: String(sessionDoc._id || sessionDoc.id || ""),
    name: String(userDoc.name || ""),
    email: String(userDoc.email || ""),
    phone: String(userDoc.phone || ""),
    requestedAt:
      sessionDoc.requestedAt ||
      userDoc.chatAccessRequestedAt ||
      sessionDoc.createdAt ||
      null,
    reason: String(
      reason ||
        userDoc.chatAccessReason ||
        sessionDoc.rejectionReason ||
        sessionDoc.metadata?.requestReason ||
        ""
    ),
    image: getUserImage(userDoc),
    status: String(status || sessionDoc.status || "pending"),
  };
};

const emitToAdmins = (io, eventName, payload) => {
  if (!io) return payload;

  io.to(ADMIN_REQUEST_ROOM).emit(eventName, payload);
  return payload;
};

const clearRequestExpiry = (sessionId) => {
  const key = String(sessionId || "");
  const timer = expiryTimers.get(key);
  if (timer) {
    clearTimeout(timer);
    expiryTimers.delete(key);
  }
};

const markSessionInactive = async (sessionId, status, reason = "") => {
  const session = await ChatSession.findById(sessionId);
  if (!session || session.status !== "pending") {
    return null;
  }

  const user = await User.findById(session.user);
  if (!user) {
    return null;
  }

  session.status = "ended";
  session.endedAt = new Date();
  session.metadata = {
    ...(session.metadata || {}),
    requestStatus: status,
    requestReason: reason,
    requestEndedAt: new Date(),
  };
  await session.save();

  user.chatAccessStatus = "none";
  user.chatAccessReason = "";
  user.chatAccessRequestedAt = undefined;
  user.chatAccessReviewedAt = undefined;
  user.chatAccessReviewedBy = undefined;
  await user.save();

  clearRequestExpiry(sessionId);

  return { session, user };
};

const emitRequestEvent = async ({
  io,
  eventName,
  session,
  user,
  status,
  reason = "",
}) => {
  if (!session || !user) return null;

  const payload = buildRequestPayload({ session, user, status, reason });
  emitToAdmins(io, eventName, payload);
  return payload;
};

const scheduleRequestExpiry = ({ io, session, user }) => {
  const sessionDoc = asObject(session);
  const key = String(sessionDoc._id || "");
  if (!key) return;

  clearRequestExpiry(key);

  if (String(sessionDoc.status || "") !== "pending") {
    return;
  }

  const requestedAt = new Date(sessionDoc.requestedAt || Date.now());
  const expiresAt = new Date(requestedAt.getTime() + REQUEST_EXPIRY_MS);
  const delay = Math.max(0, expiresAt.getTime() - Date.now());

  const timer = setTimeout(async () => {
    try {
      const result = await markSessionInactive(
        key,
        "expired",
        "Request expired"
      );
      if (result) {
        await emitRequestEvent({
          io,
          eventName: "chat:request:expired",
          session: result.session,
          user: result.user,
          status: "expired",
          reason: "Request expired",
        });
      }
    } catch (error) {
      console.log(
        "[chatRequestRealtimeService] expire timer failed",
        error?.message || error
      );
    } finally {
      clearRequestExpiry(key);
    }
  }, delay);

  expiryTimers.set(key, timer);
};

const sweepExpiredRequests = async (io) => {
  if (mongoose.connection.readyState !== 1) return;
  const cutoff = new Date(Date.now() - REQUEST_EXPIRY_MS);
  const sessions = await ChatSession.find({
    status: "pending",
    requestedAt: { $lte: cutoff },
  }).lean();

  for (const staleSession of sessions) {
    try {
      const result = await markSessionInactive(
        staleSession._id,
        "expired",
        "Request expired"
      );
      if (result) {
        await emitRequestEvent({
          io,
          eventName: "chat:request:expired",
          session: result.session,
          user: result.user,
          status: "expired",
          reason: "Request expired",
        });
      }
    } catch (error) {
      console.log(
        "[chatRequestRealtimeService] sweep failed",
        error?.message || error
      );
    }
  }
};

const cancelPendingRequest = async ({
  sessionId,
  io,
  reason = "Request cancelled",
}) => {
  if (mongoose.connection.readyState !== 1) return null;
  const result = await markSessionInactive(sessionId, "cancelled", reason);
  if (!result) return null;

  await emitRequestEvent({
    io,
    eventName: "chat:request:cancelled",
    session: result.session,
    user: result.user,
    status: "cancelled",
    reason,
  });
  return result;
};

const resolvePendingRequest = async ({
  sessionId,
  io,
  status,
  reason = "",
}) => {
  if (mongoose.connection.readyState !== 1) return null;
  const session = await ChatSession.findById(sessionId);
  if (!session) return null;

  const user = await User.findById(session.user);
  if (!user) return null;

  clearRequestExpiry(sessionId);

  await emitRequestEvent({
    io,
    eventName:
      status === "approved" ? "chat:request:accepted" : "chat:request:rejected",
    session,
    user,
    status,
    reason,
  });
  return { session, user };
};

module.exports = {
  ADMIN_REQUEST_ROOM,
  REQUEST_EXPIRY_MS,
  buildRequestPayload,
  clearRequestExpiry,
  cancelPendingRequest,
  emitRequestEvent,
  resolvePendingRequest,
  scheduleRequestExpiry,
  sweepExpiredRequests,
};
