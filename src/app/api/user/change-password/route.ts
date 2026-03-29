import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hashPassword, comparePassword, validatePasswordStrength } from '@/lib/password'
import { cookies } from 'next/headers'

/**
 * API لتغيير كلمة السر من الإعدادات
 * POST /api/user/change-password
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { currentPassword, newPassword, confirmPassword } = body

    // 1. جلب الجلسة الحالية
    const cookieStore = cookies()
    const userId = cookieStore.get('userId')?.value

    if (!userId) {
      return NextResponse.json(
        { error: 'غير مصرح: يجب تسجيل الدخول' },
        { status: 401 }
      )
    }

    // 2. التحقق من البيانات
    if (!currentPassword || !newPassword || !confirmPassword) {
      return NextResponse.json(
        { error: 'جميع الحقول مطلوبة' },
        { status: 400 }
      )
    }

    // 3. التحقق من تطابق كلمة السر الجديدة
    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        { error: 'كلمة السر الجديدة غير متطابقة' },
        { status: 400 }
      )
    }

    // 4. التحقق من أن كلمة السر الجديدة مختلفة عن الحالية
    if (currentPassword === newPassword) {
      return NextResponse.json(
        { error: 'كلمة السر الجديدة يجب أن تكون مختلفة عن الحالية' },
        { status: 400 }
      )
    }

    // 5. التحقق من قوة كلمة السر الجديدة
    const passwordValidation = validatePasswordStrength(newPassword)
    if (!passwordValidation.valid) {
      return NextResponse.json(
        { error: passwordValidation.message },
        { status: 400 }
      )
    }

    // 6. جلب المستخدم من قاعدة البيانات
    const user = await db.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'المستخدم غير موجود' },
        { status: 404 }
      )
    }

    // 7. التحقق من كلمة السر الحالية
    const isPasswordValid = await comparePassword(currentPassword, user.password)
    if (!isPasswordValid) {
      console.log(`[AUTH] Invalid current password for user ${userId}`)
      return NextResponse.json(
        { error: 'كلمة السر الحالية غير صحيحة' },
        { status: 400 }
      )
    }

    // 8. تشفير كلمة السر الجديدة
    const hashedPassword = await hashPassword(newPassword)

    // 9. تحديث كلمة السر في قاعدة البيانات
    await db.user.update({
      where: { id: userId },
      data: { password: hashedPassword }
    })

    console.log(`[AUTH] Password changed successfully for user ${userId}`)

    // 10. (اختياري) إنهاء جميع الجلسات القديمة باستثناء الحالية
    // يمكن إضافة ذلك لاحقاً إذا رغبت

    return NextResponse.json({
      success: true,
      message: 'تم تغيير كلمة السر بنجاح'
    })
  } catch (error: any) {
    console.error('[AUTH] Change password error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ أثناء تغيير كلمة السر' },
      { status: 500 }
    )
  }
}
