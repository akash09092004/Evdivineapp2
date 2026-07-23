const Referral = require('../models/user/Referral');

const createReferralRecord = async ({ referrer, referredUser, bonus = 0 }) => {
  return Referral.create({ referrer, referredUser, bonus, status: 'pending' });
};

module.exports = { createReferralRecord };

