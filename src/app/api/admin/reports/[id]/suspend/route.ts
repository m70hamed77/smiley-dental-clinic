import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserIdFromRequest } from '@/lib/auth-helper'

/**
 * POST /api/admin/reports/[id]/suspend
 * Suspend a user account (Admin only)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log('[ADMIN REPORT SUSPEND] ====================')
    console.log('[ADMIN REPORT SUSPEND] Starting suspend process...')

    // Get body first, then params
    const body = await request.json()
    const { suspensionReason } = body
    const reportId = (await params).id

    console.log('[ADMIN REPORT SUSPEND] Report ID:', reportId)
    console.log('[ADMIN REPORT SUSPEND] Suspension reason:', suspensionReason)

    if (!suspensionReason || !suspensionReason.trim()) {
      console.log('[ADMIN REPORT SUSPEND] ❌ Error: Empty suspension reason')
      return NextResponse.json({ error: 'يجب كتابة سبب الإيقاف' }, { status: 400 })
    }

    // ✅ Get userId from multiple sources
    const userId = await getUserIdFromRequest(request)

    if (!userId) {
      console.log('[ADMIN REPORT SUSPEND] ❌ Error: No userId found')
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    }

    console.log('[ADMIN REPORT SUSPEND] ✅ Found userId:', userId)

    const currentUser = await db.user.findUnique({
      where: { id: userId }
    })

    if (!currentUser || currentUser.role !== 'ADMIN') {
      console.log('[ADMIN REPORT SUSPEND] ❌ Error: User is not admin:', currentUser?.role)
      return NextResponse.json({ error: 'غير مصرح للأدمن فقط' }, { status: 403 })
    }

    // Get or create admin record
    let admin = await db.admin.findUnique({
      where: { userId: currentUser.id }
    })

    if (!admin) {
      console.log('[ADMIN REPORT SUSPEND] Creating new admin record for user:', currentUser.id)
      admin = await db.admin.create({
        data: {
          userId: currentUser.id,
          permissions: 'all'
        }
      })
      console.log('[ADMIN REPORT SUSPEND] ✅ Admin record created:', admin.id)
    } else {
      console.log('[ADMIN REPORT SUSPEND] ✅ Admin record found:', admin.id)
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
      console.log('[ADMIN REPORT SUSPEND] ❌ Error: Report not found:', reportId)
      return NextResponse.json({ error: 'البلاغ غير موجود' }, { status: 404 })
    }

    console.log('[ADMIN REPORT SUSPEND] ✅ Report found:', {
      id: report.id,
      reportedUserId: report.reportedUserId,
      status: report.status
    })

    if (report.status !== 'PENDING') {
      console.log('[ADMIN REPORT SUSPEND] ❌ Error: Report not in PENDING status:', report.status)
      return NextResponse.json({ error: 'البلاغ ليس في حالة معالجة' }, { status: 400 })
    }

    // Update report with SUSPEND decision
    await db.report.update({
      where: { id: reportId },
      data: {
        status: 'RESOLVED',
        adminDecision: 'SUSPEND',
        adminNotes: suspensionReason,
        resolvedBy: admin.id,
        resolvedAt: new Date()
      }
    })

    // Update user status to SUSPENDED
    await db.user.update({
      where: { id: report.reportedUserId },
      data: {
        status: 'SUSPENDED'
      }
    })

    console.log('[ADMIN REPORT SUSPEND] ✅ User suspended successfully')

    // Verify reported user exists before creating notification
    const reportedUserExists = await db.user.findUnique({
      where: { id: report.reportedUserId },
      select: { id: true, name: true, role: true }
    })

    if (!reportedUserExists) {
      console.log('[ADMIN REPORT SUSPEND] ❌ Error: Reported user not found:', report.reportedUserId)
      return NextResponse.json({ error: 'المستخدم المبلغ عنه غير موجود' }, { status: 404 })
    }

    // Create notification to suspended user (doctor)
    const actionData = {
      actionType: 'SUSPENDED',
      actionTitle: '⏸️ تم إيقاف حسابك مؤقتًا',
      actionMessage: suspensionReason,
      adminName: currentUser.name,
      actionDate: new Date().toISOString(),
      reportId: report.id
    }

    console.log('[ADMIN REPORT SUSPEND] Creating notification for user:', reportedUserExists.id)

    await db.notification.create({
      data: {
        userId: reportedUserExists.id,
        type: 'ADMIN_ACTION_SUSPENDED',
        title: '⏸️ تم إيقاف حسابك مؤقتًا',
        message: `تم إيقاف حسابك مؤقتًا:\n\n${suspensionReason}\n\n👤 المسؤول: ${currentUser.name}\n📅 التاريخ: ${new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}\n\nيرجى التواصل مع الإدارة للتفعيل`,
        data: JSON.stringify(actionData),
        isRead: false
      }
    })

    console.log('[ADMIN REPORT SUSPEND] ✅ Notification created successfully')

    // Send notification to reporter
    await db.notification.create({
      data: {
        userId: report.reporterId,
        type: 'REPORT_RESOLVED',
        title: '✅ تم معالجة بلاغك',
        message: `تم إيقاف المستخدم ${report.reportedUser.name} مؤقتًا بناءً على بلاغك`,
        isRead: false
      }
    })

    console.log('[ADMIN REPORT SUSPEND] ====================')
    console.log('[ADMIN REPORT SUSPEND] ✅ ALL DONE SUCCESSFULLY')

    return NextResponse.json({
      success: true,
      message: 'تم إيقاف الحساب مؤقتًا بنجاح'
    })

  } catch (error: any) {
    console.error('[ADMIN REPORT SUSPEND] ❌ CATCH ERROR:', error)
    console.error('[ADMIN REPORT SUSPEND] Error message:', error.message)
    console.error('[ADMIN REPORT SUSPEND] Error stack:', error.stack)
    return NextResponse.json(
      { error: 'حدث خطأ أثناء إيقاف الحساب: ' + error.message },
      { status: 500 }
    )
  }
}
