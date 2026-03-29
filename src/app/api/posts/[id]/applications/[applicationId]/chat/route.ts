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

    // Get the student
    const student = await db.student.findUnique({
      where: { userId }
    })

    if (!student) {
      return NextResponse.json(
        { error: 'غير مصرح' },
        { status: 403 }
      )
    }

    // Get the application
    const application = await db.application.findUnique({
      where: { id: applicationId },
      include: {
        post: true
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

    // Check if the user is the owner of the post
    if (application.post.studentId !== student.id) {
      return NextResponse.json(
        { error: 'غير مصرح' },
        { status: 403 }
      )
    }

    // Check if a case exists for this application
    let case_ = await db.case.findUnique({
      where: { applicationId: applicationId }
    })

    console.log(`[Chat API] Case found for application ${applicationId}:`, !!case_, case_?.id)

    // If no case exists, create one
    if (!case_) {
      console.log(`[Chat API] Creating new case for application ${applicationId}`)
      case_ = await db.case.create({
        data: {
          applicationId: applicationId
        }
      })
      console.log(`[Chat API] New case created: ${case_.id}`)
    }

    // Check if a conversation exists
    let conversation = await db.conversation.findUnique({
      where: { caseId: case_.id }
    })

    console.log(`[Chat API] Conversation found for case ${case_.id}:`, !!conversation, conversation?.id)

    // If no conversation exists, create one
    if (!conversation) {
      console.log(`[Chat API] Creating new conversation for case ${case_.id}`)
      conversation = await db.conversation.create({
        data: {
          caseId: case_.id,
          studentId: student.id,
          patientId: application.patientId
        }
      })
      console.log(`[Chat API] New conversation created: ${conversation.id}`)
    }

    console.log(`[Chat API] Returning conversation ID: ${conversation.id}`)

    return NextResponse.json({
      success: true,
      conversationId: conversation.id,
      message: conversation
    })
  } catch (error) {
    console.error('Error creating/opening chat:', error)
    return NextResponse.json(
      { error: 'حدث خطأ أثناء إنشاء المحادثة' },
      { status: 500 }
    )
  }
}
