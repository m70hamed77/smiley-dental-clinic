import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserIdFromRequest } from '@/lib/auth-helper'

/**
 * GET /api/admin/dashboard-stats
 *
 * Get dashboard statistics for admin
 * Only accessible by ADMIN users
 *
 * Updated: Now supports userId from cookies, headers, and query parameters
 */
export async function GET(request: NextRequest) {
  try {
    console.log('[ADMIN STATS] Fetching dashboard statistics...')

    // ✅ Get userId from multiple sources (cookies, headers, query params)
    const userId = await getUserIdFromRequest(request)

    if (!userId) {
      console.log('[ADMIN STATS] No user ID found')
      return NextResponse.json(
        { success: false, error: 'غير مصرح لك بالوصول' },
        { status: 401 }
      )
    }

    // Get user with role
    const user = await db.user.findUnique({
      where: { id: userId }
    })

    if (!user || user.role !== 'ADMIN') {
      console.log('[ADMIN STATS] User is not admin:', user?.role)
      return NextResponse.json(
        { success: false, error: 'غير مصرح لك بالوصول' },
        { status: 403 }
      )
    }

    console.log('[ADMIN STATS] User is admin, fetching stats...')

    // Get pending verifications count
    const pendingVerifications = await db.student.count({
      where: { verificationStatus: 'PENDING' }
    })

    // Get total users count
    const totalUsers = await db.user.count()

    // Get approved doctors (verified and active students)
    const approvedDoctors = await db.student.count({
      where: {
        verificationStatus: 'APPROVED',
        user: {
          status: 'ACTIVE'
        }
      }
    })

    // Get rejected doctors
    const rejectedDoctors = await db.student.count({
      where: {
        verificationStatus: 'REJECTED'
      }
    })

    // Get deleted users (both doctors and patients)
    const deletedUsers = await db.user.count({
      where: { status: 'DELETED' }
    })

    // Get banned users
    const bannedUsers = await db.user.count({
      where: { status: 'BANNED' }
    })

    // Get suspended users
    const suspendedUsers = await db.user.count({
      where: { status: 'SUSPENDED' }
    })

    // Get active patients
    const activePatients = await db.patient.count({
      where: {
        user: {
          status: 'ACTIVE'
        }
      }
    })

    // Get pending reports
    const pendingReports = await db.report.count({
      where: { status: 'PENDING' }
    })

    // Get resolved reports
    const resolvedReports = await db.report.count({
      where: { status: 'RESOLVED' }
    })

    // Get dismissed reports (by admin decision, not status)
    const dismissedReports = await db.report.count({
      where: { adminDecision: 'DISMISS' }
    })

    // Get rejected reports
    const rejectedReports = await db.report.count({
      where: { status: 'REJECTED' }
    })

    // Calculate total reports
    const totalReports = pendingReports + resolvedReports + dismissedReports + rejectedReports

    console.log('[ADMIN STATS] Stats fetched successfully')
    console.log('[ADMIN STATS] Stats details:', {
      pendingVerifications,
      totalUsers,
      approvedDoctors,
      rejectedDoctors,
      deletedUsers,
      bannedUsers,
      suspendedUsers,
      activePatients,
      pendingReports,
      resolvedReports,
      dismissedReports,
      rejectedReports,
      totalReports
    })

    return NextResponse.json({
      success: true,
      stats: {
        pendingVerifications,
        totalUsers,
        approvedDoctors,
        rejectedDoctors,
        deletedUsers,
        bannedUsers,
        suspendedUsers,
        activePatients,
        pendingReports,
        resolvedReports,
        dismissedReports,
        rejectedReports,
        totalReports
      }
    })
  } catch (error: any) {
    console.error('[ADMIN STATS] Error:', error)
    console.error('[ADMIN STATS] Error name:', error.name)
    console.error('[ADMIN STATS] Error message:', error.message)
    return NextResponse.json(
      { success: false, error: error.message || 'حدث خطأ أثناء جلب الإحصائيات' },
      { status: 500 }
    )
  }
}
