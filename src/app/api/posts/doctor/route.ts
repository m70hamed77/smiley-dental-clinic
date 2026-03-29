import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { cookies } from 'next/headers'

/**
 * API لجلب بوستات الطالب (الدكتور) حسب الـ ID
 * GET /api/posts/doctor/:doctorId
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ doctorId: string }> }
) {
  try {
    const { doctorId } = await params

    if (!doctorId) {
      return NextResponse.json(
        { error: 'معرف الدكتور مطلوب' },
        { status: 400 }
      )
    }

    // جلب المستخدم الحالي (للتحقق من الصلاحيات)
    const cookieStore = await cookies()
    const currentUserId = cookieStore.get('userId')?.value

    // التحقق من أن المستخدم طالب وأنه يطلب بياناته فقط
    if (currentUserId && currentUserId !== doctorId) {
      return NextResponse.json(
        { error: 'غير مصرح: لا يمكنك مشاهدة بوستات دكتور آخر' },
        { status: 403 }
      )
    }

    // جلب بوستات الطالب (Filtering in Backend)
    const posts = await db.post.findMany({
      where: {
        studentId: doctorId
      },
      include: {
        applications: true,
        student: {
          select: {
            id: true,
            user: {
              select: {
                name: true,
                email: true,
              }
            },
            avatarUrl: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // حساب إحصائيات لكل بوست
    const postsWithStats = posts.map(post => ({
      postId: post.id,
      doctorId: post.studentId,
      treatmentType: post.treatmentType,
      description: post.description,
      patientsNeeded: post.requiredCount,
      patientsAccepted: post.acceptedCount,
      startDate: post.createdAt?.toISOString().split('T')[0] || null,
      endDate: post.updatedAt?.toISOString().split('T')[0] || null,
      location: `${post.city} - ${post.address}`,
      status: post.status.toLowerCase(),
      priority: post.priority?.toLowerCase() || 'normal',
      createdAt: post.createdAt.toISOString(),
      applicationsCount: post.applications.length,
      pendingApplications: post.applications.filter(a => a.status === 'PENDING').length,
      acceptedApplications: post.applications.filter(a => a.status === 'ACCEPTED').length,
      rejectedApplications: post.applications.filter(a => a.status === 'REJECTED').length,
      student: post.student
    }))

    console.log(`[POSTS] ✅ Fetched ${posts.length} posts for doctor: ${doctorId}`)

    return NextResponse.json({
      success: true,
      count: posts.length,
      data: postsWithStats
    })

  } catch (error: any) {
    console.error('[POSTS] Error fetching doctor posts:', error)
    return NextResponse.json(
      { error: 'حدث خطأ أثناء جلب البوستات' },
      { status: 500 }
    )
  }
}
