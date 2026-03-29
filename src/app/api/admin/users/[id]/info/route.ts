import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * GET /api/admin/users/[id]/info
 * Get user deletion info (reports count, etc.) for admin confirmation
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get admin user from X-User-Id header
    const adminUserId = request.headers.get('X-User-Id')

    if (!adminUserId) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    }

    const currentUser = await db.user.findUnique({
      where: { id: adminUserId }
    })

    if (!currentUser || currentUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'غير مصرح للأدمن فقط' }, { status: 403 })
    }

    const { id: userId } = await params

    // Get user info
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
        student: {
          select: {
            id: true,
            verificationStatus: true,
            posts: {
              select: { id: true }
            },
            applications: {
              select: { id: true }
            },
          }
        },
        patient: {
          select: {
            id: true,
            applications: {
              select: { id: true }
            },
          }
        },
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'المستخدم غير موجود' }, { status: 404 })
    }

    if (user.role === 'ADMIN') {
      return NextResponse.json({ error: 'لا يمكن حذف حساب الأدمن' }, { status: 400 })
    }

    // Count reports
    const sentReports = await db.report.count({
      where: { reporterId: userId }
    })

    const receivedReports = await db.report.count({
      where: { reportedUserId: userId }
    })

    // Count total related data
    const postsCount = user.student?.posts.length || 0
    const applicationsCount = (user.student?.applications.length || 0) + (user.patient?.applications.length || 0)

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        verificationStatus: user.student?.verificationStatus || null,
        joinedDate: user.createdAt,
      },
      stats: {
        postsCount,
        applicationsCount,
        sentReports,
        receivedReports,
        totalReports: sentReports + receivedReports,
      }
    })

  } catch (error) {
    console.error('Error getting user info:', error)
    return NextResponse.json(
      { error: 'حدث خطأ أثناء جلب معلومات المستخدم' },
      { status: 500 }
    )
  }
}
