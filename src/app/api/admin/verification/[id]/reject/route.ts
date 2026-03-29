import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserIdFromRequest } from '@/lib/auth-helper'
import { notifyAdminStudentRejected } from '@/lib/notifications'

/**
 * POST /api/admin/verification/[id]/reject
 *
 * Reject a student verification request
 * Only accessible by ADMIN users
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const studentId = (await params).id
    console.log('[ADMIN REJECT] Rejecting student:', studentId)

    // ✅ Get userId from multiple sources
    const userId = await getUserIdFromRequest(request)

    if (!userId) {
      console.log('[ADMIN REJECT] No user ID found')
      return NextResponse.json(
        { success: false, error: 'غير مصرح لك بالوصول' },
        { status: 401 }
      )
    }

    console.log('[ADMIN REJECT] ✅ Found userId:', userId)

    // Get user with role
    const user = await db.user.findUnique({
      where: { id: userId },
      include: {
        admin: true
      }
    })

    if (!user) {
      console.log('[ADMIN REJECT] User not found:', userId)
      return NextResponse.json(
        { success: false, error: 'المستخدم غير موجود' },
        { status: 404 }
      )
    }

    // Check if user is admin
    if (user.role !== 'ADMIN') {
      console.log('[ADMIN REJECT] User is not admin:', user.role)
      return NextResponse.json(
        { success: false, error: 'غير مصرح لك بالوصول' },
        { status: 403 }
      )
    }

    // Get rejection reason from request body
    const body = await request.json()
    const rejectionReason = body.rejectionReason || 'لم يتم تحديد سبب الرفض'

    // Get the student
    const student = await db.student.findUnique({
      where: { id: studentId },
      include: {
        user: true
      }
    })

    if (!student) {
      console.log('[ADMIN REJECT] Student not found:', studentId)
      return NextResponse.json(
        { success: false, error: 'الطالب غير موجود' },
        { status: 404 }
      )
    }

    console.log('[ADMIN REJECT] Current verification status:', student.verificationStatus)
    console.log('[ADMIN REJECT] Rejection reason:', rejectionReason)

    // Update student verification status
    const updatedStudent = await db.student.update({
      where: { id: studentId },
      data: {
        verificationStatus: 'REJECTED',
        isVerified: false,
        rejectionReason: rejectionReason
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    console.log('[ADMIN REJECT] Student rejected successfully:', updatedStudent.user.name)

    // Create notification for the student
    await db.notification.create({
      data: {
        userId: student.userId,
        type: 'APPLICATION_REJECTED',
        title: 'تم رفض طلب التحقق ❌',
        message: `سبب الرفض: ${rejectionReason}. يرجى مراجعة بياناتك والتقديم مرة أخرى.`,
        actionLink: '/profile',
        actionText: 'مراجعة البروفايل',
        isRead: false
      }
    })

    console.log('[ADMIN REJECT] Notification sent to student:', student.userId)

    // Notify other admins about the rejection
    try {
      await notifyAdminStudentRejected(student.user.name, student.user.email, rejectionReason)
    } catch (notifyError) {
      console.error('[ADMIN REJECT] Failed to notify admins:', notifyError)
      // Don't fail the rejection if notification fails
    }

    return NextResponse.json({
      success: true,
      message: 'تم رفض الطالب بنجاح',
      student: {
        id: updatedStudent.id,
        name: updatedStudent.user.name,
        email: updatedStudent.user.email,
        verificationStatus: updatedStudent.verificationStatus,
        isVerified: updatedStudent.isVerified,
        rejectionReason: updatedStudent.rejectionReason
      }
    })
  } catch (error: any) {
    console.error('[ADMIN REJECT] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'حدث خطأ أثناء رفض الطالب' },
      { status: 500 }
    )
  }
}
