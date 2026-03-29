import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getTimeAgo } from '@/lib/utils'
import { getUserIdFromRequest } from '@/lib/auth-helper'

// GET /api/notifications/new - New notifications API
export async function GET(request: NextRequest) {
  try {
    console.log('[Notifications New] Fetching...')

    // ✅ Get userId from multiple sources (cookies, headers, query params)
    const userId = await getUserIdFromRequest(request)

    console.log('[Notifications New] userId:', userId)

    if (!userId) {
      return NextResponse.json({ success: false, error: 'غير مصرح' }, { status: 401 })
    }

    const user = await db.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      return NextResponse.json({ success: false, error: 'المستخدم غير موجود' }, { status: 404 })
    }

    const notifications = await db.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50
    })

    console.log('[Notifications New] Raw notifications from DB:', notifications.length)
    console.log('[Notifications New] Sample notifications:', notifications.map(n => ({
      id: n.id,
      userId: n.userId,
      type: n.type,
      title: n.title,
      isRead: n.isRead
    })))

    const unreadCount = await db.notification.count({
      where: { userId, isRead: false }
    })

    console.log('[Notifications New] Unread count:', unreadCount)

    const formatted = notifications.map((n: any) => {
      // Parse data from notification
      let notificationData: any = {}
      try {
        if (n.data) {
          notificationData = JSON.parse(n.data)
        }
      } catch (e) {
        console.error('[Notifications New] Error parsing notification data:', e)
      }

      // Use actionLink and actionText from notification if available
      let actionLink = n.actionLink || ''
      let actionText = n.actionText || ''

      // Determine action link and text based on notification type (fallback)
      if (!actionLink && !actionText) {
        switch (n.type) {
          case 'NEW_APPLICATION':
            actionLink = `/posts/${notificationData.postId}/applications`
            actionText = 'عرض الطلبات'
            break

          case 'APPLICATION_ACCEPTED':
            actionLink = `/chat?conversation=${notificationData.conversationId}`
            actionText = 'فتح المحادثة'
            break

          case 'APPLICATION_REJECTED':
            actionLink = '/search'
            actionText = 'تصفح الحالات'
            break

          case 'NEW_MESSAGE':
            actionLink = `/chat?conversation=${notificationData.conversationId}`
            actionText = 'فتح المحادثة'
            break

          case 'CASE_COMPLETED':
            actionLink = `/posts/${notificationData.postId}`
            actionText = 'عرض البوست'
            break

          case 'NEW_REVIEW':
          case 'RATING_RECEIVED':
          case 'NEW_RATING':
            actionLink = `/profile#ratings`
            actionText = 'عرض التقييم'
            break

          case 'APPOINTMENT_REMINDER':
            actionLink = `/appointments`
            actionText = 'عرض المواعيد'
            break

          case 'NEW_BADGE':
            actionLink = '/profile'
            actionText = 'عرض الملف الشخصي'
            break

          case 'REPORT_RESOLVED':
            actionLink = '/profile'
            actionText = 'عرض التفاصيل'
            break

          default:
            actionLink = ''
            actionText = ''
        }
      }

      return {
        id: n.id,
        type: n.type,
        title: n.title,
        message: n.message,
        time: getTimeAgo(n.createdAt),
        isRead: n.isRead,
        actionLink,
        actionText,
        data: n.data || null
      }
    })

    return NextResponse.json({
      success: true,
      notifications: formatted,
      unreadCount,
      total: notifications.length
    })
  } catch (error: any) {
    console.error('[Notifications New] Error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
