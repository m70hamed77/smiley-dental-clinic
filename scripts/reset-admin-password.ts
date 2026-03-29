/**
 * Reset Admin Password Script
 *
 * This script resets the admin password to the default.
 * Use it if you forgot the admin password.
 *
 * Usage:
 *   npm run reset-admin-password
 */

import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function resetAdminPassword() {
  try {
    const email = 'admin@smileydental.com'
    const newPassword = 'Admin@123456'

    console.log('🔍 Finding admin account...\n')

    const admin = await prisma.user.findUnique({
      where: { email }
    })

    if (!admin) {
      console.log('❌ Admin account not found!')
      console.log('\n💡 Please run: npm run create-admin')
      process.exit(1)
    }

    console.log('✅ Admin found:', admin.name)
    console.log('   Email:', admin.email)
    console.log('   Status:', admin.status, '\n')

    // Hash the new password
    console.log('🔐 Hashing new password...')
    const hashedPassword = await bcrypt.hash(newPassword, 12)
    console.log('✅ Password hashed\n')

    // Update password
    console.log('🔄 Updating password...')
    await prisma.user.update({
      where: { email },
      data: { password: hashedPassword }
    })

    console.log('✅ Password updated successfully!\n')

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('╔══════════════════════════════════════════════════════╗')
    console.log('║     ✅ ADMIN PASSWORD RESET SUCCESSFULLY!           ║')
    console.log('╚══════════════════════════════════════════════════════╝')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

    console.log('📝 New Login Credentials:')
    console.log('   Email:   ' + email)
    console.log('   Password: ' + newPassword + '\n')

    console.log('💡 You can now login with these credentials.')
    console.log('⚠️  Please change the password after logging in!\n')

  } catch (error: any) {
    console.error('\n❌ Error resetting password:', error.message)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

resetAdminPassword()
