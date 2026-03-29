import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { cookies } from 'next/headers'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // جلب userId من الـ cookies
    const cookieStore = await cookies()
    const userId = cookieStore.get('userId')?.value

    if (!userId) {
      return NextResponse.json(
        { error: 'غير مصرح: يجب تسجيل الدخول' },
        { status: 401 }
      )
    }

    // جلب المستخدم
    const user = await db.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'المستخدم غير موجود' },
        { status: 404 }
      )
    }

    // جلب البوست
    const post = await db.post.findUnique({
      where: { id }
    })

    if (!post) {
      return NextResponse.json(
        { error: 'البوست غير موجود' },
        { status: 404 }
      )
    }

    // جلب معلومات الطالب
    const student = await db.student.findUnique({
      where: { id: post.studentId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    if (!student) {
      return NextResponse.json(
        { error: 'ملف الطالب غير موجود' },
        { status: 404 }
      )
    }

    // التحقق من أن المستخدم مريض
    if (user.role !== 'PATIENT') {
      return NextResponse.json(
        { error: 'غير مصرح: هذه الصفحة للمرضى فقط' },
        { status: 403 }
      )
    }

    // جلب ملف المريض
    const patient = await db.patient.findUnique({
      where: { userId }
    })

    if (!patient) {
      return NextResponse.json(
        { error: 'ملف المريض غير موجود' },
        { status: 404 }
      )
    }

    // التحقق من أن الطالب هو صاحب البوست
    if (student.userId === userId) {
      return NextResponse.json(
        { error: 'لا يمكنك التقديم على بوستك الخاص' },
        { status: 403 }
      )
    }

    // التحقق من أن البوست مفتوح للتقديم
    if (post.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'هذه الحالة غير مفتوحة للتقديم' },
        { status: 400 }
      )
    }

    // التحقق من أن الحالة ليست مغلقة
    if (post.requiredCount && post.acceptedCount >= post.requiredCount) {
      return NextResponse.json(
        { error: 'اكتمل العدد المطلوب لهذه الحالة' },
        { status: 400 }
      )
    }

    // التحقق من أن المريض قدم بالفعل
    const existingApplication = await db.application.findFirst({
      where: {
        postId: id,
        patientId: patient.id
      }
    })

    if (existingApplication) {
      return NextResponse.json(
        {
          error: 'تم التقديم بالفعل',
          message: 'لقد قمت بالفعل على هذه الحالة'
        },
        { status: 400 }
      )
    }

    // إنشاء طلب جديد
    const application = await db.application.create({
      data: {
        postId: id,
        patientId: patient.id,
        studentId: student.id,
        status: 'PENDING' as any,
        medicalSnapshot: JSON.stringify({
          patientId: patient.id,
          patientName: user.name,
          patientEmail: user.email,
          patientPhone: user.phone,
          patientAge: patient.age,
          patientGender: patient.gender,
          patientAddress: patient.address,
          createdAt: new Date().toISOString()
        })
      }
    })

    // إنشاء إشعار للدكتور
    await db.notification.create({
      data: {
        userId: student.userId,
        type: 'NEW_APPLICATION',
        title: 'طلب جديد على إعلانك',
        message: `قدم ${user.name || 'مريض'} طلباً على إعلانك "${post.title}"`,
        data: JSON.stringify({
          postId: post.id,
          applicationId: application.id,
          patientId: patient.id,
          patientName: user.name
        }),
        isRead: false,
        channels: JSON.stringify(['IN_APP'])
      }
    })

    console.log(`[APPLICATION] ✅ Patient ${userId} applied for post ${id}`)
    console.log(`[NOTIFICATION] ✅ Notification created for student ${student.userId}`)
    const updatedPost = await db.post.update({
      where: { id },
      data: {
        acceptedCount: post.acceptedCount + 1
      }
    })

    console.log(`[APPLICATION] ✅ Patient ${userId} applied for post ${id}`)

    return NextResponse.json({
      success: true,
      message: 'تم إرسال طلبك بنجاح',
      application: {
        id: application.id,
        status: 'PENDING'
      }
    })
  } catch (error: any) {
    console.error('[APPLICATION] Error applying:', error)
    return NextResponse.json(
      { error: error.message || 'حدث خطأ أثناء التقديم' },
      { status: 500 }
    )
  }
}
