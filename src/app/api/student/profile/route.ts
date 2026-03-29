import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const userId = cookieStore.get('userId')?.value

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const user = await db.user.findUnique({
      where: { id: userId }
    })

    if (!user || user.role !== 'STUDENT') {
      return NextResponse.json(
        { success: false, error: 'Not authorized' },
        { status: 403 }
      )
    }

    const student = await db.student.findFirst({
      where: { userId: userId }
    })

    if (!student) {
      return NextResponse.json(
        { success: false, error: 'Student profile not found' },
        { status: 404 }
      )
    }

    const getAcademicYearName = (year: number | null) => {
      if (!year) return null
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
        id: student.id,
        universityName: student.universityName || null,
        universityEmail: student.universityEmail || null,
        academicYear: student.academicYear || null,
        academicYearName: getAcademicYearName(student.academicYear),
        studentIdNumber: student.studentIdNumber || null,
        idCardUrl: student.idCardUrl || null,
        isVerified: student.isVerified,
        verificationStatus: student.verificationStatus || null,  // ✅ إضافة الحالة الكاملة
        rejectionReason: student.rejectionReason || null,  // ✅ إضافة سبب الرفض
        specialization: student.specialization || null,
        bio: student.bio || null,
        location: student.location || null,
        city: student.city || null,
        collegeName: student.collegeName || null,
        collegeAddress: student.collegeAddress || null,
        completedCases: student.completedCases,
        activeCases: student.activeCases,
        cancelledCases: student.cancelledCases,
        // Privacy Settings
        publicProfileEnabled: student.publicProfileEnabled ?? true,
        showCases: student.showCases ?? true,
        showRatings: student.showRatings ?? true,
        showReviews: student.showReviews ?? true,
        showActivePosts: student.showActivePosts ?? true,
        showLocation: student.showLocation ?? true,
        showSpecialization: student.showSpecialization ?? true,
        showBio: student.showBio ?? true,
        showCompletedCount: student.showCompletedCount ?? true
      }
    })
  } catch (error) {
    console.error('[Student Profile API] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch student profile' },
      { status: 500 }
    )
  }
}
