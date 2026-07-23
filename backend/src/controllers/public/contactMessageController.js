const DropMessage = require('../../models/admin/DropMessage');
const { asyncHandler } = require('../../utils/asyncHandler');
const { sendResponse } = require('../../utils/responseHandler');

const createContactMessage = asyncHandler(async (req, res) => {
  const name = String(req.body.name || '').trim();
  const email = String(req.body.email || '').trim();
  const phone = String(req.body.phone || '').trim();
  const subject = String(req.body.subject || '').trim();
  const message = String(req.body.message || '').trim();

  if (!name || !email || !message) {
    return sendResponse(res, {
      statusCode: 400,
      success: false,
      message: 'name, email and message are required'
    });
  }

  const doc = await DropMessage.create({
    name,
    email,
    phone,
    subject,
    message,
    status: 'new',
    note: ''
  });

  return sendResponse(res, {
    statusCode: 201,
    message: 'Contact message saved',
    data: {
      _id: String(doc._id),
      name: doc.name,
      email: doc.email,
      phone: doc.phone,
      subject: doc.subject,
      message: doc.message,
      status: doc.status,
      createdAt: doc.createdAt || null
    }
  });
});

module.exports = {
  createContactMessage
};
