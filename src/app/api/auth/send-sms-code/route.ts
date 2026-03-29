import { NextRequest, NextResponse } from 'next/server'
import { sendSMS, formatPhoneNumber } from '@/lib/sms'

// تخزين الأكواد في الذاكرة (في الإنتاج، استخدم قاعدة البيانات أو Redis)
const verificationCodes = new Map<string, { code: string; expiresAt: number; phone: string }>()

export async function POST(request: NextRequest) {
  try {
    const { phone } = await request.json()

    if (!phone) {
      return NextResponse.json({ error: 'رقم الهاتف مطلوب' }, { status: 400 })
    }

    // توليد كود تحقق عشوائي من 6 أرقام
    const code = Math.floor(100000 + Math.random() * 900000).toString()

    // حفظ الكود مع وقت انتهاء الصلاحية (10 دقائق)
    verificationCodes.set(phone, {
      code,
      expiresAt: Date.now() + 10 * 60 * 1000,
      phone,
    })

    // تنسيق رقم الهاتف
    const formattedPhone = formatPhoneNumber(phone)

    // إرسال SMS
    const message = `كود التحقق من سمايلي لطب الأسنان: ${code}\nصالح لمدة 10 دقائق.\nلا تشارك هذا الكود مع أي شخص.`
    await sendSMS(formattedPhone, message)

    console.log(`[DEV][SMS] Verification code sent to ${formattedPhone}: ${code}`)

    return NextResponse.json({
      success: true,
      message: 'تم إرسال كود التحقق إلى هاتفك',
      // الكود يظهر فقط في وضع التطوير للأمان
      ...(process.env.NODE_ENV === 'development' && { devCode: code })
    })
  } catch (error: any) {
    console.error('[Send SMS Code Error]:', error)
    return NextResponse.json(
      { error: error.message || 'حدث خطأ أثناء إرسال كود التحقق' },
      { status: 500 }
    )
  }
}

// دالة مساعدة للحصول على الكود المخزن
export function getSMSVerificationCode(phone: string): string | null {
  const stored = verificationCodes.get(phone)
  if (!stored) return null

  // التحقق من عدم انتهاء صلاحية الكود
  if (Date.now() > stored.expiresAt) {
    verificationCodes.delete(phone)
    return null
  }

  return stored.code
}

// دالة مساعدة لحذف الكود
export function deleteSMSVerificationCode(phone: string): void {
  verificationCodes.delete(phone)
}
