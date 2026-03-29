import { PrismaClient } from '@prisma/client'

const DATABASE_URL = process.env.DATABASE_URL || "postgresql://neondb_owner:npg_8VWQD3iHtPAp@ep-bitter-sound-amro63xu-pooler.c-5.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

let db: PrismaClient

if (process.env.NODE_ENV === 'production') {
  db = new PrismaClient()
} else {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = new PrismaClient({
      log: ['error', 'warn'],
      datasources: {
        db: {
          url: DATABASE_URL,
        },
      },
    })
  }
  db = globalForPrisma.prisma
}

export { db }
export default db
