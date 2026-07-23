const User = require('../models/user/User');
const Payment = require('../models/common/Payment');
const Invoice = require('../models/common/Invoice');
const Notification = require('../models/common/Notification');
const Refund = require('../models/common/Refund');
const WalletTransaction = require('../models/common/WalletTransaction');
const mongoose = require('mongoose');

const EMPTY_DASHBOARD_STATS = {
  users: 0,
  payments: 0,
  invoices: 0,
  notifications: 0,
  refunds: 0,
  walletTransactions: 0
};

const getDashboardStats = async () => {
  if (mongoose.connection.readyState !== 1) {
    return EMPTY_DASHBOARD_STATS;
  }

  const [users, payments, invoices, notifications, refunds, walletTransactions] = await Promise.all([
    User.countDocuments(),
    Payment.countDocuments(),
    Invoice.countDocuments(),
    Notification.countDocuments(),
    Refund.countDocuments(),
    WalletTransaction.countDocuments()
  ]);
  return { users, payments, invoices, notifications, refunds, walletTransactions };
};

module.exports = { getDashboardStats };
