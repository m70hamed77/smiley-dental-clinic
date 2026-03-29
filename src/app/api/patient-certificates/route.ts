import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/patient-certificates - عرض الشهادات العامة
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get('studentId')
    const patientId = searchParams.get('patientId')

    // Build where clause
    const where: any = {
      isPublic: true
    }

    if (studentId) {
      where.studentId = studentId
    }

    if (patientId) {
      where.patientId = patientId
    }

    // Get public certificates
    const certificates = await db.patientCertificate.findMany({
      where,
      include: {
        case_: {
          include: {
            application: {
              include: {
                post: {
                  select: {
                    id: true,
                    title: true,
                    treatmentType: true
                  }
                }
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
      },
      take: 50 // Limit to 50 certificates
    })

    return NextResponse.json({
      success: true,
      certificates
    })
  } catch (error: any) {
    console.error('[Patient Certificates API] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'حدث خطأ أثناء جلب الشهادات' },
      { status: 500 }
    )
  }
}
