import { PrismaClient } from '@prisma/client'
import { comparePassword } from '@/lib/password'

const prisma = new PrismaClient()

async function checkUsers() {
  console.log('Checking users in database...\n')

  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      status: true,
      createdAt: true,
    },
    orderBy: {
      createdAt: 'desc'
    }
  })

  console.log(`Total users: ${users.length}\n`)

  users.forEach((user) => {
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
    console.log(`ID: ${user.id}`)
    console.log(`Email: ${user.email}`)
    console.log(`Name: ${user.name}`)
    console.log(`Role: ${user.role}`)
    console.log(`Status: ${user.status}`)
    console.log(`Created: ${user.createdAt}`)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
  })

  // Check if admin user exists
  const adminUser = await prisma.user.findFirst({
    where: {
      role: 'ADMIN'
    }
  })

  if (adminUser) {
    console.log('✅ Admin user found:')
    console.log(`Email: ${adminUser.email}`)
    console.log(`Status: ${adminUser.status}`)
  } else {
    console.log('❌ No admin user found!')

    // Create admin user with plain password (will be hashed by the system)
    console.log('\nCreating admin user...')
    const admin = await prisma.user.create({
      data: {
        email: 'admin@smileydental.com',
        password: 'Admin@123456',
        name: 'Admin User',
        role: 'ADMIN',
        status: 'ACTIVE',
      }
    })
    console.log('✅ Admin user created successfully!')
    console.log(`Email: ${admin.email}`)
    console.log(`Password: Admin@123456`)
  }

  await prisma.$disconnect()
}

checkUsers()
  .catch(console.error)
  .finally(() => process.exit(0))
