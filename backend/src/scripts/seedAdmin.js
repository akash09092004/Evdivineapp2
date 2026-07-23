const bcrypt = require('bcryptjs');
const { loadEnvFile } = require('../utils/loadEnvFile');
const connectDB = require('../config/db');
const Admin = require('../models/admin/Admin');

loadEnvFile();

const main = async () => {
  const email = String(process.env.SEED_ADMIN_EMAIL || 'admin@example.com').trim().toLowerCase();
  const password = String(process.env.SEED_ADMIN_PASSWORD || 'Admin@123');
  const name = String(process.env.SEED_ADMIN_NAME || 'Admin').trim();

  if (!email || !password) {
    throw new Error('SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD are required');
  }

  const connection = await connectDB();

  if (!connection) {
    console.log('MongoDB is not available, so no database admin record was created.');
    console.log(`Use these fallback admin credentials: ${email} / ${password}`);
    process.exit(0);
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const admin = await Admin.findOneAndUpdate(
    { email },
    {
      email,
      passwordHash,
      name,
      isActive: true
    },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
  );

  console.log(`Admin ready: ${admin.email}`);
  console.log(`Password: ${password}`);
  process.exit(0);
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
