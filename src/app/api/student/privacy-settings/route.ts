import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { db } from '@/lib/db'

export async function PATCH(request: NextRequest) {
  try {
    console.log('[PRIVACY SETTINGS] 📝 Received request')

    // Get cookies FIRST before any async operations
    const cookieStore = await cookies()
    const userId = cookieStore.get('userId')?.value

    console.log('[PRIVACY SETTINGS] User ID:', userId)

    if (!userId) {
      console.log('[PRIVACY SETTINGS] ❌ No user ID found')
      return NextResponse.json(
        { error: 'يجب تسجيل الدخول' },
        { status: 401 }
      )
    }

    // Parse request body BEFORE any async DB operations
    let body
    try {
      const rawBody = await request.text()
      body = JSON.parse(rawBody)
    } catch (parseError) {
      console.error('[PRIVACY SETTINGS] ❌ Failed to parse request body:', parseError)
      return NextResponse.json(
        { error: 'فشل في قراءة البيانات المرسلة' },
        { status: 400 }
      )
    }

    console.log('[PRIVACY SETTINGS] Request body:', body)

    // Validate allowed fields
    const allowedFields = [
      'publicProfileEnabled',
      'showCases',
      'showRatings',
      'showReviews',
      'showActivePosts',
      'showLocation',
      'showSpecialization',
      'showBio',
      'showCompletedCount'
    ]

    const invalidFields = Object.keys(body).filter(key => !allowedFields.includes(key))
    if (invalidFields.length > 0) {
      console.log('[PRIVACY SETTINGS] ❌ Invalid fields:', invalidFields)
      return NextResponse.json(
        { error: `حقول غير مسموحة: ${invalidFields.join(', ')}` },
        { status: 400 }
      )
    }

    // Get the student
    const student = await db.student.findFirst({
      where: { userId }
    })

    console.log('[PRIVACY SETTINGS] Student:', student?.id, 'User:', student?.userId)

    if (!student) {
      console.log('[PRIVACY SETTINGS] ❌ Student not found')
      return NextResponse.json(
        { error: 'الطالب غير موجود' },
        { status: 404 }
      )
    }

    // Update privacy settings
    console.log('[PRIVACY SETTINGS] Updating student:', student.id, 'with:', body)
    const updatedStudent = await db.student.update({
      where: { id: student.id },
      data: body
    })

    console.log('[PRIVACY SETTINGS] ✅ Updated student in database')

    console.log('[PRIVACY SETTINGS] Updated values:')
    allowedFields.forEach(field => {
      if (body[field] !== undefined) {
        console.log(`  - ${field}: ${updatedStudent[field]}`)
      }
    })

    return NextResponse.json({
      success: true,
      message: 'تم تحديث إعدادات الخصوصية بنجاح',
      settings: {
        publicProfileEnabled: updatedStudent.publicProfileEnabled,
        showCases: updatedStudent.showCases,
        showRatings: updatedStudent.showRatings,
        showReviews: updatedStudent.showReviews,
        showActivePosts: updatedStudent.showActivePosts,
        showLocation: updatedStudent.showLocation,
        showSpecialization: updatedStudent.showSpecialization,
        showBio: updatedStudent.showBio,
        showCompletedCount: updatedStudent.showCompletedCount
      }
    })
  } catch (error: any) {
    console.error('[PRIVACY SETTINGS] ❌ Error:', error)
    console.error('[PRIVACY SETTINGS] Error details:', {
      message: error.message,
      stack: error.stack
    })
    return NextResponse.json(
      { error: error.message || 'حدث خطأ أثناء تحديث الإعدادات' },
      { status: 500 }
    )
  }
}
