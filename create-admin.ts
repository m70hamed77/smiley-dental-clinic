import { PrismaClient } from '@prisma/client'
import { hashPassword } from './src/lib/password'

const prisma = new PrismaClient()

async function createAdmin() {
  console.log('═══════════════════════════════════════')
  console.log('CREATING ADMIN USER')
  console.log('═══════════════════════════════════════')

  const adminEmail = 'admin@smileydental.com'
  const adminPassword = 'admin123'

  // Check if admin already exists
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail }
  })

  if (existingAdmin) {
    console.log('⚠️  Admin user already exists!')
    console.log(`   Email: ${existingAdmin.email}`)
    console.log(`   Role: ${existingAdmin.role}`)
    console.log(`   Status: ${existingAdmin.status}`)
    console.log('')
    console.log('Do you want to update the password?')
    console.log('Please use the update-admin-password.ts script if needed.')
    await prisma.$disconnect()
    return
  }

  // Hash the password
  console.log('Hashing password...')
  const hashedPassword = await hashPassword(adminPassword)
  console.log('Password hashed successfully')

  // Create admin user
  console.log('Creating admin user...')
  const admin = await prisma.user.create({
    data: {
      email: adminEmail,
      password: hashedPassword,
      name: 'System Admin',
      role: 'ADMIN',
      status: 'ACTIVE',
      emailVerified: new Date(),
    },
    include: {
      admin: true
    }
  })

  // Create admin record
  console.log('Creating admin record...')
  await prisma.admin.create({
    data: {
      userId: admin.id,
      permissions: 'all',
    }
  })

  console.log('✅ Admin user created successfully!')
  console.log('')
  console.log('Admin Details:')
  console.log(`  ID: ${admin.id}`)
  console.log(`  Name: ${admin.name}`)
  console.log(`  Email: ${admin.email}`)
  console.log(`  Role: ${admin.role}`)
  console.log(`  Status: ${admin.status}`)
  console.log('')
  console.log('Login Credentials:')
  console.log(`  Email: ${adminEmail}`)
  console.log(`  Password: ${adminPassword}`)
  console.log('')
  console.log('═══════════════════════════════════════')

  await prisma.$disconnect()
}

createAdmin().catch((error) => {
  console.error('Error:', error)
  process.exit(1)
})
