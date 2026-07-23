const Payment = require('../../models/common/Payment');
const { asyncHandler } = require('../../utils/asyncHandler');
const { sendResponse } = require('../../utils/responseHandler');

const listPayments = asyncHandler(async (req, res) => {
  const rows = await Payment.find({}).sort({ createdAt: -1 }).lean();
  sendResponse(res, { data: rows });
});

module.exports = { listPayments };

