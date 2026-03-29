import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { db } from '@/lib/db'

// GET /api/chat/conversations/[id] - Get conversation details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const conversationId = resolvedParams.id

    console.log('[Conversation API] Fetching conversation with ID:', conversationId)

    const cookieStore = await cookies()
    const userId = cookieStore.get('userId')?.value

    console.log('[Conversation API] User ID from cookie:', userId)

    if (!userId) {
      console.log('[Conversation API] No userId found in cookie')
      return NextResponse.json({ success: false, error: 'غير مصرح' }, { status: 401 })
    }

    // Get the user
    const user = await db.user.findUnique({
      where: { id: userId }
    })

    console.log('[Conversation API] User found:', !!user, user?.id, user?.role)

    if (!user) {
      console.log('[Conversation API] User not found in database')
      return NextResponse.json({ success: false, error: 'المستخدم غير موجود' }, { status: 404 })
    }

    // Get the conversation with all related data
    console.log('[Conversation API] Querying conversation from database...')
    const conversation = await db.conversation.findUnique({
      where: { id: conversationId },
      include: {
        case_: {
          include: {
            application: {
              include: {
                post: true
              }
            }
          }
        },
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

    console.log('[Conversation API] Conversation found:', !!conversation, conversationId)

    if (!conversation) {
      console.log('[Conversation API] Conversation NOT found in database')
      return NextResponse.json({ success: false, error: 'المحادثة غير موجودة' }, { status: 404 })
    }

    // Check if user is part of this conversation
    const studentUserId = conversation.student?.user?.id || null
    const patientUserId = conversation.patient?.user?.id || null

    const isStudent = user.role === 'STUDENT' && studentUserId === userId
    const isPatient = user.role === 'PATIENT' && patientUserId === userId

    console.log('[Conversation API] Access check:', {
      userId,
      userRole: user.role,
      studentUserId,
      patientUserId,
      isStudent,
      isPatient
    })

    if (!isStudent && !isPatient) {
      console.log('[Conversation API] Unauthorized access attempt')
      return NextResponse.json({ success: false, error: 'غير مصرح' }, { status: 403 })
    }

    return NextResponse.json({
      success: true,
      conversation
    })
  } catch (error: any) {
    console.error('[Conversation API] Error:', error)
    return NextResponse.json(
      { success: false, error: 'حدث خطأ أثناء جلب المحادثة' },
      { status: 500 }
    )
  }
}
