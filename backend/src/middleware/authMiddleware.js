const jwt = require('jsonwebtoken');
const AppError = require('../utils/AppError');
const { ROLES } = require('../utils/constants');

const authenticate = (allowedRoles = []) => async (req, res, next) => {
  const header =
    req.headers.authorization ||
    req.headers['x-access-token'] ||
    req.headers['x-auth-token'] ||
    req.headers.token;

  if (!header) {
    return next(new AppError('Unauthorized', 401, 'UNAUTHORIZED'));
  }

  const token = header.startsWith('Bearer ') ? header.split(' ')[1] : header;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.auth = decoded;
    req.userRole = decoded.role;
    if (allowedRoles.length && !allowedRoles.includes(decoded.role)) {
      return next(new AppError('Forbidden', 403, 'FORBIDDEN'));
    }
    return next();
  } catch (error) {
    return next(new AppError('Invalid or expired token', 401, 'TOKEN_INVALID'));
  }
};

const requireRole = (...roles) => authenticate(roles);

const requireUser = authenticate([ROLES.USER]);
const requireAdmin = authenticate([ROLES.ADMIN]);

module.exports = { authenticate, requireRole, requireUser, requireAdmin };
