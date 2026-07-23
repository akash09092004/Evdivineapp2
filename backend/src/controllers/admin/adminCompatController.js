const mongoose = require('mongoose');
const User = require('../../models/user/User');
const HistoryNote = require('../../../models/HistoryNote');
const Refund = require('../../models/common/Refund');
const WalletTransaction = require('../../models/common/WalletTransaction');
const AdminActivityLog = require('../../models/admin/AdminActivityLog');
const { creditWallet } = require('../../services/walletService');
const { getDashboardStats } = require('../../services/analyticsService');
const { asyncHandler } = require('../../utils/asyncHandler');
const AppError = require('../../utils/AppError');
const { sendResponse } = require('../../utils/responseHandler');

const dashboard = asyncHandler(async (req, res) => {
  const stats = await getDashboardStats();
  sendResponse(res, { data: stats });
});

const listSubscribers = asyncHandler(async (req, res) => {
  const rows = await User.find({}).sort({ createdAt: -1 }).lean();
  sendResponse(res, { data: rows });
});

const listUserCredits = asyncHandler(async (req, res) => {
  const rows = await WalletTransaction.find({ ownerType: 'user' }).sort({ createdAt: -1 }).lean();
  sendResponse(res, { data: rows });
});

const addCredit = asyncHandler(async (req, res) => {
  const userId = String(
    req.params.userId ||
      req.params.id ||
      req.body.userId ||
      req.body.id ||
      req.body.ownerId ||
      ''
  ).trim();
  const amount = Number(req.body.amount);

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new AppError('Invalid user id', 400, 'VALIDATION_ERROR');
  }

  if (!Number.isFinite(amount) || amount <= 0) {
    throw new AppError('amount must be a positive number', 400, 'AMOUNT_INVALID');
  }

  const user = await User.findById(userId);
  if (!user) {
    throw new AppError('User not found', 404, 'USER_NOT_FOUND');
  }

  await creditWallet({
    ownerType: 'user',
    ownerId: userId,
    amount,
    type: 'admin_credit',
    reference: `admin_credit_${req.auth?.id || 'admin'}_${Date.now()}`,
    meta: {
      addedBy: req.auth?.id || null,
      addedByRole: req.auth?.role || 'admin',
      source: 'admin_user_credits'
    }
  });

  const transaction = await WalletTransaction.findOne({
    ownerType: 'user',
    owner: userId,
    type: 'admin_credit'
  })
    .sort({ createdAt: -1 })
    .lean();

  const updatedUser = await User.findById(userId).lean();

  sendResponse(res, {
    message: 'Credit added successfully',
    data: {
      user: updatedUser,
      transaction: transaction || null
    }
  });
});

const listRefundTransactions = asyncHandler(async (req, res) => {
  const rows = await Refund.find({}).sort({ createdAt: -1 }).lean();
  sendResponse(res, { data: rows });
});

const getRefundAmounts = asyncHandler(async (req, res) => {
  const [summary] = await Refund.aggregate([
    {
      $group: {
        _id: null,
        totalAmount: { $sum: '$amount' },
        count: { $sum: 1 },
        pendingAmount: {
          $sum: { $cond: [{ $eq: ['$status', 'pending'] }, '$amount', 0] }
        },
        processedAmount: {
          $sum: { $cond: [{ $eq: ['$status', 'processed'] }, '$amount', 0] }
        },
        rejectedAmount: {
          $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, '$amount', 0] }
        }
      }
    }
  ]);

  sendResponse(res, {
    data: summary || {
      totalAmount: 0,
      count: 0,
      pendingAmount: 0,
      processedAmount: 0,
      rejectedAmount: 0
    }
  });
});

const listHistoryNotes = asyncHandler(async (req, res) => {
  const rows = await HistoryNote.find({})
    .sort({ createdAt: -1 })
    .populate([
      { path: 'user', select: 'name email phone profileImage' },
      {
        path: 'booking',
        select: 'bookingNumber bookingStatus paymentStatus startAt endAt consultationType finalAmount currency userId adminId',
        populate: [
          { path: 'userId', select: 'name email phone profileImage' },
          { path: 'adminId', select: 'name email' }
        ]
      },
      { path: 'createdBy', select: 'name email' }
    ])
    .lean();

  const normalizePerson = (person) => {
    if (!person) return null;
    return {
      _id: person._id || null,
      name: person.name || '',
      email: person.email || '',
      phone: person.phone || '',
      profileImage: person.profileImage || ''
    };
  };

  const normalizeBooking = (booking) => {
    if (!booking) return null;
    return {
      _id: booking._id || null,
      bookingId: booking._id || null,
      bookingNumber: booking.bookingNumber || '',
      bookingStatus: booking.bookingStatus || '',
      paymentStatus: booking.paymentStatus || '',
      consultationType: booking.consultationType || '',
      startAt: booking.startAt || null,
      endAt: booking.endAt || null,
      finalAmount: booking.finalAmount ?? null,
      currency: booking.currency || '',
      user: normalizePerson(booking.userId),
      admin: normalizePerson(booking.adminId)
    };
  };

  const normalized = rows.map((row) => {
    const user = normalizePerson(row.user);
    const booking = normalizeBooking(row.booking);
    const author = normalizePerson(row.createdBy);
    const note = row.note || row.title || '';

    return {
      _id: row._id,
      user,
      userName: user?.name || booking?.user?.name || booking?.user?.email || '',
      booking,
      bookingId: booking?._id || row.booking || null,
      note,
      message: note,
      title: row.title || note,
      createdBy: author,
      author: author?.name || author?.email || '',
      createdAt: row.createdAt || null,
      date: row.createdAt || null,
      updatedAt: row.updatedAt || null
    };
  });

  sendResponse(res, { data: normalized });
});

module.exports = {
  dashboard,
  listSubscribers,
  listUserCredits,
  addCredit,
  listRefundTransactions,
  getRefundAmounts,
  listHistoryNotes
};
