import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const conversations = await db.conversation.findMany({
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

    return NextResponse.json({
      success: true,
      count: conversations.length,
      conversations: conversations.map(c => ({
        id: c.id,
        caseId: c.caseId,
        studentId: c.studentId,
        patientId: c.patientId,
        studentName: c.student?.user?.name,
        patientName: c.patient?.user?.name,
        postTitle: c.case_?.application?.post?.title,
        applicationId: c.case_?.applicationId
      }))
    })
  } catch (error: any) {
    console.error('[Debug Conversations] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
