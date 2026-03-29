import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { db } from '@/lib/db'

// GET /api/cases - جلب حالات الطالب
export async function GET(request: NextRequest) {
  try {
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

    // Students can see their own cases, patients can see their cases
    let cases = []

    if (user.role === 'STUDENT') {
      const student = await db.student.findFirst({
        where: { userId }
      })

      if (!student) {
        return NextResponse.json({ success: false, error: 'السجل الطالب غير موجود' }, { status: 404 })
      }

      // Only fetch ACCEPTED cases (after doctor approval)
      cases = await db.case.findMany({
        where: {
          application: {
            studentId: student.id,
            status: 'ACCEPTED' // Only accepted cases
          }
        },
        include: {
          application: {
            include: {
              post: {
                select: {
                  id: true,
                  title: true,
                  treatmentType: true,
                  city: true
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
            }
          },
          photos: {
            orderBy: {
              createdAt: 'desc'
            }
          },
          certificate: true,
          rating: true // Include rating data
        },
        orderBy: {
          createdAt: 'desc'
        }
      })
    } else if (user.role === 'PATIENT') {
      const patient = await db.patient.findFirst({
        where: { userId }
      })

      if (!patient) {
        return NextResponse.json({ success: false, error: 'السجل المريض غير موجود' }, { status: 404 })
      }

      // Only fetch ACCEPTED cases (after doctor approval)
      cases = await db.case.findMany({
        where: {
          application: {
            patientId: patient.id,
            status: 'ACCEPTED' // Only accepted cases
          }
        },
        include: {
          application: {
            include: {
              post: {
                select: {
                  id: true,
                  title: true,
                  treatmentType: true,
                  city: true
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
            }
          },
          photos: {
            orderBy: {
              createdAt: 'desc'
            }
          },
          certificate: true,
          rating: true // Include rating data
        },
        orderBy: {
          createdAt: 'desc'
        }
      })
    }

    return NextResponse.json({
      success: true,
      cases
    })
  } catch (error: any) {
    console.error('[Cases API] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'حدث خطأ أثناء جلب الحالات' },
      { status: 500 }
    )
  }
}
