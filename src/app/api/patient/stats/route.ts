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

    // Get the patient
    const patient = await db.patient.findUnique({
      where: { userId }
    })

    if (!patient) {
      return NextResponse.json(
        { error: 'المريض غير موجود' },
        { status: 404 }
      )
    }

    // Get all patient applications
    const applications = await db.application.findMany({
      where: { patientId: patient.id },
      include: {
        post: true
      }
    })

    // Calculate stats
    const totalApplications = applications.length
    const acceptedApplications = applications.filter(a => a.status === 'ACCEPTED').length
    const pendingApplications = applications.filter(a => a.status === 'PENDING').length
    const rejectedApplications = applications.filter(a => a.status === 'REJECTED').length

    // Calculate completed treatments (accepted applications for completed posts)
    const completedTreatments = applications.filter(a =>
      a.status === 'ACCEPTED' && a.post.status === 'COMPLETED'
    ).length

    return NextResponse.json({
      success: true,
      stats: {
        totalApplications,
        acceptedApplications,
        pendingApplications,
        rejectedApplications,
        completedTreatments,
      }
    })
  } catch (error) {
    console.error('Error fetching patient stats:', error)
    return NextResponse.json(
      { error: 'حدث خطأ أثناء جلب إحصائيات المريض' },
      { status: 500 }
    )
  }
}
