import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { storeOTP, generateOTP } from '@/lib/password'

/**
 * API لطلب OTP عند نسيان كلمة المرور
 * POST /api/auth/forgot-password
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body

    // 1. التحقق من وجود البريد الإلكتروني
    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'البريد الإلكتروني مطلوب' },
        { status: 400 }
      )
    }

    // 2. البحث عن المستخدم
    const user = await db.user.findUnique({
      where: { email }
    })

    // للأمان: نرجع نفس الرسالة سواء كان المستخدم موجوداً أم لا
    // لكن نطبع في الـ Console إذا كان موجوداً
    if (!user) {
      console.log(`[AUTH] Forgot password attempt for non-existent email: ${email}`)
      return NextResponse.json({
        message: 'إذا كان البريد الإلكتروني مسجلاً، تم إرسال رمز التحقق'
      })
    }

    // 3. توليد OTP عشوائي 6 أرقام
    const otp = generateOTP()

    // 4. حفظ OTP مع صلاحية 10 دقائق
    storeOTP(email, otp, 10)

    // 5. طباعة OTP في Console فقط (محاكاة إرسال الإيميل/SMS)
    console.log(`🔐 OTP for ${email}: ${otp}`)
    console.log(`⏰ Expires at: ${new Date(Date.now() + 10 * 60 * 1000).toLocaleString('ar-EG')}`)

    // 6. في الإنتاج، هنا نرسل OTP عبر البريد الإلكتروني أو SMS
    // sendOTPEmail(email, otp)
    // sendOTPSMS(user.phone, otp)

    return NextResponse.json({
      success: true,
      message: 'إذا كان البريد الإلكتروني مسجلاً، تم إرسال رمز التحقق',
      // نرجع OTP ليُطبع في Console المتصفح (للتجربة فقط)
      dev_otp: otp
    })
  } catch (error: any) {
    console.error('[AUTH] Forgot password error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ أثناء معالجة الطلب' },
      { status: 500 }
    )
  }
}
