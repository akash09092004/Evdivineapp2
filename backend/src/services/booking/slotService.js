const mongoose = require("mongoose");
const Admin = require("../../models/admin/Admin");
const SlotPlan = require("../../models/booking/SlotPlan");
const AdminAvailability = require("../../models/booking/AdminAvailability");
const AdminLeave = require("../../models/booking/AdminLeave");
const BlockedTime = require("../../models/booking/BlockedTime");
const SlotLock = require("../../models/booking/SlotLock");
const Booking = require("../../models/booking/Booking");
const AppError = require("../../utils/AppError");
const {
  BOOKING_STATUS,
  SLOT_LOCK_STATUS,
  CONSULTATION_TYPES,
  DEFAULTS,
} = require("../../utils/bookingConstants");
const {
  clock24ToMinutes,
  minutesToClock24,
  overlaps,
  normalizeCurrency,
  startOfDayInTimeZone,
  zonedTimeToUtc,
  utcToZonedDateString,
  utcToZonedTimeString,
  isObjectId,
} = require("../../utils/bookingHelpers");

const getTimezoneOrDefault = (value) =>
  String(value || DEFAULTS.TIMEZONE).trim() || DEFAULTS.TIMEZONE;

const getActiveAdmin = async () => {
  const admin = await Admin.findOne({ isActive: true }).sort({ createdAt: 1 }).lean();
  if (!admin) {
    throw new AppError("Admin not found", 404, "ADMIN_NOT_FOUND");
  }
  return admin;
};

const validateSlotPlanPayload = (payload = {}) => {
  const title = String(payload.title || "").trim();
  const consultationType = String(payload.consultationType || CONSULTATION_TYPES.CHAT).trim();
  const durationMinutes = Number(payload.durationMinutes);
  const breakMinutes = Number(payload.breakMinutes ?? DEFAULTS.DEFAULT_BREAK_MINUTES);
  const basePrice = Number(payload.basePrice);
  const offerPrice = Number(payload.offerPrice);
  const currency = normalizeCurrency(payload.currency || DEFAULTS.CURRENCY);

  if (!title) throw new AppError("Title is required", 400, "VALIDATION_ERROR");
  if (consultationType !== CONSULTATION_TYPES.CHAT) {
    throw new AppError("Only chat consultation type is allowed", 400, "VALIDATION_ERROR");
  }
  if (!Number.isFinite(durationMinutes) || durationMinutes <= 0) {
    throw new AppError("Duration must be greater than 0", 400, "VALIDATION_ERROR");
  }
  if (!Number.isFinite(breakMinutes) || breakMinutes < 0) {
    throw new AppError("Break minutes must be zero or greater", 400, "VALIDATION_ERROR");
  }
  if (!Number.isFinite(basePrice) || basePrice <= 0) {
    throw new AppError("Base price must be greater than 0", 400, "VALIDATION_ERROR");
  }
  if (!Number.isFinite(offerPrice) || offerPrice < 0 || offerPrice > basePrice) {
    throw new AppError("Offer price must be zero or less than base price", 400, "VALIDATION_ERROR");
  }
  if (currency !== DEFAULTS.CURRENCY) {
    throw new AppError("Currency must be USD", 400, "VALIDATION_ERROR");
  }

  return {
    title,
    consultationType,
    durationMinutes,
    breakMinutes,
    basePrice,
    offerPrice,
    currency,
    isPopular: Boolean(payload.isPopular),
    isActive: payload.isActive !== false,
  };
};

const validateShifts = (shifts = []) => {
  const normalized = shifts.map((shift, index) => {
    const startTime = String(shift.startTime || "").trim();
    const endTime = String(shift.endTime || "").trim();
    if (!startTime || !endTime) {
      throw new AppError(`Shift ${index + 1} requires startTime and endTime`, 400, "VALIDATION_ERROR");
    }
    const start = clock24ToMinutes(startTime);
    const end = clock24ToMinutes(endTime);
    if (!Number.isFinite(start) || !Number.isFinite(end) || start >= end) {
      throw new AppError(`Shift ${index + 1} startTime must be earlier than endTime`, 400, "VALIDATION_ERROR");
    }
    return { startTime: minutesToClock24(start), endTime: minutesToClock24(end) };
  });

  for (let i = 0; i < normalized.length; i += 1) {
    for (let j = i + 1; j < normalized.length; j += 1) {
      const a = normalized[i];
      const b = normalized[j];
      if (overlaps(`${a.startTime}:00`, `${a.endTime}:00`, `${b.startTime}:00`, `${b.endTime}:00`)) {
        throw new AppError("Overlapping shifts are not allowed", 400, "VALIDATION_ERROR");
      }
    }
  }

  return normalized;
};

const normalizeAvailabilityPayload = (payload = {}, adminId) => {
  const dayOfWeek = Number(payload.dayOfWeek);
  const timezone = String(payload.timezone || DEFAULTS.TIMEZONE).trim() || DEFAULTS.TIMEZONE;
  const isAvailable = payload.isAvailable !== false;
  const shifts = isAvailable ? validateShifts(Array.isArray(payload.shifts) ? payload.shifts : []) : [];

  if (!Number.isInteger(dayOfWeek) || dayOfWeek < 0 || dayOfWeek > 6) {
    throw new AppError("dayOfWeek must be between 0 and 6", 400, "VALIDATION_ERROR");
  }

  return {
    adminId,
    dayOfWeek,
    isAvailable,
    shifts,
    timezone,
  };
};

const getAdminAvailabilityByDay = async (adminId, dayOfWeek) =>
  AdminAvailability.findOne({ adminId, dayOfWeek }).lean();

const getBlockingIntervals = async (adminId, startAt, endAt) => {
  const [leaves, blocks] = await Promise.all([
    AdminLeave.find({
      adminId,
      isActive: true,
      startAt: { $lt: endAt },
      endAt: { $gt: startAt },
    }).lean(),
    BlockedTime.find({
      adminId,
      isActive: true,
      startAt: { $lt: endAt },
      endAt: { $gt: startAt },
    }).lean(),
  ]);

  return [...leaves, ...blocks];
};

const getBookingIntervals = async (adminId, startAt, endAt) =>
  Booking.find({
    adminId,
    bookingStatus: {
      $in: [
        BOOKING_STATUS.PAYMENT_PENDING,
        BOOKING_STATUS.CONFIRMED,
        BOOKING_STATUS.READY,
        BOOKING_STATUS.WAITING_FOR_ADMIN,
        BOOKING_STATUS.IN_PROGRESS,
      ],
    },
    startAt: { $lt: endAt },
    busyUntil: { $gt: startAt },
  }).lean();

const getLockIntervals = async (adminId, startAt, endAt) =>
  SlotLock.find({
    adminId,
    status: SLOT_LOCK_STATUS.ACTIVE,
    expiresAt: { $gt: new Date() },
    startAt: { $lt: endAt },
    busyUntil: { $gt: startAt },
  }).lean();

const buildSlotStatus = (slot, refs = {}) => {
  const now = new Date();

  if (slot.startAt <= now) return "expired";
  if (slot.busyUntil <= now) return "expired";
  if (refs.blocked) return "blocked";
  if (refs.locked) return "locked";
  if (refs.booked) return "booked";
  return "available";
};

const generateSlotsForDate = async ({ date, planId }) => {
  if (!isObjectId(planId)) {
    throw new AppError("Valid planId is required", 400, "VALIDATION_ERROR");
  }

  const plan = await SlotPlan.findOne({
    _id: planId,
    consultationType: CONSULTATION_TYPES.CHAT,
    isActive: true,
    deletedAt: null,
  }).lean();
  if (!plan) throw new AppError("Slot plan not found", 404, "SLOT_PLAN_NOT_FOUND");

  const activeAdmin = await getActiveAdmin();
  const inputDate = String(date || "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(inputDate)) {
    throw new AppError("date must be YYYY-MM-DD", 400, "VALIDATION_ERROR");
  }

  const dayOfWeek = new Date(`${inputDate}T00:00:00Z`).getUTCDay();
  const availability = await getAdminAvailabilityByDay(activeAdmin._id, dayOfWeek);
  const timezone = getTimezoneOrDefault(availability?.timezone);
  if (!availability || !availability.isAvailable || !Array.isArray(availability.shifts) || !availability.shifts.length) {
    return {
      timezone,
      currency: plan.currency || DEFAULTS.CURRENCY,
      plan,
      slots: [],
    };
  }

  const slots = [];

  for (const shift of availability.shifts) {
    const shiftEndUtc = zonedTimeToUtc(inputDate, shift.endTime, timezone);
    const startMinutes = clock24ToMinutes(shift.startTime);
    const endMinutes = clock24ToMinutes(shift.endTime);
    const increment = Number(plan.durationMinutes) + Number(plan.breakMinutes ?? DEFAULTS.DEFAULT_BREAK_MINUTES);

    for (
      let cursor = startMinutes;
      cursor + Number(plan.durationMinutes) <= endMinutes;
      cursor += increment
    ) {
      const startAt = zonedTimeToUtc(inputDate, minutesToClock24(cursor), timezone);
      const endAt = zonedTimeToUtc(inputDate, minutesToClock24(cursor + Number(plan.durationMinutes)), timezone);
      const busyUntil = zonedTimeToUtc(inputDate, minutesToClock24(cursor + Number(plan.durationMinutes) + Number(plan.breakMinutes ?? DEFAULTS.DEFAULT_BREAK_MINUTES)), timezone);

      if (busyUntil > shiftEndUtc) break;

      const blockedIntervals = await getBlockingIntervals(activeAdmin._id, startAt, busyUntil);
      const bookedIntervals = await getBookingIntervals(activeAdmin._id, startAt, busyUntil);
      const lockedIntervals = await getLockIntervals(activeAdmin._id, startAt, busyUntil);

      const status = buildSlotStatus(
        { startAt, busyUntil },
        {
          blocked: blockedIntervals.length > 0,
          booked: bookedIntervals.length > 0,
          locked: lockedIntervals.length > 0,
        }
      );

      slots.push({
        startAt,
        endAt,
        busyUntil,
        status,
        timezone,
        localDate: inputDate,
        localStartTime: utcToZonedTimeString(startAt, timezone),
        localEndTime: utcToZonedTimeString(endAt, timezone),
        breakMinutes: Number(plan.breakMinutes ?? DEFAULTS.DEFAULT_BREAK_MINUTES),
        durationMinutes: Number(plan.durationMinutes),
        price: Number(plan.offerPrice),
        planId: String(plan._id),
        planTitle: plan.title,
        currency: normalizeCurrency(plan.currency),
      });
    }
  }

  return {
    timezone,
    currency: normalizeCurrency(plan.currency),
    adminId: String(activeAdmin._id),
    plan,
    slots,
  };
};

const getSlotPlanPrice = async (planId) => {
  const plan = await SlotPlan.findOne({
    _id: planId,
    consultationType: CONSULTATION_TYPES.CHAT,
    isActive: true,
    deletedAt: null,
  }).lean();
  if (!plan) throw new AppError("Slot plan not found", 404, "SLOT_PLAN_NOT_FOUND");
  return plan;
};

const createSlotLock = async ({ userId, slotPlanId, startAt, timeZone = "" }) => {
  const plan = await getSlotPlanPrice(slotPlanId);
  const activeAdmin = await getActiveAdmin();
  const startDate = new Date(startAt);
  if (Number.isNaN(startDate.getTime())) {
    throw new AppError("Valid startAt is required", 400, "VALIDATION_ERROR");
  }

  const durationMinutes = Number(plan.durationMinutes);
  const breakMinutes = Number(plan.breakMinutes ?? DEFAULTS.DEFAULT_BREAK_MINUTES);
  const endAt = new Date(startDate.getTime() + durationMinutes * 60 * 1000);
  const busyUntil = new Date(endAt.getTime() + breakMinutes * 60 * 1000);
  const expiresAt = new Date(Date.now() + Number(process.env.SLOT_LOCK_MINUTES || DEFAULTS.SLOT_LOCK_MINUTES) * 60 * 1000);
  const idempotencyKey = `slot-lock:${userId}:${slotPlanId}:${startDate.toISOString()}`;
  const requestedTimezone = getTimezoneOrDefault(timeZone);
  const dayOfWeek = requestedTimezone
    ? new Date(`${utcToZonedDateString(startDate, requestedTimezone)}T00:00:00Z`).getUTCDay()
    : startDate.getUTCDay();
  const availability = await getAdminAvailabilityByDay(activeAdmin._id, dayOfWeek);
  const timezone = getTimezoneOrDefault(availability?.timezone || requestedTimezone);
  const localDate = utcToZonedDateString(startDate, timezone);
  const localStartMinutes = clock24ToMinutes(utcToZonedTimeString(startDate, timezone));
  const localBusyMinutes = localStartMinutes + durationMinutes + breakMinutes;

  if (!availability || !availability.isAvailable || !Array.isArray(availability.shifts) || !availability.shifts.length) {
    throw new AppError("Selected slot is not available", 409, "SLOT_NOT_AVAILABLE");
  }

  const fitsAnyShift = availability.shifts.some((shift) => {
    const shiftStart = clock24ToMinutes(shift.startTime);
    const shiftEnd = clock24ToMinutes(shift.endTime);
    return localStartMinutes >= shiftStart && localBusyMinutes <= shiftEnd;
  });
  if (!fitsAnyShift) {
    throw new AppError("Selected slot is outside working hours", 409, "SLOT_NOT_AVAILABLE");
  }

  const blockingIntervals = await getBlockingIntervals(activeAdmin._id, startDate, busyUntil);
  if (blockingIntervals.length) {
    throw new AppError("Selected slot is blocked", 409, "SLOT_BLOCKED");
  }

  const existingLock = await SlotLock.findOne({
    adminId: activeAdmin._id,
    slotPlanId,
    startAt: startDate,
    status: SLOT_LOCK_STATUS.ACTIVE,
  }).lean();

  if (existingLock) {
    if (new Date(existingLock.expiresAt).getTime() <= Date.now()) {
      await SlotLock.updateOne(
        { _id: existingLock._id },
        {
          $set: {
            status: SLOT_LOCK_STATUS.EXPIRED,
            releasedAt: new Date(),
          },
        }
      );
    } else if (String(existingLock.userId) === String(userId)) {
      return {
        lock: existingLock,
        plan,
        adminId: activeAdmin._id,
        timezone,
        finalAmount: Number(plan.offerPrice),
        currency: normalizeCurrency(plan.currency),
        idempotent: true,
      };
    } else {
      throw new AppError("Selected slot is temporarily locked", 409, "SLOT_ALREADY_LOCKED");
    }
  }

  const bookedIntervals = await getBookingIntervals(activeAdmin._id, startDate, busyUntil);
  if (bookedIntervals.length) {
    throw new AppError("Selected slot is already booked", 409, "SLOT_ALREADY_BOOKED");
  }

  const lockedIntervals = await getLockIntervals(activeAdmin._id, startDate, busyUntil);
  if (lockedIntervals.length) {
    throw new AppError("Selected slot is temporarily locked", 409, "SLOT_ALREADY_LOCKED");
  }

  try {
    const lock = await SlotLock.create({
      lockNumber: `LOCK-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
      userId,
      adminId: activeAdmin._id,
      slotPlanId,
      startAt: startDate,
      endAt,
      busyUntil,
      expiresAt,
      status: SLOT_LOCK_STATUS.ACTIVE,
      idempotencyKey,
    });

    return {
      lock,
      plan,
      adminId: activeAdmin._id,
      timezone,
      finalAmount: Number(plan.offerPrice),
      currency: normalizeCurrency(plan.currency),
    };
  } catch (error) {
    if (error.code === 11000) {
      const existing = await SlotLock.findOne({
        adminId: activeAdmin._id,
        slotPlanId,
        startAt: startDate,
        status: SLOT_LOCK_STATUS.ACTIVE,
      }).lean();

      if (
        existing &&
        String(existing.userId) === String(userId) &&
        new Date(existing.expiresAt).getTime() > Date.now()
      ) {
        return {
          lock: existing,
          plan,
          adminId: activeAdmin._id,
          timezone,
          finalAmount: Number(plan.offerPrice),
          currency: normalizeCurrency(plan.currency),
          idempotent: true,
        };
      }

      throw new AppError("Selected slot is temporarily locked", 409, "SLOT_ALREADY_LOCKED");
    }
    throw error;
  }
};

module.exports = {
  getActiveAdmin,
  validateSlotPlanPayload,
  normalizeAvailabilityPayload,
  getAdminAvailabilityByDay,
  getSlotPlanPrice,
  generateSlotsForDate,
  createSlotLock,
};
