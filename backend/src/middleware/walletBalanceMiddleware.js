const AppError = require('../utils/AppError');

const walletBalanceMiddleware = (minBalance = 0) => (req, res, next) => {
  const balance = Number(req.user?.walletBalance || 0);
  if (balance < minBalance) return next(new AppError('Insufficient wallet balance', 402, 'INSUFFICIENT_BALANCE'));
  next();
};

module.exports = walletBalanceMiddleware;
