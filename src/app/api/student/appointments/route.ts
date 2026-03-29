import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { db } from '@/lib/db'

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

    // Get all cases for this student (through applications on their posts)
    const studentPosts = await db.post.findMany({
      where: { studentId: student.id },
      select: { id: true }
    })

    const postIds = studentPosts.map(p => p.id)

    if (postIds.length === 0) {
      return NextResponse.json({
        success: true,
        upcomingCount: 0,
        appointments: []
      })
    }

    // Get applications on these posts
    const applications = await db.application.findMany({
      where: {
        postId: { in: postIds },
        status: 'ACCEPTED'
      },
      include: {
        case_: {
          include: {
            appointment: true
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
        },
        post: {
          select: {
            id: true,
            title: true,
            city: true,
            address: true
          }
        }
      }
    })

    // Filter applications that have a case and appointment
    const appointments = applications
      .filter(app => app.case_ && app.case_.appointment)
      .map(app => ({
        id: app.case_!.appointment!.id,
        caseId: app.case_!.id,
        patientName: app.patient.user.name,
        patientAvatar: app.patient.user.avatarUrl,
        postTitle: app.post.title,
        postId: app.post.id,
        scheduledAt: app.case_!.appointment!.scheduledAt,
        location: app.case_!.appointment!.location,
        status: app.case_!.appointment!.status,
        duration: app.case_!.appointment!.duration,
        caseAddress: `${app.post.city} - ${app.post.address}`
      }))

    // Count upcoming appointments (scheduledAt > now)
    const now = new Date()
    const upcomingAppointments = appointments.filter(
      app => new Date(app.scheduledAt) > now
    )
    const upcomingCount = upcomingAppointments.length

    return NextResponse.json({
      success: true,
      upcomingCount,
      appointments
    })
  } catch (error) {
    console.error('Error fetching student appointments:', error)
    return NextResponse.json(
      { error: 'حدث خطأ أثناء جلب المواعيد' },
      { status: 500 }
    )
  }
}
