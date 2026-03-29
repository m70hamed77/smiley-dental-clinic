import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const userId = cookieStore.get('userId')?.value

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'غير مصرح بالدخول' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { collegeName, collegeAddress } = body

    console.log('[Update College] Received:', { collegeName, collegeAddress })

    // البحث عن الطالب
    const student = await db.student.findFirst({
      where: { userId }
    })

    if (!student) {
      return NextResponse.json(
        { success: false, error: 'لم يتم العثور على حساب الطالب' },
        { status: 404 }
      )
    }

    // تحديث بيانات الكلية
    const updateData: any = {}
    
    if (collegeName !== undefined) {
      updateData.collegeName = collegeName
    }
    
    if (collegeAddress !== undefined) {
      updateData.collegeAddress = collegeAddress
    }

    console.log('[Update College] Updating with:', updateData)

    const updatedStudent = await db.student.update({
      where: { id: student.id },
      data: updateData
    })

    console.log('[Update College] ✅ Updated successfully')

    return NextResponse.json({
      success: true,
      student: {
        collegeName: updatedStudent.collegeName,
        collegeAddress: updatedStudent.collegeAddress
      },
      message: 'تم تحديث بيانات الكلية بنجاح'
    })
  } catch (error) {
    console.error('[Update College] Error:', error)
    return NextResponse.json(
      { success: false, error: 'حدث خطأ أثناء تحديث البيانات' },
      { status: 500 }
    )
  }
}
