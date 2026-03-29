import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/cases/by-application/[applicationId] - جلب الحالة بناءً على معرف الطلب
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ applicationId: string }> }
) {
  try {
    const resolvedParams = await params
    const applicationId = resolvedParams.applicationId

    // Get the case by application ID
    const case_ = await db.case.findUnique({
      where: { applicationId },
      include: {
        rating: true
      }
    })

    if (!case_) {
      return NextResponse.json(
        { success: false, error: 'الحالة غير موجودة' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      case: case_
    })
  } catch (error: any) {
    console.error('[Case by Application API] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'حدث خطأ أثناء جلب الحالة' },
      { status: 500 }
    )
  }
}
