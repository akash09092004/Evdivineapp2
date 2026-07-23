const mongoose = require("mongoose");

const ChatSession = require("../../models/chat/ChatSession");
const ChatMessage = require("../../models/chat/ChatMessage");
const Booking = require("../../models/booking/Booking");
const User = require("../../models/user/User");

const AppError = require("../../utils/AppError");

const {
  CHAT_STATUS,
  BOOKING_STATUS,
  DEFAULTS,
} = require("../../utils/bookingConstants");

const { sanitizeText } = require("../../utils/bookingHelpers");
const { createNotification } = require("../notificationService");
const { getIO } = require("../../sockets/socket");

/**
 * Convert any value into a safe string.
 */
const toIdString = (value) => {
  if (!value) return "";
  return String(value);
};

/**
 * Validate MongoDB ObjectId.
 */
const validateObjectId = (value, fieldName = "id") => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    throw new AppError(
      `Valid ${fieldName} is required`,
      400,
      "VALIDATION_ERROR"
    );
  }
};

/**
 * Return numeric environment value safely.
 */
const getNumberConfig = (envValue, defaultValue) => {
  const parsedValue = Number(envValue);

  if (Number.isFinite(parsedValue) && parsedValue >= 0) {
    return parsedValue;
  }

  const parsedDefault = Number(defaultValue);

  return Number.isFinite(parsedDefault) && parsedDefault >= 0
    ? parsedDefault
    : 0;
};

/**
 * Return all statuses that are allowed to enter or continue a chat.
 */
const getJoinableBookingStatuses = () =>
  [
    BOOKING_STATUS.CONFIRMED,
    BOOKING_STATUS.READY,
    BOOKING_STATUS.WAITING_FOR_ADMIN,
    BOOKING_STATUS.IN_PROGRESS,
  ].filter(Boolean);

/**
 * Check whether booking status supports chat.
 */
const canJoinChat = (booking) => {
  if (!booking) return false;

  const allowedStatuses = getJoinableBookingStatuses();

  return allowedStatuses.includes(booking.bookingStatus);
};

/**
 * Get chat join-window details.
 */
const getJoinWindowDetails = (booking) => {
  const startAt = new Date(booking?.startAt);
  const endAt = new Date(booking?.endAt);

  const startTime = startAt.getTime();
  const endTime = endAt.getTime();

  if (!Number.isFinite(startTime) || !Number.isFinite(endTime)) {
    throw new AppError(
      "Booking startAt or endAt is invalid",
      409,
      "INVALID_BOOKING_TIME"
    );
  }

  if (endTime <= startTime) {
    throw new AppError(
      "Booking end time must be after start time",
      409,
      "INVALID_BOOKING_TIME"
    );
  }

  const joinBeforeMinutes = getNumberConfig(
    process.env.CHAT_JOIN_BEFORE_MINUTES,
    DEFAULTS.CHAT_JOIN_BEFORE_MINUTES
  );

  const joinGraceMinutes = getNumberConfig(
    process.env.CHAT_JOIN_GRACE_MINUTES,
    DEFAULTS.CHAT_JOIN_GRACE_MINUTES
  );

  const windowStart =
    startTime - joinBeforeMinutes * 60 * 1000;

  const windowEnd =
    endTime + joinGraceMinutes * 60 * 1000;

  return {
    startTime,
    endTime,
    windowStart,
    windowEnd,
    joinBeforeMinutes,
    joinGraceMinutes,
  };
};

/**
 * Check whether current time is inside join window.
 */
const isJoinWindowOpen = (booking) => {
  const now = Date.now();
  const { windowStart, windowEnd } =
    getJoinWindowDetails(booking);

  return now >= windowStart && now <= windowEnd;
};

/**
 * Load booking and its chat session.
 */
const ensureBookingChat = async (bookingId) => {
  validateObjectId(bookingId, "bookingId");

  const booking = await Booking.findById(bookingId);

  if (!booking) {
    throw new AppError(
      "Booking not found",
      404,
      "BOOKING_NOT_FOUND"
    );
  }

  const chat = await ChatSession.findOne({
    bookingId: booking._id,
  });

  if (!chat) {
    throw new AppError(
      "Chat session not found",
      404,
      "CHAT_SESSION_NOT_FOUND"
    );
  }

  return { booking, chat };
};

/**
 * Validate that the booking can be joined.
 *
 * role:
 * - user
 * - admin
 */
const assertChatCanBeJoined = (
  booking,
  role = "user"
) => {
  if (!booking) {
    throw new AppError(
      "Booking not found",
      404,
      "BOOKING_NOT_FOUND"
    );
  }

  const currentStatus = booking.bookingStatus;

  /*
   * Cancelled and completed checks must come before canJoinChat().
   * In your old code, these checks were effectively unreachable because
   * canJoinChat() already rejected these statuses.
   */
  if (currentStatus === BOOKING_STATUS.COMPLETED) {
    throw new AppError(
      "Chat is already completed",
      409,
      "CHAT_ALREADY_COMPLETED"
    );
  }

  if (
    currentStatus ===
      BOOKING_STATUS.CANCELLED_BY_ADMIN ||
    currentStatus ===
      BOOKING_STATUS.CANCELLED_BY_USER
  ) {
    throw new AppError(
      "Booking is cancelled",
      409,
      "BOOKING_CANCELLED"
    );
  }

  if (!canJoinChat(booking)) {
    const allowedStatuses =
      getJoinableBookingStatuses().join(", ");

    throw new AppError(
      `Booking status '${currentStatus || "undefined"}' is not ready for chat. Allowed statuses: ${allowedStatuses}`,
      409,
      "BOOKING_NOT_READY"
    );
  }

  const now = Date.now();

  const {
    windowStart,
    windowEnd,
    joinBeforeMinutes,
    joinGraceMinutes,
  } = getJoinWindowDetails(booking);

  if (now < windowStart) {
    throw new AppError(
      `Chat join window has not opened yet. You can join ${joinBeforeMinutes} minute(s) before booking start time.`,
      409,
      "CHAT_JOIN_WINDOW_NOT_OPEN"
    );
  }

  if (now > windowEnd) {
    throw new AppError(
      `Chat join window has closed. Grace period was ${joinGraceMinutes} minute(s) after booking end time.`,
      409,
      "CHAT_JOIN_WINDOW_CLOSED"
    );
  }

  /*
   * At present both user and admin can join independently.
   * Admin does not have to wait for userJoinedAt.
   */
  if (!["user", "admin"].includes(role)) {
    throw new AppError(
      "Invalid chat participant role",
      400,
      "INVALID_CHAT_ROLE"
    );
  }

  return true;
};

/**
 * Verify that supplied user owns the booking.
 */
const assertUserOwnsBooking = (
  booking,
  userId
) => {
  if (
    !userId ||
    toIdString(booking.userId) !==
      toIdString(userId)
  ) {
    throw new AppError(
      "Forbidden",
      403,
      "FORBIDDEN"
    );
  }
};

/**
 * Verify that supplied admin owns the booking.
 */
const assertAdminOwnsBooking = (
  booking,
  adminId
) => {
  if (
    !adminId ||
    toIdString(booking.adminId) !==
      toIdString(adminId)
  ) {
    throw new AppError(
      "Forbidden",
      403,
      "FORBIDDEN"
    );
  }
};

/**
 * User joins booked chat.
 */
const joinUserChat = async ({
  bookingId,
  userId,
}) => {
  const { booking, chat } =
    await ensureBookingChat(bookingId);

  assertUserOwnsBooking(booking, userId);
  assertChatCanBeJoined(booking, "user");

  if (!chat.userJoinedAt) {
    chat.userJoinedAt = new Date();
  }

  /*
   * Do not downgrade an already active chat to waiting.
   */
  if (chat.status !== CHAT_STATUS.ACTIVE) {
    chat.status = CHAT_STATUS.WAITING;
  }

  await chat.save();

  /*
   * Do not downgrade IN_PROGRESS back to WAITING_FOR_ADMIN.
   */
  if (
    booking.bookingStatus !==
    BOOKING_STATUS.IN_PROGRESS
  ) {
    booking.bookingStatus =
      BOOKING_STATUS.WAITING_FOR_ADMIN;

    await booking.save();
  }

  const io = getIO();

  if (io) {
    io.to(
      `admin:${toIdString(booking.adminId)}`
    ).emit("chat:user-waiting", {
      bookingId: toIdString(booking._id),
      chatRoomId: chat.chatroomId,
      userJoinedAt: chat.userJoinedAt,
    });
  }

  await createNotification({
    recipientType: "admin",
    recipient: booking.adminId,
    title: "User waiting",
    body: `User is waiting for booking ${booking.bookingNumber}.`,
    type: "booking",
    bookingId: booking._id,
    meta: {
      bookingId: toIdString(booking._id),
      chatRoomId: chat.chatroomId,
    },
  });

  return {
    booking,
    chat,
    joinWindowOpen: true,
  };
};

/**
 * Admin joins booked chat.
 */
const joinAdminChat = async ({
  bookingId,
  adminId,
}) => {
  const { booking, chat } =
    await ensureBookingChat(bookingId);

  assertAdminOwnsBooking(booking, adminId);
  assertChatCanBeJoined(booking, "admin");

  if (!chat.adminJoinedAt) {
    chat.adminJoinedAt = new Date();
  }

  if (!chat.actualStartedAt) {
    chat.actualStartedAt = new Date();
  }

  chat.status = CHAT_STATUS.ACTIVE;

  await chat.save();

  booking.bookingStatus =
    BOOKING_STATUS.IN_PROGRESS;

  await booking.save();

  const io = getIO();

  if (io) {
    io.to(
      `user:${toIdString(booking.userId)}`
    ).emit("chat:admin-joined", {
      bookingId: toIdString(booking._id),
      chatRoomId: chat.chatroomId,
      adminJoinedAt: chat.adminJoinedAt,
      actualStartedAt: chat.actualStartedAt,
    });

    io.to(
      `chatroom:${chat.chatroomId}`
    ).emit("chat:session-active", {
      bookingId: toIdString(booking._id),
      chatRoomId: chat.chatroomId,
      status: CHAT_STATUS.ACTIVE,
    });
  }

  return {
    booking,
    chat,
    joinWindowOpen: true,
  };
};

/**
 * List booking chat messages.
 */
const listMessages = async ({
  bookingId,
  userId,
  adminId,
  page = 1,
  limit = 50,
}) => {
  const { booking, chat } =
    await ensureBookingChat(bookingId);

  if (userId) {
    assertUserOwnsBooking(booking, userId);
  }

  if (adminId) {
    assertAdminOwnsBooking(
      booking,
      adminId
    );
  }

  if (!userId && !adminId) {
    throw new AppError(
      "Authenticated participant is required",
      401,
      "UNAUTHORIZED"
    );
  }

  const safePage = Math.max(
    Number(page) || 1,
    1
  );

  const safeLimit = Math.min(
    Math.max(Number(limit) || 50, 1),
    100
  );

  const skip =
    (safePage - 1) * safeLimit;

  const query = {
    session: chat._id,
  };

  const [messages, total] =
    await Promise.all([
      ChatMessage.find(query)
        .sort({ createdAt: 1 })
        .skip(skip)
        .limit(safeLimit)
        .lean(),

      ChatMessage.countDocuments(query),
    ]);

  return {
    booking,
    chat,
    messages,
    pagination: {
      page: safePage,
      limit: safeLimit,
      total,
      totalPages: Math.ceil(
        total / safeLimit
      ),
    },
  };
};

/**
 * Send a message.
 */
const sendMessage = async ({
  bookingId,
  senderId,
  senderRole,
  message,
}) => {
  const { booking, chat } =
    await ensureBookingChat(bookingId);

  if (!["user", "admin"].includes(senderRole)) {
    throw new AppError(
      "senderRole must be user or admin",
      400,
      "VALIDATION_ERROR"
    );
  }

  /*
   * Important security validation:
   * User/admin must belong to this booking.
   */
  if (senderRole === "user") {
    assertUserOwnsBooking(
      booking,
      senderId
    );
  }

  if (senderRole === "admin") {
    assertAdminOwnsBooking(
      booking,
      senderId
    );
  }

  if (
    booking.bookingStatus ===
    BOOKING_STATUS.COMPLETED
  ) {
    throw new AppError(
      "Chat is already completed",
      409,
      "CHAT_ALREADY_COMPLETED"
    );
  }

  if (
    booking.bookingStatus ===
      BOOKING_STATUS.CANCELLED_BY_ADMIN ||
    booking.bookingStatus ===
      BOOKING_STATUS.CANCELLED_BY_USER
  ) {
    throw new AppError(
      "Booking is cancelled",
      409,
      "BOOKING_CANCELLED"
    );
  }

  const activeStatuses = [
    BOOKING_STATUS.READY,
    BOOKING_STATUS.WAITING_FOR_ADMIN,
    BOOKING_STATUS.IN_PROGRESS,
  ].filter(Boolean);

  if (
    !activeStatuses.includes(
      booking.bookingStatus
    )
  ) {
    throw new AppError(
      `Chat is not active for booking status '${booking.bookingStatus || "undefined"}'`,
      409,
      "CHAT_NOT_ACTIVE"
    );
  }

  if (!isJoinWindowOpen(booking)) {
    throw new AppError(
      "Chat window has closed or has not opened yet",
      409,
      "CHAT_WINDOW_CLOSED"
    );
  }

  if (
    chat.status === CHAT_STATUS.COMPLETED
  ) {
    throw new AppError(
      "Chat session is completed",
      409,
      "CHAT_ALREADY_COMPLETED"
    );
  }

  const cleanedMessage = sanitizeText(
    message,
    2000
  );

  if (!cleanedMessage) {
    throw new AppError(
      "Message is required",
      400,
      "VALIDATION_ERROR"
    );
  }

  let senderName = "Admin";

  if (senderRole === "user") {
    const sender = await User.findById(
      senderId
    )
      .select("name")
      .lean();

    senderName = sender?.name || "User";
  }

  const record = await ChatMessage.create({
    session: chat._id,
    chatroomId: chat.chatroomId,
    bookingId: booking._id,

    senderRole,
    senderId: toIdString(senderId),
    senderName,

    type: "text",
    text: cleanedMessage,

    messageType: "text",
    message: cleanedMessage,

    isRead: false,
  });

  const io = getIO();

  if (io) {
    io.to(
      `chatroom:${chat.chatroomId}`
    ).emit("chat:new-message", {
      bookingId: toIdString(booking._id),
      chatRoomId: chat.chatroomId,
      message: record.toObject(),
    });
  }

  return {
    booking,
    chat,
    message: record,
  };
};

/**
 * End chat session.
 */
const endChat = async ({
  bookingId,
  endedBy,
  reason = "",
}) => {
  const { booking, chat } =
    await ensureBookingChat(bookingId);

  if (
    !["user", "admin", "system"].includes(
      endedBy
    )
  ) {
    throw new AppError(
      "endedBy must be user, admin or system",
      400,
      "VALIDATION_ERROR"
    );
  }

  if (
    booking.bookingStatus ===
      BOOKING_STATUS.COMPLETED &&
    chat.status === CHAT_STATUS.COMPLETED
  ) {
    return {
      booking,
      chat,
      alreadyCompleted: true,
    };
  }

  const now = new Date();

  booking.bookingStatus =
    BOOKING_STATUS.COMPLETED;

  await booking.save();

  chat.status = CHAT_STATUS.COMPLETED;
  chat.actualEndedAt =
    chat.actualEndedAt || now;
  chat.endedAt = chat.endedAt || now;
  chat.endedBy = endedBy;
  chat.endReason = sanitizeText(
    reason,
    500
  );

  await chat.save();

  const io = getIO();

  if (io) {
    io.to(
      `chatroom:${chat.chatroomId}`
    ).emit("chat:session-ended", {
      bookingId: toIdString(booking._id),
      chatRoomId: chat.chatroomId,
      reason: chat.endReason,
      endedBy,
      endedAt: chat.endedAt,
    });

    io.to(
      `user:${toIdString(booking.userId)}`
    ).emit("chat:session-ended", {
      bookingId: toIdString(booking._id),
      reason: chat.endReason,
      endedBy,
    });

    io.to(
      `admin:${toIdString(booking.adminId)}`
    ).emit("chat:session-ended", {
      bookingId: toIdString(booking._id),
      reason: chat.endReason,
      endedBy,
    });
  }

  return {
    booking,
    chat,
    alreadyCompleted: false,
  };
};

module.exports = {
  ensureBookingChat,
  canJoinChat,
  isJoinWindowOpen,
  assertChatCanBeJoined,
  joinUserChat,
  joinAdminChat,
  listMessages,
  sendMessage,
  endChat,
};