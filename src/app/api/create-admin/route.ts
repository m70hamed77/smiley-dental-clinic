import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import * as bcrypt from 'bcryptjs'

/**
 * POST /api/create-admin
 *
 * Creates the initial admin user if it doesn't exist
 * This should be called ONCE to set up the system
 */
export async function POST(request: NextRequest) {
  try {
    console.log('[CREATE ADMIN] Starting admin creation...')

    // Admin configuration
    const ADMIN_CONFIG = {
      email: 'admin@smileydental.com',
      password: 'Admin@123456',
      name: 'System Admin',
      phone: '+970123456789',
    }

    // Check if admin already exists
    const existingUser = await db.user.findUnique({
      where: { email: ADMIN_CONFIG.email },
    })

    if (existingUser) {
      console.log('[CREATE ADMIN] Admin already exists:', existingUser.email)
      return NextResponse.json({
        success: true,
        message: 'الأدمن موجود بالفعل',
        admin: {
          email: existingUser.email,
          name: existingUser.name,
        }
      })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(ADMIN_CONFIG.password, 12)
    console.log('[CREATE ADMIN] Password hashed successfully')

    // Create user
    const user = await db.user.create({
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
    console.log('[CREATE ADMIN] User created:', user.id)

    // Create admin profile
    const adminProfile = await db.admin.create({
      data: {
        userId: user.id,
        permissions: JSON.stringify({
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
    console.log('[CREATE ADMIN] Admin profile created:', adminProfile.id)

    return NextResponse.json({
      success: true,
      message: 'تم إنشاء الأدمن بنجاح!',
      admin: {
        email: user.email,
        name: user.name,
      },
      credentials: {
        email: ADMIN_CONFIG.email,
        password: ADMIN_CONFIG.password,
      }
    })
  } catch (error: any) {
    console.error('[CREATE ADMIN] Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'حدث خطأ أثناء إنشاء الأدمن',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}
