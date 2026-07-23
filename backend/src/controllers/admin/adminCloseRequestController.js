const CloseRequest = require('../../models/admin/CloseRequest');
const { asyncHandler } = require('../../utils/asyncHandler');
const { sendResponse } = require('../../utils/responseHandler');

const listCloseRequests = asyncHandler(async (req, res) => {
  const rows = await CloseRequest.find({}).sort({ createdAt: -1 }).lean();
  sendResponse(res, {
    data: rows.map((row) => ({
      user: row.user || 'N/A',
      booking: row.booking || 'N/A',
      reason: row.reason || row.note || 'N/A',
      status: row.status || 'N/A',
      date: row.createdAt || null
    }))
  });
});

const createCloseRequest = asyncHandler(async (req, res) => {
  const user = String(req.body.user || '').trim();
  const booking = String(req.body.booking || '').trim();
  const reason = String(req.body.reason || '').trim();
  const status = String(req.body.status || 'pending').trim();
  const note = String(req.body.note || '').trim();

  if (!user || !booking) {
    return sendResponse(res, {
      statusCode: 400,
      success: false,
      message: 'user and booking are required'
    });
  }

  const doc = await CloseRequest.create({
    user,
    booking,
    reason,
    status,
    note
  });

  sendResponse(res, {
    message: 'Close request saved',
    data: {
      user: doc.user,
      booking: doc.booking,
      reason: doc.reason,
      status: doc.status,
      date: doc.createdAt
    }
  });
});

const updateCloseRequest = asyncHandler(async (req, res) => {
  const doc = await CloseRequest.findByIdAndUpdate(
    req.params.id,
    {
      ...(req.body.user !== undefined ? { user: String(req.body.user).trim() } : {}),
      ...(req.body.booking !== undefined ? { booking: String(req.body.booking).trim() } : {}),
      ...(req.body.reason !== undefined ? { reason: String(req.body.reason).trim() } : {}),
      ...(req.body.status !== undefined ? { status: String(req.body.status).trim() } : {}),
      ...(req.body.note !== undefined ? { note: String(req.body.note).trim() } : {})
    },
    { new: true }
  );

  sendResponse(res, {
    message: 'Close request updated',
    data: doc
  });
});

module.exports = {
  listCloseRequests,
  createCloseRequest,
  updateCloseRequest
};
