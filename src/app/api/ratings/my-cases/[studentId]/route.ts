import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ studentId: string }> }
) {
  try {
    const resolvedParams = await params
    const studentId = resolvedParams.id

    // Get current user from cookies
    const cookieStore = await request.cookies
    const userId = cookieStore.get('userId')?.value

    if (!userId) {
      return NextResponse.json(
        { error: 'يجب تسجيل الدخول' },
        { status: 401 }
      )
    }

    // Get the patient
    const patient = await db.patient.findFirst({
      where: { userId }
    })

    if (!patient) {
      return NextResponse.json(
        { error: 'الحساب غير موجود' },
        { status: 404 }
      )
    }

    // Get completed cases for this patient with this student
    const cases = await db.case.findMany({
      where: {
        isCompleted: true,
        application: {
          patientId: patient.id,
          studentId: studentId
        }
      },
      include: {
        application: {
          include: {
            post: {
              select: {
                id: true,
                title: true,
                treatmentType: true
              }
            }
          }
        },
        rating: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    console.log(`[RATING CASES] ✅ Found ${cases.length} completed cases for patient ${patient.id} with student ${studentId}`)

    return NextResponse.json({
      success: true,
      cases: cases.map(c => ({
        id: c.id,
        postTitle: c.application.post.title,
        treatmentType: c.application.post.treatmentType,
        completedAt: c.endDate || c.updatedAt,
        hasRated: !!c.rating,
        rating: c.rating ? {
          overallRating: c.rating.overallRating,
          reviewText: c.rating.reviewText
        } : null
      }))
    })
  } catch (error: any) {
    console.error('[RATING CASES] Error:', error)
    return NextResponse.json(
      { error: error.message || 'حدث خطأ أثناء جلب الحالات' },
      { status: 500 }
    )
  }
}
