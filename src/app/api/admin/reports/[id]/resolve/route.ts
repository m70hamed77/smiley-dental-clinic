import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserIdFromRequest } from '@/lib/auth-helper'

/**
 * POST /api/admin/reports/[id]/resolve
 *
 * Resolve a report
 * Only accessible by ADMIN users
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log('[ADMIN REPORT RESOLVE] ====================')
    console.log('[ADMIN REPORT RESOLVE] Starting resolve process...')

    // Get body first, then params
    const body = await request.json()
    const resolution = body.resolution
    const reportId = (await params).id

    console.log('[ADMIN REPORT RESOLVE] Report ID:', reportId)
    console.log('[ADMIN REPORT RESOLVE] Resolution text:', resolution)

    if (!resolution || !resolution.trim()) {
      console.log('[ADMIN REPORT RESOLVE] ❌ Error: Empty resolution')
      return NextResponse.json(
        { success: false, error: 'وصف الحل مطلوب' },
        { status: 400 }
      )
    }

    // ✅ Get userId from multiple sources
    const userId = await getUserIdFromRequest(request)

    if (!userId) {
      console.log('[ADMIN REPORT RESOLVE] ❌ Error: No userId found')
      return NextResponse.json(
        { success: false, error: 'غير مصرح لك بالوصول' },
        { status: 401 }
      )
    }

    console.log('[ADMIN REPORT RESOLVE] ✅ Found userId:', userId)

    // Get user with role
    const user = await db.user.findUnique({
      where: { id: userId }
    })

    if (!user || user.role !== 'ADMIN') {
      console.log('[ADMIN REPORT RESOLVE] ❌ Error: User is not admin:', user?.role)
      return NextResponse.json(
        { success: false, error: 'غير مصرح لك بالوصول' },
        { status: 403 }
      )
    }

    // Get or create admin record
    let admin = await db.admin.findUnique({
      where: { userId: user.id }
    })

    if (!admin) {
      console.log('[ADMIN REPORT RESOLVE] Creating new admin record for user:', user.id)
      admin = await db.admin.create({
        data: {
          userId: user.id,
          permissions: 'all'
        }
      })
      console.log('[ADMIN REPORT RESOLVE] ✅ Admin record created:', admin.id)
    } else {
      console.log('[ADMIN REPORT RESOLVE] ✅ Admin record found:', admin.id)
    }

    // Update report status
    const updatedReport = await db.report.update({
      where: { id: reportId },
      data: {
        status: 'RESOLVED',
        adminNotes: resolution.trim(),
        resolvedBy: admin.id,
        resolvedAt: new Date()
      },
      include: {
        reporter: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        reportedUser: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    console.log('[ADMIN REPORT RESOLVE] ✅ Report updated successfully')

    // Verify reported user exists before creating notification
    const reportedUserExists = await db.user.findUnique({
      where: { id: updatedReport.reportedUser.id },
      select: { id: true, name: true, role: true }
    })

    if (!reportedUserExists) {
      console.log('[ADMIN REPORT RESOLVE] ❌ Error: Reported user not found:', updatedReport.reportedUser.id)
      return NextResponse.json({ success: false, error: 'المستخدم المبلغ عنه غير موجود' }, { status: 404 })
    }

    console.log('[ADMIN REPORT RESOLVE] ✅ Reported user exists:', reportedUserExists.name)

    // Create notification for the reported user (doctor/student)
    const actionData = {
      actionType: 'RESOLVED',
      actionTitle: '✅ تم حل بلاغك بنجاح',
      actionMessage: resolution,
      adminName: user.name,
      actionDate: new Date().toISOString(),
      reportId: reportId
    }

    console.log('[ADMIN REPORT RESOLVE] Creating notification for user:', reportedUserExists.id)

    const notification = await db.notification.create({
      data: {
        userId: reportedUserExists.id,
        type: 'ADMIN_ACTION_RESOLVED',
        title: '✅ تم حل بلاغك بنجاح',
        message: `تمت مراجعة بلاغك وتم التأكد من عدم وجود مخالفة.

📝 ملاحظات الإدارة: ${resolution}

👤 المسؤول: ${user.name}

📅 التاريخ: ${new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`,
        data: JSON.stringify(actionData),
        isRead: false
      }
    })

    console.log('[ADMIN REPORT RESOLVE] ✅ Notification created successfully:', notification.id)
    console.log('[ADMIN REPORT RESOLVE] ====================')
    console.log('[ADMIN REPORT RESOLVE] ✅ ALL DONE SUCCESSFULLY')

    return NextResponse.json({
      success: true,
      message: 'تم حل البلاغ بنجاح',
      report: {
        id: updatedReport.id,
        status: updatedReport.status,
        adminNotes: updatedReport.adminNotes
      }
    })
  } catch (error: any) {
    console.error('[ADMIN REPORT RESOLVE] ❌ CATCH ERROR:', error)
    console.error('[ADMIN REPORT RESOLVE] Error message:', error.message)
    console.error('[ADMIN REPORT RESOLVE] Error stack:', error.stack)
    return NextResponse.json(
      { success: false, error: error.message || 'حدث خطأ أثناء حل البلاغ' },
      { status: 500 }
    )
  }
}
