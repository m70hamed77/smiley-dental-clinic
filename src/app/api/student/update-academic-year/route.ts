import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { db } from '@/lib/db'

// API لتحديث البيانات الأكاديمية للطالب (v4 - With new Prisma Client)
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
    const { academicYear, universityName, collegeName, collegeAddress } = body

    console.log('[Update Academic Info] Received data:', {
      academicYear,
      universityName,
      collegeName,
      collegeAddress
    })

    // تحديث السنة الدراسية للطالب
    const student = await db.student.findFirst({
      where: { userId }
    })

    if (!student) {
      return NextResponse.json(
        { success: false, error: 'لم يتم العثور على حساب الطالب' },
        { status: 404 }
      )
    }

    // بناء كائن البيانات للتحديث
    const updateData: any = {}

    // التحقق من صحة السنة الدراسية وإضافتها للتحديث
    if (academicYear !== undefined && academicYear !== null) {
      if (academicYear < 1 || academicYear > 6) {
        return NextResponse.json(
          { success: false, error: 'السنة الدراسية غير صالحة' },
          { status: 400 }
        )
      }
      updateData.academicYear = academicYear
    }

    // إضافة البيانات الأكاديمية للتحديث
    // نستخدم الشرط: إذا كانت القيمة موجودة (ليست undefined وليست null وليست سلسلة فارغة)
    if (universityName !== undefined && universityName !== null && universityName !== '') {
      updateData.universityName = universityName
    }

    if (collegeName !== undefined && collegeName !== null && collegeName !== '') {
      updateData.collegeName = collegeName
    }

    if (collegeAddress !== undefined && collegeAddress !== null && collegeAddress !== '') {
      updateData.collegeAddress = collegeAddress
    }

    console.log('[Update Academic Info] Final updateData:', updateData)

    const updatedStudent = await db.student.update({
      where: { id: student.id },
      data: updateData
    })

    // تحويل السنة إلى اسمها بالعربية
    const getAcademicYearName = (year: number) => {
      const years: { [key: number]: string } = {
        1: 'الأولى',
        2: 'الثانية',
        3: 'الثالثة',
        4: 'الرابعة',
        5: 'الخامسة',
        6: 'السادسة'
      }
      return years[year] || `السنة ${year}`
    }

    return NextResponse.json({
      success: true,
      student: {
        ...updatedStudent,
        academicYearName: getAcademicYearName(updatedStudent.academicYear || 0)
      },
      message: 'تم تحديث البيانات الأكاديمية بنجاح'
    })
  } catch (error) {
    console.error('[Update Academic Info] Error:', error)
    return NextResponse.json(
      { success: false, error: 'حدث خطأ أثناء تحديث البيانات الأكاديمية' },
      { status: 500 }
    )
  }
}
