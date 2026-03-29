import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { Notification } from '@prisma/client'
import { getTimeAgo } from '@/lib/utils'
import { getUserIdFromRequest } from '@/lib/auth-helper'

// GET /api/notifications - Fetch all notifications for authenticated user (Fixed: v3)
export async function GET(request: NextRequest) {
  try {
    console.log('[Notifications] Fetching notifications...')

    // ✅ Get userId from multiple sources (cookies, headers, query params)
    const userId = await getUserIdFromRequest(request)

    console.log('[Notifications] userId:', userId)

    if (!userId) {
      console.log('[Notifications] No userId found, returning 401')
      return NextResponse.json(
        { success: false, error: 'غير مصرح بالدخول' },
        { status: 401 }
      )
    }

    // Verify user exists
    const user = await db.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      console.log('[Notifications] User not found')
      return NextResponse.json(
        { success: false, error: 'المستخدم غير موجود' },
        { status: 404 }
      )
    }

    console.log('[Notifications] User found:', user.id, user.role)

    // Fetch notifications
    const notifications = await db.notification.findMany({
      where: {
        userId: userId
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 50 // Limit to last 50 notifications
    })

    // Count unread
    const unreadCount = await db.notification.count({
      where: {
        userId: userId,
        isRead: false
      }
    })

    // Format notifications for frontend
    const formattedNotifications = notifications.map((notif: Notification) => {
      let title = notif.title
      let message = notif.message
      let actionLink = notif.actionLink || ''
      let actionText = notif.actionText || ''
      let timeAgo = getTimeAgo(notif.createdAt)

      // Parse data JSON if exists
      let data: any = null
      if (notif.data) {
        try {
          data = JSON.parse(notif.data)
        } catch (e) {
          console.error('Error parsing notification data:', e)
        }
      }

      // Set action links based on notification type (fallback if not set in DB)
      if (!actionLink && !actionText) {
        switch (notif.type) {
          case 'NEW_APPLICATION':
            if (data?.postId) {
              actionLink = `/posts/${data.postId}/applications`
              actionText = 'عرض الطلبات'
            }
            break

          case 'APPLICATION_ACCEPTED':
            if (data?.postId) {
              actionLink = `/applications`
              actionText = 'عرض طلباتي'
            }
            break

          case 'APPLICATION_REJECTED':
            if (data?.postId) {
              actionLink = `/applications`
              actionText = 'عرض طلباتي'
            }
            break

          case 'NEW_MESSAGE':
            if (data?.conversationId) {
              actionLink = `/chat?conversation=${data.conversationId}`
              actionText = 'الرد على الرسالة'
            }
            break

          case 'CASE_COMPLETED':
            if (data?.caseId) {
              actionLink = `/applications`
              actionText = 'عرض التفاصيل'
            }
            break

          case 'NEW_REVIEW':
            if (data?.caseId) {
              actionLink = `/profile`
              actionText = 'عرض التقييم'
            }
            break

          case 'NEW_RATING':
            if (data?.ratingId || data?.caseId) {
              actionLink = `/profile#ratings`
              actionText = 'عرض التقييم'
            }
            break

          case 'APPOINTMENT_REMINDER':
            if (data?.appointmentId) {
              actionLink = `/appointments`
              actionText = 'عرض الموعد'
            }
            break

          case 'NEW_BADGE':
            if (data?.badgeId) {
              actionLink = `/profile`
              actionText = 'عرض الشارة'
            }
            break

          default:
            break
        }
      }

      return {
        id: notif.id,
        type: notif.type,
        title: title,
        message: message,
        time: timeAgo,
        isRead: notif.isRead,
        actionLink: actionLink,
        actionText: actionText,
        data: notif.data || null
      }
    })

    return NextResponse.json({
      success: true,
      notifications: formattedNotifications,
      unreadCount: unreadCount,
      total: notifications.length
    })

  } catch (error) {
    console.error('Error fetching notifications:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch notifications' },
      { status: 500 }
    )
  }
}
