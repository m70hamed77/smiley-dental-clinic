const { PrismaClient } = require('@prisma/client')
require('dotenv').config()

const prisma = new PrismaClient()

async function testConnection() {
  try {
    console.log('Testing database connection...')
    console.log('DATABASE_URL:', process.env.DATABASE_URL?.substring(0, 50) + '...')

    await prisma.$connect()
    console.log('✅ Connected to database successfully!')

    // Try to query a user
    const count = await prisma.user.count()
    console.log(`✅ Found ${count} users in the database`)

    // Try to find the first user
    if (count > 0) {
      const firstUser = await prisma.user.findFirst({
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          status: true,
        }
      })
      console.log('✅ First user:', firstUser)
    }

  } catch (error) {
    console.error('❌ Database connection failed:', error.message)
    console.error('Error details:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testConnection()
