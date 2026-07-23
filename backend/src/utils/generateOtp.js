const crypto = require('crypto');

const generateOtp = (length = 6) => {
  const digits = Array.from({ length }, () => crypto.randomInt(0, 10)).join('');
  return digits.padStart(length, '0');
};

module.exports = { generateOtp };

