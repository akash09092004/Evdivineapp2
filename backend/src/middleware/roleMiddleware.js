const AppError = require('../utils/AppError');

const allowOnly = (...roles) => (req, res, next) => {
  if (!req.auth || !roles.includes(req.auth.role)) {
    return next(new AppError('Forbidden', 403, 'FORBIDDEN'));
  }
  next();
};

module.exports = { allowOnly };

