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
        { error: 'غير مصرح - يمكنك فقط عرض طلبات البوستات الخاصة بك' },
        { status: 403 }
      )
    }

    // Get all applications for this post
    const applications = await db.application.findMany({
      where: { postId: id },
      include: {
        patient: {
          include: {
            user: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({
      success: true,
      applications: applications.map(app => ({
        id: app.id,
        patientId: app.patientId,
        patientName: app.patient.user.name,
        patientEmail: app.patient.user.email,
        patientPhone: app.patient.user.phone,
        patientAge: app.patient.age,
        patientGender: app.patient.gender,
        patientAddress: app.patient.address,
        status: app.status,
        createdAt: app.createdAt,
        updatedAt: app.updatedAt,
        medicalSnapshot: app.medicalSnapshot
      }))
    })
  } catch (error) {
    console.error('Error fetching applications:', error)
    return NextResponse.json(
      { error: 'حدث خطأ أثناء جلب الطلبات' },
      { status: 500 }
    )
  }
}
