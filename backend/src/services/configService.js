const BonusConfig = require('../models/common/BonusConfig');
const PricingConfig = require('../models/common/PricingConfig');

const getLatestBonusConfig = async () => {
  let config = await BonusConfig.findOne().sort({ createdAt: -1 }).lean();
  if (!config) {
    const created = await BonusConfig.create({});
    config = created.toObject();
  }
  return config;
};

const updateBonusConfig = async (payload = {}) => {
  let config = await BonusConfig.findOne().sort({ createdAt: -1 });
  if (!config) config = new BonusConfig({});
  Object.assign(config, payload);
  await config.save();
  return config.toObject();
};

const getLatestPricingConfig = async () => {
  let config = await PricingConfig.findOne().sort({ createdAt: -1 }).lean();
  if (!config) {
    const created = await PricingConfig.create({});
    config = created.toObject();
  }
  return config;
};

const updatePricingConfig = async (payload = {}) => {
  let config = await PricingConfig.findOne().sort({ createdAt: -1 });
  if (!config) config = new PricingConfig({});
  Object.assign(config, payload);
  await config.save();
  return config.toObject();
};

const getSessionRate = async (type) => {
  const pricing = await getLatestPricingConfig();
  if (type === 'chat') return Number(pricing.chatRatePerMinute || 0);
  if (type === 'voice') return Number(pricing.voiceRatePerMinute || 0);
  if (type === 'video') return Number(pricing.videoRatePerMinute || 0);
  return 0;
};

const getChatFreeSeconds = async () => {
  const pricing = await getLatestPricingConfig();
  return Number(pricing.chatFreeSeconds || process.env.DEFAULT_CHAT_FREE_SECONDS || 300);
};

const getLowWalletAlertThreshold = async () => {
  const pricing = await getLatestPricingConfig();
  return Number(pricing.lowWalletAlertThreshold || process.env.LOW_WALLET_ALERT_THRESHOLD || 100);
};

module.exports = {
  getLatestBonusConfig,
  updateBonusConfig,
  getLatestPricingConfig,
  updatePricingConfig,
  getSessionRate,
  getChatFreeSeconds,
  getLowWalletAlertThreshold
};
