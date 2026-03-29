import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserIdFromRequest } from '@/lib/auth-helper'

/**
 * POST /api/admin/reports/[id]/warn
 * Warn a user account (Admin only)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log('[ADMIN REPORT WARN] ====================')
    console.log('[ADMIN REPORT WARN] Starting warn process...')

    // Get body first, then params
    const body = await request.json()
    const { warningMessage } = body
    const reportId = (await params).id

    console.log('[ADMIN REPORT WARN] Report ID:', reportId)
    console.log('[ADMIN REPORT WARN] Warning message:', warningMessage)

    if (!warningMessage || !warningMessage.trim()) {
      console.log('[ADMIN REPORT WARN] ❌ Error: Empty warning message')
      return NextResponse.json({ error: 'يجب كتابة رسالة التحذير' }, { status: 400 })
    }

    // ✅ Get userId from multiple sources
    const userId = await getUserIdFromRequest(request)

    if (!userId) {
      console.log('[ADMIN REPORT WARN] ❌ Error: No userId found')
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    }

    console.log('[ADMIN REPORT WARN] ✅ User ID found:', userId)

    const currentUser = await db.user.findUnique({
      where: { id: userId }
    })

    if (!currentUser) {
      console.log('[ADMIN REPORT WARN] ❌ Error: User not found')
      return NextResponse.json({ error: 'المستخدم غير موجود' }, { status: 404 })
    }

    console.log('[ADMIN REPORT WARN] Current user:', currentUser.name, 'Role:', currentUser.role)

    if (currentUser.role !== 'ADMIN') {
      console.log('[ADMIN REPORT WARN] ❌ Error: User is not admin')
      return NextResponse.json({ error: 'غير مصرح للأدمن فقط' }, { status: 403 })
    }

    // Get or create admin record
    let admin = await db.admin.findUnique({
      where: { userId: currentUser.id }
    })

    if (!admin) {
      console.log('[ADMIN REPORT WARN] Creating new admin record for user:', currentUser.id)
      admin = await db.admin.create({
        data: {
          userId: currentUser.id,
          permissions: 'all'
        }
      })
      console.log('[ADMIN REPORT WARN] ✅ Admin record created:', admin.id)
    } else {
      console.log('[ADMIN REPORT WARN] ✅ Admin record found:', admin.id)
    }

    // Get the report
    const report = await db.report.findUnique({
      where: { id: reportId },
      include: {
        reporter: true,
        reportedUser: true
      }
    })

    if (!report) {
      console.log('[ADMIN REPORT WARN] ❌ Error: Report not found:', reportId)
      return NextResponse.json({ error: 'البلاغ غير موجود' }, { status: 404 })
    }

    console.log('[ADMIN REPORT WARN] ✅ Report found:', {
      id: report.id,
      reporterId: report.reporterId,
      reporterName: report.reporter?.name,
      reportedUserId: report.reportedUserId,
      reportedUserName: report.reportedUser?.name,
      status: report.status
    })

    if (report.status !== 'PENDING') {
      console.log('[ADMIN REPORT WARN] ❌ Error: Report not in PENDING status:', report.status)
      return NextResponse.json({ error: 'البلاغ ليس في حالة معالجة' }, { status: 400 })
    }

    // Update report with WARNING decision
    console.log('[ADMIN REPORT WARN] Updating report...')
    const updatedReport = await db.report.update({
      where: { id: reportId },
      data: {
        status: 'RESOLVED',
        adminDecision: 'WARNING',
        adminNotes: warningMessage,
        resolvedBy: admin.id,
        resolvedAt: new Date()
      }
    })

    console.log('[ADMIN REPORT WARN] ✅ Report updated successfully')

    // Verify reported user exists before creating notification
    const reportedUserExists = await db.user.findUnique({
      where: { id: report.reportedUserId },
      select: { id: true, name: true, email: true, role: true }
    })

    if (!reportedUserExists) {
      console.log('[ADMIN REPORT WARN] ❌ Error: Reported user not found:', report.reportedUserId)
      return NextResponse.json({ error: 'المستخدم المبلغ عنه غير موجود' }, { status: 404 })
    }

    console.log('[ADMIN REPORT WARN] ✅ Reported user exists:', reportedUserExists.name, 'Role:', reportedUserExists.role)

    // Create notification to reported user (doctor)
    const actionData = {
      actionType: 'WARNED',
      actionTitle: '⚠️ تحذير من الإدارة',
      actionMessage: warningMessage,
      adminName: currentUser.name,
      actionDate: new Date().toISOString(),
      reportId: report.id
    }

    console.log('[ADMIN REPORT WARN] Creating notification for user:', reportedUserExists.id)
    console.log('[ADMIN REPORT WARN] Notification data:', JSON.stringify(actionData))

    const notification = await db.notification.create({
      data: {
        userId: reportedUserExists.id,
        type: 'ADMIN_ACTION_WARNED',
        title: '⚠️ تحذير من الإدارة',
        message: `لقد تم إصدار تحذير لحسابك:\n\n${warningMessage}\n\n👤 المسؤول: ${currentUser.name}\n📅 التاريخ: ${new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`,
        data: JSON.stringify(actionData),
        isRead: false
      }
    })

    console.log('[ADMIN REPORT WARN] ✅ Notification created successfully:', notification.id)
    console.log('[ADMIN REPORT WARN] Notification sent to:', reportedUserExists.name, '(', reportedUserExists.email, ')')

    // Send notification to reporter
    console.log('[ADMIN REPORT WARN] Creating notification for reporter:', report.reporterId)
    await db.notification.create({
      data: {
        userId: report.reporterId,
        type: 'REPORT_RESOLVED',
        title: '✅ تم معالجة بلاغك',
        message: `تم إصدار تحذير للمستخدم ${report.reportedUser.name} بناءً على بلاغك`,
        isRead: false
      }
    })
    console.log('[ADMIN REPORT WARN] ✅ Reporter notification created successfully')

    console.log('[ADMIN REPORT WARN] ====================')
    console.log('[ADMIN REPORT WARN] ✅ ALL DONE SUCCESSFULLY')

    return NextResponse.json({
      success: true,
      message: 'تم إرسال التحذير للمستخدم بنجاح'
    })

  } catch (error: any) {
    console.error('[ADMIN REPORT WARN] ❌ CATCH ERROR:', error)
    console.error('[ADMIN REPORT WARN] Error message:', error.message)
    console.error('[ADMIN REPORT WARN] Error stack:', error.stack)

    // Return detailed error message for debugging
    return NextResponse.json(
      {
        error: 'حدث خطأ أثناء إرسال التحذير',
        details: error.message
      },
      { status: 500 }
    )
  }
}
