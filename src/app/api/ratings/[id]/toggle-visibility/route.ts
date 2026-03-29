import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Resolve params first
    const resolvedParams = await params
    const ratingId = resolvedParams.id

    console.log('[RATING VISIBILITY] ===== Toggle Request Start =====')
    console.log('[RATING VISIBILITY] Rating ID:', ratingId)

    // Validate rating ID
    if (!ratingId || ratingId === 'undefined' || ratingId === 'null') {
      console.log('[RATING VISIBILITY] ❌ Invalid rating ID')
      return NextResponse.json(
        { success: false, error: 'معرف التقييم غير صالح' },
        { status: 400 }
      )
    }

    // Get current rating
    const rating = await db.rating.findUnique({
      where: { id: ratingId }
    })

    if (!rating) {
      console.log('[RATING VISIBILITY] ❌ Rating not found:', ratingId)
      return NextResponse.json(
        { success: false, error: 'التقييم غير موجود' },
        { status: 404 }
      )
    }

    console.log('[RATING VISIBILITY] ✅ Rating found, current isVisible:', rating.isVisible)

    // Get current user from cookies
    const cookieStore = await request.cookies
    const userId = cookieStore.get('userId')?.value

    console.log('[RATING VISIBILITY] User ID from cookie:', userId)

    if (!userId) {
      console.log('[RATING VISIBILITY] ❌ Not authenticated')
      return NextResponse.json(
        { success: false, error: 'يجب تسجيل الدخول' },
        { status: 401 }
      )
    }

    // Get the current student
    const student = await db.student.findFirst({
      where: { userId }
    })

    if (!student) {
      console.log('[RATING VISIBILITY] ❌ Student not found')
      return NextResponse.json(
        { success: false, error: 'الحساب غير موجود' },
        { status: 404 }
      )
    }

    console.log('[RATING VISIBILITY] Student ID:', student.id)
    console.log('[RATING VISIBILITY] Rating studentId:', rating.studentId)

    // Verify that the student owns this rating
    console.log('[RATING VISIBILITY] 🛡️ Authorization Check:')
    console.log('  - Rating studentId:', rating.studentId)
    console.log('  - Student ID:', student.id)
    console.log('  - Match:', rating.studentId === student.id)
    console.log('  - Rating ID:', rating.id)
    console.log('  - User ID:', userId)

    if (rating.studentId !== student.id) {
      console.log('[RATING VISIBILITY] ❌❌❌ AUTHORIZATION FAILED ❌❌❌')
      console.log('[RATING VISIBILITY] Reason: rating.studentId !== student.id')
      return NextResponse.json(
        {
          success: false,
          error: 'غير مصرح لك بتعديل هذا التقييم',
          details: {
            ratingStudentId: rating.studentId,
            currentStudentId: student.id,
            ratingId: rating.id
          }
        },
        { status: 403 }
      )
    }

    console.log('[RATING VISIBILITY] ✅ Authorization passed!')

    // Toggle visibility
    const newVisibility = !rating.isVisible
    console.log('[RATING VISIBILITY] Toggling from', rating.isVisible, 'to', newVisibility)

    const updatedRating = await db.rating.update({
      where: { id: ratingId },
      data: { isVisible: newVisibility }
    })

    console.log('[RATING VISIBILITY] ✅ Toggle successful, new value:', updatedRating.isVisible)

    return NextResponse.json({
      success: true,
      rating: {
        id: updatedRating.id,
        isVisible: updatedRating.isVisible
      }
    })
  } catch (error: any) {
    console.error('[RATING VISIBILITY] ❌ Error:', error.message)
    console.error('[RATING VISIBILITY] Stack:', error.stack)
    return NextResponse.json(
      { success: false, error: error.message || 'حدث خطأ أثناء تحديث التقييم' },
      { status: 500 }
    )
  }
}
