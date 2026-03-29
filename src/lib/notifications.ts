import { db } from './db'
import { NotificationType } from '@prisma/client'

/**
 * مكتبة مساعدة لإرسال إشعارات للادمن
 * تستخدم عند حدوث أحداث مهمة في النظام
 */

/**
 * إرسال إشعار لجميع الأدمن
 */
export async function notifyAdmins(params: {
  type: NotificationType
  title: string
  message: string
  actionLink?: string
  actionText?: string
  data?: any
}) {
  try {
    // جلب جميع الأدمن
    const admins = await db.user.findMany({
      where: { role: 'ADMIN' }
    })

    if (admins.length === 0) {
      console.warn('[NOTIFICATIONS] No admins found to notify')
      return 0
    }

    // إنشاء إشعار لكل أدمن
    let createdCount = 0
    for (const admin of admins) {
      try {
        await db.notification.create({
          data: {
            userId: admin.id,
            type: params.type,
            title: params.title,
            message: params.message,
            actionLink: params.actionLink,
            actionText: params.actionText,
            data: params.data ? JSON.stringify(params.data) : null,
          }
        })
        createdCount++
      } catch (error) {
        console.error(`[NOTIFICATIONS] Failed to create notification for admin ${admin.id}:`, error)
      }
    }

    console.log(`[NOTIFICATIONS] ✅ Sent notification to ${createdCount} admin(s)`)
    return createdCount
  } catch (error) {
    console.error('[NOTIFICATIONS] ❌ Failed to notify admins:', error)
    return 0
  }
}

/**
 * إرسال إشعار عند تسجيل طالب جديد
 */
export async function notifyAdminNewStudent(studentId: string, studentName: string, studentEmail: string) {
  return notifyAdmins({
    type: 'STUDENT_VERIFICATION',
    title: '🎓 طالب جديد ينتظر التفعيل',
    message: `قام ${studentName} (${studentEmail}) بالتسجيل كطالب طب أسنان ويحتاج إلى مراجعة بياناته وتوثيق حسابه.`,
    actionLink: `/admin/users?userId=${studentId}`,
    actionText: 'مراجعة الحساب',
    data: {
      studentId,
      studentName,
      studentEmail,
      timestamp: new Date().toISOString()
    }
  })
}

/**
 * إرسال إشعار عند وصول بلاغ جديد
 */
export async function notifyAdminNewReport(reportId: string, reporterName: string, reportedUserName: string, description: string) {
  return notifyAdmins({
    type: 'NEW_REPORT',
    title: '⚠️ تم استلام بلاغ جديد',
    message: `قام ${reporterName} بتقديم بلاغ ضد ${reportedUserName}: ${description.substring(0, 100)}${description.length > 100 ? '...' : ''}`,
    actionLink: `/admin/reports?reportId=${reportId}`,
    actionText: 'مراجعة البلاغ',
    data: {
      reportId,
      reporterName,
      reportedUserName,
      timestamp: new Date().toISOString()
    }
  })
}

/**
 * إرسال إشعار عند قبول طالب
 */
export async function notifyAdminStudentApproved(studentName: string, studentEmail: string) {
  return notifyAdmins({
    type: 'STUDENT_VERIFIED',
    title: '✅ تم توثيق طالب جديد',
    message: `تم توثيق حساب الطالب ${studentName} (${studentEmail}) بنجاح.`,
    actionLink: `/admin/users`,
    actionText: 'عرض الطلاب',
    data: {
      studentName,
      studentEmail,
      timestamp: new Date().toISOString()
    }
  })
}

/**
 * إرسال إشعار عند رفض طالب
 */
export async function notifyAdminStudentRejected(studentName: string, studentEmail: string, reason: string) {
  return notifyAdmins({
    type: 'STUDENT_VERIFICATION',
    title: '❌ تم رفض طالب',
    message: `تم رفض حساب الطالب ${studentName} (${studentEmail}) بسبب: ${reason}`,
    actionLink: `/admin/users`,
    actionText: 'عرض الطلاب',
    data: {
      studentName,
      studentEmail,
      reason,
      timestamp: new Date().toISOString()
    }
  })
}

/**
 * إرسال إشعار عند حذف مستخدم
 */
export async function notifyAdminUserDeleted(userName: string, userEmail: string, reason?: string) {
  return notifyAdmins({
    type: 'ADMIN_ACTION_PERM_BANNED',
    title: '🗑️ تم حذف حساب',
    message: `تم حذف حساب ${userName} (${userEmail})${reason ? `. السبب: ${reason}` : ''}`,
    actionLink: `/admin/users`,
    actionText: 'عرض المستخدمين',
    data: {
      userName,
      userEmail,
      reason,
      timestamp: new Date().toISOString()
    }
  })
}

/**
 * إرسال إشعار عند حظر مستخدم
 */
export async function notifyAdminUserBanned(userName: string, userEmail: string, banType: 'TEMP' | 'PERM', reason: string) {
  const title = banType === 'PERM'
    ? '🚫 تم حظر حساب نهائياً'
    : '⏸️ تم حظر حساب مؤقتاً'

  return notifyAdmins({
    type: banType === 'PERM' ? 'ADMIN_ACTION_PERM_BANNED' : 'ADMIN_ACTION_TEMP_BANNED',
    title,
    message: `تم حظر حساب ${userName} (${userEmail}) بسبب: ${reason}`,
    actionLink: `/admin/users`,
    actionText: 'عرض المستخدمين',
    data: {
      userName,
      userEmail,
      banType,
      reason,
      timestamp: new Date().toISOString()
    }
  })
}

/**
 * إرسال إشعار عند حل بلاغ
 */
export async function notifyAdminReportResolved(reportId: string, resolution: string) {
  return notifyAdmins({
    type: 'REPORT_RESOLVED',
    title: '✅ تم حل بلاغ',
    message: `تم حل البلاغ ${reportId} بنجاح. الحل: ${resolution}`,
    actionLink: `/admin/reports`,
    actionText: 'عرض البلاغات',
    data: {
      reportId,
      resolution,
      timestamp: new Date().toISOString()
    }
  })
}

/**
 * إرسال إشعار عام مخصص
 */
export async function notifyAdminCustom(params: {
  title: string
  message: string
  actionLink?: string
  actionText?: string
}) {
  return notifyAdmins({
    type: 'NEW_REPORT', // استخدام نوع افتراضي
    title: params.title,
    message: params.message,
    actionLink: params.actionLink,
    actionText: params.actionText
  })
}
