import { NextRequest, NextResponse } from 'next/server'
import { sendVerificationCode } from '@/lib/email'

// تخزين الأكواد في الذاكرة (في الإنتاج، استخدم قاعدة البيانات أو Redis)
const verificationCodes = new Map<string, { code: string; expiresAt: number; email: string }>()

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: 'البريد الإلكتروني مطلوب' }, { status: 400 })
    }

    // توليد كود تحقق عشوائي من 6 أرقام
    const code = Math.floor(100000 + Math.random() * 900000).toString()

    // حفظ الكود مع وقت انتهاء الصلاحية (10 دقائق)
    verificationCodes.set(email, {
      code,
      expiresAt: Date.now() + 10 * 60 * 1000,
      email,
    })

    // إرسال الإيميل فعلياً
    await sendVerificationCode(email, code)

    console.log(`[DEV][EMAIL] Verification code sent to ${email}: ${code}`)

    return NextResponse.json({
      success: true,
      message: 'تم إرسال كود التحقق إلى بريدك الإلكتروني',
      // الكود يظهر فقط في وضع التطوير للأمان
      ...(process.env.NODE_ENV === 'development' && { devCode: code })
    })
  } catch (error: any) {
    console.error('[Send Verification Code Error]:', error)
    return NextResponse.json(
      { error: error.message || 'حدث خطأ أثناء إرسال كود التحقق' },
      { status: 500 }
    )
  }
}

// دالة مساعدة للحصول على الكود المخزن
export function getVerificationCode(email: string): string | null {
  const stored = verificationCodes.get(email)
  if (!stored) return null
  
  // التحقق من عدم انتهاء صلاحية الكود
  if (Date.now() > stored.expiresAt) {
    verificationCodes.delete(email)
    return null
  }
  
  return stored.code
}

// دالة مساعدة لحذف الكود
export function deleteVerificationCode(email: string): void {
  verificationCodes.delete(email)
}
