import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { db } from '@/lib/db'

// API لجلب المحادثات (Fixed: v4 - Correct logic)
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const userId = cookieStore.get('userId')?.value

    console.log('[Chat Conversations] userId from cookie:', userId)

    if (!userId) {
      console.log('[Chat Conversations] No userId found')
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    }

    // Get user from database
    const user = await db.user.findUnique({
      where: { id: userId }
    })

    console.log('[Chat Conversations] User found:', !!user, user?.id, user?.role)

    if (!user) {
      return NextResponse.json({ error: 'المستخدم غير موجود' }, { status: 404 })
    }

    let conversations: any[] = []

    // If user is STUDENT, get conversations where studentId = user's student ID
    if (user.role === 'STUDENT') {
      const student = await db.student.findFirst({
        where: { userId: user.id },
        select: { id: true }
      })

      if (!student) {
        return NextResponse.json({ error: 'السجل الطالب غير موجود' }, { status: 404 })
      }

      console.log('[Chat Conversations] Student ID:', student.id)

      // Get all conversations where this student is the student
      const dbConversations = await db.conversation.findMany({
        where: {
          studentId: student.id
        },
        include: {
          case_: {
            include: {
              application: {
                include: {
                  post: {
                    select: {
                      id: true,
                      title: true,
                      status: true
                    }
                  }
                }
              },
              appointment: {
                select: {
                  status: true,
                  scheduledAt: true
                }
              }
            }
          },
          patient: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  avatarUrl: true
                }
              }
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      })

      console.log('[Chat Conversations] Found conversations for student:', dbConversations.length)

      conversations = dbConversations.map(async (conv: any) => {
        const caseStatus = conv.case_?.appointment?.status || 'PENDING'
        
        // Get last message from database
        let lastMessageContent = 'لم تبدأ المحادثة بعد'
        let lastMessageTime = conv.createdAt || new Date()
        
        try {
          const lastMessage = await db.message.findFirst({
            where: { conversationId: conv.id },
            orderBy: { sentAt: 'desc' }
          })
          
          if (lastMessage) {
            lastMessageContent = lastMessage.content || ''
            lastMessageTime = lastMessage.sentAt
          }
          
          console.log(`[Chat Conversations] Last message for conversation ${conv.id}:`, lastMessage ? 'found' : 'none')
        } catch (msgError) {
          console.error(`[Chat Conversations] Error fetching last message for conversation ${conv.id}:`, msgError)
        }

        // Calculate time ago
        const getTimeAgo = (date: Date) => {
          const now = new Date()
          const diff = now.getTime() - date.getTime()
          const seconds = Math.floor(diff / 1000)
          const minutes = Math.floor(seconds / 60)
          const hours = Math.floor(minutes / 60)
          const days = Math.floor(hours / 24)

          if (days > 0) {
            return `منذ ${days} ${days === 1 ? 'يوم' : 'أيام'}`
          } else if (hours > 0) {
            return `منذ ${hours} ${hours === 1 ? 'ساعة' : 'ساعات'}`
          } else if (minutes > 0) {
            return `منذ ${minutes} ${minutes === 1 ? 'دقيقة' : 'دقائق'}`
          } else {
            return 'الآن'
          }
        }

        // Determine case status display
        let status = 'ACTIVE'
        if (caseStatus === 'COMPLETED') {
          status = 'COMPLETED'
        } else if (caseStatus === 'CANCELLED') {
          status = 'CANCELLED'
        }

        return {
          id: conv.id,
          applicationId: conv.case_?.applicationId || '',
          postId: conv.case_?.application?.post?.id || '',
          patientName: conv.patient?.user?.name || 'مريض',
          patientAvatar: conv.patient?.user?.avatarUrl || null,
          patientId: conv.patient?.user?.id || '',
          caseTitle: conv.case_?.application?.post?.title || 'بدون عنوان',
          caseStatus: status,
          lastMessage: lastMessageContent,
          lastMessageTime: getTimeAgo(new Date(lastMessageTime)),
          unreadCount: 0,
          status,
          applicationStatus: 'ACCEPTED',
          applicationDate: conv.createdAt,
          conversationId: conv.id
        }
      })
      
      // Wait for all promises to resolve
      conversations = await Promise.all(conversations)
    }
    // If user is PATIENT, get conversations where patientId = user's patient ID
    else if (user.role === 'PATIENT') {
      const patient = await db.patient.findFirst({
        where: { userId: user.id },
        select: { id: true }
      })

      if (!patient) {
        return NextResponse.json({ error: 'السجل المريض غير موجود' }, { status: 404 })
      }

      console.log('[Chat Conversations] Patient ID:', patient.id)

      // Get all conversations where this patient is the patient
      const dbConversations = await db.conversation.findMany({
        where: {
          patientId: patient.id
        },
        include: {
          case_: {
            include: {
              application: {
                include: {
                  post: {
                    select: {
                      id: true,
                      title: true,
                      status: true
                    }
                  }
                }
              },
              appointment: {
                select: {
                  status: true,
                  scheduledAt: true
                }
              }
            }
          },
          student: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  avatarUrl: true
                }
              }
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      })

      console.log('[Chat Conversations] Found conversations for patient:', dbConversations.length)

      conversations = dbConversations.map(async (conv: any) => {
        const caseStatus = conv.case_?.appointment?.status || 'PENDING'
        
        // Get last message from database
        let lastMessageContent = 'لم تبدأ المحادثة بعد'
        let lastMessageTime = conv.createdAt || new Date()
        
        try {
          const lastMessage = await db.message.findFirst({
            where: { conversationId: conv.id },
            orderBy: { sentAt: 'desc' }
          })
          
          if (lastMessage) {
            lastMessageContent = lastMessage.content || ''
            lastMessageTime = lastMessage.sentAt
          }
          
          console.log(`[Chat Conversations] Last message for conversation ${conv.id}:`, lastMessage ? 'found' : 'none')
        } catch (msgError) {
          console.error(`[Chat Conversations] Error fetching last message for conversation ${conv.id}:`, msgError)
        }

        // Calculate time ago
        const getTimeAgo = (date: Date) => {
          const now = new Date()
          const diff = now.getTime() - date.getTime()
          const seconds = Math.floor(diff / 1000)
          const minutes = Math.floor(seconds / 60)
          const hours = Math.floor(minutes / 60)
          const days = Math.floor(hours / 24)

          if (days > 0) {
            return `منذ ${days} ${days === 1 ? 'يوم' : 'أيام'}`
          } else if (hours > 0) {
            return `منذ ${hours} ${hours === 1 ? 'ساعة' : 'ساعات'}`
          } else if (minutes > 0) {
            return `منذ ${minutes} ${minutes === 1 ? 'دقيقة' : 'دقائق'}`
          } else {
            return 'الآن'
          }
        }

        // Determine case status display
        let status = 'ACTIVE'
        if (caseStatus === 'COMPLETED') {
          status = 'COMPLETED'
        } else if (caseStatus === 'CANCELLED') {
          status = 'CANCELLED'
        }

        return {
          id: conv.id,
          applicationId: conv.case_?.applicationId || '',
          postId: conv.case_?.application?.post?.id || '',
          patientName: conv.student?.user?.name || 'دكتور',
          patientAvatar: conv.student?.user?.avatarUrl || null,
          patientId: conv.student?.user?.id || '',
          caseTitle: conv.case_?.application?.post?.title || 'بدون عنوان',
          caseStatus: status,
          lastMessage: lastMessageContent,
          lastMessageTime: getTimeAgo(new Date(lastMessageTime)),
          unreadCount: 0,
          status,
          applicationStatus: 'ACCEPTED',
          applicationDate: conv.createdAt,
          conversationId: conv.id
        }
      })
      
      // Wait for all promises to resolve
      conversations = await Promise.all(conversations)
    } else {
      return NextResponse.json({ error: 'هذه الصفحة متاحة فقط للطلاب والمرضى' }, { status: 403 })
    }

    console.log('[Chat Conversations] Total formatted conversations:', conversations.length)

    return NextResponse.json({
      success: true,
      conversations,
      total: conversations.length
    })

  } catch (error: any) {
    console.error('[Chat Conversations API] Error:', error)
    return NextResponse.json(
      { error: 'فشل في جلب المحادثات', details: error.message },
      { status: 500 }
    )
  }
}
