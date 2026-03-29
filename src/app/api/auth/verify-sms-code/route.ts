import { NextRequest, NextResponse } from 'next/server'
import { getSMSVerificationCode, deleteSMSVerificationCode } from '../send-sms-code/route'

export async function POST(request: NextRequest) {
  try {
    const { phone, code } = await request.json()

    console.log(`[DEV][SMS] Verifying code for ${phone}`)

    if (!phone || !code) {
      console.log('[DEV][SMS] ❌ Missing phone or code')
      return NextResponse.json({ error: 'رقم الهاتف وكود التحقق مطلوبان' }, { status: 400 })
    }

    // الحصول على الكود المخزن
    const storedCode = getSMSVerificationCode(phone)

    if (!storedCode) {
      console.log(`[DEV][SMS] ❌ No valid code found for ${phone} (expired or doesn't exist)`)
      return NextResponse.json({ error: 'كود التحقق غير صالح أو منتهي الصلاحية' }, { status: 400 })
    }

    // التحقق من الكود (تجاهل المسافات)
    const normalizedInputCode = code.replace(/\s/g, '')
    const normalizedStoredCode = storedCode.replace(/\s/g, '')

    const isValid = normalizedStoredCode === normalizedInputCode

    console.log(`[DEV][SMS] Verification attempt: ${isValid ? '✅ VALID' : '❌ INVALID'}`)

    if (!isValid) {
      return NextResponse.json({ error: 'كود التحقق غير صحيح' }, { status: 400 })
    }

    // حذف الكود بعد الاستخدام
    deleteSMSVerificationCode(phone)
    console.log(`[DEV][SMS] ✅ Verification successful for ${phone}`)

    return NextResponse.json({
      success: true,
      message: 'تم التحقق من رقم الهاتف بنجاح',
    })
  } catch (error: any) {
    console.error('[DEV][SMS] ❌ Verification error:', error)
    return NextResponse.json(
      { error: error.message || 'حدث خطأ أثناء التحقق من الكود' },
      { status: 500 }
    )
  }
}
