const { body } = require('express-validator');

const guestLoginValidator = [body('deviceId').notEmpty().withMessage('deviceId is required')];
const paymentValidator = [body('amount').isNumeric(), body('purpose').notEmpty()];

module.exports = { guestLoginValidator, paymentValidator };
