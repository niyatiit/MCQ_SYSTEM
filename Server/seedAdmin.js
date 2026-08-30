import dns from 'dns';
dns.setServers(['8.8.8.8', '8.8.4.4']);

import dotenv from 'dotenv';
import connectDB from './config/db.js';
import Admin from './models/admin.model.js';

dotenv.config();
connectDB();

const seedAdmin = async () => {
  try {
    await Admin.deleteMany(); // clears old admin if any (optional, use with caution)

    await Admin.create({
      username: 'svgu',
      password: 'SVGU@CPI@12345', // will be hashed automatically via pre('save') hook
    });

    console.log('Admin seeded successfully!');
    process.exit();
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

seedAdmin();