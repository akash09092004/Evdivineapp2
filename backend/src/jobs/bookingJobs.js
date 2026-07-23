const mongoose = require("mongoose");
const Booking = require("../models/booking/Booking");
const SlotLock = require("../models/booking/SlotLock");
const ChatSession = require("../models/chat/ChatSession");
const { createNotification } = require("../services/notificationService");
const {
  BOOKING_STATUS,
  SLOT_LOCK_STATUS,
  CHAT_STATUS,
  PAYMENT_STATUS,
} = require("../utils/bookingConstants");

let bookingJobsStarted = false;
let bookingJobTimer = null;

const isDatabaseReady = () => mongoose.connection.readyState === 1;

const stopTimer = () => {
  if (bookingJobTimer) {
    clearInterval(bookingJobTimer);
    bookingJobTimer = null;
  }
};

const releaseExpiredSlotLocks = async () => {
  if (!isDatabaseReady()) return;
  const now = new Date();
  const expiredLocks = await SlotLock.find({
    status: SLOT_LOCK_STATUS.ACTIVE,
    expiresAt: { $lte: now },
  });

  if (!expiredLocks.length) return;

  for (const lock of expiredLocks) {
    lock.status = SLOT_LOCK_STATUS.EXPIRED;
    lock.releasedAt = now;
    await lock.save();
  }
};

const expirePendingBookings = async () => {
  if (!isDatabaseReady()) return;
  const now = new Date();
  const expiredBookings = await Booking.find({
    bookingStatus: BOOKING_STATUS.PAYMENT_PENDING,
    createdAt: { $lte: new Date(now.getTime() - 15 * 60 * 1000) },
  });

  if (!expiredBookings.length) return;

  for (const booking of expiredBookings) {
    booking.bookingStatus = BOOKING_STATUS.EXPIRED;
    booking.paymentStatus = PAYMENT_STATUS.CANCELLED;
    await booking.save();

    await SlotLock.updateOne(
      { _id: booking.slotLockId },
      {
        $set: {
          status: SLOT_LOCK_STATUS.EXPIRED,
          releasedAt: now,
        },
      }
    );
  }
};

const markReadyBookings = async () => {
  if (!isDatabaseReady()) return;
  const now = new Date();
  const readyWindowStart = new Date(now.getTime() + 5 * 60 * 1000);
  const bookings = await Booking.find({
    bookingStatus: {
      $in: [BOOKING_STATUS.CONFIRMED],
    },
    startAt: { $lte: readyWindowStart, $gte: now },
  });

  for (const booking of bookings) {
    booking.bookingStatus = BOOKING_STATUS.READY;
    await booking.save();
    if (booking.chatSessionId) {
      await ChatSession.updateOne(
        { _id: booking.chatSessionId },
        { $set: { status: CHAT_STATUS.SCHEDULED } }
      );
    }
  }
};

const sendBookingReminders = async () => {
  if (!isDatabaseReady()) return;
  const now = new Date();
  const reminderMarks = [
    { key: "oneHour", minutes: 60, title: "Booking starts in 1 hour" },
    { key: "fifteenMinutes", minutes: 15, title: "Booking starts in 15 minutes" },
    { key: "fiveMinutes", minutes: 5, title: "Booking starts in 5 minutes" },
  ];

  for (const mark of reminderMarks) {
    const from = new Date(now.getTime() + mark.minutes * 60 * 1000);
    const bookings = await Booking.find({
      bookingStatus: {
        $in: [BOOKING_STATUS.CONFIRMED, BOOKING_STATUS.READY, BOOKING_STATUS.WAITING_FOR_ADMIN, BOOKING_STATUS.IN_PROGRESS],
      },
      startAt: {
        $gte: new Date(from.getTime() - 60 * 1000),
        $lte: new Date(from.getTime() + 60 * 1000),
      },
      [`reminderFlags.${mark.key}`]: { $ne: true },
    });

    for (const booking of bookings) {
      booking.reminderFlags = booking.reminderFlags || {};
      booking.reminderFlags[mark.key] = true;
      await booking.save();

      await createNotification({
        recipientType: "user",
        recipient: booking.userId,
        title: mark.title,
        body: `Your chat booking ${booking.bookingNumber} starts soon.`,
        type: "booking",
        bookingId: booking._id,
        meta: { bookingId: String(booking._id), reminder: mark.key },
      });
    }
  }
};

const autoCloseChats = async () => {
  if (!isDatabaseReady()) return;
  const now = new Date();
  const bookings = await Booking.find({
    bookingStatus: {
      $in: [
        BOOKING_STATUS.CONFIRMED,
        BOOKING_STATUS.READY,
        BOOKING_STATUS.WAITING_FOR_ADMIN,
        BOOKING_STATUS.IN_PROGRESS,
      ],
    },
    endAt: { $lte: now },
  });

  for (const booking of bookings) {
    booking.bookingStatus = BOOKING_STATUS.COMPLETED;
    await booking.save();
    if (booking.chatSessionId) {
      await ChatSession.updateOne(
        { _id: booking.chatSessionId },
        {
          $set: {
            status: CHAT_STATUS.COMPLETED,
            actualEndedAt: now,
            endedAt: now,
          },
        }
      );
    }
  }
};

const runBookingJobs = async () => {
  if (!isDatabaseReady()) return;
  await releaseExpiredSlotLocks();
  await expirePendingBookings();
  await markReadyBookings();
  await sendBookingReminders();
  await autoCloseChats();
};

const startBookingJobs = () => {
  if (bookingJobsStarted) return;
  if (!isDatabaseReady()) {
    console.warn("[bookingJobs] MongoDB not connected, skipping background jobs");
    return;
  }
  bookingJobsStarted = true;
  void runBookingJobs();
  stopTimer();
  bookingJobTimer = setInterval(() => {
    void runBookingJobs().catch((error) => {
      console.log("[bookingJobs] run failed", error?.message || error);
    });
  }, 60 * 1000);
};

module.exports = {
  startBookingJobs,
  runBookingJobs,
};
