import bcrypt from 'bcryptjs'

// دوال موحدة لتشفير ومقارنة كلمات المرور

/**
 * تشفير كلمة المرور
 * @param password - كلمة المرور النصية
 * @returns كلمة المرور المشفرة
 */
export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 10)
}

/**
 * التحقق من كلمة المرور
 * @param password - كلمة المرور النصية
 * @param hashedPassword - كلمة المرور المشفرة
 * @returns true إذا كانت صحيحة، false إذا كانت خاطئة
 */
export async function comparePassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return await bcrypt.compare(password, hashedPassword)
}

/**
 * التحقق من قوة كلمة المرور
 * @param password - كلمة المرور
 * @returns object يحتوي على valid و message
 */
export function validatePasswordStrength(password: string): {
  valid: boolean
  message?: string
} {
  if (password.length < 6) {
    return {
      valid: false,
      message: 'كلمة السر يجب أن تكون 6 أحرف على الأقل'
    }
  }

  if (password.length > 100) {
    return {
      valid: false,
      message: 'كلمة السر طويلة جداً'
    }
  }

  return { valid: true }
}

/**
 * نوع تخزين OTP
 */
export interface StoredOTP {
  otp: string
  expiresAt: number
  verified?: boolean
}

/**
 * مخزن OTP بسيط (in-memory)
 * في الإنتاج، استخدم Redis أو قاعدة بيانات
 */
declare global {
  var otpStore: Map<string, StoredOTP> | undefined
}

if (!global.otpStore) {
  global.otpStore = new Map<string, StoredOTP>()
}

/**
 * حفظ OTP
 */
export function storeOTP(email: string, otp: string, expiryMinutes: number = 10): void {
  global.otpStore!.set(email, {
    otp,
    expiresAt: Date.now() + expiryMinutes * 60 * 1000,
    verified: false
  })
}

/**
 * جلب OTP
 */
export function getStoredOTP(email: string): StoredOTP | undefined {
  return global.otpStore!.get(email)
}

/**
 * التحقق من OTP
 */
export function verifyOTP(email: string, otp: string): {
  valid: boolean
  message?: string
} {
  const stored = getStoredOTP(email)

  if (!stored) {
    return {
      valid: false,
      message: 'انتهت صلاحية الرقم أو غير صحيح'
    }
  }

  // التحقق من الصلاحية
  if (Date.now() > stored.expiresAt) {
    global.otpStore!.delete(email)
    return {
      valid: false,
      message: 'انتهت صلاحية الرقم'
    }
  }

  // التحقق من الرقم
  if (stored.otp !== otp) {
    return {
      valid: false,
      message: 'الرقم غير صحيح'
    }
  }

  return { valid: true }
}

/**
 * تأكيد OTP (بعد التحقق الناجح)
 */
export function markOTPVerified(email: string): void {
  const stored = getStoredOTP(email)
  if (stored) {
    global.otpStore!.set(email, {
      ...stored,
      verified: true
    })
  }
}

/**
 * التحقق مما إذا كان OTP مؤكداً
 */
export function isOTPVerified(email: string): boolean {
  const stored = getStoredOTP(email)
  return stored?.verified || false
}

/**
 * حذف OTP
 */
export function deleteOTP(email: string): void {
  global.otpStore!.delete(email)
}

/**
 * توليد OTP عشوائي
 */
export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}
