import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { db } from '@/lib/db'
import ZAI from 'z-ai-web-dev-sdk'

// GET /api/chat/conversations/[id]/messages - Get all messages in a conversation
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const conversationId = resolvedParams.id

    const cookieStore = await cookies()
    const userId = cookieStore.get('userId')?.value

    if (!userId) {
      return NextResponse.json({ success: false, error: 'غير مصرح' }, { status: 401 })
    }

    // Get the user
    const user = await db.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      return NextResponse.json({ success: false, error: 'المستخدم غير موجود' }, { status: 404 })
    }

    // Get the conversation
    const conversation = await db.conversation.findUnique({
      where: { id: conversationId },
      include: {
        student: {
          include: {
            user: true
          }
        },
        patient: {
          include: {
            user: true
          }
        }
      }
    })

    if (!conversation) {
      return NextResponse.json({ success: false, error: 'المحادثة غير موجودة' }, { status: 404 })
    }

    // Check if user is part of this conversation
    const studentUserId = conversation.student?.user?.id || null
    const patientUserId = conversation.patient?.user?.id || null

    const isStudent = user.role === 'STUDENT' && studentUserId === userId
    const isPatient = user.role === 'PATIENT' && patientUserId === userId

    if (!isStudent && !isPatient) {
      return NextResponse.json({ success: false, error: 'غير مصرح' }, { status: 403 })
    }

    // Get all messages for this conversation
    const messages = await db.message.findMany({
      where: {
        conversationId: conversationId
      },
      orderBy: {
        sentAt: 'asc'
      }
    })

    // Format messages for frontend
    const formattedMessages = messages.map(msg => {
      let senderName = 'مجهول'
      let senderRole = 'UNKNOWN'
      let senderUserId = ''

      if (msg.studentId) {
        senderName = conversation.student?.user?.name || 'دكتور'
        senderRole = 'STUDENT'
        senderUserId = conversation.student?.user?.id || ''
      } else if (msg.patientId) {
        senderName = conversation.patient?.user?.name || 'مريض'
        senderRole = 'PATIENT'
        senderUserId = conversation.patient?.user?.id || ''
      }

      return {
        id: msg.id,
        conversationId: msg.conversationId,
        senderId: senderUserId,
        content: msg.content || '',
        messageType: msg.messageType,
        fileUrl: msg.fileUrl,
        timestamp: msg.sentAt,
        isRead: msg.isRead,
        sender: {
          name: senderName,
          role: senderRole
        }
      }
    })

    console.log('[Messages API] ✅ Retrieved', formattedMessages.length, 'messages')

    return NextResponse.json({
      success: true,
      messages: formattedMessages,
      total: messages.length
    })
  } catch (error: any) {
    console.error('[Messages API] Error:', error)
    return NextResponse.json(
      { success: false, error: 'حدث خطأ أثناء جلب الرسائل' },
      { status: 500 }
    )
  }
}

// POST /api/chat/conversations/[id]/messages - Send a new message
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const conversationId = resolvedParams.id

    const body = await request.json()
    const { content, messageType = 'TEXT', fileUrl } = body

    // Validate
    if (messageType === 'TEXT' && (!content || !content.trim())) {
      return NextResponse.json({ success: false, error: 'محتوى الرسالة مطلوب' }, { status: 400 })
    }

    if ((messageType === 'IMAGE' || messageType === 'FILE') && !fileUrl) {
      return NextResponse.json({ success: false, error: 'رابط الملف مطلوب' }, { status: 400 })
    }

    const cookieStore = await cookies()
    const userId = cookieStore.get('userId')?.value

    if (!userId) {
      return NextResponse.json({ success: false, error: 'غير مصرح' }, { status: 401 })
    }

    // Get the user
    const user = await db.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      return NextResponse.json({ success: false, error: 'المستخدم غير موجود' }, { status: 404 })
    }

    // Get the conversation
    const conversation = await db.conversation.findUnique({
      where: { id: conversationId },
      include: {
        student: {
          include: {
            user: true
          }
        },
        patient: {
          include: {
            user: true
          }
        }
      }
    })

    if (!conversation) {
      return NextResponse.json({ success: false, error: 'المحادثة غير موجودة' }, { status: 404 })
    }

    // Check if user is part of this conversation
    const studentUserId = conversation.student?.user?.id || null
    const patientUserId = conversation.patient?.user?.id || null

    const isStudent = user.role === 'STUDENT' && studentUserId === userId
    const isPatient = user.role === 'PATIENT' && patientUserId === userId

    if (!isStudent && !isPatient) {
      return NextResponse.json({ success: false, error: 'غير مصرح' }, { status: 403 })
    }

    // For patients: check if student has sent at least one message
    if (user.role === 'PATIENT') {
      const hasStudentMessage = await db.message.findFirst({
        where: {
          conversationId: conversationId,
          studentId: conversation.student?.id
        }
      })

      if (!hasStudentMessage) {
        return NextResponse.json(
          { success: false, error: 'بانتظار الدكتور لبدء المحادثة' },
          { status: 403 }
        )
      }
    }

    // Create the message with studentId or patientId
    const newMessage = await db.message.create({
      data: {
        conversationId: conversationId,
        content: messageType === 'TEXT' ? content.trim() : null,
        messageType: messageType as any,
        fileUrl: (messageType === 'IMAGE' || messageType === 'FILE') ? fileUrl : null,
        studentId: user.role === 'STUDENT' ? conversation.studentId : null,
        patientId: user.role === 'PATIENT' ? conversation.patientId : null,
        isRead: false
      }
    })

    // Mark previous messages from the other user as read
    if (user.role === 'STUDENT') {
      await db.message.updateMany({
        where: {
          conversationId: conversationId,
          patientId: conversation.patientId,
          isRead: false
        },
        data: { isRead: true }
      })
    } else {
      await db.message.updateMany({
        where: {
          conversationId: conversationId,
          studentId: conversation.studentId,
          isRead: false
        },
        data: { isRead: true }
      })
    }

    // Get sender info
    let senderName = user.name || 'مستخدم'
    let senderRole = user.role

    console.log(`[Messages API] ✅ Message sent by ${user.role} in conversation ${conversationId}`)

    // ============================================
    // Create notification for the other user
    // ============================================
    try {
      // Determine recipient (the other user in the conversation)
      const recipientUserId = user.role === 'STUDENT' ? conversation.patient?.user?.id : conversation.student?.user?.id
      const recipientUser = user.role === 'STUDENT' ? conversation.patient?.user : conversation.student?.user

      if (recipientUserId && recipientUser) {
        console.log(`[Messages API] Creating notification for user ${recipientUserId}`)
        console.log(`[Messages API] Notification data: conversationId=${conversationId}, senderName=${senderName}`)

        // Create notification in database
        await db.notification.create({
          data: {
            userId: recipientUserId,
            type: 'NEW_MESSAGE',
            title: 'رسالة جديدة',
            message: `${senderName} أرسل لك رسالة جديدة`,
            data: JSON.stringify({
              conversationId: conversationId,
              senderId: user.id,
              senderName: senderName
            })
          }
        })

        console.log(`[Messages API] ✅ Notification created for user ${recipientUserId}`)

        // Use z-ai-web-dev-sdk for additional notification handling
        try {
          const zai = await ZAI.create()
          // You can add additional AI-powered notification processing here if needed
          console.log(`[Messages API] ✅ z-ai-web-dev-sdk initialized for notification`)
        } catch (zaiError: any) {
          console.error(`[Messages API] z-ai-web-dev-sdk error:`, zaiError.message)
          // Continue even if z-ai fails
        }
      } else {
        console.log(`[Messages API] ⚠️ No recipient user found for notification`)
      }
    } catch (notificationError: any) {
      console.error('[Messages API] Error creating notification:', notificationError)
      // Continue even if notification fails
    }

    return NextResponse.json({
      success: true,
      message: {
        id: newMessage.id,
        conversationId: newMessage.conversationId,
        senderId: user.id,
        content: newMessage.content,
        messageType: newMessage.messageType,
        fileUrl: newMessage.fileUrl,
        timestamp: newMessage.sentAt,
        isRead: newMessage.isRead,
        sender: {
          name: senderName,
          role: senderRole
        }
      }
    })
  } catch (error: any) {
    console.error('[Messages API] Error:', error)
    return NextResponse.json(
      { success: false, error: 'حدث خطأ أثناء إرسال الرسالة' },
      { status: 500 }
    )
  }
}
