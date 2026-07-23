const { body } = require('express-validator');

const adminLoginValidator = [body('email').isEmail(), body('password').notEmpty()];

module.exports = { adminLoginValidator };

