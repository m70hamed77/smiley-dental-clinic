import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserIdFromRequest } from '@/lib/auth-helper'

/**
 * GET /api/admin/users
 *
 * Get all users for admin management
 * Only accessible by ADMIN users
 */
export async function GET(request: NextRequest) {
  try {
    console.log('[ADMIN USERS] Fetching all users...')

    // ✅ Get userId from multiple sources (cookies, headers, query params)
    const userId = await getUserIdFromRequest(request)

    console.log('[ADMIN USERS] Auth check:', {
      hasUserId: !!userId,
      userId: userId || 'null'
    })

    if (!userId) {
      console.log('[ADMIN USERS] ❌ No user ID found')
      return NextResponse.json(
        { success: false, error: 'غير مصرح لك بالوصول' },
        { status: 401 }
      )
    }

    console.log('[ADMIN USERS] ✅ Found userId:', userId)

    // Get user with role
    const user = await db.user.findUnique({
      where: { id: userId }
    })

    console.log('[ADMIN USERS] User from DB:', {
      found: !!user,
      id: user?.id,
      name: user?.name,
      role: user?.role,
      status: user?.status
    })

    if (!user || user.role !== 'ADMIN') {
      console.log('[ADMIN USERS] ❌ User is not admin:', {
        found: !!user,
        role: user?.role,
        isAdmin: user?.role === 'ADMIN'
      })
      return NextResponse.json(
        { success: false, error: 'غير مصرح لك بالوصول' },
        { status: 403 }
      )
    }

    console.log('[ADMIN USERS] ✅ User is admin, fetching users...')

    // Get all students with their verification info
    const students = await db.student.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            role: true,
            status: true,
            createdAt: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Get all patients
    const patients = await db.patient.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            role: true,
            status: true,
            createdAt: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // ✅ تحقق من أن User موجود للكل Student/Patient
    const formattedStudents = students
      .filter(s => s.user) // فقط الطلاب الذين لديهم user
      .map(student => ({
        id: student.id,
        userId: student.user.id,
        name: student.user.name,
        email: student.user.email,
        phone: student.user.phone,
        role: student.user.role as 'STUDENT' | 'PATIENT',
        userStatus: student.user.status,
        verificationStatus: student.verificationStatus,
        universityEmail: student.universityEmail,
        idCardUrl: student.idCardUrl,
        academicYear: student.academicYear,
        createdAt: student.createdAt,
        rejectionReason: student.rejectionReason
      }))

    const formattedPatients = patients
      .filter(p => p.user) // فقط المرضى الذين لديهم user
      .map(patient => ({
        id: patient.id,
        userId: patient.user.id,
        name: patient.user.name,
        email: patient.user.email,
        phone: patient.user.phone,
        role: patient.user.role as 'STUDENT' | 'PATIENT',
        userStatus: patient.user.status,
        verificationStatus: null,
        universityEmail: null,
        idCardUrl: null,
        academicYear: null,
        createdAt: patient.createdAt,
        rejectionReason: null
      }))

    // Format and combine all users
    const allUsers = [...formattedStudents, ...formattedPatients]

    console.log('[ADMIN USERS] Found', allUsers.length, 'users')
    console.log('[ADMIN USERS] ✅ Request completed successfully')

    return NextResponse.json({
      success: true,
      users: allUsers
    })
  } catch (error: any) {
    console.error('[ADMIN USERS] ❌ Error:', error)
    console.error('[ADMIN USERS] Error stack:', error.stack)
    console.error('[ADMIN USERS] Error name:', error.name)
    console.error('[ADMIN USERS] Error message:', error.message)
    
    return NextResponse.json(
      { success: false, error: error.message || 'حدث خطأ أثناء جلب المستخدمين' },
      { status: 500 }
    )
  }
}
