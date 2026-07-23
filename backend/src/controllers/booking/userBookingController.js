const mongoose = require("mongoose");
const Booking = require("../../models/booking/Booking");
const User = require("../../models/user/User");
const SlotPlan = require("../../models/booking/SlotPlan");
const SlotLock = require("../../models/booking/SlotLock");
const ChatSession = require("../../models/chat/ChatSession");
const ChatMessage = require("../../models/chat/ChatMessage");
const { asyncHandler } = require("../../utils/asyncHandler");
const AppError = require("../../utils/AppError");
const { sendResponse } = require("../../utils/responseHandler");
const {
  generateSlotsForDate,
  createSlotLock,
} = require("../../services/booking/slotService");
const {
  createBookingFromLock,
  processWalletPaymentForBooking,
  refundBookingToWallet,
} = require("../../services/booking/bookingService");
const {
  createBookingPayPalOrder,
  captureBookingPayPalOrder,
} = require("../../services/booking/paypalBookingService");
const {
  joinUserChat,
  listMessages,
  sendMessage,
  endChat,
} = require("../../services/booking/chatService");
const {
  PAYMENT_METHODS,
  BOOKING_STATUS,
} = require("../../utils/bookingConstants");

const parsePagination = (query) => {
  const page = Math.max(1, Number(query.page || 1));
  const limit = Math.min(100, Math.max(1, Number(query.limit || 20)));
  return { page, limit, skip: (page - 1) * limit };
};

const listChatSlotPlans = asyncHandler(async (_req, res) => {
  const plans = await SlotPlan.find({
    consultationType: "chat",
    isActive: true,
    deletedAt: null,
  })
    .sort({ durationMinutes: 1, createdAt: 1 })
    .lean();

  return sendResponse(res, {
    data: {
      items: plans,
    },
  });
});

const normalizeSearchRegex = (value) =>
  new RegExp(String(value || "").trim(), "i");

const buildBookingFilter = async (userId, query = {}) => {
  const filter = { userId };
  const now = new Date();
  const status = String(query.status || "").trim();
  const mode = String(query.filter || query.type || "")
    .trim()
    .toLowerCase();

  if (status) {
    filter.bookingStatus = status;
  } else if (mode === "upcoming") {
    filter.startAt = { $gte: now };
    filter.bookingStatus = {
      $nin: [
        BOOKING_STATUS.COMPLETED,
        BOOKING_STATUS.CANCELLED_BY_USER,
        BOOKING_STATUS.CANCELLED_BY_ADMIN,
        BOOKING_STATUS.REFUNDED,
        BOOKING_STATUS.EXPIRED,
      ],
    };
  } else if (mode === "completed") {
    filter.bookingStatus = BOOKING_STATUS.COMPLETED;
  } else if (mode === "cancelled") {
    filter.bookingStatus = {
      $in: [
        BOOKING_STATUS.CANCELLED_BY_USER,
        BOOKING_STATUS.CANCELLED_BY_ADMIN,
        BOOKING_STATUS.REFUNDED,
      ],
    };
  }

  return filter;
};

const getAvailableSlots = asyncHandler(async (req, res) => {
  const date = String(req.query.date || "").trim();
  const planId = String(req.query.planId || "").trim();

  if (!date || !planId) {
    throw new AppError("date and planId are required", 400, "VALIDATION_ERROR");
  }

  const data = await generateSlotsForDate({ date, planId });
  return sendResponse(res, {
    data,
  });
});

const lockSlot = asyncHandler(async (req, res) => {
  const slotPlanId = String(req.body.slotPlanId || "").trim();
  const startAt = String(req.body.startAt || "").trim();
  const timeZone = String(req.body.timeZone || req.body.timezone || "").trim();

  if (!slotPlanId || !startAt) {
    throw new AppError(
      "slotPlanId and startAt are required",
      400,
      "VALIDATION_ERROR"
    );
  }

  const data = await createSlotLock({
    userId: req.auth.id,
    slotPlanId,
    startAt,
    timeZone,
  });

  return sendResponse(res, {
    statusCode: 201,
    message: "Slot locked successfully",
    data,
  });
});

const createPendingBooking = asyncHandler(async (req, res) => {
  const lockId = String(req.body.lockId || req.body.slotLockId || "").trim();
  const paymentMethod = String(req.body.paymentMethod || "")
    .trim()
    .toLowerCase();

  if (!lockId) {
    throw new AppError("lockId is required", 400, "VALIDATION_ERROR");
  }
  if (
    ![PAYMENT_METHODS.WALLET, PAYMENT_METHODS.PAYPAL].includes(paymentMethod)
  ) {
    throw new AppError(
      "paymentMethod must be wallet or paypal",
      400,
      "VALIDATION_ERROR"
    );
  }

  const booking = await createBookingFromLock({
    userId: req.auth.id,
    lockId,
    paymentMethod,
  });

  return sendResponse(res, {
    statusCode: 201,
    message: "Booking created",
    data: booking,
  });
});

const payFromWallet = asyncHandler(async (req, res) => {
  const bookingId = String(req.body.bookingId || "").trim();
  if (!bookingId) {
    throw new AppError("bookingId is required", 400, "VALIDATION_ERROR");
  }

  const result = await processWalletPaymentForBooking({
    bookingId,
    userId: req.auth.id,
  });

  return sendResponse(res, {
    message: "Wallet payment completed",
    data: result,
  });
});

const createPaypalOrder = asyncHandler(async (req, res) => {
  const bookingId = String(req.body.bookingId || "").trim();
  const returnUrl = String(req.body.returnUrl || "").trim();
  const cancelUrl = String(req.body.cancelUrl || "").trim();

  if (!bookingId) {
    throw new AppError("bookingId is required", 400, "VALIDATION_ERROR");
  }

  const result = await createBookingPayPalOrder({
    bookingId,
    authUserId: req.auth.id,
    returnUrl,
    cancelUrl,
  });

  return sendResponse(res, {
    statusCode: 201,
    message: "PayPal order created",
    data: result,
  });
});

const capturePaypalOrder = asyncHandler(async (req, res) => {
  const bookingId = String(req.body.bookingId || "").trim();
  const paypalOrderId = String(
    req.body.paypalOrderId || req.body.orderId || ""
  ).trim();
  const payerId = String(req.body.payerId || req.body.PayerID || "").trim();

  if (!bookingId || !paypalOrderId) {
    throw new AppError(
      "bookingId and paypalOrderId are required",
      400,
      "VALIDATION_ERROR"
    );
  }

  const result = await captureBookingPayPalOrder({
    bookingId,
    paypalOrderId,
    payerId,
    authUserId: req.auth.id,
  });

  return sendResponse(res, {
    message: "PayPal payment captured",
    data: result,
  });
});

const listMyBookings = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  const filter = await buildBookingFilter(req.auth.id, req.query);
  const search = String(req.query.search || "").trim();

  if (search) {
    filter.$or = [{ bookingNumber: normalizeSearchRegex(search) }];
  }

  const [items, total] = await Promise.all([
    Booking.find(filter)
      .populate("slotPlanId")
      .sort({ startAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Booking.countDocuments(filter),
  ]);

  return sendResponse(res, {
    data: {
      items,
      total,
      page,
      limit,
      pages: Math.max(1, Math.ceil(total / limit)),
    },
  });
});

const getMyBooking = asyncHandler(async (req, res) => {
  const booking = await Booking.findOne({
    _id: req.params.bookingId,
    userId: req.auth.id,
  })
    .populate("slotPlanId")
    .populate("adminId")
    .lean();

  if (!booking) {
    throw new AppError("Booking not found", 404, "BOOKING_NOT_FOUND");
  }

  return sendResponse(res, { data: booking });
});

const joinChat = asyncHandler(async (req, res) => {
  const result = await joinUserChat({
    bookingId: req.params.bookingId,
    userId: req.auth.id,
  });

  return sendResponse(res, {
    message: "Joined chat",
    data: result,
  });
});

const getMessages = asyncHandler(async (req, res) => {
  const { page, limit } = parsePagination(req.query);
  const result = await listMessages({
    bookingId: req.params.bookingId,
    userId: req.auth.id,
    page,
    limit,
  });

  return sendResponse(res, { data: result });
});

const sendChatMessage = asyncHandler(async (req, res) => {
  const message = String(req.body.message || req.body.text || "").trim();
  if (!message) {
    throw new AppError("message is required", 400, "VALIDATION_ERROR");
  }

  const result = await sendMessage({
    bookingId: req.params.bookingId,
    senderId: req.auth.id,
    senderRole: "user",
    message,
  });

  return sendResponse(res, {
    statusCode: 201,
    message: "Message sent",
    data: result,
  });
});

const endBookingChat = asyncHandler(async (req, res) => {
  const reason = String(req.body.reason || "").trim();
  const result = await endChat({
    bookingId: req.params.bookingId,
    endedBy: "user",
    reason,
  });

  return sendResponse(res, {
    message: "Chat ended",
    data: result,
  });
});

const cancelBooking = asyncHandler(async (req, res) => {
  const reason = String(req.body.reason || "").trim();
  const result = await refundBookingToWallet({
    bookingId: req.params.bookingId,
    requestedBy: "user",
    reason,
  });

  return sendResponse(res, {
    message: "Booking cancelled",
    data: result,
  });
});

module.exports = {
  listChatSlotPlans,
  getAvailableSlots,
  lockSlot,
  createPendingBooking,
  payFromWallet,
  createPaypalOrder,
  capturePaypalOrder,
  listMyBookings,
  getMyBooking,
  joinChat,
  getMessages,
  sendChatMessage,
  endBookingChat,
  cancelBooking,
};
