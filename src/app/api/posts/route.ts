import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      title,
      treatmentType,
      description,
      requiredCount,
      city,
      address,
      priority = 'NORMAL',
      latitude,
      longitude,
    } = body

    // التحقق من الحقول المطلوبة
    if (!title || !treatmentType || !city || !address) {
      return NextResponse.json(
        { error: 'جميع الحقول المطلوبة يجب ملؤها' },
        { status: 400 }
      )
    }

    // جلب userId من الـ cookies
    const cookieStore = await cookies()
    const userId = cookieStore.get('userId')?.value

    if (!userId) {
      return NextResponse.json(
        { error: 'غير مصرح: يجب تسجيل الدخول' },
        { status: 401 }
      )
    }

    // التحقق من أن المستخدم طالب وجلب سجل Student
    const user = await db.user.findUnique({
      where: { id: userId }
    })

    if (!user || user.role !== 'STUDENT') {
      return NextResponse.json(
        { error: 'غير مصرح: هذه الصفحة للطلاب فقط' },
        { status: 403 }
      )
    }

    // جلب سجل Student للحصول على studentId الصحيح
    const student = await db.student.findUnique({
      where: { userId }
    })

    if (!student) {
      return NextResponse.json(
        { error: 'ملف الطالب غير موجود. يرجى التواصل مع الدعم' },
        { status: 403 }
      )
    }

    // إنشاء البوست باستخدام Student.id وليس User.id
    const post = await db.post.create({
      data: {
        studentId: student.id, // ✅ نستخدم Student.id وليس User.id
        title,
        treatmentType: treatmentType as any,
        description,
        requiredCount: requiredCount ? parseInt(requiredCount) : null,
        city,
        address,
        priority: priority as any,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        status: 'ACTIVE' as any,
      }
    })

    console.log(`[POSTS] ✅ Post created: ${post.title}`)

    return NextResponse.json({
      success: true,
      message: 'تم نشر البوست بنجاح',
      post: {
        id: post.id,
        title: post.title,
        treatmentType: post.treatmentType,
        createdAt: post.createdAt,
      }
    })
  } catch (error: any) {
    console.error('[POSTS] Error creating post:', error)
    return NextResponse.json(
      { error: error.message || 'حدث خطأ أثناء نشر البوست' },
      { status: 500 }
    )
  }
}

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

    // جلب بوستات المستخدم من قاعدة البيانات باستخدام Student.id
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
    }))

    console.log(`[POSTS] 📊 User ${userId} fetched ${posts.length} posts`)

    return NextResponse.json({
      success: true,
      posts: postsWithStats,
      total: postsWithStats.length
    })
  } catch (error: any) {
    console.error('[POSTS] Error fetching posts:', error)
    return NextResponse.json(
      { error: error.message || 'حدث خطأ أثناء جلب البوستات' },
      { status: 500 }
    )
  }
}
