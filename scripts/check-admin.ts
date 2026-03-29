/**
 * Check Admin Users Script
 *
 * This script checks if admin users exist in the database.
 *
 * Usage:
 *   npm run check-admin
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkAdmin() {
  try {
    console.log('🔍 Checking for admin users...\n')

    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN' },
      include: {
        admin: true
      }
    })

    if (admins.length === 0) {
      console.log('❌ No admin users found in database!')
      console.log('\n💡 You need to create an admin account first:')
      console.log('   Run: npm run create-admin')
    } else {
      console.log(`✅ Found ${admins.length} admin user(s):\n`)

      for (const admin of admins) {
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
        console.log(`ID:          ${admin.id}`)
        console.log(`Name:        ${admin.name}`)
        console.log(`Email:       ${admin.email}`)
        console.log(`Role:        ${admin.role}`)
        console.log(`Status:      ${admin.status}`)
        console.log(`Has Admin Record: ${admin.admin ? '✅' : '❌'}`)

        if (admin.admin) {
          console.log(`Admin ID:    ${admin.admin.id}`)
          console.log(`Permissions: ${admin.admin.permissions}`)
        }
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
      }
    }

    // Check all users
    console.log('📊 All users in database:')
    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        createdAt: true
      }
    })

    console.log(`Total users: ${allUsers.length}\n`)

    for (const user of allUsers) {
      console.log(`  - ${user.role} | ${user.email} | ${user.status}`)
    }

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkAdmin()
