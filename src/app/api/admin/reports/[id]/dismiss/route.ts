import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserIdFromRequest } from '@/lib/auth-helper'

/**
 * POST /api/admin/reports/[id]/dismiss
 *
 * Dismiss a report
 * Only accessible by ADMIN users
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const reportId = (await params).id

    console.log('[ADMIN REPORT DISMISS] Dismissing report:', reportId)

    // ✅ Get userId from multiple sources
    const userId = await getUserIdFromRequest(request)

    if (!userId) {
      console.log('[ADMIN REPORT DISMISS] No user ID found')
      return NextResponse.json(
        { success: false, error: 'غير مصرح لك بالوصول' },
        { status: 401 }
      )
    }

    console.log('[ADMIN REPORT DISMISS] ✅ Found userId:', userId)

    // Get user with role
    const user = await db.user.findUnique({
      where: { id: userId }
    })

    if (!user || user.role !== 'ADMIN') {
      console.log('[ADMIN REPORT DISMISS] User is not admin:', user?.role)
      return NextResponse.json(
        { success: false, error: 'غير مصرح لك بالوصول' },
        { status: 403 }
      )
    }

    // Get admin record
    const admin = await db.admin.findUnique({
      where: { userId: user.id }
    })

    if (!admin) {
      console.log('[ADMIN REPORT DISMISS] Admin record not found for user:', user.id)
      return NextResponse.json(
        { success: false, error: 'سجل الأدمن غير موجود' },
        { status: 403 }
      )
    }

    console.log('[ADMIN REPORT DISMISS] Admin record found:', admin.id)

    // Update report status
    const updatedReport = await db.report.update({
      where: { id: reportId },
      data: {
        status: 'REJECTED',
        adminDecision: 'DISMISS',
        resolvedBy: admin.id,  // Use admin.id not user.id
        resolvedAt: new Date()
      },
      include: {
        reporter: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    console.log('[ADMIN REPORT DISMISS] Report dismissed successfully')

    // Create notification for reporter
    await db.notification.create({
      data: {
        userId: updatedReport.reporter.id,
        type: 'REPORT_RESOLVED',
        title: 'تم رفض بلاغك',
        message: 'تم مراجعة البلاغ الذي قدمته وقررنا رفضه',
        isRead: false
      }
    })

    console.log('[ADMIN REPORT DISMISS] Notification sent to reporter')

    return NextResponse.json({
      success: true,
      message: 'تم رفض البلاغ بنجاح',
      report: {
        id: updatedReport.id,
        status: updatedReport.status
      }
    })
  } catch (error: any) {
    console.error('[ADMIN REPORT DISMISS] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'حدث خطأ أثناء رفض البلاغ' },
      { status: 500 }
    )
  }
}
