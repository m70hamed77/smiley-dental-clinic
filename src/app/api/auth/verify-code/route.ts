import { NextRequest, NextResponse } from 'next/server'
import { getVerificationCode, deleteVerificationCode } from '../send-verification-code/route'

export async function POST(request: NextRequest) {
  try {
    const { email, code } = await request.json()

    console.log(`[DEV][EMAIL] Verifying code for ${email}`)

    if (!email || !code) {
      console.log('[DEV][EMAIL] ❌ Missing email or code')
      return NextResponse.json({ error: 'البريد الإلكتروني وكود التحقق مطلوبان' }, { status: 400 })
    }

    // الحصول على الكود المخزن
    const storedCode = getVerificationCode(email)

    if (!storedCode) {
      console.log(`[DEV][EMAIL] ❌ No valid code found for ${email} (expired or doesn't exist)`)
      return NextResponse.json({ error: 'كود التحقق غير صالح أو منتهي الصلاحية' }, { status: 400 })
    }

    // التحقق من الكود (تجاهل المسافات)
    const normalizedInputCode = code.replace(/\s/g, '')
    const normalizedStoredCode = storedCode.replace(/\s/g, '')

    const isValid = normalizedStoredCode === normalizedInputCode

    console.log(`[DEV][EMAIL] Verification attempt: ${isValid ? '✅ VALID' : '❌ INVALID'}`)

    if (!isValid) {
      return NextResponse.json({ error: 'كود التحقق غير صحيح' }, { status: 400 })
    }

    // حذف الكود بعد الاستخدام
    deleteVerificationCode(email)
    console.log(`[DEV][EMAIL] ✅ Verification successful for ${email}`)

    return NextResponse.json({
      success: true,
      message: 'تم التحقق من البريد الإلكتروني بنجاح',
    })
  } catch (error: any) {
    console.error('[DEV][EMAIL] ❌ Verification error:', error)
    return NextResponse.json(
      { error: error.message || 'حدث خطأ أثناء التحقق من الكود' },
      { status: 500 }
    )
  }
}
