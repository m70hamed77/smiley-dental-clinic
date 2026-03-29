import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserIdFromRequest } from '@/lib/auth-helper'

/**
 * POST /api/admin/users/[id]/delete
 *
 * Delete a user account (Soft Delete)
 * Only accessible by ADMIN users
 *
 * Changes status to DELETED and stores deleteReason
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = (await params).id
    console.log('[ADMIN DELETE USER] Deleting user:', userId)

    // Get delete reason from request body
    const body = await request.json()
    const deleteReason = body.deleteReason || 'لم يتم تحديد سبب الحذف'

    if (!deleteReason.trim()) {
      console.log('[ADMIN DELETE USER] No delete reason provided')
      return NextResponse.json(
        { success: false, error: 'سبب الحذف مطلوب' },
        { status: 400 }
      )
    }

    // ✅ Get userId from multiple sources
    const adminUserId = await getUserIdFromRequest(request)

    if (!adminUserId) {
      console.log('[ADMIN DELETE USER] No user ID found')
      return NextResponse.json(
        { success: false, error: 'غير مصرح لك بالوصول' },
        { status: 401 }
      )
    }

    console.log('[ADMIN DELETE USER] ✅ Found admin userId:', adminUserId)

    // Get admin user with role
    const adminUser = await db.user.findUnique({
      where: { id: adminUserId }
    })

    if (!adminUser || adminUser.role !== 'ADMIN') {
      console.log('[ADMIN DELETE USER] User is not admin:', adminUser?.role)
      return NextResponse.json(
        { success: false, error: 'غير مصرح لك بالوصول' },
        { status: 403 }
      )
    }

    // Check if the user exists
    const userToDelete = await db.user.findUnique({
      where: { id: userId },
      include: {
        student: true,
        patient: true
      }
    })

    if (!userToDelete) {
      console.log('[ADMIN DELETE USER] User not found:', userId)
      return NextResponse.json(
        { success: false, error: 'المستخدم غير موجود' },
        { status: 404 }
      )
    }

    // Prevent deleting admin accounts
    if (userToDelete.role === 'ADMIN') {
      console.log('[ADMIN DELETE USER] Cannot delete admin account')
      return NextResponse.json(
        { success: false, error: 'لا يمكن حذف حسابات الأدمن' },
        { status: 403 }
      )
    }

    console.log('[ADMIN DELETE USER] User to delete:', {
      id: userToDelete.id,
      name: userToDelete.name,
      email: userToDelete.email,
      role: userToDelete.role,
      currentStatus: userToDelete.status
    })

    // Soft delete: update status to DELETED and store deleteReason
    const deletedUser = await db.user.update({
      where: { id: userId },
      data: {
        status: 'DELETED',
        deleteReason: deleteReason.trim()
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        deleteReason: true
      }
    })

    console.log('[ADMIN DELETE USER] User deleted successfully:', deletedUser.name)

    return NextResponse.json({
      success: true,
      message: 'تم حذف الحساب بنجاح',
      user: deletedUser
    })
  } catch (error: any) {
    console.error('[ADMIN DELETE USER] Error:', error)
    console.error('[ADMIN DELETE USER] Error name:', error.name)
    console.error('[ADMIN DELETE USER] Error message:', error.message)
    return NextResponse.json(
      { success: false, error: error.message || 'حدث خطأ أثناء حذف الحساب' },
      { status: 500 }
    )
  }
}
