'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Lock, ArrowLeft, ArrowRight, CheckCircle, RefreshCw } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTranslations } from '@/hooks/useTranslations'

type Step = 'email' | 'otp' | 'reset' | 'success'

export default function ForgotPasswordPage() {
  const { t, locale } = useTranslations()
  const isRTL = locale === 'ar'
  const router = useRouter()
  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [devOtp, setDevOtp] = useState('')

  // الخطوة 1: طلب OTP
  const handleRequestOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!email) {
      setError(t('forgotPasswordPage.errors.emailRequired'))
      return
    }

    // ✅ التحقق من صحة البريد (يحتوي على @)
    if (!email.includes('@') || !email.includes('.')) {
      setError(t('forgotPasswordPage.errors.emailInvalid'))
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || t('forgotPasswordPage.errors.unknownError'))
      }

      setSuccess(t('forgotPasswordPage.codeSent'))
      setDevOtp(data.dev_otp || '')

      // ✅ طباعة OTP في Console المتصفح
      if (data.dev_otp) {
        console.log('%c🔐 رمز التحقق (OTP):', 'color: #10b981; font-size: 16px; font-weight: bold;', data.dev_otp)
        console.log('%c⏰ صالح لمدة 10 دقائق', 'color: #6b7280; font-size: 12px;')
        console.log('%c📧 تم إرسال إلى: ' + email, 'color: #3b82f6; font-size: 12px;')
      }

      // الانتقال للخطوة التالية بعد 2 ثانية
      setTimeout(() => {
        setSuccess('')
        setStep('otp')
      }, 2000)

    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // الخطوة 2: التحقق من OTP
  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!otp || otp.length !== 6) {
      setError(t('forgotPasswordPage.errors.otpRequired'))
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || t('forgotPasswordPage.errors.unknownError'))
      }

      setSuccess(t('forgotPasswordPage.verified'))
      
      // الانتقال للخطوة التالية بعد 1 ثانية
      setTimeout(() => {
        setSuccess('')
        setStep('reset')
      }, 1000)

    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // الخطوة 3: إعادة تعيين كلمة السر
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError(t('forgotPasswordPage.errors.passwordMismatch'))
      return
    }

    if (password.length < 6) {
      setError(t('forgotPasswordPage.errors.passwordMinLength'))
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, confirmPassword })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || t('forgotPasswordPage.errors.unknownError'))
      }

      setStep('success')

    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleResendOTP = async () => {
    if (!email) return
    
    setLoading(true)
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || t('forgotPasswordPage.errors.unknownError'))
      }

      setDevOtp(data.dev_otp || '')
      setSuccess(t('forgotPasswordPage.codeSent'))
      setTimeout(() => setSuccess(''), 3000)

    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'} className="min-h-screen bg-gradient-hero py-12 px-4 relative overflow-hidden flex items-center justify-center">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl pulse-gentle" />
      </div>

      <Card className="w-full max-w-md relative z-10 glass border-2 border-border/50 shadow-2xl fade-in" style={{ animationDelay: '200ms' }}>
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Lock className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-responsive-2xl" suppressHydrationWarning={true}>
            {step === 'email' && t('forgotPasswordPage.stepEmailTitle')}
            {step === 'otp' && t('forgotPasswordPage.stepOtpTitle')}
            {step === 'reset' && t('forgotPasswordPage.stepResetTitle')}
            {step === 'success' && t('forgotPasswordPage.stepSuccessTitle')}
          </CardTitle>
          <CardDescription className="text-responsive-base" suppressHydrationWarning={true}>
            {step === 'email' && t('forgotPasswordPage.stepEmailDesc')}
            {step === 'otp' && t('forgotPasswordPage.stepOtpDesc', { email })}
            {step === 'reset' && t('forgotPasswordPage.stepResetDesc')}
            {step === 'success' && t('forgotPasswordPage.stepSuccessDesc')}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4 fade-in">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="mb-4 bg-success/10 text-success border-success/30 fade-in">
              <CheckCircle className={`w-4 h-4 ${isRTL ? 'mr-2' : 'ml-2'}`} aria-hidden="true" />
              <span suppressHydrationWarning={true}>{success}</span>
            </Alert>
          )}

          {/* الخطوة 1: إدخال البريد الإلكتروني */}
          {step === 'email' && (
            <form onSubmit={handleRequestOTP} className="space-y-4">
              <div>
                <label className="block mb-2 text-responsive-sm font-medium" suppressHydrationWarning={true}>
                  {t('forgotPasswordPage.emailLabel')}
                </label>
                <Input
                  type="email"
                  placeholder={t('forgotPasswordPage.emailPlaceholder')}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  dir="ltr"
                  className="bg-white/50"
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-gradient-primary btn-hover-lift shadow-lg hover:shadow-xl"
                disabled={loading}
              >
                <span suppressHydrationWarning={true}>{loading ? t('forgotPasswordPage.sending') : t('forgotPasswordPage.sendCode')}</span>
                {!loading && <ArrowLeft className={`w-4 h-4 ${isRTL ? 'mr-2' : 'ml-2'}`} aria-hidden="true" />}
              </Button>
            </form>
          )}

          {/* الخطوة 2: إدخال OTP */}
          {step === 'otp' && (
            <form onSubmit={handleVerifyOTP} className="space-y-4">
              {/* رسالة إرشادية */}
              <div className="bg-info/10 border border-info/30 rounded-xl p-4">
                <p className="text-responsive-sm text-info mb-2 font-medium" suppressHydrationWarning={true}>
                  {t('forgotPasswordPage.infoBox.title')}
                </p>
                <p className="text-responsive-xs text-info/80" suppressHydrationWarning={true}>
                  {t('forgotPasswordPage.infoBox.desc')}
                </p>
                <p className="text-responsive-xs text-info/70 mt-2" suppressHydrationWarning={true}>
                  {t('forgotPasswordPage.infoBox.validity')}
                </p>
              </div>

              <div>
                <label className="block mb-2 text-responsive-sm font-medium" suppressHydrationWarning={true}>
                  {t('forgotPasswordPage.otpLabel')}
                </label>
                <Input
                  type="text"
                  placeholder={t('forgotPasswordPage.otpPlaceholder')}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  maxLength={6}
                  required
                  dir="ltr"
                  className="text-center text-2xl tracking-widest bg-white/50"
                />
                <button
                  type="button"
                  onClick={handleResendOTP}
                  disabled={loading}
                  className="mt-2 text-responsive-sm text-primary hover:text-primary-hover flex items-center gap-1 mx-auto transition-colors"
                >
                  <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} aria-hidden="true" />
                  <span suppressHydrationWarning={true}>{t('forgotPasswordPage.resendCode')}</span>
                </button>
              </div>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep('email')}
                  className="flex-1"
                >
                  <ArrowRight className={`w-4 h-4 ${isRTL ? 'mr-1' : 'ml-1'}`} aria-hidden="true" />
                  <span suppressHydrationWarning={true}>{t('forgotPasswordPage.back')}</span>
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-gradient-primary btn-hover-lift shadow-lg hover:shadow-xl"
                  disabled={loading}
                >
                  <span suppressHydrationWarning={true}>{loading ? t('forgotPasswordPage.verifying') : t('forgotPasswordPage.verify')}</span>
                  {!loading && <ArrowLeft className={`w-4 h-4 ${isRTL ? 'mr-2' : 'ml-2'}`} aria-hidden="true" />}
                </Button>
              </div>
            </form>
          )}

          {/* الخطوة 3: إدخال كلمة السر الجديدة */}
          {step === 'reset' && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block mb-2 text-responsive-sm font-medium" suppressHydrationWarning={true}>
                  {t('forgotPasswordPage.newPasswordLabel')}
                </label>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder={t('forgotPasswordPage.passwordPlaceholder')}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="bg-white/50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 text-foreground-muted hover:text-foreground transition-colors`}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? '👁️' : '🙈'}
                  </button>
                </div>
              </div>

              <div>
                <label className="block mb-2 text-responsive-sm font-medium" suppressHydrationWarning={true}>
                  {t('forgotPasswordPage.confirmPasswordLabel')}
                </label>
                <Input
                  type="password"
                  placeholder={t('forgotPasswordPage.passwordPlaceholder')}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  className="bg-white/50"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep('otp')}
                  className="flex-1"
                >
                  <ArrowRight className={`w-4 h-4 ${isRTL ? 'mr-1' : 'ml-1'}`} aria-hidden="true" />
                  <span suppressHydrationWarning={true}>{t('forgotPasswordPage.back')}</span>
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-gradient-primary btn-hover-lift shadow-lg hover:shadow-xl"
                  disabled={loading}
                >
                  <span suppressHydrationWarning={true}>{loading ? t('forgotPasswordPage.changing') : t('forgotPasswordPage.resetPassword')}</span>
                  {!loading && <ArrowLeft className={`w-4 h-4 ${isRTL ? 'mr-2' : 'ml-2'}`} aria-hidden="true" />}
                </Button>
              </div>
            </form>
          )}

          {/* الخطوة 4: النجاح */}
          {step === 'success' && (
            <div className="text-center space-y-4 fade-in">
              <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto shadow-lg">
                <CheckCircle className="w-8 h-8 text-success" />
              </div>
              <p className="text-foreground-muted" suppressHydrationWarning={true}>
                {t('forgotPasswordPage.successMessage')}
              </p>
              <Button
                onClick={() => router.push('/auth/login')}
                className="w-full bg-gradient-primary btn-hover-lift shadow-lg hover:shadow-xl"
              >
                <span suppressHydrationWarning={true}>{t('forgotPasswordPage.goToLogin')}</span>
                <ArrowLeft className={`w-4 h-4 ${isRTL ? 'mr-2' : 'ml-2'}`} aria-hidden="true" />
              </Button>
            </div>
          )}

          <div className="mt-6 text-center">
            <Link
              href="/auth/login"
              className="text-responsive-sm text-foreground-muted hover:text-primary flex items-center justify-center gap-1 link-underline transition-colors"
            >
              <ArrowRight className={`w-3 h-3 ${isRTL ? 'mr-1' : 'ml-1'}`} aria-hidden="true" />
              <span suppressHydrationWarning={true}>{t('forgotPasswordPage.backToLogin')}</span>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
