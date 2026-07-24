const mongoose = require("mongoose");
const User = require("../../models/user/User");
const UserWallet = require("../../models/user/UserWallet");
const Payment = require("../../models/common/Payment");
const WalletTransaction = require("../../models/common/WalletTransaction");
const Refund = require("../../models/common/Refund");
const Notification = require("../../models/common/Notification");
const ChatSession = require("../../models/chat/ChatSession");
const ChatMessage = require("../../models/chat/ChatMessage");
const Booking = require("../../models/booking/Booking");
const SlotLock = require("../../models/booking/SlotLock");
const SlotPlan = require("../../models/booking/SlotPlan");
const AdminAvailability = require("../../models/booking/AdminAvailability");
const AdminLeave = require("../../models/booking/AdminLeave");
const BlockedTime = require("../../models/booking/BlockedTime");
const AppError = require("../../utils/AppError");
const {
  BOOKING_STATUS,
  PAYMENT_STATUS,
  SLOT_LOCK_STATUS,
  CHAT_STATUS,
  PAYMENT_METHODS,
  TRANSACTION_TYPES,
  DEFAULTS,
} = require("../../utils/bookingConstants");
const { createNotification } = require("../notificationService");
const { getIO } = require("../../sockets/socket");

const generateNumber = (prefix) =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

const getWalletDocument = async (userId, session = null) => {
  const user = await User.findById(userId).session(session || null);
  const userBalance = Number(user?.walletBalance || 0);
  let wallet = await UserWallet.findOne({ user: userId }).session(session || null);
  if (!wallet) {
    wallet = new UserWallet({
      user: userId,
      balance: userBalance,
      availableBalance: userBalance,
      totalCredited: userBalance,
      totalDebited: 0,
      currency: DEFAULTS.CURRENCY,
      status: "active",
    });
    await wallet.save({ session });
  } else {
    const walletBalance = Number(wallet.availableBalance || wallet.balance || 0);
    if (userBalance > walletBalance) {
      wallet.balance = userBalance;
      wallet.availableBalance = userBalance;
      wallet.totalCredited = Math.max(Number(wallet.totalCredited || 0), userBalance);
      await wallet.save({ session });
    }
  }
  return wallet;
};

const syncUserWalletBalance = async (userId, balance, session = null) => {
  await User.updateOne({ _id: userId }, { $set: { walletBalance: balance } }).session(session || null);
  await UserWallet.updateOne(
    { user: userId },
    {
      $set: {
        balance,
        availableBalance: balance,
      },
    }
  ).session(session || null);
};

const normalizePaymentStatus = (status) => {
  const value = String(status || "").toLowerCase();
  if (value === PAYMENT_STATUS.PAID) return PAYMENT_STATUS.COMPLETED;
  if (Object.values(PAYMENT_STATUS).includes(value)) return value;
  return PAYMENT_STATUS.PENDING;
};

const createBookingFromLock = async ({ userId, lockId, paymentMethod }, session = null) => {
  const lock = await SlotLock.findOne({
    _id: lockId,
    userId,
    status: SLOT_LOCK_STATUS.ACTIVE,
  }).session(session || null);

  if (!lock) {
    throw new AppError("Active lock not found", 404, "SLOT_LOCK_NOT_FOUND");
  }

  if (lock.expiresAt <= new Date()) {
    throw new AppError("Slot lock expired", 400, "SLOT_LOCK_EXPIRED");
  }

  const plan = await SlotPlan.findOne({
    _id: lock.slotPlanId,
    isActive: true,
    deletedAt: null,
  }).session(session || null);
  if (!plan) {
    throw new AppError("Slot plan not found", 404, "SLOT_PLAN_NOT_FOUND");
  }

  const duplicate = await Booking.findOne({
    slotLockId: lock._id,
    userId,
  }).session(session || null);
  if (duplicate) return duplicate;

  const booking = new Booking({
    bookingNumber: generateNumber("BK"),
    userId,
    adminId: lock.adminId,
    slotPlanId: plan._id,
    slotLockId: lock._id,
    consultationType: "chat",
    startAt: lock.startAt,
    endAt: lock.endAt,
    busyUntil: lock.busyUntil,
    durationMinutes: plan.durationMinutes,
    breakMinutes: plan.breakMinutes,
    basePrice: plan.basePrice,
    offerPrice: plan.offerPrice,
    finalAmount: plan.offerPrice,
    currency: plan.currency || DEFAULTS.CURRENCY,
    paymentMethod,
    paymentStatus: PAYMENT_STATUS.PENDING,
    bookingStatus: BOOKING_STATUS.PAYMENT_PENDING,
    priceSnapshot: {
      planTitle: plan.title,
      durationMinutes: plan.durationMinutes,
      breakMinutes: plan.breakMinutes,
      basePrice: plan.basePrice,
      offerPrice: plan.offerPrice,
      finalAmount: plan.offerPrice,
      currency: plan.currency || DEFAULTS.CURRENCY,
    },
    idempotencyKey: `booking-create:${lock._id.toString()}`,
  });

  await booking.save({ session });
  lock.bookingId = booking._id;
  await lock.save({ session });
  return booking;
};

const createChatRoomForBooking = async ({ booking, session = null }) => {
  const roomId = `booking_${booking.bookingNumber}`;
  let chat = await ChatSession.findOne({ bookingId: booking._id }).session(session || null);

  if (!chat) {
    chat = new ChatSession({
      chatroomId: roomId,
      user: booking.userId,
      userId: String(booking.userId),
      adminId: String(booking.adminId),
      hostId: String(booking.adminId),
      adminName: "",
      bookingId: booking._id,
      bookingNumber: booking.bookingNumber,
      slotPlanId: booking.slotPlanId,
      scheduledStartAt: booking.startAt,
      scheduledEndAt: booking.endAt,
      durationMinutes: booking.durationMinutes,
      status: CHAT_STATUS.SCHEDULED,
      requestedAt: booking.createdAt || new Date(),
      metadata: {
        booking: true,
      },
    });
    await chat.save({ session });
  } else {
    chat.chatroomId = roomId;
    chat.scheduledStartAt = booking.startAt;
    chat.scheduledEndAt = booking.endAt;
    chat.durationMinutes = booking.durationMinutes;
    chat.status = chat.status || CHAT_STATUS.SCHEDULED;
    await chat.save({ session });
  }

  booking.chatSessionId = chat._id;
  booking.chatRoomId = roomId;
  booking.chatRoomStatus = CHAT_STATUS.SCHEDULED;
  await booking.save({ session });

  return chat;
};

const confirmBookingPayment = async ({ bookingId, paymentMethod, paymentRecord = null, gatewayResponse = {}, session = null }) => {
  const booking = await Booking.findById(bookingId).session(session || null);
  if (!booking) throw new AppError("Booking not found", 404, "BOOKING_NOT_FOUND");

  if (booking.bookingStatus === BOOKING_STATUS.CONFIRMED && booking.paymentStatus === PAYMENT_STATUS.COMPLETED) {
    return booking;
  }

  booking.paymentStatus = PAYMENT_STATUS.COMPLETED;
  booking.bookingStatus = BOOKING_STATUS.CONFIRMED;
  booking.paymentMethod = paymentMethod || booking.paymentMethod;
  if (paymentRecord) booking.paymentId = paymentRecord._id;
  booking.rawGatewayResponse = gatewayResponse;
  await booking.save({ session });

  const lock = await SlotLock.findById(booking.slotLockId).session(session || null);
  if (lock && lock.status === SLOT_LOCK_STATUS.ACTIVE) {
    lock.status = SLOT_LOCK_STATUS.CONVERTED;
    lock.bookingId = booking._id;
    lock.convertedAt = new Date();
    await lock.save({ session });
  }

  const chat = await createChatRoomForBooking({ booking, session });

  const io = getIO();
  if (io) {
    io.to(`admin:booking`).emit("booking:new-confirmed", { bookingId: String(booking._id), booking: booking.toObject() });
    io.to(`user:${String(booking.userId)}`).emit("payment:completed", { bookingId: String(booking._id), booking: booking.toObject() });
  }

  await Promise.all([
    createNotification({
      recipientType: "user",
      recipient: booking.userId,
      title: "Booking Confirmed",
      body: `Your ${booking.consultationType} booking is confirmed.`,
      type: "booking",
      bookingId: booking._id,
      meta: { bookingId: String(booking._id) },
    }),
    createNotification({
      recipientType: "admin",
      recipient: booking.adminId,
      title: "New Paid Booking",
      body: `A new booking ${booking.bookingNumber} has been confirmed.`,
      type: "booking",
      bookingId: booking._id,
      meta: { bookingId: String(booking._id) },
    }),
  ]);

  return { booking, chat };
};

const processWalletPaymentForBooking = async ({ bookingId, userId }) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const booking = await Booking.findOne({ _id: bookingId, userId }).session(session);
    if (!booking) throw new AppError("Booking not found", 404, "BOOKING_NOT_FOUND");

    const bookingStatus = String(booking.bookingStatus || "").toLowerCase();
    const paymentStatus = String(booking.paymentStatus || "").toLowerCase();
    const alreadyPaid =
      bookingStatus === BOOKING_STATUS.CONFIRMED ||
      paymentStatus === PAYMENT_STATUS.COMPLETED ||
      paymentStatus === PAYMENT_STATUS.PAID;

    if (alreadyPaid) {
      const existingPayment = await Payment.findOne({
        bookingId: booking._id,
        user: userId,
        purpose: "booking",
      })
        .sort({ createdAt: -1 })
        .session(session);
      const wallet = await getWalletDocument(userId, session);
      await session.commitTransaction();
      session.endSession();
      return {
        booking,
        payment: existingPayment || null,
        wallet,
        alreadyPaid: true,
        idempotent: true,
      };
    }

    if (booking.bookingStatus !== BOOKING_STATUS.PAYMENT_PENDING) {
      throw new AppError(
        "Booking is not in payment pending state",
        409,
        "BOOKING_NOT_PAYABLE"
      );
    }

    const wallet = await getWalletDocument(userId, session);
    if (wallet.status !== "active") throw new AppError("Wallet is inactive", 403, "WALLET_INACTIVE");

    const amount = Number(booking.finalAmount || 0);
    if (Number(wallet.availableBalance || wallet.balance || 0) < amount) {
      throw new AppError("Insufficient wallet balance", 402, "INSUFFICIENT_BALANCE");
    }

    const idempotencyKey = `wallet-booking:${booking._id.toString()}`;
    const existingTx = await WalletTransaction.findOne({ idempotencyKey }).session(session);
    if (existingTx) {
      const existingPayment = await Payment.findOne({
        bookingId: booking._id,
        user: userId,
        purpose: "booking",
        status: PAYMENT_STATUS.COMPLETED,
      })
        .sort({ createdAt: -1 })
        .session(session);
      await session.commitTransaction();
      session.endSession();
      return {
        booking,
        payment: existingPayment || null,
        wallet,
        idempotent: true,
        alreadyPaid: true,
      };
    }

    const balanceBefore = Number(wallet.availableBalance || wallet.balance || 0);
    const balanceAfter = balanceBefore - amount;
    wallet.balance = balanceAfter;
    wallet.availableBalance = balanceAfter;
    wallet.totalDebited = Number(wallet.totalDebited || 0) + amount;
    await wallet.save({ session });

    await syncUserWalletBalance(userId, balanceAfter, session);

    const transaction = await WalletTransaction.create(
      [
        {
          transactionNumber: generateNumber("WT"),
          ownerType: "user",
          owner: userId,
          amount,
          direction: "debit",
          type: TRANSACTION_TYPES.BOOKING_PAYMENT,
          reference: booking._id.toString(),
          walletId: wallet._id,
          userId,
          currency: booking.currency,
          balanceBefore,
          balanceAfter,
          referenceType: "booking",
          referenceId: booking._id.toString(),
          description: `Booking payment for ${booking.bookingNumber}`,
          status: "completed",
          idempotencyKey,
          meta: { bookingId: String(booking._id) },
        },
      ],
      { session }
    );

    const payment = await Payment.create(
      [
        {
          user: userId,
          bookingId: booking._id,
          amount,
          expectedAmount: amount,
          currency: booking.currency,
          purpose: "booking",
          status: PAYMENT_STATUS.COMPLETED,
          orderId: "",
          paymentId: transaction[0]._id.toString(),
          gateway: "wallet",
          gatewayOrderId: "",
          gatewayCaptureId: transaction[0]._id.toString(),
          platformCommissionAmount: 0,
          gatewayFee: 0,
          idempotencyKey,
          rawGatewayResponse: {},
          meta: {
            bookingId: String(booking._id),
            paymentMethod: "wallet",
          },
        },
      ],
      { session }
    );

    const confirmed = await confirmBookingPayment({
      bookingId: booking._id,
      paymentMethod: PAYMENT_METHODS.WALLET,
      paymentRecord: payment[0],
      gatewayResponse: { walletTransactionId: transaction[0]._id.toString() },
      session,
    });

    await session.commitTransaction();
    session.endSession();
    return { booking: confirmed.booking, payment: payment[0], wallet, transaction: transaction[0] };
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

const refundBookingToWallet = async ({ bookingId, requestedBy = "user", reason = "" }) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const booking = await Booking.findById(bookingId).session(session);
    if (!booking) throw new AppError("Booking not found", 404, "BOOKING_NOT_FOUND");

    const refundIdempotencyKey = `booking-refund:${booking._id.toString()}`;
    const existingRefund = await Refund.findOne({ idempotencyKey: refundIdempotencyKey }).session(session);
    if (existingRefund) {
      await session.commitTransaction();
      session.endSession();
      return { booking, refund: existingRefund, idempotent: true };
    }

    const now = new Date();
    const diffMs = new Date(booking.startAt).getTime() - now.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    let refundPercentage = 0;
    if (requestedBy === "admin") {
      refundPercentage = 100;
    } else if (diffHours >= 4) {
      refundPercentage = 100;
    } else if (diffHours >= 1) {
      refundPercentage = 50;
    } else {
      refundPercentage = 0;
    }

    const refundAmount = Number((Number(booking.finalAmount || 0) * refundPercentage) / 100);
    const wallet = await getWalletDocument(booking.userId, session);
    const balanceBefore = Number(wallet.availableBalance || wallet.balance || 0);
    const balanceAfter = balanceBefore + refundAmount;

    if (refundAmount > 0) {
      wallet.balance = balanceAfter;
      wallet.availableBalance = balanceAfter;
      wallet.totalCredited = Number(wallet.totalCredited || 0) + refundAmount;
      await wallet.save({ session });
      await syncUserWalletBalance(booking.userId, balanceAfter, session);
    }

    const walletTx = refundAmount > 0
      ? await WalletTransaction.create(
          [
            {
              transactionNumber: generateNumber("WT"),
              ownerType: "user",
              owner: booking.userId,
              amount: refundAmount,
              direction: "credit",
              type: TRANSACTION_TYPES.BOOKING_REFUND,
              reference: booking._id.toString(),
              walletId: wallet._id,
              userId: booking.userId,
              currency: booking.currency,
              balanceBefore,
              balanceAfter,
              referenceType: "booking",
              referenceId: booking._id.toString(),
              description: `Refund for ${booking.bookingNumber}`,
              status: "completed",
              idempotencyKey: refundIdempotencyKey,
              meta: { bookingId: String(booking._id), refund: true },
            },
          ],
          { session }
        )
      : [];

    const refund = await Refund.create(
      [
        {
          user: booking.userId,
          payment: booking.paymentId || null,
          bookingId: booking._id,
          amount: Number(booking.finalAmount || 0),
          reason,
          refundNumber: generateNumber("RF"),
          requestedBy,
          originalAmount: Number(booking.finalAmount || 0),
          refundPercentage,
          refundAmount,
          refundMethod: "wallet",
          currency: booking.currency,
          status: refundAmount > 0 ? "completed" : "rejected",
          walletTransactionId: walletTx[0]?._id || null,
          processedAt: refundAmount > 0 ? new Date() : null,
          idempotencyKey: refundIdempotencyKey,
        },
      ],
      { session }
    );

    if (refundAmount > 0) {
      booking.bookingStatus = BOOKING_STATUS.REFUNDED;
    } else if (requestedBy === "admin") {
      booking.bookingStatus = BOOKING_STATUS.CANCELLED_BY_ADMIN;
    } else {
      booking.bookingStatus = BOOKING_STATUS.CANCELLED_BY_USER;
    }
    booking.paymentStatus = refundAmount > 0 ? PAYMENT_STATUS.REFUNDED : booking.paymentStatus;
    booking.cancelledBy = requestedBy;
    booking.cancellationReason = reason;
    booking.refundStatus = refundAmount > 0 ? "completed" : "not_eligible";
    booking.refundedAmount = refundAmount;
    booking.refundId = refund[0]._id;
    await booking.save({ session });

    const lock = await SlotLock.findById(booking.slotLockId).session(session);
    if (lock && lock.status === SLOT_LOCK_STATUS.CONVERTED) {
      lock.status = SLOT_LOCK_STATUS.RELEASED;
      lock.releasedAt = new Date();
      await lock.save({ session });
    }

    if (booking.chatSessionId) {
      await ChatSession.updateOne(
        { _id: booking.chatSessionId },
        {
          $set: {
            status: "cancelled",
            endedAt: new Date(),
            actualEndedAt: new Date(),
            endReason: reason,
            endedBy: requestedBy,
          },
        }
      ).session(session);
    }

    const io = getIO();
    if (io) {
      io.to(`user:${String(booking.userId)}`).emit("booking:cancelled", { bookingId: String(booking._id) });
      io.to(`admin:booking`).emit("booking:cancelled", { bookingId: String(booking._id) });
      if (refundAmount > 0) {
        io.to(`user:${String(booking.userId)}`).emit("refund:completed", { bookingId: String(booking._id), refundAmount });
      }
    }

    await createNotification({
      recipientType: "user",
      recipient: booking.userId,
      title: refundAmount > 0 ? "Refund Completed" : "Booking Cancelled",
      body: refundAmount > 0 ? `Refund of ${refundAmount} ${booking.currency} has been credited to your wallet.` : "Your booking was cancelled.",
      type: "refund",
      bookingId: booking._id,
      meta: { bookingId: String(booking._id), refundAmount },
    });

    await session.commitTransaction();
    session.endSession();
    return { booking, refund: refund[0], refundAmount, walletTransaction: walletTx[0] || null };
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

module.exports = {
  generateNumber,
  getWalletDocument,
  syncUserWalletBalance,
  createBookingFromLock,
  createChatRoomForBooking,
  confirmBookingPayment,
  processWalletPaymentForBooking,
  refundBookingToWallet,
};
