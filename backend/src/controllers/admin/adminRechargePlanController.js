const RechargePlan = require('../../models/common/RechargePlan');
const { asyncHandler } = require('../../utils/asyncHandler');
const { sendResponse } = require('../../utils/responseHandler');

const createPlan = asyncHandler(async (req, res) => {
  const plan = await RechargePlan.create(req.body);
  sendResponse(res, { message: 'Recharge plan created', data: plan });
});

const listPlans = asyncHandler(async (req, res) => {
  const rows = await RechargePlan.find({}).sort({ amount: 1 }).lean();
  sendResponse(res, { data: rows });
});

module.exports = { createPlan, listPlans };

