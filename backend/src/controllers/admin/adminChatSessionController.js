const ChatSession = require('../../models/chat/ChatSession');
const ChatMessage = require('../../models/chat/ChatMessage');
const User = require('../../models/user/User');
const { asyncHandler } = require('../../utils/asyncHandler');
const AppError = require('../../utils/AppError');
const { sendResponse } = require('../../utils/responseHandler');
const mongoose = require('mongoose');
const { getIO } = require('../../sockets/socket');

const getSessionLookupQuery = (identifier) => {
  const trimmed = String(identifier || '').trim();
  const or = [{ chatroomId: trimmed }];
  if (mongoose.isValidObjectId(trimmed)) {
    or.unshift({ _id: trimmed });
  }
  return { $or: or };
};

const fallbackChatroomId = (sessionId) => `chat_${String(sessionId)}`;
const allowedSessionStatuses = new Set(["pending", "approved", "rejected", "active", "ended"]);

const listSessions = asyncHandler(async (req, res) => {
  const status = String(req.query.status || 'all').toLowerCase();
  const filter = status === 'all' ? {} : { status };
  const sessions = await ChatSession.find(filter).sort({ updatedAt: -1 }).lean();
  return sendResponse(res, { data: sessions });
});

const getSessionMessages = asyncHandler(async (req, res) => {
  const session = await ChatSession.findOne(getSessionLookupQuery(req.params.sessionId || req.params.chatroomId)).lean();
  if (!session) throw new AppError('Chat session not found', 404, 'CHAT_SESSION_NOT_FOUND');
  const messages = await ChatMessage.find({ session: session._id }).sort({ createdAt: 1 }).lean();
  return sendResponse(res, { data: { session, messages } });
});

const sendAdminMessage = asyncHandler(async (req, res) => {
  const { text = '', type = 'text', mediaUrl = '', transcription = '', metadata = {} } = req.body;
  const session = await ChatSession.findOne(getSessionLookupQuery(req.params.sessionId || req.params.chatroomId));
  if (!session) throw new AppError('Chat session not found', 404, 'CHAT_SESSION_NOT_FOUND');
  if (!['approved', 'active'].includes(session.status)) {
    throw new AppError('Chat is not active yet', 403, 'CHAT_NOT_ACTIVE');
  }

  const trimmedText = String(text || '').trim();
  if (type === 'text' && !trimmedText) {
    throw new AppError('Message text is required', 400, 'VALIDATION_ERROR');
  }

  const message = await ChatMessage.create({
    session: session._id,
    chatroomId: session.chatroomId || fallbackChatroomId(session._id),
    senderRole: 'admin',
    senderId: String(req.auth.id || 'local-admin'),
    senderName: req.auth.name || 'Admin',
    chatroomId: session.chatroomId,
    type,
    text: trimmedText,
    mediaUrl,
    transcription,
    metadata
  });

  session.status = 'active';
  session.startedAt = session.startedAt || new Date();
  session.lastMessageAt = new Date();
  if (!session.chatroomId) session.chatroomId = fallbackChatroomId(session._id);
  await session.save();

  const io = getIO();
  if (io) {
    io.to(`chatroom:${String(session.chatroomId || fallbackChatroomId(session._id))}`).emit('chat:new-message', {
      sessionId: String(session._id),
      chatroomId: String(session.chatroomId || fallbackChatroomId(session._id)),
      message: message.toObject()
    });
  }

  return sendResponse(res, { message: 'Message sent', data: message.toObject() });
});

const markSessionEnded = asyncHandler(async (req, res) => {
  const session = await ChatSession.findOne(getSessionLookupQuery(req.params.sessionId || req.params.chatroomId));
  if (!session) throw new AppError('Chat session not found', 404, 'CHAT_SESSION_NOT_FOUND');
  session.status = 'ended';
  session.endedAt = new Date();
  await session.save();
  return sendResponse(res, { message: 'Chat session ended', data: session.toObject() });
});

const updateSession = asyncHandler(async (req, res) => {
  const identifier = req.params.sessionId || req.params.chatroomId;
  const session = await ChatSession.findOne(getSessionLookupQuery(identifier));
  if (!session) throw new AppError('Chat session not found', 404, 'CHAT_SESSION_NOT_FOUND');

  const nextFreeMinutes = req.body?.freeMinutes;
  if (nextFreeMinutes !== undefined && nextFreeMinutes !== null && nextFreeMinutes !== "") {
    const parsed = Number(nextFreeMinutes);
    if (!Number.isFinite(parsed) || parsed < 0) {
      throw new AppError('Invalid free minutes value', 400, 'VALIDATION_ERROR');
    }
    session.freeMinutes = parsed;
  }

  const nextStatus = String(req.body?.status || req.body?.chatAccessStatus || "").trim().toLowerCase();
  if (nextStatus) {
    if (!allowedSessionStatuses.has(nextStatus)) {
      throw new AppError('Invalid session status', 400, 'VALIDATION_ERROR');
    }
    session.status = nextStatus;
    if (nextStatus === 'ended') {
      session.endedAt = session.endedAt || new Date();
    }
    if (nextStatus === 'active') {
      session.startedAt = session.startedAt || new Date();
    }
  }

  const nextReason = String(req.body?.reason || req.body?.rejectionReason || "").trim();
  if (req.body && Object.prototype.hasOwnProperty.call(req.body, "reason")) {
    session.rejectionReason = nextReason;
  }
  if (req.body && Object.prototype.hasOwnProperty.call(req.body, "rejectionReason")) {
    session.rejectionReason = nextReason;
  }

  const nextAdminName = String(req.body?.adminName || "").trim();
  if (nextAdminName) {
    session.adminName = nextAdminName;
  }

  if (req.body && Object.prototype.hasOwnProperty.call(req.body, "startedAt")) {
    const startedAt = req.body.startedAt ? new Date(req.body.startedAt) : null;
    if (startedAt && Number.isNaN(startedAt.getTime())) {
      throw new AppError('Invalid startedAt value', 400, 'VALIDATION_ERROR');
    }
    if (startedAt) session.startedAt = startedAt;
  }

  if (req.body && Object.prototype.hasOwnProperty.call(req.body, "endedAt")) {
    const endedAt = req.body.endedAt ? new Date(req.body.endedAt) : null;
    if (endedAt && Number.isNaN(endedAt.getTime())) {
      throw new AppError('Invalid endedAt value', 400, 'VALIDATION_ERROR');
    }
    if (endedAt) session.endedAt = endedAt;
  }

  session.lastMessageAt = session.lastMessageAt || undefined;
  await session.save();

  const io = getIO();
  if (io) {
    io.to(`chatroom:${String(session.chatroomId || fallbackChatroomId(session._id))}`).emit('chat:session-updated', {
      status: session.status,
      session: session.toObject()
    });
  }

  return sendResponse(res, {
    message: 'Chat session updated',
    data: session.toObject()
  });
});

module.exports = {
  listSessions,
  getSessionMessages,
  sendAdminMessage,
  markSessionEnded,
  updateSession
};
