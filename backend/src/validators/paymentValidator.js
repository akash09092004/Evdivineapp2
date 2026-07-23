const { body } = require('express-validator');

const createOrderValidator = [body('amount').isNumeric(), body('purpose').notEmpty()];

module.exports = { createOrderValidator };

