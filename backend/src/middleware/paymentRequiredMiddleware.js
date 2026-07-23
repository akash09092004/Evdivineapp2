const AppError = require('../utils/AppError');

const paymentRequiredMiddleware = (req, res, next) => {
  if (!req.sessionAllowed) return next(new AppError('Payment required', 402, 'PAYMENT_REQUIRED'));
  next();
};

module.exports = paymentRequiredMiddleware;

