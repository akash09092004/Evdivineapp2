const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const ChatSession = require("../models/chat/ChatSession");
const ChatMessage = require("../models/chat/ChatMessage");
const User = require("../models/user/User");
const {
  sweepExpiredRequests,
  ADMIN_REQUEST_ROOM,
} = require("../services/chatRequestRealtimeService");

let ioInstance = null;
let expirySweepTimer = null;

const isLocalDevOrigin = (origin) =>
  /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(String(origin || ""));

const buildLookupQuery = (identifier) => {
  const trimmed = String(identifier || "").trim();
  const or = [{ chatroomId: trimmed }];
  if (/^[a-f\d]{24}$/i.test(trimmed)) {
    or.unshift({ _id: trimmed });
  }
  return { $or: or };
};

const fallbackChatroomId = (sessionId) => `chat_${String(sessionId)}`;

const initSocket = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => {
        if (!origin) {
          callback(null, true);
          return;
        }

        if (
          process.env.NODE_ENV !== "production" &&
          isLocalDevOrigin(origin)
        ) {
          callback(null, true);
          return;
        }

        const allowedOrigins = [
          process.env.CLIENT_URL,
          process.env.ADMIN_URL,
        ].filter(Boolean);

        if (!allowedOrigins.length || allowedOrigins.includes(origin)) {
          callback(null, true);
          return;
        }

        callback(new Error(`Socket CORS blocked for origin: ${origin}`));
      },
      credentials: true,
    },
  });
  ioInstance = io;

  io.use((socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.replace("Bearer ", "");
      if (!token) return next();
      socket.auth = jwt.verify(token, process.env.JWT_SECRET);
      next();
    } catch (error) {
      next(new Error("Unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    const auth = socket.auth;
    if (auth?.id && auth?.role) {
      socket.join(`${auth.role}:${auth.id}`);
      if (auth.role === "admin") {
        socket.join(ADMIN_REQUEST_ROOM);
        socket.join("admin:booking");
      }
    }

    socket.on("chat:join", async ({ sessionId, chatroomId }, ack) => {
      try {
        const identifier = chatroomId || sessionId;
        const session = await ChatSession.findOne(
          buildLookupQuery(identifier)
        ).lean();
        if (!session) throw new Error("Chat session not found");

        const isUser =
          auth?.role === "user" && String(session.user) === String(auth.id);
        const isAdmin =
          auth?.role === "admin" &&
          (!session.hostId ||
            String(session.hostId) === String(auth.id) ||
            String(session.adminId) === String(auth.id));
        if (!isUser && !isAdmin) throw new Error("Forbidden");

        const chatroomId =
          session.chatroomId || fallbackChatroomId(session._id);
        socket.join(`chatroom:${chatroomId}`);
        socket.join(`chat-session:${String(session._id)}`);
        socket.join(`user:${String(session.user)}`);
        if (session.hostId) socket.join(`host:${String(session.hostId)}`);
        if (session.bookingId) {
          socket.join(`booking:${String(session.bookingId)}`);
        }
        const messages = await ChatMessage.find({ session: session._id })
          .sort({ createdAt: 1 })
          .lean();
        if (typeof ack === "function") {
          ack({ success: true, data: { session, messages } });
        }
      } catch (error) {
        if (typeof ack === "function")
          ack({
            success: false,
            message: error.message || "Unable to join chat",
          });
      }
    });

    socket.on("chat:message", async (payload, ack) => {
      try {
        const {
          sessionId,
          chatroomId,
          text = "",
          type = "text",
          mediaUrl = "",
          transcription = "",
          metadata = {},
        } = payload || {};
        const identifier = chatroomId || sessionId;
        const session = await ChatSession.findOne(buildLookupQuery(identifier));
        if (!session) throw new Error("Chat session not found");

        const isUser =
          auth?.role === "user" && String(session.user) === String(auth.id);
        const isAdmin =
          auth?.role === "admin" &&
          (!session.hostId ||
            String(session.hostId) === String(auth.id) ||
            String(session.adminId) === String(auth.id));
        if (!isUser && !isAdmin) throw new Error("Forbidden");
        if (!["approved", "active", "scheduled", "waiting"].includes(session.status))
          throw new Error("Chat not active");

        const senderName =
          auth?.role === "admin"
            ? auth?.name || "Admin"
            : (await User.findById(auth.id).lean())?.name || "User";
        const message = await ChatMessage.create({
          session: session._id,
          chatroomId,
          senderRole: auth.role,
          senderId: String(auth.id),
          senderName,
          type,
          text: String(text || "").trim(),
          mediaUrl,
          transcription,
          metadata,
        });

        session.status = "active";
        session.startedAt = session.startedAt || new Date();
        session.lastMessageAt = new Date();
        await session.save();

        ioInstance?.to(`chatroom:${chatroomId}`).emit("chat:new-message", {
          sessionId: String(session._id),
          chatroomId,
          message: message.toObject(),
        });

        if (typeof ack === "function")
          ack({ success: true, data: message.toObject() });
      } catch (error) {
        if (typeof ack === "function")
          ack({
            success: false,
            message: error.message || "Unable to send message",
          });
      }
    });

    socket.on("disconnect", () => {});
  });

  const runExpirySweep = async () => {
    if (require("mongoose").connection.readyState !== 1) return;
    try {
      await sweepExpiredRequests(io);
    } catch (error) {
      console.log("[socket] expiry sweep failed", error?.message || error);
    }
  };

  runExpirySweep();
  if (expirySweepTimer) {
    clearInterval(expirySweepTimer);
  }
  expirySweepTimer = setInterval(
    runExpirySweep,
    Number(process.env.CHAT_REQUEST_EXPIRY_SWEEP_MS || 60000)
  );

  return io;
};

const getIO = () => ioInstance;

module.exports = initSocket;
module.exports.getIO = getIO;
