import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { cookies } from 'next/headers'
import { notifyAdminNewReport } from '@/lib/notifications'

/**
 * POST /api/reports
 * Submit a new report (by any authenticated user)
 */
export async function POST(request: NextRequest) {
  try {
    // Get user session from cookie
    const cookieStore = await cookies()
    const userId = cookieStore.get('userId')?.value

    if (!userId) {
      console.log('[REPORTS] No userId cookie found')
      return NextResponse.json({ error: 'يجب تسجيل الدخول لتقديم بلاغ' }, { status: 401 })
    }

    console.log('[REPORTS] Found userId:', userId)

    const currentUser = await db.user.findUnique({
      where: { id: userId },
      include: {
        student: true,
        patient: true,
      }
    })

    if (!currentUser) {
      console.log('[REPORTS] User not found for userId:', userId)
      return NextResponse.json({ error: 'المستخدم غير موجود' }, { status: 404 })
    }

    console.log('[REPORTS] Current user:', currentUser.name, 'Role:', currentUser.role)

    if (currentUser.role === 'ADMIN') {
      return NextResponse.json({ error: 'الأدمن لا يمكنه تقديم بلاغات' }, { status: 403 })
    }

    const body = await request.json()
    const { reportedUserName, reportedUserEmail, description, caseId } = body

    // Validate required fields
    if (!reportedUserName || !reportedUserEmail || !description) {
      return NextResponse.json({
        error: 'جميع الحقول مطلوبة'
      }, { status: 400 })
    }

    // Find the reported user by email
    const reportedUser = await db.user.findUnique({
      where: { email: reportedUserEmail }
    })

    if (!reportedUser) {
      return NextResponse.json({
        error: 'المستخدم المبلغ عنه غير موجود'
      }, { status: 404 })
    }

    // Check if reported user is admin
    if (reportedUser.role === 'ADMIN') {
      return NextResponse.json({
        error: 'لا يمكن تقديم بلاغ ضد الأدمن'
      }, { status: 400 })
    }

    // Prevent self-reporting
    if (reportedUser.id === currentUser.id) {
      return NextResponse.json({
        error: 'لا يمكن تقديم بلاغ ضد نفسك'
      }, { status: 400 })
    }

    // Create the report
    const report = await db.report.create({
      data: {
        reporterId: currentUser.id,
        reporterType: currentUser.role === 'STUDENT' ? 'student' : 'patient',
        reportedUserId: reportedUser.id,
        caseId: caseId || null,
        reportType: 'OTHER', // Default to OTHER for manual reports
        description: description,
        status: 'PENDING',
      }
    })

    // Send notification to all admins using the notification library
    try {
      await notifyAdminNewReport(
        report.id,
        currentUser.name,
        reportedUser.name,
        description
      )
    } catch (notifyError) {
      console.error('[REPORTS] Failed to notify admins:', notifyError)
      // Don't fail the report if notification fails
    }

    return NextResponse.json({
      success: true,
      message: 'تم إرسال البلاغ بنجاح! سيقوم الأدمن بمراجعته قريبًا',
      reportId: report.id
    })

  } catch (error) {
    console.error('Error creating report:', error)
    return NextResponse.json(
      { error: 'حدث خطأ أثناء إرسال البلاغ' },
      { status: 500 }
    )
  }
}
