/**
 * Create First Super Admin Script
 *
 * This script creates the first admin user in the system.
 * Run it ONCE to initialize the system with a super admin.
 *
 * Usage:
 *   npm run create-admin
 */

import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

// Admin configuration
const ADMIN_CONFIG = {
  email: 'admin@smileydental.com',
  password: 'Admin@123456',  // Change this after first login!
  name: 'System Admin',
  phone: '+970123456789',
}

async function createAdmin() {
  try {
    console.log('🚀 Starting admin creation process...\n')

    // Check if admin already exists
    console.log('🔍 Checking if admin already exists...')
    const existingUser = await prisma.user.findUnique({
      where: { email: ADMIN_CONFIG.email },
    })

    if (existingUser) {
      console.log('❌ Admin already exists with email:', ADMIN_CONFIG.email)
      console.log('   If you need to reset, please delete the existing admin first.')
      process.exit(1)
    }

    console.log('✅ Admin email is available\n')

    // Hash password
    console.log('🔐 Hashing password...')
    const hashedPassword = await bcrypt.hash(ADMIN_CONFIG.password, 12)
    console.log('✅ Password hashed\n')

    // Create user
    console.log('👤 Creating user account...')
    const user = await prisma.user.create({
      data: {
        email: ADMIN_CONFIG.email,
        password: hashedPassword,
        name: ADMIN_CONFIG.name,
        phone: ADMIN_CONFIG.phone,
        role: 'ADMIN',
        status: 'ACTIVE',
        emailVerified: new Date(),
      },
    })
    console.log('✅ User created:', user.id)
    console.log('   Email:', user.email)
    console.log('   Name:', user.name)
    console.log('   Role:', user.role)
    console.log('   Status:', user.status, '\n')

    // Create admin profile
    console.log('📋 Creating admin profile...')
    const adminProfile = await prisma.admin.create({
      data: {
        userId: user.id,
        permissions: JSON.stringify({
          // Full permissions for super admin
          canVerifyStudents: true,
          canManageUsers: true,
          canManagePosts: true,
          canViewReports: true,
          canResolveReports: true,
          canBanUsers: true,
          canManageAdmins: true,
          canViewAllData: true,
        }),
      },
    })
    console.log('✅ Admin profile created:', adminProfile.id, '\n')

    // Success message
    console.log('╔══════════════════════════════════════════════════════╗')
    console.log('║         ✅ ADMIN CREATED SUCCESSFULLY!               ║')
    console.log('╚══════════════════════════════════════════════════════╝\n')

    console.log('📝 Login Credentials:')
    console.log('   Email:   ', ADMIN_CONFIG.email)
    console.log('   Password:', ADMIN_CONFIG.password, '\n')

    console.log('⚠️  IMPORTANT SECURITY NOTES:')
    console.log('   1. Log in immediately and change the password!')
    console.log('   2. Do not share these credentials!')
    console.log('   3. Delete this script or move it to a secure location!')
    console.log('   4. Future admins should be created by this admin!\n')

    console.log('🎯 Next Steps:')
    console.log('   1. Go to /login and log in with these credentials')
    console.log('   2. Navigate to /profile to change your password')
    console.log('   3. Start reviewing student verification requests at /admin/verification\n')

  } catch (error) {
    console.error('❌ Error creating admin:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the script
createAdmin()
