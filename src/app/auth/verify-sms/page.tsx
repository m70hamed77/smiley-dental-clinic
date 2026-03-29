'use client'

import { useState, Suspense } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Phone, ArrowLeft, Loader2, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'

function VerifySMSContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const phone = searchParams.get('phone') || ''
  const userType = searchParams.get('userType') || 'patient'

  const [code, setCode] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      // 1. التحقق من كود SMS
      const verifyResponse = await fetch('/api/auth/verify-sms-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, code }),
      })

      const verifyData = await verifyResponse.json()

      if (!verifyResponse.ok) {
        throw new Error(verifyData.error || 'فشل التحقق من الكود')
      }

      // 2. التحقق من الكود ناجح، الآن نحفظ المستخدم في قاعدة البيانات
      const registrationData = localStorage.getItem('registrationData')
      if (registrationData) {
        try {
          const parsed = JSON.parse(registrationData)
          const registerResponse = await fetch('/api/auth/register-user', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: parsed.name,
              email: parsed.email,
              password: parsed.password,
              phone: parsed.phone,
              role: parsed.userType === 'student' ? 'STUDENT' : 'PATIENT',
            }),
          })

          const registerData = await registerResponse.json()

          if (!registerResponse.ok) {
            console.warn('User registration failed:', registerData)
            throw new Error(registerData.error || 'فشل إنشاء الحساب')
          }

          // 3. حفظ بيانات المستخدم في localStorage للدخول التلقائي
          localStorage.setItem('currentUser', JSON.stringify(registerData.user))

          // 4. حذف بيانات التسجيل المؤقتة
          localStorage.removeItem('registrationData')
        } catch (error: any) {
          console.error('Error saving user to database:', error)
          throw new Error(error.message || 'فشل حفظ البيانات')
        }
      }

      setSuccess(true)
      setTimeout(() => {
        if (userType === 'patient') {
          router.push('/dashboard/patient')
        } else {
          router.push('/dashboard/student')
        }
      }, 1500)
    } catch (err: any) {
      setError(err.message || 'حدث خطأ ما')
    } finally {
      setIsLoading(false)
    }
  }

  const handleResend = async () => {
    setIsResending(true)
    setError('')

    try {
      const response = await fetch('/api/auth/send-sms-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      })

      const data = await response.json()
      console.log('[Verify SMS] Resend response:', data)

      if (!response.ok) {
        throw new Error(data.error || 'فشل إرسال الكود')
      }

      alert('تم إرسال كود جديد إلى هاتفك')
    } catch (err: any) {
      console.error('[Verify SMS] Resend error:', err)
      setError(err.message || 'حدث خطأ ما')
    } finally {
      setIsResending(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 bg-muted/50">
      <div className="w-full max-w-md">
        {/* Back Button */}
        <Link href="/auth/register" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-6" suppressHydrationWarning={true}>
          <ArrowLeft className="w-4 h-4 ml-1" />
          رجوع
        </Link>

        <Card>
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-emerald-800 to-teal-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <Phone className="w-8 h-8 text-emerald-800" />
            </div>
            <CardTitle className="text-2xl" suppressHydrationWarning={true}>تحقق من رقم هاتفك</CardTitle>
            <CardDescription suppressHydrationWarning={true}>
              أرسلنا كود تحقق إلى <strong>{phone}</strong>
            </CardDescription>
          </CardHeader>
          <CardContent>
            {success ? (
              <div className="text-center py-8">
                <CheckCircle2 className="w-16 h-16 text-emerald-800 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2" suppressHydrationWarning={true}>تم التحقق بنجاح!</h3>
                <p className="text-muted-foreground" suppressHydrationWarning={true}>جاري تحويلك...</p>
              </div>
            ) : (
              <form onSubmit={handleVerify} className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <Alert className="bg-slate-100 border-emerald-700">
                  <Phone className="h-4 w-4 text-emerald-800" />
                  <AlertDescription className="text-emerald-50 text-sm" suppressHydrationWarning={true}>
                    ✅ تم إرسال كود التحقق إلى هاتفك <strong>{phone}</strong>
                  </AlertDescription>
                </Alert>

                <div className="space-y-2">
                  <Label htmlFor="code" suppressHydrationWarning={true}>كود التحقق</Label>
                  <Input
                    id="code"
                    type="text"
                    placeholder="أدخل الكود المكون من 6 أرقام"
                    maxLength={6}
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    required
                    className="text-center text-2xl tracking-widest"
                    suppressHydrationWarning={true}
                  />
                  <p className="text-xs text-muted-foreground text-center" suppressHydrationWarning={true}>
                    الكود صالح لمدة 10 دقائق
                  </p>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-emerald-800 to-teal-800 hover:from-emerald-900 hover:to-teal-900"
                  disabled={isLoading}
                  suppressHydrationWarning={true}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                      جاري التحقق...
                    </>
                  ) : (
                    'تحقق'
                  )}
                </Button>

                <div className="text-center text-sm text-muted-foreground" suppressHydrationWarning={true}>
                  لم تستلم الكود؟{' '}
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={isResending}
                    className="text-emerald-800 hover:underline font-medium disabled:opacity-50"
                    suppressHydrationWarning={true}
                  >
                    {isResending ? (
                      <>
                        <Loader2 className="w-3 h-3 ml-1 inline animate-spin" />
                        جاري الإرسال...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-3 h-3 ml-1 inline" />
                        إعادة إرسال الكود
                      </>
                    )}
                  </button>
                </div>

                <div className="space-y-3">
                  <Alert className="bg-blue-50 border-blue-200">
                    <Phone className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-blue-900 text-sm" suppressHydrationWarning={true}>
                      📱 تأكد من التحقق من:
                      <ul className="list-disc list-inside mt-1 mr-2">
                        <li suppressHydrationWarning={true}>الرسائل النصية (SMS)</li>
                        <li suppressHydrationWarning={true}>الرسائل المزعجة (Spam)</li>
                        <li suppressHydrationWarning={true}>أن رقم الهاتف صحيح</li>
                      </ul>
                    </AlertDescription>
                  </Alert>

                  <Alert className="bg-amber-50 border-amber-200">
                    <AlertCircle className="h-4 w-4 text-amber-600" />
                    <AlertDescription className="text-amber-900 text-sm" suppressHydrationWarning={true}>
                      ⚠️ <strong>وضع التطوير:</strong> يمكنك العثور على الكود في console المتصفح إذا لم يصل إلى هاتفك
                    </AlertDescription>
                  </Alert>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export const dynamic = 'force-dynamic'

export default function VerifySMSPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-muted/50 py-12 px-4" suppressHydrationWarning={true}>جاري التحميل...</div>}>
      <VerifySMSContent />
    </Suspense>
  )
}
