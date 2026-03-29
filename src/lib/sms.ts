import { Twilio } from 'twilio'

// تهيئة Twilio - فقط إذا تم تكوين المفاتيح بشكل صحيح
let twilioClient: Twilio | null = null

const getTwilioClient = (): Twilio | null => {
  // إذا تم تهيئة العميل مسبقاً، أعده
  if (twilioClient) {
    return twilioClient
  }

  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken = process.env.TWILIO_AUTH_TOKEN

  // التحقق من أن المفاتيح تم تكوينها بشكل صحيح
  if (!accountSid || !authToken) {
    console.log('[SMS] Twilio credentials not configured')
    return null
  }

  // التحقق من أن accountSid يبدأ بـ AC
  if (!accountSid.startsWith('AC')) {
    console.error('[SMS] Invalid TWILIO_ACCOUNT_SID: must start with "AC"')
    console.log('[SMS] Current value:', accountSid.substring(0, 10) + '...')
    return null
  }

  // التحقق من أن هذه ليست القيم الافتراضية
  if (accountSid === 'AC00000000000000000000000000000000' || 
      accountSid === 'your_account_sid_here' || 
      authToken === 'your_auth_token_here' ||
      authToken === 'placeholder_token') {
    console.log('[SMS] Using placeholder credentials - running in development mode')
    return null
  }

  try {
    twilioClient = new Twilio(accountSid, authToken)
    return twilioClient
  } catch (error) {
    console.error('[SMS] Failed to initialize Twilio client:', error)
    return null
  }
}

/**
 * إرسال SMS
 */
export async function sendSMS(to: string, message: string) {
  try {
    const client = getTwilioClient()

    if (!client) {
      // وضع التطوير: عرض الرسالة في console
      console.log('='.repeat(60))
      console.log('[SMS SENDING SIMULATION - Development Mode]')
      console.log('='.repeat(60))
      console.log(`To: ${to}`)
      console.log(`Message: ${message}`)
      console.log('='.repeat(60))
      console.log('NOTE: SMS not sent because Twilio credentials are not configured')
      console.log('To send real SMS, add TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN to .env')
      console.log('Get credentials from: https://console.twilio.com/')
      console.log('='.repeat(60))

      return {
        success: true,
        sid: `dev-${Date.now()}`,
        note: 'SMS simulated in development mode'
      }
    }

    // إرسال SMS فعلياً في الإنتاج
    const from = process.env.TWILIO_PHONE_NUMBER || '+1234567890'

    const messageResult = await client.messages.create({
      body: message,
      from,
      to
    })

    console.log('[SMS Sent Successfully]:', messageResult.sid)
    return {
      success: true,
      sid: messageResult.sid,
      data: messageResult
    }
  } catch (error: any) {
    console.error('[SMS Sending Error]:', error)
    throw new Error(error.message || 'فشل إرسال الرسالة النصية')
  }
}

/**
 * إرسال كود التحقق عبر SMS
 */
export async function sendVerificationSMS(phone: string, code: string) {
  const message = `كود التحقق من سمايلي لطب الأسنان: ${code}\nصالح لمدة 10 دقائق.\nلا تشارك هذا الكود مع أي شخص.`

  return sendSMS(phone, code)
}

/**
 * تنسيق رقم الهاتف للإرسال (يبدأ بـ +2 لمصر)
 */
export function formatPhoneNumber(phone: string): string {
  // إزالة أي مسافات أو أحرف خاصة
  let cleaned = phone.replace(/[^0-9]/g, '')

  // إذا كان الرقم يبدأ بـ 0، استبدله بكود الدولة المصري +20
  if (cleaned.startsWith('0')) {
    cleaned = '20' + cleaned.substring(1)
  }

  // إذا لم يبدأ بـ +، أضف +
  if (!cleaned.startsWith('+')) {
    cleaned = '+' + cleaned
  }

  return cleaned
}
