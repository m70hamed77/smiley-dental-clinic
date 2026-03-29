import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserIdFromRequest } from '@/lib/auth-helper'

/**
 * GET /api/admin/verification
 *
 * Get all pending verification requests for admin review
 * Only accessible by ADMIN users
 */
export async function GET(request: NextRequest) {
  try {
    console.log('[ADMIN VERIFICATION] Fetching pending verification requests...')

    // ✅ Get userId from multiple sources (cookies, headers, query params)
    const userId = await getUserIdFromRequest(request)

    if (!userId) {
      console.log('[ADMIN VERIFICATION] No user ID found')
      return NextResponse.json(
        { success: false, error: 'غير مصرح لك بالوصول' },
        { status: 401 }
      )
    }

    console.log('[ADMIN VERIFICATION] ✅ Found userId:', userId)

    // Get user with role
    const user = await db.user.findUnique({
      where: { id: userId },
      include: {
        admin: true
      }
    })

    if (!user) {
      console.log('[ADMIN VERIFICATION] User not found:', userId)
      return NextResponse.json(
        { success: false, error: 'المستخدم غير موجود' },
        { status: 404 }
      )
    }

    // Check if user is admin
    if (user.role !== 'ADMIN') {
      console.log('[ADMIN VERIFICATION] User is not admin:', user.role)
      return NextResponse.json(
        { success: false, error: 'غير مصرح لك بالوصول' },
        { status: 403 }
      )
    }

    // Get all pending verification requests
    const pendingStudents = await db.student.findMany({
      where: {
        verificationStatus: 'PENDING'
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            createdAt: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    console.log('[ADMIN VERIFICATION] Found', pendingStudents.length, 'pending requests')

    return NextResponse.json({
      success: true,
      students: pendingStudents.map(student => ({
        id: student.id,
        userId: student.user.id,
        name: student.user.name,
        email: student.user.email,
        phone: student.user.phone,
        universityEmail: student.universityEmail,
        universityName: student.universityName,
        studentIdNumber: student.studentIdNumber,
        idCardUrl: student.idCardUrl,
        academicYear: student.academicYear,
        createdAt: student.createdAt,
        userCreatedAt: student.user.createdAt
      }))
    })
  } catch (error: any) {
    console.error('[ADMIN VERIFICATION] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'حدث خطأ أثناء جلب الطلبات' },
      { status: 500 }
    )
  }
}
