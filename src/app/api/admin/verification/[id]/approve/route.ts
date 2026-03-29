import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserIdFromRequest } from '@/lib/auth-helper'
import { notifyAdminStudentApproved } from '@/lib/notifications'

/**
 * POST /api/admin/verification/[id]/approve
 *
 * Approve a student verification request
 * Only accessible by ADMIN users
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const studentId = (await params).id
    console.log('[ADMIN APPROVE] Approving student:', studentId)

    // ✅ Get userId from multiple sources
    const userId = await getUserIdFromRequest(request)

    if (!userId) {
      console.log('[ADMIN APPROVE] No user ID found')
      return NextResponse.json(
        { success: false, error: 'غير مصرح لك بالوصول' },
        { status: 401 }
      )
    }

    console.log('[ADMIN APPROVE] ✅ Found userId:', userId)

    // Get user with role
    const user = await db.user.findUnique({
      where: { id: userId },
      include: {
        admin: true
      }
    })

    if (!user) {
      console.log('[ADMIN APPROVE] User not found:', userId)
      return NextResponse.json(
        { success: false, error: 'المستخدم غير موجود' },
        { status: 404 }
      )
    }

    // Check if user is admin
    if (user.role !== 'ADMIN') {
      console.log('[ADMIN APPROVE] User is not admin:', user.role)
      return NextResponse.json(
        { success: false, error: 'غير مصرح لك بالوصول' },
        { status: 403 }
      )
    }

    // Get the student
    const student = await db.student.findUnique({
      where: { id: studentId },
      include: {
        user: true
      }
    })

    if (!student) {
      console.log('[ADMIN APPROVE] Student not found:', studentId)
      return NextResponse.json(
        { success: false, error: 'الطالب غير موجود' },
        { status: 404 }
      )
    }

    console.log('[ADMIN APPROVE] Current verification status:', student.verificationStatus)

    // Update student verification status AND user status to ACTIVE
    const updatedStudent = await db.student.update({
      where: { id: studentId },
      data: {
        verificationStatus: 'APPROVED',
        isVerified: true,
        rejectionReason: null
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            status: true
          }
        }
      }
    })

    // ✅ Also update user status to ACTIVE
    await db.user.update({
      where: { id: student.userId },
      data: { status: 'ACTIVE' }
    })

    console.log('[ADMIN APPROVE] Student approved successfully:', updatedStudent.user.name)
    console.log('[ADMIN APPROVE] User status set to ACTIVE')

    // Create notification for the student
    await db.notification.create({
      data: {
        userId: student.userId,
        type: 'STUDENT_VERIFIED',
        title: 'تمت الموافقة على حسابك! 🎉',
        message: 'تم مراجعة وتأكيد بياناتك بنجاح. يمكنك الآن استخدام جميع خدمات المنصة.',
        actionLink: '/profile',
        actionText: 'الذهاب للبروفايل',
        isRead: false
      }
    })

    console.log('[ADMIN APPROVE] Notification sent to student:', student.userId)

    // Notify other admins about the approval
    try {
      await notifyAdminStudentApproved(student.user.name, student.user.email)
    } catch (notifyError) {
      console.error('[ADMIN APPROVE] Failed to notify admins:', notifyError)
      // Don't fail the approval if notification fails
    }

    return NextResponse.json({
      success: true,
      message: 'تمت الموافقة على الطالب بنجاح',
      student: {
        id: updatedStudent.id,
        name: updatedStudent.user.name,
        email: updatedStudent.user.email,
        verificationStatus: updatedStudent.verificationStatus,
        isVerified: updatedStudent.isVerified
      }
    })
  } catch (error: any) {
    console.error('[ADMIN APPROVE] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'حدث خطأ أثناء الموافقة على الطالب' },
      { status: 500 }
    )
  }
}
