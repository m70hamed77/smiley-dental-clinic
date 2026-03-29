import { Resend } from 'resend'

// تهيئة Resend
const resend = new Resend(process.env.RESEND_API_KEY || 're_test_placeholder')

// واجهة لإرسال الإيميل
export interface SendEmailOptions {
  to: string
  subject: string
  html: string
  text?: string
}

/**
 * إرسال بريد إلكتروني
 */
export async function sendEmail({ to, subject, html, text }: SendEmailOptions) {
  try {
    // في وضع التطوير بدون مفتاح API، نعرض الإيميل في console
    if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY === 're_test_placeholder') {
      console.log('='.repeat(60))
      console.log('[EMAIL SENDING SIMULATION - Development Mode]')
      console.log('='.repeat(60))
      console.log(`To: ${to}`)
      console.log(`Subject: ${subject}`)
      console.log('HTML Content:', html)
      console.log('='.repeat(60))
      console.log('NOTE: Email not sent because RESEND_API_KEY is not configured')
      console.log('To send real emails, add RESEND_API_KEY to your .env file')
      console.log('Get your API key from: https://resend.com/api-keys')
      console.log('='.repeat(60))

      return {
        success: true,
        messageId: `dev-${Date.now()}`,
        note: 'Email simulated in development mode'
      }
    }

    // إرسال الإيميل فعلياً في الإنتاج
    const data = await resend.emails.send({
      from: 'Smiley Dental <no-reply@smiley-dental.com>',
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, ''),
    })

    console.log('[Email Sent Successfully]:', data)
    return {
      success: true,
      messageId: data.id,
      data
    }
  } catch (error: any) {
    console.error('[Email Sending Error]:', error)
    throw new Error(error.message || 'فشل إرسال البريد الإلكتروني')
  }
}

/**
 * إرسال كود التحقق
 */
export async function sendVerificationCode(email: string, code: string) {
  const html = `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #333;
          background-color: #f4f4f4;
          margin: 0;
          padding: 20px;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          background: white;
          border-radius: 10px;
          overflow: hidden;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header {
          background: linear-gradient(135deg, #10b981 0%, #14b8a6 100%);
          color: white;
          padding: 30px;
          text-align: center;
        }
        .header h1 {
          margin: 0;
          font-size: 28px;
        }
        .content {
          padding: 40px 30px;
        }
        .code-box {
          background: linear-gradient(135deg, #ecfdf5 0%, #f0fdfa 100%);
          border: 2px dashed #10b981;
          border-radius: 10px;
          padding: 30px;
          text-align: center;
          margin: 30px 0;
        }
        .code {
          font-size: 48px;
          font-weight: bold;
          color: #059669;
          letter-spacing: 8px;
          margin: 0;
        }
        .info {
          background: #fef3c7;
          border-right: 4px solid #f59e0b;
          padding: 15px;
          margin: 20px 0;
          border-radius: 5px;
        }
        .footer {
          background: #f8f9fa;
          padding: 20px;
          text-align: center;
          font-size: 14px;
          color: #6c757d;
        }
        .btn {
          display: inline-block;
          background: linear-gradient(135deg, #10b981 0%, #14b8a6 100%);
          color: white;
          padding: 12px 30px;
          text-decoration: none;
          border-radius: 25px;
          font-weight: bold;
          margin-top: 20px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🦷 سمايلي لطب الأسنان</h1>
        </div>

        <div class="content">
          <h2 style="color: #10b981; margin-top: 0;">مرحباً بك!</h2>

          <p>شكراً لتسجيلك في منصة سمايلي لطب الأسنان.</p>
          <p>لإكمال عملية التسجيل، يرجى استخدام كود التحقق التالي:</p>

          <div class="code-box">
            <p class="code">${code}</p>
          </div>

          <div class="info">
            <strong>⚠️ مهم:</strong>
            <ul style="margin: 10px 0 0 20px; padding: 0;">
              <li>هذا الكود صالح لمدة 10 دقائق فقط</li>
              <li>لا تشارك هذا الكود مع أي شخص</li>
              <li>إذا لم تطلب هذا الكود، يمكنك تجاهل هذه الرسالة</li>
            </ul>
          </div>

          <p>إذا واجهت أي مشكلة، لا تتردد في التواصل معنا.</p>

          <p>تحياتنا،<br>فريق سمايلي لطب الأسنان</p>
        </div>

        <div class="footer">
          <p>هذه رسالة تلقائية، لا ترد عليها</p>
          <p>© 2024 سمايلي لطب الأسنان - جميع الحقوق محفوظة</p>
        </div>
      </div>
    </body>
    </html>
  `

  return sendEmail({
    to: email,
    subject: 'كود التحقق من سمايلي لطب الأسنان',
    html,
    text: `كود التحقق الخاص بك هو: ${code}\nصالح لمدة 10 دقائق.`
  })
}

/**
 * إرسال إيميل ترحيبي
 */
export async function sendWelcomeEmail(email: string, name: string) {
  const html = `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #333;
          background-color: #f4f4f4;
          margin: 0;
          padding: 20px;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          background: white;
          border-radius: 10px;
          overflow: hidden;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header {
          background: linear-gradient(135deg, #10b981 0%, #14b8a6 100%);
          color: white;
          padding: 30px;
          text-align: center;
        }
        .content {
          padding: 40px 30px;
        }
        .footer {
          background: #f8f9fa;
          padding: 20px;
          text-align: center;
          font-size: 14px;
          color: #6c757d;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🦷 سمايلي لطب الأسنان</h1>
        </div>

        <div class="content">
          <h2 style="color: #10b981;">أهلاً بك، ${name}!</h2>

          <p>تم تسجيل حسابك بنجاح في منصة سمايلي لطب الأسنان.</p>

          <p>نحن سعداء بانضمامك إلى مجتمعنا ونتطلع لمساعدتك في الحصول على أفضل رعاية أسنان.</p>

          <p><strong>ما يمكنك فعله الآن:</strong></p>
          <ul>
            <li>تصفح الحالات المتاحة</li>
            <li>تواصل مع الطلاب الموثقين</li>
            <li>احجز مواعيدك بسهولة</li>
          </ul>

          <p>تحياتنا،<br>فريق سمايلي لطب الأسنان</p>
        </div>

        <div class="footer">
          <p>© 2024 سمايلي لطب الأسنان - جميع الحقوق محفوظة</p>
        </div>
      </div>
    </body>
    </html>
  `

  return sendEmail({
    to: email,
    subject: 'مرحباً بك في سمايلي لطب الأسنان',
    html,
    text: `أهلاً بك ${name} في سمايلي لطب الأسنان!`
  })
}
