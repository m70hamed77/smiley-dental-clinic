import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const conversations = await db.conversation.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        case_: {
          include: {
            application: {
              include: {
                post: {
                  select: {
                    title: true
                  }
                }
              }
            }
          }
        },
        student: {
          include: {
            user: {
              select: {
                name: true,
                email: true
              }
            }
          }
        },
        patient: {
          include: {
            user: {
              select: {
                name: true,
                email: true
              }
            }
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      count: conversations.length,
      conversations: conversations.map(c => ({
        id: c.id,
        caseId: c.caseId,
        studentId: c.studentId,
        studentName: c.student?.user?.name,
        studentEmail: c.student?.user?.email,
        patientId: c.patientId,
        patientName: c.patient?.user?.name,
        patientEmail: c.patient?.user?.email,
        postTitle: c.case_?.application?.post?.title,
        applicationId: c.case_?.applicationId,
        createdAt: c.createdAt
      }))
    })
  } catch (error: any) {
    console.error('[Debug All Conversations] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
