const Horoscope = require('../../models/common/Horoscope');
const { asyncHandler } = require('../../utils/asyncHandler');
const { sendResponse } = require('../../utils/responseHandler');

const createHoroscope = asyncHandler(async (req, res) => {
  const item = await Horoscope.create(req.body);
  sendResponse(res, { message: 'Horoscope saved', data: item });
});

const listHoroscopes = asyncHandler(async (req, res) => {
  const rows = await Horoscope.find({}).sort({ date: -1 }).lean();
  sendResponse(res, { data: rows });
});

module.exports = { createHoroscope, listHoroscopes };

