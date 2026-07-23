const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const User = require("../../models/user/User");
const Admin = require("../../models/admin/Admin");
const SlotPlan = require("../../models/booking/SlotPlan");
const AdminAvailability = require("../../models/booking/AdminAvailability");
const AdminLeave = require("../../models/booking/AdminLeave");
const BlockedTime = require("../../models/booking/BlockedTime");
const Booking = require("../../models/booking/Booking");
const { asyncHandler } = require("../../utils/asyncHandler");
const AppError = require("../../utils/AppError");
const { sendResponse } = require("../../utils/responseHandler");
const {
  validateSlotPlanPayload,
  normalizeAvailabilityPayload,
  getActiveAdmin,
} = require("../../services/booking/slotService");
const {
  joinAdminChat,
  listMessages,
  sendMessage,
  endChat,
} = require("../../services/booking/chatService");
const { refundBookingToWallet } = require("../../services/booking/bookingService");
const {
  BOOKING_STATUS,
} = require("../../utils/bookingConstants");

const parsePagination = (query) => {
  const page = Math.max(1, Number(query.page || 1));
  const limit = Math.min(100, Math.max(1, Number(query.limit || 20)));
  return { page, limit, skip: (page - 1) * limit };
};

const buildRegex = (value) => new RegExp(String(value || "").trim(), "i");

const getAdmin = async (auth = {}) => {
  const authId = String(auth?.id || "").trim();
  const authEmail = String(auth?.email || "").trim().toLowerCase();
  let admin = null;

  if (mongoose.Types.ObjectId.isValid(authId)) {
    admin = await Admin.findById(authId);
  }

  if (!admin && authEmail) {
    admin = await Admin.findOne({ email: authEmail });
  }

  if (!admin && authEmail) {
    const fallbackEmail = String(process.env.ADMIN_LOGIN_EMAIL || "admin@example.com").trim().toLowerCase();
    if (authEmail === fallbackEmail) {
      const fallbackPassword = String(process.env.ADMIN_LOGIN_PASSWORD || "Admin@123");
      const passwordHash = await bcrypt.hash(fallbackPassword, 10);
      admin = await Admin.findOneAndUpdate(
        { email: fallbackEmail },
        {
          email: fallbackEmail,
          passwordHash,
          name: String(process.env.ADMIN_LOGIN_NAME || "Admin").trim(),
          role: "admin",
          isActive: true,
        },
        { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
      );
    }
  }

  if (!admin || !admin.isActive) {
    throw new AppError("Admin not found", 404, "ADMIN_NOT_FOUND");
  }

  return admin;
};

const listSlotPlans = asyncHandler(async (req, res) => {
  await getAdmin(req.auth);
  const { page, limit, skip } = parsePagination(req.query);
  const search = String(req.query.search || "").trim();
  const filter = { deletedAt: null, consultationType: "chat" };
  if (search) filter.title = buildRegex(search);

  const [items, total] = await Promise.all([
    SlotPlan.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    SlotPlan.countDocuments(filter),
  ]);

  return sendResponse(res, {
    data: { items, total, page, limit, pages: Math.max(1, Math.ceil(total / limit)) },
  });
});

const getSlotPlan = asyncHandler(async (req, res) => {
  await getAdmin(req.auth);
  const plan = await SlotPlan.findOne({
    _id: req.params.id,
    deletedAt: null,
  }).lean();
  if (!plan) throw new AppError("Slot plan not found", 404, "SLOT_PLAN_NOT_FOUND");
  return sendResponse(res, { data: plan });
});

const createSlotPlan = asyncHandler(async (req, res) => {
  const admin = await getAdmin(req.auth);
  const payload = validateSlotPlanPayload(req.body);
  const existing = await SlotPlan.findOne({
    title: payload.title,
    consultationType: payload.consultationType,
    deletedAt: null,
  }).lean();
  if (existing) {
    throw new AppError("Slot plan already exists", 409, "SLOT_PLAN_EXISTS");
  }

  const plan = await SlotPlan.create({
    ...payload,
    createdBy: admin._id,
  });

  return sendResponse(res, {
    statusCode: 201,
    message: "Slot plan created",
    data: plan,
  });
});

const updateSlotPlan = asyncHandler(async (req, res) => {
  const admin = await getAdmin(req.auth);
  const plan = await SlotPlan.findOne({
    _id: req.params.id,
    deletedAt: null,
  });
  if (!plan) throw new AppError("Slot plan not found", 404, "SLOT_PLAN_NOT_FOUND");

  const merged = {
    title: req.body.title ?? plan.title,
    consultationType: "chat",
    durationMinutes: req.body.durationMinutes ?? plan.durationMinutes,
    breakMinutes: req.body.breakMinutes ?? plan.breakMinutes,
    basePrice: req.body.basePrice ?? plan.basePrice,
    offerPrice: req.body.offerPrice ?? plan.offerPrice,
    currency: req.body.currency ?? plan.currency,
    isPopular: req.body.isPopular ?? plan.isPopular,
    isActive: req.body.isActive ?? plan.isActive,
  };
  const payload = validateSlotPlanPayload(merged);

  Object.assign(plan, payload, {
    updatedBy: admin._id,
  });
  await plan.save();

  return sendResponse(res, { message: "Slot plan updated", data: plan });
});

const updateSlotPlanStatus = asyncHandler(async (req, res) => {
  const admin = await getAdmin(req.auth);
  const plan = await SlotPlan.findOne({
    _id: req.params.id,
    deletedAt: null,
  });
  if (!plan) throw new AppError("Slot plan not found", 404, "SLOT_PLAN_NOT_FOUND");

  const isActive =
    typeof req.body.isActive === "boolean"
      ? req.body.isActive
      : String(req.body.status || "").toLowerCase() !== "inactive";

  plan.isActive = isActive;
  plan.updatedBy = admin._id;
  await plan.save();

  return sendResponse(res, {
    message: "Slot plan status updated",
    data: plan,
  });
});

const deleteSlotPlan = asyncHandler(async (req, res) => {
  const admin = await getAdmin(req.auth);
  const plan = await SlotPlan.findOne({
    _id: req.params.id,
    deletedAt: null,
  });
  if (!plan) throw new AppError("Slot plan not found", 404, "SLOT_PLAN_NOT_FOUND");
  plan.isActive = false;
  plan.deletedAt = new Date();
  plan.updatedBy = admin._id;
  await plan.save();
  return sendResponse(res, { message: "Slot plan removed" });
});

const listAvailability = asyncHandler(async (req, res) => {
  const admin = await getAdmin(req.auth);
  const filter = { adminId: admin._id };
  if (req.query.dayOfWeek !== undefined && req.query.dayOfWeek !== "") {
    filter.dayOfWeek = Number(req.query.dayOfWeek);
  }
  const items = await AdminAvailability.find(filter).sort({ dayOfWeek: 1 }).lean();
  return sendResponse(res, { data: items });
});

const upsertAvailability = asyncHandler(async (req, res) => {
  const admin = await getAdmin(req.auth);
  const payload = normalizeAvailabilityPayload(req.body, admin._id);
  const existing = await AdminAvailability.findOne({
    adminId: admin._id,
    dayOfWeek: payload.dayOfWeek,
  });

  if (existing) {
    Object.assign(existing, payload, {
      updatedBy: admin._id,
    });
    await existing.save();
    return sendResponse(res, { message: "Availability updated", data: existing });
  }

  const created = await AdminAvailability.create({
    ...payload,
    createdBy: admin._id,
  });
  return sendResponse(res, {
    statusCode: 201,
    message: "Availability created",
    data: created,
  });
});

const patchAvailability = asyncHandler(async (req, res) => {
  const admin = await getAdmin(req.auth);
  const item = await AdminAvailability.findById(req.params.id);
  if (!item) throw new AppError("Availability not found", 404, "AVAILABILITY_NOT_FOUND");
  const merged = {
    dayOfWeek: req.body.dayOfWeek ?? item.dayOfWeek,
    isAvailable: req.body.isAvailable ?? item.isAvailable,
    shifts: req.body.shifts ?? item.shifts,
    timezone: req.body.timezone ?? item.timezone,
  };
  const payload = normalizeAvailabilityPayload(merged, item.adminId);
  Object.assign(item, payload, { updatedBy: admin._id });
  await item.save();
  return sendResponse(res, { message: "Availability updated", data: item });
});

const listLeaves = asyncHandler(async (req, res) => {
  const admin = await getAdmin(req.auth);
  const items = await AdminLeave.find({ adminId: admin._id }).sort({ startAt: -1 }).lean();
  return sendResponse(res, { data: items });
});

const createLeave = asyncHandler(async (req, res) => {
  const admin = await getAdmin(req.auth);
  const startAt = new Date(req.body.startAt);
  const endAt = new Date(req.body.endAt);
  const reason = String(req.body.reason || "").trim();

  if (Number.isNaN(startAt.getTime()) || Number.isNaN(endAt.getTime()) || endAt <= startAt) {
    throw new AppError("Valid startAt and endAt are required", 400, "VALIDATION_ERROR");
  }

  const leave = await AdminLeave.create({
    adminId: admin._id,
    startAt,
    endAt,
    reason,
    isActive: req.body.isActive !== false,
    createdBy: admin._id,
  });

  return sendResponse(res, {
    statusCode: 201,
    message: "Leave created",
    data: leave,
  });
});

const deleteLeave = asyncHandler(async (req, res) => {
  const admin = await getAdmin(req.auth);
  const leave = await AdminLeave.findById(req.params.id);
  if (!leave) throw new AppError("Leave not found", 404, "LEAVE_NOT_FOUND");
  leave.isActive = false;
  leave.updatedBy = admin._id;
  await leave.save();
  return sendResponse(res, { message: "Leave removed" });
});

const listBlockedTimes = asyncHandler(async (req, res) => {
  const admin = await getAdmin(req.auth);
  const items = await BlockedTime.find({ adminId: admin._id }).sort({ startAt: -1 }).lean();
  return sendResponse(res, { data: items });
});

const createBlockedTime = asyncHandler(async (req, res) => {
  const admin = await getAdmin(req.auth);
  const startAt = new Date(req.body.startAt);
  const endAt = new Date(req.body.endAt);
  const reason = String(req.body.reason || "").trim();

  if (Number.isNaN(startAt.getTime()) || Number.isNaN(endAt.getTime()) || endAt <= startAt) {
    throw new AppError("Valid startAt and endAt are required", 400, "VALIDATION_ERROR");
  }

  const blockedTime = await BlockedTime.create({
    adminId: admin._id,
    startAt,
    endAt,
    reason,
    isActive: req.body.isActive !== false,
    createdBy: admin._id,
  });

  return sendResponse(res, {
    statusCode: 201,
    message: "Blocked time created",
    data: blockedTime,
  });
});

const deleteBlockedTime = asyncHandler(async (req, res) => {
  const admin = await getAdmin(req.auth);
  const blockedTime = await BlockedTime.findById(req.params.id);
  if (!blockedTime) throw new AppError("Blocked time not found", 404, "BLOCKED_TIME_NOT_FOUND");
  blockedTime.isActive = false;
  blockedTime.updatedBy = admin._id;
  await blockedTime.save();
  return sendResponse(res, { message: "Blocked time removed" });
});

const buildBookingQuery = async (adminId, query = {}) => {
  const filter = { adminId };
  const status = String(query.status || "").trim();
  const paymentStatus = String(query.paymentStatus || "").trim();
  const search = String(query.search || "").trim();

  if (status) filter.bookingStatus = status;
  if (paymentStatus) filter.paymentStatus = paymentStatus;

  if (query.dateFrom || query.dateTo) {
    filter.startAt = {};
    if (query.dateFrom) filter.startAt.$gte = new Date(query.dateFrom);
    if (query.dateTo) filter.startAt.$lte = new Date(query.dateTo);
  }

  if (query.mode === "today") {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    filter.startAt = { $gte: start, $lt: end };
  } else if (query.mode === "upcoming") {
    filter.startAt = { $gte: new Date() };
    filter.bookingStatus = {
      $nin: [
        BOOKING_STATUS.COMPLETED,
        BOOKING_STATUS.CANCELLED_BY_USER,
        BOOKING_STATUS.CANCELLED_BY_ADMIN,
        BOOKING_STATUS.REFUNDED,
        BOOKING_STATUS.EXPIRED,
      ],
    };
  }

  if (search) {
    const userIds = await User.find({
      $or: [
        { name: buildRegex(search) },
        { email: buildRegex(search) },
        { phone: buildRegex(search) },
      ],
    }).distinct("_id");

    filter.$or = [
      { bookingNumber: buildRegex(search) },
      ...(userIds.length ? [{ userId: { $in: userIds } }] : []),
    ];
  }

  return filter;
};

const fetchBookings = async (adminId, query = {}) => {
  const { page, limit, skip } = parsePagination(query);
  const filter = await buildBookingQuery(adminId, query);

  const [items, total] = await Promise.all([
    Booking.find(filter)
      .populate("userId")
      .populate("slotPlanId")
      .sort({ startAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Booking.countDocuments(filter),
  ]);

  return {
    items,
    total,
    page,
    limit,
    pages: Math.max(1, Math.ceil(total / limit)),
  };
};

const listBookings = asyncHandler(async (req, res) => {
  const admin = await getAdmin(req.auth);
  const data = await fetchBookings(admin._id, req.query);
  return sendResponse(res, { data });
});

const listTodayBookings = asyncHandler(async (req, res) => {
  const admin = await getAdmin(req.auth);
  const data = await fetchBookings(admin._id, { ...req.query, mode: "today" });
  return sendResponse(res, { data });
});

const listUpcomingBookings = asyncHandler(async (req, res) => {
  const admin = await getAdmin(req.auth);
  const data = await fetchBookings(admin._id, { ...req.query, mode: "upcoming" });
  return sendResponse(res, { data });
});

const getBooking = asyncHandler(async (req, res) => {
  const admin = await getAdmin(req.auth);
  const booking = await Booking.findOne({
    _id: req.params.bookingId,
    adminId: admin._id,
  })
    .populate("userId")
    .populate("slotPlanId")
    .populate("paymentId")
    .populate("refundId")
    .lean();

  if (!booking) throw new AppError("Booking not found", 404, "BOOKING_NOT_FOUND");
  return sendResponse(res, { data: booking });
});

const joinChat = asyncHandler(async (req, res) => {
  const result = await joinAdminChat({
    bookingId: req.params.bookingId,
    adminId: (await getAdmin(req.auth))._id,
  });

  return sendResponse(res, {
    message: "Joined chat",
    data: result,
  });
});

const getMessages = asyncHandler(async (req, res) => {
  const { page, limit } = parsePagination(req.query);
  const admin = await getAdmin(req.auth);
  const result = await listMessages({
    bookingId: req.params.bookingId,
    adminId: admin._id,
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

  const admin = await getAdmin(req.auth);
  const result = await sendMessage({
    bookingId: req.params.bookingId,
    senderId: admin._id,
    senderRole: "admin",
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
    endedBy: "admin",
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
    requestedBy: "admin",
    reason,
  });

  return sendResponse(res, {
    message: "Booking cancelled",
    data: result,
  });
});

module.exports = {
  listSlotPlans,
  getSlotPlan,
  createSlotPlan,
  updateSlotPlan,
  updateSlotPlanStatus,
  deleteSlotPlan,
  listAvailability,
  upsertAvailability,
  patchAvailability,
  listLeaves,
  createLeave,
  deleteLeave,
  listBlockedTimes,
  createBlockedTime,
  deleteBlockedTime,
  listBookings,
  listTodayBookings,
  listUpcomingBookings,
  getBooking,
  joinChat,
  getMessages,
  sendChatMessage,
  endBookingChat,
  cancelBooking,
};
