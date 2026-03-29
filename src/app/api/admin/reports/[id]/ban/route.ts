import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserIdFromRequest } from '@/lib/auth-helper'

/**
 * POST /api/admin/reports/[id]/ban
 * Ban a user account (temporary or permanent) - Admin only
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log('[ADMIN REPORT BAN] ====================')
    console.log('[ADMIN REPORT BAN] Starting ban process...')

    // Get body first, then params
    const body = await request.json()
    const { banType, banDurationDays, banReason } = body
    const reportId = (await params).id

    console.log('[ADMIN REPORT BAN] Report ID:', reportId)
    console.log('[ADMIN REPORT BAN] Ban type:', banType)
    console.log('[ADMIN REPORT BAN] Ban reason:', banReason)
    console.log('[ADMIN REPORT BAN] Ban duration:', banDurationDays)

    if (!banType || !banReason || !banReason.trim()) {
      console.log('[ADMIN REPORT BAN] ❌ Error: Missing required fields')
      return NextResponse.json({ error: 'جميع الحقول مطلوبة' }, { status: 400 })
    }

    if (banType === 'TEMP_BAN' && (!banDurationDays || banDurationDays < 1)) {
      console.log('[ADMIN REPORT BAN] ❌ Error: Invalid ban duration')
      return NextResponse.json({ error: 'يجب تحديد مدة الحظر' }, { status: 400 })
    }

    // ✅ Get userId from multiple sources
    const userId = await getUserIdFromRequest(request)

    if (!userId) {
      console.log('[ADMIN REPORT BAN] ❌ Error: No userId found')
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    }

    console.log('[ADMIN REPORT BAN] ✅ Found userId:', userId)

    const currentUser = await db.user.findUnique({
      where: { id: userId }
    })

    if (!currentUser || currentUser.role !== 'ADMIN') {
      console.log('[ADMIN REPORT BAN] ❌ Error: User is not admin:', currentUser?.role)
      return NextResponse.json({ error: 'غير مصرح للأدمن فقط' }, { status: 403 })
    }

    // Get or create admin record
    let admin = await db.admin.findUnique({
      where: { userId: currentUser.id }
    })

    if (!admin) {
      console.log('[ADMIN REPORT BAN] Creating new admin record for user:', currentUser.id)
      admin = await db.admin.create({
        data: {
          userId: currentUser.id,
          permissions: 'all'
        }
      })
      console.log('[ADMIN REPORT BAN] ✅ Admin record created:', admin.id)
    } else {
      console.log('[ADMIN REPORT BAN] ✅ Admin record found:', admin.id)
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
      console.log('[ADMIN REPORT BAN] ❌ Error: Report not found:', reportId)
      return NextResponse.json({ error: 'البلاغ غير موجود' }, { status: 404 })
    }

    console.log('[ADMIN REPORT BAN] ✅ Report found:', {
      id: report.id,
      reportedUserId: report.reportedUserId,
      status: report.status
    })

    if (report.status !== 'PENDING') {
      console.log('[ADMIN REPORT BAN] ❌ Error: Report not in PENDING status:', report.status)
      return NextResponse.json({ error: 'البلاغ ليس في حالة معالجة' }, { status: 400 })
    }

    // Calculate ban until date for temporary bans
    let banUntil: Date | null = null
    if (banType === 'TEMP_BAN') {
      const now = new Date()
      banUntil = new Date(now.getTime() + banDurationDays * 24 * 60 * 60 * 1000)
      console.log('[ADMIN REPORT BAN] Ban until:', banUntil)
    }

    // Update report with ban decision
    await db.report.update({
      where: { id: reportId },
      data: {
        status: 'RESOLVED',
        adminDecision: banType,
        adminNotes: banReason,
        banDuration: banDurationDays || null,
        resolvedBy: admin.id,
        resolvedAt: new Date()
      }
    })

    // Update user status to BANNED
    await db.user.update({
      where: { id: report.reportedUserId },
      data: {
        status: 'BANNED'
      }
    })

    // Create ban record
    await db.userBan.create({
      data: {
        userId: report.reportedUserId,
        banType: banType === 'TEMP_BAN' ? 'temporary' : 'permanent',
        banReason: banReason,
        bannedBy: admin.id,
        banUntil: banUntil,
        isActive: true
      }
    })

    console.log('[ADMIN REPORT BAN] ✅ User banned successfully')

    // Verify reported user exists before creating notification
    const reportedUserExists = await db.user.findUnique({
      where: { id: report.reportedUserId },
      select: { id: true, name: true, role: true }
    })

    if (!reportedUserExists) {
      console.log('[ADMIN REPORT BAN] ❌ Error: Reported user not found:', report.reportedUserId)
      return NextResponse.json({ error: 'المستخدم المبلغ عنه غير موجود' }, { status: 404 })
    }

    // Create notification to banned user (doctor)
    const banMessage = banType === 'TEMP_BAN'
      ? `تم حظر حسابك مؤقتًا لمدة ${banDurationDays} يوم`
      : 'تم حظر حسابك نهائيًا'

    const actionData = {
      actionType: banType === 'TEMP_BAN' ? 'TEMP_BANNED' : 'PERM_BANNED',
      actionTitle: '🚫 تم حظر حسابك',
      actionMessage: banReason,
      adminName: currentUser.name,
      actionDate: new Date().toISOString(),
      reportId: report.id,
      banDuration: banDurationDays || null
    }

    console.log('[ADMIN REPORT BAN] Creating notification for user:', reportedUserExists.id)

    await db.notification.create({
      data: {
        userId: reportedUserExists.id,
        type: banType === 'TEMP_BAN' ? 'ADMIN_ACTION_TEMP_BANNED' : 'ADMIN_ACTION_PERM_BANNED',
        title: '🚫 تم حظر حسابك',
        message: `${banMessage}:\n\n${banReason}\n\n👤 المسؤول: ${currentUser.name}\n📅 التاريخ: ${new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}${banUntil ? `\n🕐 ينتهي في: ${banUntil.toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}` : ''}`,
        data: JSON.stringify(actionData),
        isRead: false
      }
    })

    console.log('[ADMIN REPORT BAN] ✅ Notification created successfully')

    // Send notification to reporter
    await db.notification.create({
      data: {
        userId: report.reporterId,
        type: 'REPORT_RESOLVED',
        title: '✅ تم معالجة بلاغك',
        message: `تم حظر المستخدم ${report.reportedUser.name} بناءً على بلاغك`,
        isRead: false
      }
    })

    console.log('[ADMIN REPORT BAN] ====================')
    console.log('[ADMIN REPORT BAN] ✅ ALL DONE SUCCESSFULLY')

    return NextResponse.json({
      success: true,
      message: banType === 'TEMP_BAN'
        ? `تم حظر الحساب مؤقتًا لمدة ${banDurationDays} يوم`
        : 'تم حظر الحساب نهائيًا'
    })

  } catch (error: any) {
    console.error('[ADMIN REPORT BAN] ❌ CATCH ERROR:', error)
    console.error('[ADMIN REPORT BAN] Error message:', error.message)
    console.error('[ADMIN REPORT BAN] Error stack:', error.stack)
    return NextResponse.json(
      { error: 'حدث خطأ أثناء حظر الحساب: ' + error.message },
      { status: 500 }
    )
  }
}
