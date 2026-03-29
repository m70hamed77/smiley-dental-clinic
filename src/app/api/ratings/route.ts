import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    // Get current user from cookies
    const cookieStore = await request.cookies
    const userId = cookieStore.get('userId')?.value

    if (!userId) {
      return NextResponse.json(
        { error: 'يجب تسجيل الدخول للتقييم' },
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

    // Parse request body
    const body = await request.json()
    const { caseId, overallRating, qualityRating, professionalRating, punctualityRating, cleanlinessRating, explanationRating, reviewText } = body

    // Validate required fields
    if (!caseId) {
      return NextResponse.json(
        { error: 'يجب تحديد الحالة' },
        { status: 400 }
      )
    }

    if (!overallRating || overallRating < 1 || overallRating > 5) {
      return NextResponse.json(
        { error: 'التقييم العام يجب أن يكون بين 1 و 5' },
        { status: 400 }
      )
    }

    // Validate reviewText length
    if (reviewText && reviewText.length > 500) {
      return NextResponse.json(
        { error: 'التعليق لا يجب أن يتجاوز 500 حرف' },
        { status: 400 }
      )
    }

    // Get the case and verify it belongs to this patient
    const case_ = await db.case.findUnique({
      where: { id: caseId },
      include: {
        application: {
          include: {
            patient: true,
            student: true
          }
        }
      }
    })

    console.log('[RATING] Case found:', {
      caseId,
      isCompleted: case_?.isCompleted,
      patientId: patient.id,
      casePatientId: case_?.application?.patientId,
      match: case_?.application?.patientId === patient.id
    })

    if (!case_) {
      return NextResponse.json(
        { error: 'الحالة غير موجودة' },
        { status: 404 }
      )
    }

    if (case_.application.patientId !== patient.id) {
      return NextResponse.json(
        { error: 'غير مصرح لك بتقييم هذه الحالة' },
        { status: 403 }
      )
    }

    // Check if case is completed
    if (!case_.isCompleted) {
      console.log('[RATING] ❌ Case is not completed:', {
        caseId,
        isCompleted: case_.isCompleted,
        endDate: case_.endDate
      })
      return NextResponse.json(
        { error: 'يمكن التقييم فقط للحالات المكتملة' },
        { status: 400 }
      )
    }

    // Check if rating already exists (caseId is unique)
    const existingRating = await db.rating.findUnique({
      where: { caseId }
    })

    let rating
    if (existingRating) {
      // Update existing rating
      rating = await db.rating.update({
        where: { caseId },
        data: {
          overallRating,
          qualityRating: qualityRating || null,
          professionalRating: professionalRating || null,
          punctualityRating: punctualityRating || null,
          cleanlinessRating: cleanlinessRating || null,
          explanationRating: explanationRating || null,
          reviewText: reviewText || null
        }
      })
      console.log(`[RATING] ✅ Updated rating for case ${caseId}`)
    } else {
      // Create new rating
      rating = await db.rating.create({
        data: {
          caseId,
          patientId: patient.id,
          studentId: case_.application.studentId,
          overallRating,
          qualityRating: qualityRating || null,
          professionalRating: professionalRating || null,
          punctualityRating: punctualityRating || null,
          cleanlinessRating: cleanlinessRating || null,
          explanationRating: explanationRating || null,
          reviewText: reviewText || null,
          isVisible: true // Default visible
        }
      })
      console.log(`[RATING] ✅ Created new rating for case ${caseId}`)

      // Send notification to the doctor (student)
      try {
        // Get the student's user ID
        const student = await db.student.findUnique({
          where: { id: case_.application.studentId },
          select: { userId: true }
        })

        // Get patient name for notification
        const patientUser = await db.user.findUnique({
          where: { id: userId },
          select: { name: true }
        })

        if (student && patientUser) {
          await db.notification.create({
            data: {
              userId: student.userId,
              title: 'تقييم جديد من مريض',
              message: `قيمك المريض ${patientUser.name} بتقييم ${overallRating}/5 نجوم${reviewText ? ' وكتب: ' + reviewText.substring(0, 50) + '...' : ''}`,
              type: 'NEW_RATING',
              data: JSON.stringify({
                ratingId: rating.id,
                caseId: caseId,
                overallRating,
                patientName: patientUser.name
              }),
              isRead: false
            }
          })
          console.log(`[RATING] ✅ Notification sent to student ${student.userId}`)
        }
      } catch (notifError) {
        console.error('[RATING] Failed to send notification:', notifError)
        // Don't fail the rating if notification fails
      }
    }

    return NextResponse.json({
      success: true,
      rating: {
        id: rating.id,
        overallRating: rating.overallRating,
        reviewText: rating.reviewText,
        createdAt: rating.createdAt
      },
      message: existingRating ? 'تم تحديث تقييمك بنجاح' : 'تم إرسال تقييمك بنجاح'
    })
  } catch (error: any) {
    console.error('[RATING] Error:', error)
    return NextResponse.json(
      { error: error.message || 'حدث خطأ أثناء إرسال التقييم' },
      { status: 500 }
    )
  }
}
