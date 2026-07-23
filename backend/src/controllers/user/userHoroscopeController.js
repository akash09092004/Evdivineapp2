const Horoscope = require('../../models/common/Horoscope');
const { asyncHandler } = require('../../utils/asyncHandler');
const { sendResponse } = require('../../utils/responseHandler');

const todayHoroscope = asyncHandler(async (req, res) => {
  const { rashi } = req.params;
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  const item = await Horoscope.findOne({ rashi, date }).lean();
  sendResponse(res, { data: item });
});

const listHoroscopes = asyncHandler(async (req, res) => {
  const rows = await Horoscope.find({}).sort({ date: -1 }).lean();
  sendResponse(res, { data: rows });
});

module.exports = { todayHoroscope, listHoroscopes };

