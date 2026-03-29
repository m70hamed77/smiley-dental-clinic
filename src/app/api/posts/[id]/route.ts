import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const id = resolvedParams.id

    if (!id) {
      return NextResponse.json(
        { error: 'معرف البوست مطلوب' },
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

    // Get the post with student info
    const post = await db.post.findUnique({
      where: { id },
      include: {
        student: {
          include: {
            user: true
          }
        }
      }
    })

    if (!post) {
      return NextResponse.json(
        { error: 'البوست غير موجود' },
        { status: 404 }
      )
    }

    // Get the current user
    const user = await db.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'المستخدم غير موجود' },
        { status: 404 }
      )
    }

    // Check if the user is the owner of this post
    const isOwner = user.id === post.student.userId

    // Get the student record for the current user (if they are a student)
    const student = await db.student.findUnique({
      where: { userId: user.id }
    })

    // Check if user has applied to this post
    let hasApplied = false
    let conversationId: string | null = null

    if (user.role === 'PATIENT') {
      // Get patient record
      const patient = await db.patient.findUnique({
        where: { userId: user.id }
      })

      if (patient) {
        const application = await db.application.findFirst({
          where: {
            postId: post.id,
            patientId: patient.id
          }
        })
        hasApplied = !!application

        // If patient has an accepted application, get the conversation ID
        if (application && application.status === 'ACCEPTED') {
          const case_ = await db.case.findUnique({
            where: { applicationId: application.id }
          })

          if (case_) {
            const conversation = await db.conversation.findUnique({
              where: { caseId: case_.id }
            })

            if (conversation) {
              conversationId = conversation.id
            }
          }
        }
      }
    }

    // Calculate statistics
    const allApplications = await db.application.findMany({
      where: { postId: post.id }
    })

    const totalApplications = allApplications.length
    const pendingApplications = allApplications.filter(a => a.status === 'PENDING').length
    const acceptedApplications = allApplications.filter(a => a.status === 'ACCEPTED').length
    const rejectedApplications = allApplications.filter(a => a.status === 'REJECTED').length

    // Check if the post is full
    const requiredCount = post.requiredCount || 5
    const isFull = acceptedApplications >= requiredCount
    const remainingCount = Math.max(0, requiredCount - acceptedApplications)

    // Return the response with current user info
    return NextResponse.json({
      success: true,
      post: post,
      stats: {
        totalApplications,
        pendingApplications,
        acceptedApplications,
        rejectedApplications,
        remainingCount
      },
      currentUser: {
        id: user.id,
        role: user.role,
        isOwner,
        hasApplied,
        isFull,
        conversationId
      }
    })
  } catch (error) {
    console.error('Error fetching post details:', error)
    return NextResponse.json(
      { error: 'حدث خطأ أثناء جلب تفاصيل البوست' },
      { status: 500 }
    )
  }
}
