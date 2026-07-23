const mongoose = require('mongoose');
const { getDashboardStats } = require('../../services/analyticsService');
const { asyncHandler } = require('../../utils/asyncHandler');
const { sendResponse } = require('../../utils/responseHandler');

const dashboard = asyncHandler(async (req, res) => {
  if (mongoose.connection.readyState !== 1) {
    sendResponse(res, {
      data: {
        users: 0,
        payments: 0,
        invoices: 0,
        notifications: 0,
        refunds: 0,
        walletTransactions: 0
      }
    });
    return;
  }

  const stats = await getDashboardStats();
  sendResponse(res, { data: stats });
});

module.exports = { dashboard };
