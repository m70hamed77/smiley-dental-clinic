const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const prisma = new PrismaClient();

async function createAdmin() {
  try {
    console.log('🔐 Creating admin account...');

    // Check if admin already exists
    const existingAdmin = await prisma.user.findUnique({
      where: { email: 'admin@smileydental.com' }
    });

    if (existingAdmin) {
      console.log('⚠️  Admin account already exists!');
      console.log('✅ Email:', existingAdmin.email);
      console.log('✅ Password: Admin@123456');
      console.log('✅ Status:', existingAdmin.status);
      console.log('✅ Role:', existingAdmin.role);
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash('Admin@123456', 10);

    // Create admin user
    const admin = await prisma.user.create({
      data: {
        email: 'admin@smileydental.com',
        password: hashedPassword,
        name: 'Admin',
        role: 'ADMIN',
        status: 'ACTIVE',
        phone: '+1234567890',
      }
    });

    // Create admin profile
    await prisma.admin.create({
      data: {
        userId: admin.id,
        permissions: 'ALL',
      }
    });

    console.log('✅ Admin account created successfully!');
    console.log('✅ Email:', admin.email);
    console.log('✅ Password: Admin@123456');
    console.log('✅ Role:', admin.role);
    console.log('✅ Status:', admin.status);
    console.log('\n🚀 You can now login at: http://localhost:3000/auth/login');

  } catch (error) {
    console.error('❌ Error creating admin:', error.message);
    console.error('Full error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();
