import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserIdFromRequest } from '@/lib/auth-helper'

/**
 * POST /api/admin/ensure-admin
 *
 * Ensure admin record exists for the current admin user
 * This is a utility to create Admin records if they don't exist
 */
export async function POST(request: NextRequest) {
  try {
    // ✅ Get userId from multiple sources (cookies, headers, query params)
    const userId = await getUserIdFromRequest(request)

    if (!userId) {
      return NextResponse.json({ success: false, error: 'غير مصرح' }, { status: 401 })
    }

    const user = await db.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      return NextResponse.json({ success: false, error: 'المستخدم غير موجود' }, { status: 404 })
    }

    if (user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'غير مصرح للأدمن فقط' }, { status: 403 })
    }

    // Check if admin record exists
    let admin = await db.admin.findUnique({
      where: { userId: user.id }
    })

    if (!admin) {
      // Create admin record
      admin = await db.admin.create({
        data: {
          userId: user.id,
          permissions: 'all'  // Default permissions
        }
      })
      console.log('[ENSURE ADMIN] Created admin record for user:', user.id)
    } else {
      console.log('[ENSURE ADMIN] Admin record already exists for user:', user.id)
    }

    return NextResponse.json({
      success: true,
      message: 'تم التأكد من سجل الأدمن بنجاح',
      admin: {
        id: admin.id,
        userId: admin.userId,
        permissions: admin.permissions
      }
    })
  } catch (error: any) {
    console.error('[ENSURE ADMIN] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'حدث خطأ أثناء التأكد من سجل الأدمن' },
      { status: 500 }
    )
  }
}
