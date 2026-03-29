import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserIdFromRequest } from '@/lib/auth-helper'

// PUT /api/notifications/mark-read - Mark notification as read (Fixed: v3)
export async function PUT(request: NextRequest) {
  try {
    console.log('[Mark-Read PUT] Processing request...')

    // ✅ Get userId from multiple sources (cookies, headers, query params)
    const userId = await getUserIdFromRequest(request)

    console.log('[Mark-Read PUT] userId:', userId)

    if (!userId) {
      console.log('[Mark-Read PUT] No userId found')
      return NextResponse.json(
        { success: false, error: 'غير مصرح بالدخول' },
        { status: 401 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { notificationId, markAll = false } = body

    if (markAll) {
      // Mark all notifications as read
      await db.notification.updateMany({
        where: {
          userId: userId,
          isRead: false
        },
        data: {
          isRead: true
        }
      })

      return NextResponse.json({
        success: true,
        message: 'All notifications marked as read'
      })
    }

    // Validate notificationId
    if (!notificationId) {
      return NextResponse.json(
        { success: false, error: 'Notification ID is required' },
        { status: 400 }
      )
    }

    // Mark single notification as read
    const notification = await db.notification.update({
      where: {
        id: notificationId,
        userId: userId // Ensure user owns this notification
      },
      data: {
        isRead: true
      }
    })

    return NextResponse.json({
      success: true,
      notification: notification
    })

  } catch (error) {
    console.error('Error marking notification as read:', error)

    // Check if it's a "record not found" error
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
      return NextResponse.json(
        { success: false, error: 'Notification not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to mark notification as read' },
      { status: 500 }
    )
  }
}

// DELETE /api/notifications/mark-read - Delete notification (Fixed: v3)
export async function DELETE(request: NextRequest) {
  try {
    console.log('[Notifications DELETE] Processing request...')

    // ✅ Get userId from multiple sources (cookies, headers, query params)
    const userId = await getUserIdFromRequest(request)

    console.log('[Notifications DELETE] userId:', userId)

    if (!userId) {
      console.log('[Notifications DELETE] No userId found')
      return NextResponse.json(
        { success: false, error: 'غير مصرح بالدخول' },
        { status: 401 }
      )
    }

    // Parse URLSearchParams
    const { searchParams } = new URL(request.url)
    const notificationId = searchParams.get('id')
    const deleteAll = searchParams.get('deleteAll') === 'true'

    if (deleteAll) {
      // Delete all notifications
      await db.notification.deleteMany({
        where: {
          userId: userId
        }
      })

      return NextResponse.json({
        success: true,
        message: 'All notifications deleted'
      })
    }

    // Validate notificationId
    if (!notificationId) {
      return NextResponse.json(
        { success: false, error: 'Notification ID is required' },
        { status: 400 }
      )
    }

    // Delete notification
    await db.notification.delete({
      where: {
        id: notificationId,
        userId: userId // Ensure user owns this notification
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Notification deleted'
    })

  } catch (error) {
    console.error('Error deleting notification:', error)

    // Check if it's a "record not found" error
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
      return NextResponse.json(
        { success: false, error: 'Notification not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to delete notification' },
      { status: 500 }
    )
  }
}
