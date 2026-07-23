const mongoose = require('mongoose');
const Admin = require('../../models/admin/Admin');
const { asyncHandler } = require('../../utils/asyncHandler');
const { sendResponse } = require('../../utils/responseHandler');

const getProfile = asyncHandler(async (req, res) => {
  let admin = null;

  if (req.auth?._id && mongoose.Types.ObjectId.isValid(req.auth._id)) {
    admin = await Admin.findById(req.auth._id).lean();
  }

  if (!admin) {
    admin = {
      _id: req.auth?._id || 'local-admin',
      email: req.auth?.email || '',
      name: req.auth?.name || 'Admin',
      role: req.auth?.role || 'admin',
      isActive: true
    };
  }

  sendResponse(res, { data: admin });
});

module.exports = { getProfile };
