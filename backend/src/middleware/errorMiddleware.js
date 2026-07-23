const AppError = require('../utils/AppError');

const notFound = (req, res, next) => {
  next(new AppError(`Route not found: ${req.originalUrl}`, 404, 'ROUTE_NOT_FOUND'));
};

const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const validationErrors = Array.isArray(err.data) ? err.data : [];
  const message =
    err.code === 'VALIDATION_ERROR' && validationErrors.length
      ? validationErrors
          .map((item) => item?.msg || item?.message || 'Validation error')
          .filter(Boolean)
          .join(', ')
      : err.message || 'Internal Server Error';

  if (err.code === 'VALIDATION_ERROR') {
    console.error('[ValidationError]', {
      path: req?.originalUrl,
      method: req?.method,
      message,
      errors: validationErrors,
    });
  } else if (statusCode >= 500) {
    console.error('[ServerError]', {
      path: req?.originalUrl,
      method: req?.method,
      message,
      code: err.code || 'SERVER_ERROR',
    });
  }

  const response = {
    success: false,
    message,
    code: err.code || 'SERVER_ERROR'
  };

  if (err.data !== undefined && err.data !== null) {
    response.data = err.data;
  }

  if (process.env.NODE_ENV !== 'production') {
    response.stack = err.stack;
  }

  return res.status(statusCode).json(response);
};

module.exports = { notFound, errorHandler };
