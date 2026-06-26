// backend/scripts/createAdmin.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const createAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected...');

    const usersCollection = mongoose.connection.db.collection('users');

    // Check if admin already exists
    const existing = await usersCollection.findOne({ email: 'admin@smartiv.com' });
    if (existing) {
      console.log('Admin already exists!');
      process.exit(0);
    }

    // Hash password manually — no model hook involved
    const hashedPassword = bcrypt.hashSync('Admin@1234', 10);

    // Insert directly into MongoDB collection
    await usersCollection.insertOne({
      name: 'Super Admin',
      email: 'admin@smartiv.com',
      password: hashedPassword,
      role: 'superadmin',
      ward: 'All Wards',
      isActive: true,
      lastLogin: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      __v: 0,
    });

    console.log('✅ Super Admin created successfully!');
    console.log('─────────────────────────────────');
    console.log('Email:    admin@smartiv.com');
    console.log('Password: Admin@1234');
    console.log('Role:     superadmin');
    console.log('─────────────────────────────────');

    mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

createAdmin();
