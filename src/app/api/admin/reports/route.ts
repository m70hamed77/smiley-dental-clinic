import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserIdFromRequest } from '@/lib/auth-helper'

/**
 * GET /api/admin/reports
 *
 * Get all reports for admin management
 * Only accessible by ADMIN users
 */
export async function GET(request: NextRequest) {
  try {
    console.log('[ADMIN REPORTS] Fetching all reports...')

    // ✅ Get userId from multiple sources (cookies, headers, query params)
    const userId = await getUserIdFromRequest(request)

    if (!userId) {
      console.log('[ADMIN REPORTS] ❌ No user ID found')
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
      console.log('[ADMIN REPORTS] User is not admin:', user?.role)
      return NextResponse.json(
        { success: false, error: 'غير مصرح لك بالوصول' },
        { status: 403 }
      )
    }

    // Get all reports with reporter and reported user info
    const reports = await db.report.findMany({
      include: {
        reporter: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        reportedUser: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        resolver: {
          include: {
            user: {
              select: {
                name: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    console.log('[ADMIN REPORTS] Found', reports.length, 'reports')

    return NextResponse.json({
      success: true,
      reports: reports.map(report => ({
        id: report.id,
        reporterId: report.reporterId,
        reporterName: report.reporter.name,
        reporterEmail: report.reporter.email,
        reportedId: report.reportedUserId,
        reportedName: report.reportedUser.name,
        reportedEmail: report.reportedUser.email,
        type: report.reportType,
        description: report.description,
        status: report.status,
        adminDecision: report.adminDecision,
        adminNotes: report.adminNotes,
        banDuration: report.banDuration,
        resolvedBy: report.resolver?.user?.name || null,
        resolvedAt: report.resolvedAt,
        createdAt: report.createdAt,
        updatedAt: report.updatedAt
      }))
    })
  } catch (error: any) {
    console.error('[ADMIN REPORTS] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'حدث خطأ أثناء جلب البلاغات' },
      { status: 500 }
    )
  }
}
