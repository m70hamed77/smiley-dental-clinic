import { NextRequest, NextResponse } from 'next/server'
import { verifyOTP, markOTPVerified, isOTPVerified } from '@/lib/password'

/**
 * API للتحقق من OTP
 * POST /api/auth/verify-otp
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, otp } = body

    // 1. التحقق من البيانات
    if (!email || !otp) {
      return NextResponse.json(
        { error: 'البريد الإلكتروني ورمز التحقق مطلوبان' },
        { status: 400 }
      )
    }

    console.log(`[AUTH] Verifying OTP for ${email}: ${otp}`)

    // 2. التحقق من OTP
    const result = verifyOTP(email, otp)

    if (!result.valid) {
      console.log(`[AUTH] OTP verification failed for ${email}: ${result.message}`)
      return NextResponse.json(
        { error: result.message || 'الرقم غير صحيح' },
        { status: 400 }
      )
    }

    // 3. تأكيد OTP (للسماح بإعادة تعيين كلمة السر)
    markOTPVerified(email)

    console.log(`[AUTH] OTP verified successfully for ${email}`)

    return NextResponse.json({
      success: true,
      message: 'تم التحقق بنجاح'
    })
  } catch (error: any) {
    console.error('[AUTH] Verify OTP error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ أثناء التحقق من الرمز' },
      { status: 500 }
    )
  }
}
