import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { db } from '@/lib/db'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; applicationId: string }> }
) {
  try {
    const resolvedParams = await params
    const id = resolvedParams.id
    const applicationId = resolvedParams.applicationId

    if (!id || !applicationId) {
      return NextResponse.json(
        { error: 'معرف البوست والطلب مطلوبان' },
        { status: 400 }
      )
    }

    const cookieStore = await cookies()
    const userId = cookieStore.get('userId')?.value

    if (!userId) {
      return NextResponse.json(
        { error: 'يجب تسجيل الدخول' },
        { status: 401 }
      )
    }

    // Get the post
    const post = await db.post.findUnique({
      where: { id }
    })

    if (!post) {
      return NextResponse.json(
        { error: 'البوست غير موجود' },
        { status: 404 }
      )
    }

    // Check if the user is the owner of the post
    const student = await db.student.findUnique({
      where: { userId }
    })

    if (!student || student.id !== post.studentId) {
      return NextResponse.json(
        { error: 'غير مصرح' },
        { status: 403 }
      )
    }

    // Get the application
    const application = await db.application.findUnique({
      where: { id: applicationId },
      include: {
        post: true,
        patient: {
          include: {
            user: true
          }
        }
      }
    })

    if (!application) {
      return NextResponse.json(
        { error: 'الطلب غير موجود' },
        { status: 404 }
      )
    }

    // Check if the application belongs to the post
    if (application.postId !== id) {
      return NextResponse.json(
        { error: 'الطلب لا ينتمي لهذا البوست' },
        { status: 400 }
      )
    }

    // Check if the application is already processed
    if (application.status !== 'PENDING') {
      // Return 200 instead of 400 to avoid console error
      // The application was already accepted/rejected
      return NextResponse.json({
        success: true,
        message: application.status === 'ACCEPTED' ? 'تم قبول هذا الطلب بالفعل' : 'تم رفض هذا الطلب بالفعل',
        application,
        alreadyProcessed: true
      })
    }

    // Reject the application
    const updatedApplication = await db.application.update({
      where: { id: applicationId },
      data: { status: 'REJECTED' }
    })

    // Create notification for the patient
    await db.notification.create({
      data: {
        userId: application.patient.user.id,
        type: 'APPLICATION_REJECTED',
        title: 'تم رفض طلبك',
        message: `تم رفض طلبك على إعلان "${application.post.title}"`,
        data: JSON.stringify({
          postId: id,
          applicationId: applicationId
        }),
        isRead: false,
        channels: JSON.stringify(['IN_APP'])
      }
    })

    console.log(`[NOTIFICATION] ✅ Rejection notification created for patient ${application.patient.user.id}`)

    return NextResponse.json({
      success: true,
      message: 'تم رفض الطلب بنجاح',
      application: updatedApplication
    })
  } catch (error) {
    console.error('Error rejecting application:', error)
    return NextResponse.json(
      { error: 'حدث خطأ أثناء رفض الطلب' },
      { status: 500 }
    )
  }
}
