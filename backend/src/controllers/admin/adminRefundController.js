const Refund = require('../../models/common/Refund');
const { initiateRefund } = require('../../services/refundService');
const { asyncHandler } = require('../../utils/asyncHandler');
const { sendResponse } = require('../../utils/responseHandler');

const listRefunds = asyncHandler(async (req, res) => {
  const rows = await Refund.find({}).sort({ createdAt: -1 }).lean();
  sendResponse(res, { data: rows });
});

const processRefund = asyncHandler(async (req, res) => {
  const refund = await initiateRefund(req.body);
  sendResponse(res, { message: 'Refund processed', data: refund });
});

module.exports = { listRefunds, processRefund };

