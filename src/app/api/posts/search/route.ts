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

    // جلب المستخدم لمعرفة نوعه
    const user = await db.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'المستخدم غير موجود' },
        { status: 404 }
      )
    }

    // بناء شروط الفلترة
    const searchParams = request.nextUrl.searchParams
    const treatmentType = searchParams.get('treatmentType')
    const city = searchParams.get('city')
    const search = searchParams.get('search')

    // بناء where clause
    const where: any = {
      status: 'ACTIVE' as any
    }

    // إضافة فلتر نوع العلاج
    if (treatmentType) {
      where.treatmentType = treatmentType
    }

    // إضافة فلتر المدينة
    if (city) {
      where.city = city
    }

    // إضافة فلتر البحث (العنوان أو وصف)
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' as any } },
        { description: { contains: search, mode: 'insensitive' as any } },
      ]
    }

    // جلب جميع البوستات النشطة مع الفلاتر
    const posts = await db.post.findMany({
      where,
      include: {
        student: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatarUrl: true
              }
            }
          }
        },
        applications: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // جلب التقييمات لكل طالب
    const studentIds = posts.map(p => p.studentId)
    const ratings = await db.rating.findMany({
      where: {
        studentId: { in: studentIds }
      }
    })

    // حساب متوسط التقييم لكل طالب
    const studentRatings: { [key: string]: { total: number; count: number } } = {}
    ratings.forEach(r => {
      if (!studentRatings[r.studentId]) {
        studentRatings[r.studentId] = { total: 0, count: 0 }
      }
      studentRatings[r.studentId].total += r.overallRating
      studentRatings[r.studentId].count += 1
    })

    // حساب المتوسط
    const studentAvgRatings: { [key: string]: number } = {}
    Object.entries(studentRatings).forEach(([studentId, data]) => {
      if (data.count > 0) {
        studentAvgRatings[studentId] = Math.round((data.total / data.count) * 10) / 10
      }
    })

    // حساب الإحصائيات لكل بوست
    const postsWithStats = posts.map(post => {
      const totalRatings = studentRatings[post.studentId]?.count || 0
      const avgRating = studentAvgRatings[post.studentId] || 0

      return {
        id: post.id,
        studentId: post.studentId,
        studentName: post.student.user.name,
        studentEmail: post.student.user.email,
        studentAvatar: post.student.user.avatarUrl,
        studentRating: avgRating,
        totalRatings,
        title: post.title,
        treatmentType: post.treatmentType,
        city: post.city,
        address: post.address,
        location: post.address, // استخدام address كـ location
        priority: post.priority,
        requiredCount: post.requiredCount,
        acceptedCount: post.acceptedCount,
        createdAt: post.createdAt,
        applicationsCount: post.applications.length,
        pendingApplications: post.applications.filter((a: any) => a.status === 'PENDING').length,
        acceptedApplications: post.applications.filter((a: any) => a.status === 'ACCEPTED').length,
        completedCases: post.student.completedCases || 0,
        distance: 'غير محدد', // يمكن حسابه لاحقاً بناءً على الموقع الجغرافي
      }
    })

    console.log(`[POSTS SEARCH] 📊 ${user.role} ${userId} fetched ${postsWithStats.length} posts`)

    return NextResponse.json({
      success: true,
      posts: postsWithStats,
      total: postsWithStats.length
    })
  } catch (error: any) {
    console.error('[POSTS SEARCH] Error:', error)
    return NextResponse.json(
      { error: error.message || 'حدث خطأ أثناء جلب البوستات' },
      { status: 500 }
    )
  }
}
