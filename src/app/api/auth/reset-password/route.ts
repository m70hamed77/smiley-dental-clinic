import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hashPassword, isOTPVerified, deleteOTP, validatePasswordStrength } from '@/lib/password'

/**
 * API لإعادة تعيين كلمة السر
 * POST /api/auth/reset-password
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, confirmPassword } = body

    // 1. التحقق من البيانات
    if (!email || !password) {
      return NextResponse.json(
        { error: 'البريد الإلكتروني وكلمة السر الجديدة مطلوبان' },
        { status: 400 }
      )
    }

    // 2. التحقق من تطابق كلمة السر
    if (password !== confirmPassword) {
      return NextResponse.json(
        { error: 'كلمة السر الجديدة غير متطابقة' },
        { status: 400 }
      )
    }

    // 3. التحقق من قوة كلمة السر
    const passwordValidation = validatePasswordStrength(password)
    if (!passwordValidation.valid) {
      return NextResponse.json(
        { error: passwordValidation.message },
        { status: 400 }
      )
    }

    // 4. التحقق من أن OTP تم تأكيده
    if (!isOTPVerified(email)) {
      console.log(`[AUTH] Password reset attempt without verified OTP for ${email}`)
      return NextResponse.json(
        { error: 'يجب التحقق من البريد الإلكتروني أولاً' },
        { status: 400 }
      )
    }

    // 5. التحقق من وجود المستخدم
    const user = await db.user.findUnique({
      where: { email }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'المستخدم غير موجود' },
        { status: 404 }
      )
    }

    // 6. تشفير كلمة السر الجديدة
    const hashedPassword = await hashPassword(password)

    // 7. تحديث كلمة السر في قاعدة البيانات
    await db.user.update({
      where: { email },
      data: { password: hashedPassword }
    })

    // 8. حذف OTP
    deleteOTP(email)

    console.log(`[AUTH] Password reset successfully for ${email}`)

    return NextResponse.json({
      success: true,
      message: 'تم تغيير كلمة السر بنجاح'
    })
  } catch (error: any) {
    console.error('[AUTH] Reset password error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ أثناء إعادة تعيين كلمة السر' },
      { status: 500 }
    )
  }
}
