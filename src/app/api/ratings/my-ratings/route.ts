import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    // Get current user from cookies
    const cookieStore = await request.cookies
    const userId = cookieStore.get('userId')?.value

    if (!userId) {
      return NextResponse.json(
        { error: 'يجب تسجيل الدخول' },
        { status: 401 }
      )
    }

    // Get the current student
    const student = await db.student.findFirst({
      where: { userId }
    })

    if (!student) {
      return NextResponse.json(
        { error: 'الحساب غير موجود' },
        { status: 404 }
      )
    }

    // Get all ratings for this student
    const ratings = await db.rating.findMany({
      where: { studentId: student.id },
      include: {
        case_: {
          include: {
            application: {
              include: {
                patient: {
                  include: {
                    user: {
                      select: {
                        id: true,
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
                    treatmentType: true
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

    console.log(`[MY RATINGS] ✅ Fetched ${ratings.length} ratings for student ${student.id}`)

    return NextResponse.json({
      success: true,
      ratings: ratings.map(r => ({
        id: r.id,
        overallRating: r.overallRating,
        qualityRating: r.qualityRating,
        professionalRating: r.professionalRating,
        punctualityRating: r.punctualityRating,
        cleanlinessRating: r.cleanlinessRating,
        explanationRating: r.explanationRating,
        reviewText: r.reviewText,
        isVisible: r.isVisible,
        patientName: r.case_?.application?.patient?.user?.name || 'مريض',
        patientAvatar: r.case_?.application?.patient?.user?.avatarUrl,
        postTitle: r.case_?.application?.post?.title || 'حالة',
        treatmentType: r.case_?.application?.post?.treatmentType || 'علاج',
        createdAt: r.createdAt
      }))
    })
  } catch (error: any) {
    console.error('[MY RATINGS] Error:', error)
    return NextResponse.json(
      { error: error.message || 'حدث خطأ أثناء جلب التقييمات' },
      { status: 500 }
    )
  }
}
