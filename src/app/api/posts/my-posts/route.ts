import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    // جلب userId من الـ cookies
    const cookieStore = await cookies()
    const userId = cookieStore.get('userId')?.value

    if (!userId) {
      return NextResponse.json(
        { error: 'غير مصرح: يجب تسجيل الدخول' },
        { status: 401 }
      )
    }

    // جلب سجل Student للحصول على studentId الصحيح
    const student = await db.student.findUnique({
      where: { userId }
    })

    if (!student) {
      return NextResponse.json(
        { error: 'ملف الطالب غير موجود' },
        { status: 403 }
      )
    }

    // جلب جميع بوستات الطالب مع الطلبات المرتبطة بها باستخدام Student.id
    const posts = await db.post.findMany({
      where: {
        studentId: student.id // ✅ نستخدم Student.id
      },
      include: {
        applications: true,
        student: {
          select: {
            id: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true,
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

    // حساب الإحصائيات لكل بوست
    const postsWithStats = posts.map(post => ({
      ...post,
      applicationsCount: post.applications.length,
      pendingApplications: post.applications.filter((a: any) => a.status === 'PENDING').length,
      acceptedApplications: post.applications.filter((a: any) => a.status === 'ACCEPTED').length,
      rejectedApplications: post.applications.filter((a: any) => a.status === 'REJECTED').length,
      lockedApplications: post.applications.filter((a: any) => a.status === 'LOCKED').length,
    }))

    // حساب الإحصائيات العامة
    const totalPosts = postsWithStats.length
    const activePosts = postsWithStats.filter((p: any) => p.status === 'ACTIVE').length
    const totalApplications = postsWithStats.reduce((sum: number, p: any) => sum + p.applicationsCount, 0)
    const acceptedPatients = postsWithStats.reduce((sum: number, p: any) => sum + p.acceptedApplications, 0)

    console.log(`[MY-POSTS] 📊 Student ${student.id} (${userId}) viewing ${totalPosts} posts`)

    return NextResponse.json({
      success: true,
      posts: postsWithStats,
      stats: {
        totalPosts,
        activePosts,
        totalApplications,
        acceptedPatients
      }
    })
  } catch (error: any) {
    console.error('[MY-POSTS] Error fetching posts:', error)
    return NextResponse.json(
      { error: error.message || 'حدث خطأ أثناء جلب البوستات' },
      { status: 500 }
    )
  }
}
