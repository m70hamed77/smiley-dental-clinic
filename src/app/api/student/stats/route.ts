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

    // جلب سجل Student
    const student = await db.student.findUnique({
      where: { userId }
    })

    if (!student) {
      return NextResponse.json(
        { error: 'ملف الطالب غير موجود' },
        { status: 403 }
      )
    }

    // جلب جميع بوستات الطالب
    const posts = await db.post.findMany({
      where: { studentId: student.id }
    })

    // حساب الحالات
    const totalCases = posts.length
    const completedCases = posts.filter((p) => p.status === 'COMPLETED').length
    const activeCases = posts.filter((p) => p.status === 'ACTIVE').length

    // جلب التقييمات من جدول Rating
    const ratings = await db.rating.findMany({
      where: { studentId: student.id }
    })

    // حساب متوسط التقييم
    let averageRating = 0
    if (ratings.length > 0) {
      const totalRating = ratings.reduce((sum, r) => sum + r.overallRating, 0)
      averageRating = Math.round((totalRating / ratings.length) * 10) / 10 // رقم عشري واحد
    }

    // حساب النقاط بناءً على الحالات المكتملة
    // مثال: كل حالة مكتملة = 10 نقاط
    const pointsPerCompletedCase = 10
    const points = completedCases * pointsPerCompletedCase

    // تحديد المستوى بناءً على النقاط
    let level = 'مبتدئ'
    if (points >= 300) {
      level = 'متقدم'
    } else if (points >= 100) {
      level = 'متوسط'
    }

    console.log(`[STUDENT STATS] 📊 Student ${student.id} - Total: ${totalCases}, Completed: ${completedCases}, Active: ${activeCases}, Points: ${points}, Level: ${level}`)

    return NextResponse.json({
      success: true,
      stats: {
        totalCases,
        completedCases,
        activeCases,
        rating: averageRating,
        points,
        level
      }
    })
  } catch (error: any) {
    console.error('[STUDENT STATS] Error fetching stats:', error)
    return NextResponse.json(
      { error: error.message || 'حدث خطأ أثناء جلب الإحصائيات' },
      { status: 500 }
    )
  }
}
