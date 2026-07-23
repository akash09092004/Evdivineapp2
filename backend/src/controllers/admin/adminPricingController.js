const { asyncHandler } = require('../../utils/asyncHandler');
const { sendResponse } = require('../../utils/responseHandler');
const AppError = require('../../utils/AppError');
const { getLatestPricingConfig, updatePricingConfig } = require('../../services/configService');

const getPricingConfig = asyncHandler(async (req, res) => {
  const config = await getLatestPricingConfig();
  sendResponse(res, { data: config });
});

const setPricingConfig = asyncHandler(async (req, res) => {
  const {
    chatRatePerMinute,
    chatFreeSeconds,
    voiceRatePerMinute,
    videoRatePerMinute,
    bookingBaseFee,
    platformCommissionPercent,
    walletRechargeBonusPercent,
    lowWalletAlertThreshold,
    currency,
    isActive
  } = req.body;

  const payload = {};
  const numericFields = {
    chatRatePerMinute,
    chatFreeSeconds,
    voiceRatePerMinute,
    videoRatePerMinute,
    bookingBaseFee,
    platformCommissionPercent,
    walletRechargeBonusPercent,
    lowWalletAlertThreshold
  };

  for (const [key, value] of Object.entries(numericFields)) {
    if (value !== undefined) {
      const num = Number(value);
      if (!Number.isFinite(num) || num < 0) throw new AppError(`${key} must be a non-negative number`, 400, 'PRICE_INVALID');
      payload[key] = num;
    }
  }

  if (currency !== undefined) payload.currency = currency;
  if (isActive !== undefined) payload.isActive = !!isActive;

  const config = await updatePricingConfig(payload);
  sendResponse(res, { message: 'Pricing settings updated', data: config });
});

module.exports = { getPricingConfig, setPricingConfig };
