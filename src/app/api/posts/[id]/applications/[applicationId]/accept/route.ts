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
      where: { userId },
      include: {
        user: true
      }
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
        alreadyProcessed: true,
        postIsFull: post.acceptedCount >= (post.requiredCount || 5)
      })
    }

    // Check if the post is already full
    const requiredCount = post.requiredCount || 5
    if (post.acceptedCount >= requiredCount) {
      return NextResponse.json(
        { error: 'اكتمل العدد المطلوب لهذا البوست' },
        { status: 400 }
      )
    }

    // Accept the application
    const updatedApplication = await db.application.update({
      where: { id: applicationId },
      data: { status: 'ACCEPTED' }
    })

    // Create a Case for this accepted application
    // Check if case already exists
    let newCase = await db.case.findUnique({
      where: { applicationId }
    })

    if (!newCase) {
      newCase = await db.case.create({
        data: {
          applicationId: applicationId
        }
      })
      console.log(`[ACCEPT] ✅ Case created: ${newCase.id} for application ${applicationId}`)
    } else {
      console.log(`[ACCEPT] ℹ️ Case already exists: ${newCase.id} for application ${applicationId}`)
    }

    // Create an Appointment with a default date (7 days from now)
    // The student can update this later
    // Only create if appointment doesn't exist
    let newAppointment = await db.appointment.findUnique({
      where: { caseId: newCase.id }
    })

    if (!newAppointment) {
      const defaultDate = new Date()
      defaultDate.setDate(defaultDate.getDate() + 7)

      newAppointment = await db.appointment.create({
        data: {
          caseId: newCase.id,
          type: 'APPOINTMENT',
          status: 'SCHEDULED',
          scheduledAt: defaultDate,
          duration: 60, // Default 1 hour
          location: null // Will be updated later
        }
      })
      console.log(`[ACCEPT] ✅ Appointment created: ${newAppointment.id}`)
    } else {
      console.log(`[ACCEPT] ℹ️ Appointment already exists: ${newAppointment.id}`)
    }

    // Create an empty Conversation for the doctor to start
    // Check if conversation already exists for this case
    let newConversation = await db.conversation.findUnique({
      where: { caseId: newCase.id }
    })

    if (!newConversation) {
      // Create new conversation only if it doesn't exist
      newConversation = await db.conversation.create({
        data: {
          caseId: newCase.id,
          studentId: student.id,
          patientId: application.patientId
        }
      })
      console.log(`[ACCEPT] ✅ New Conversation created: ${newConversation.id} between student ${student.id} and patient ${application.patientId}`)
    } else {
      console.log(`[ACCEPT] ✅ Conversation already exists: ${newConversation.id}`)
    }

    // Increment the accepted count
    const updatedPost = await db.post.update({
      where: { id },
      data: { acceptedCount: { increment: 1 } }
    })

    // Create notification for the patient
    console.log(`[ACCEPT] Creating notification for patient: ${application.patient.user.id}, name: ${application.patient.user.name}`)
    console.log(`[ACCEPT] Conversation ID to include in notification: ${newConversation.id}`)
    
    const patientNotification = await db.notification.create({
      data: {
        userId: application.patient.user.id,
        type: 'APPLICATION_ACCEPTED',
        title: 'تم قبول طلبك',
        message: `تم قبول طلبك على إعلان "${application.post.title}"`,
        data: JSON.stringify({
          postId: id,
          applicationId: applicationId,
          caseId: newCase.id,
          conversationId: newConversation.id,
          appointmentId: newAppointment.id,
          studentId: student.id,
          studentName: student.user.name
        }),
        isRead: false,
        channels: JSON.stringify(['IN_APP'])
      }
    })

    console.log(`[NOTIFICATION] ✅ Notification created for patient ${application.patient.user.id}, notification ID: ${patientNotification.id}`)
    console.log(`[NOTIFICATION] Notification data:`, JSON.parse(patientNotification.data))

    // Check if the post is now full
    const isFull = updatedPost.acceptedCount >= requiredCount

    if (isFull) {
      // Close the post
      await db.post.update({
        where: { id },
        data: { status: 'COMPLETED' }
      })

      // Reject all pending applications
      await db.application.updateMany({
        where: {
          postId: id,
          status: 'PENDING'
        },
        data: { status: 'REJECTED' }
      })
    }

    return NextResponse.json({
      success: true,
      message: isFull ? 'تم قبول الطلب وإغلاق البوست' : 'تم قبول الطلب بنجاح',
      application: updatedApplication,
      postIsFull: isFull
    })
  } catch (error) {
    console.error('Error accepting application:', error)
    return NextResponse.json(
      { error: 'حدث خطأ أثناء قبول الطلب' },
      { status: 500 }
    )
  }
}
