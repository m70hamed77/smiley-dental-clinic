import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { db } from '@/lib/db'
import { getTimeAgo } from '@/lib/utils'

export async function GET(request: NextRequest) {
  try {
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
        { error: 'الطالب غير موجود' },
        { status: 404 }
      )
    }

    // Get all student's posts
    const posts = await db.post.findMany({
      where: { studentId: student.id },
      select: { id: true }
    })

    const postIds = posts.map(p => p.id)

    if (postIds.length === 0) {
      return NextResponse.json({
        success: true,
        pendingCount: 0,
        recentApplications: []
      })
    }

    // Get all applications for these posts (not just pending)
    const applications = await db.application.findMany({
      where: {
        postId: { in: postIds }
      },
      include: {
        post: {
          select: {
            id: true,
            title: true
          }
        },
        patient: {
          include: {
            user: {
              select: {
                name: true,
                avatarUrl: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 50 // Get more applications for better UX
    })

    // Count pending applications
    const pendingCount = applications.filter(app => app.status === 'PENDING').length

    const recentApplications = applications.map(app => ({
      id: app.id,
      patientName: app.patient.user.name,
      patientAvatar: app.patient.user.avatarUrl,
      postTitle: app.post.title,
      postId: app.post.id,
      status: app.status,
      submittedAt: app.createdAt,
      timeAgo: getTimeAgo(app.createdAt)
    }))

    return NextResponse.json({
      success: true,
      pendingCount,
      recentApplications
    })
  } catch (error) {
    console.error('Error fetching student applications:', error)
    return NextResponse.json(
      { error: 'حدث خطأ أثناء جلب الطلبات' },
      { status: 500 }
    )
  }
}
