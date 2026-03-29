import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const userId = cookieStore.get('userId')?.value

    if (!userId) {
      return NextResponse.json({ error: 'يجب تسجيل الدخول' }, { status: 401 })
    }

    // Get patient record
    const patient = await db.patient.findUnique({
      where: { userId }
    })

    if (!patient) {
      return NextResponse.json({ error: 'المرضى غير موجود' }, { status: 404 })
    }

    // Get all applications for this patient
    const applications = await db.application.findMany({
      where: { patientId: patient.id },
      include: {
        post: {
          include: {
            student: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    avatarUrl: true
                  }
                }
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Get ratings for each student to calculate average rating
    const studentIds = applications.map(app => app.post.studentId)
    const ratings = await db.rating.findMany({
      where: {
        studentId: { in: studentIds }
      }
    })

    // Calculate average rating for each student
    const studentRatings: { [key: string]: { total: number; count: number } } = {}
    ratings.forEach(r => {
      if (!studentRatings[r.studentId]) {
        studentRatings[r.studentId] = { total: 0, count: 0 }
      }
      studentRatings[r.studentId].total += r.overallRating
      studentRatings[r.studentId].count += 1
    })

    // Calculate average
    const studentAvgRatings: { [key: string]: number } = {}
    Object.entries(studentRatings).forEach(([studentId, data]) => {
      if (data.count > 0) {
        studentAvgRatings[studentId] = Math.round((data.total / data.count) * 10) / 10
      }
    })

    // Format applications
    const formattedApplications = applications.map(app => ({
      id: app.id,
      postId: app.postId,
      postTitle: app.post.title,
      postCity: app.post.city,
      postAddress: app.address,
      postTreatmentType: app.post.treatmentType,
      status: app.status,
      createdAt: app.createdAt,
      studentId: app.post.studentId,
      studentName: app.post.student.user.name,
      studentAvatar: app.post.student.user.avatarUrl,
      studentRating: studentAvgRatings[app.post.studentId] || 0
    }))

    return NextResponse.json({
      success: true,
      applications: formattedApplications
    })
  } catch (error: any) {
    console.error('[Patient Applications] Error:', error)
    return NextResponse.json(
      { error: error.message || 'حدث خطأ أثناء جلب الطلبات' },
      { status: 500 }
    )
  }
}
