const { generateToken } = require('../utils/generateToken');

const issueToken = (entity) => generateToken({
  id: entity._id.toString(),
  role: entity.role,
  phone: entity.phone || entity.mobile,
  email: entity.email || undefined
});

module.exports = { issueToken };

