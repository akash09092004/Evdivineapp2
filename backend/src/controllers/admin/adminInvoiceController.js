const Invoice = require('../../models/common/Invoice');
const { asyncHandler } = require('../../utils/asyncHandler');
const { sendResponse } = require('../../utils/responseHandler');

const listInvoices = asyncHandler(async (req, res) => {
  const rows = await Invoice.find({}).sort({ createdAt: -1 }).lean();
  sendResponse(res, { data: rows });
});

module.exports = { listInvoices };

