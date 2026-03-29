import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { db } from '@/lib/db'

// GET /api/patient/me - جلب بيانات المريض الحالي
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const userId = cookieStore.get('userId')?.value

    if (!userId) {
      return NextResponse.json({ success: false, error: 'غير مصرح' }, { status: 401 })
    }

    // Get the patient
    const patient = await db.patient.findFirst({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            avatarUrl: true
          }
        }
      }
    })

    if (!patient) {
      return NextResponse.json(
        { success: false, error: 'السجل المريض غير موجود' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      patient
    })
  } catch (error: any) {
    console.error('[Patient Me API] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'حدث خطأ أثناء جلب البيانات' },
      { status: 500 }
    )
  }
}
