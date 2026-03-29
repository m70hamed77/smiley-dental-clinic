import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const notifications = await db.notification.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      }
    })

    return NextResponse.json({
      total: notifications.length,
      notifications: notifications.map(n => ({
        id: n.id,
        userId: n.userId,
        userName: n.user?.name || 'Unknown',
        userRole: n.user?.role || 'Unknown',
        type: n.type,
        title: n.title,
        message: n.message,
        isRead: n.isRead,
        createdAt: n.createdAt
      }))
    })
  } catch (error: any) {
    return NextResponse.json({
      error: error.message,
      notifications: []
    }, { status: 500 })
  }
}
