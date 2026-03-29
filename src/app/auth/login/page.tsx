'use client'

import { useState } from 'react'
import { Eye, EyeOff, Lock, Mail, AlertCircle, LogIn, User, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { LanguageSwitcher } from '@/components/language-switcher'
import { useTranslations } from '@/hooks/useTranslations'

export default function LoginPage() {
  const router = useRouter()
  const { t, locale } = useTranslations()
  const isRTL = locale === 'ar'

  // State Management
  const [formData, setFormData] = useState<{
    email: string
    password: string
  }>({
    email: '',
    password: ''
  })

  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)

  // Real-time Validation
  const validateField = (name: string, value: string) => {
    const newErrors = { ...errors }

    switch (name) {
      case 'email':
        const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
        if (!value.trim()) {
          newErrors.email = t('loginPage.errors.emailRequired')
        } else if (!emailRegex.test(value.trim())) {
          newErrors.email = t('loginPage.errors.emailInvalid')
        } else {
          delete newErrors.email
        }
        break

      case 'password':
        if (!value) {
          newErrors.password = t('loginPage.errors.passwordRequired')
        } else if (value.length < 8) {
          newErrors.password = t('loginPage.errors.passwordMinLength')
        } else {
          delete newErrors.password
        }
        break
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Handle Input Change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    setTouched(prev => ({ ...prev, [name]: true }))
    validateField(name, value)
  }

  // Handle Blur
  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setTouched(prev => ({ ...prev, [name]: true }))
    validateField(name, value)
  }

  // Check if form is valid
  const isFormValid = () => {
    const hasEmail = formData.email && formData.email.trim().length > 5
    const hasPassword = formData.password && formData.password.length >= 6
    return hasEmail && hasPassword
  }

  // Handle Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const fieldsToValidate = ['email', 'password']
    const newTouched: Record<string, boolean> = {}

    fieldsToValidate.forEach(field => {
      newTouched[field] = true
      validateField(field, formData[field])
    })

    setTouched(newTouched)

    if (!isFormValid()) {
      return
    }

    setIsSubmitting(true)
    setErrors({})

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 15000)

      console.log('🔐 [Login] Attempting login for:', formData.email.trim().toLowerCase())
      console.log('🔐 [Login] Password length:', formData.password.trim().length)

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email.trim().toLowerCase(),
          password: formData.password.trim(),
          rememberMe
        }),
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      console.log('📡 [Login] Response status:', response.status, response.statusText)

      let data
      try {
        const contentType = response.headers.get('content-type')
        if (!contentType || !contentType.includes('application/json')) {
          console.error('❌ [Login] Server returned non-JSON response:', {
            status: response.status,
            statusText: response.statusText,
            contentType
          })
          throw new Error(t('loginPage.errors.invalidResponse'))
        }

        const responseText = await response.text()
        console.log('📄 [Login] Response text length:', responseText.length)

        data = JSON.parse(responseText)
        console.log('📦 [Login] Parsed data:', { success: data.success, hasUser: !!data.user, hasError: !!data.error })
      } catch (parseError) {
        console.error('❌ [Login] Failed to parse response:', parseError)
        throw new Error(t('loginPage.errors.parseError'))
      }

      if (response.ok) {
        if (!data.success) {
          const errorMessage = data.message || data.error || 'Unknown error'
          console.log('⚠️ [Login] Account not ready:', errorMessage)
          setErrors({ submit: errorMessage })
          return
        }

        console.log('✅ [Login] Login successful:', {
          userId: data.user?.id,
          name: data.user?.name,
          role: data.user?.role
        })

        let storageSuccess = false

        try {
          localStorage.setItem('currentUser', JSON.stringify(data.user))
          localStorage.setItem('userId', data.user?.id || '')
          console.log('✅ [Login] Saved to localStorage')
          storageSuccess = true
        } catch (storageError: unknown) {
          console.warn('⚠️ [Login] Failed to save to localStorage:', storageError instanceof Error ? storageError.message : String(storageError))
        }

        try {
          sessionStorage.setItem('currentUser', JSON.stringify(data.user))
          sessionStorage.setItem('userId', data.user?.id || '')
          console.log('✅ [Login] Saved to sessionStorage')
          storageSuccess = true
        } catch (sessionError: unknown) {
          console.warn('⚠️ [Login] Failed to save to sessionStorage:', sessionError instanceof Error ? sessionError.message : String(sessionError))
        }

        try {
          document.cookie = `userId=${data.user?.id || ''}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=lax`
          document.cookie = `userRole=${data.user?.role || ''}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=lax`
          console.log('✅ [Login] Saved to document.cookie')
          storageSuccess = true
        } catch (cookieError: unknown) {
          console.warn('⚠️ [Login] Failed to save to document.cookie:', cookieError instanceof Error ? cookieError.message : String(cookieError))
        }

        try {
          if (rememberMe && data.token) {
            localStorage.setItem('authToken', data.token)
            sessionStorage.setItem('authToken', data.token)
          } else if (data.token) {
            sessionStorage.setItem('authToken', data.token)
          }
        } catch (tokenError: unknown) {
          console.warn('⚠️ [Login] Failed to save token:', tokenError instanceof Error ? tokenError.message : String(tokenError))
        }

        if (!storageSuccess) {
          console.warn('⚠️ [Login] Warning: Failed to save user session in any storage')
        }

        let redirectPath = '/dashboard'
        if (data.user?.role === 'ADMIN') {
          redirectPath = '/admin'
        } else if (data.user?.role === 'STUDENT') {
          redirectPath = '/dashboard/student'
        } else if (data.user?.role === 'PATIENT') {
          redirectPath = '/dashboard/patient'
        }

        const userId = data.user?.id || ''
        const urlWithUserId = `${redirectPath}?userId=${userId}`

        console.log('🔄 [Login] Redirecting to:', urlWithUserId)
        router.push(urlWithUserId)
      } else {
        let errorMessage = t('loginPage.errors.invalidCredentials')

        if (data.error) {
          errorMessage = data.error
        } else if (data.message) {
          errorMessage = data.message
        } else if (response.status === 400) {
          errorMessage = t('loginPage.errors.invalidData')
        } else if (response.status === 401) {
          errorMessage = t('loginPage.errors.invalidCredentials')
        } else if (response.status === 403) {
          errorMessage = t('loginPage.errors.forbidden')
        } else if (response.status === 500) {
          errorMessage = t('loginPage.errors.serverError')
        }

        console.log('❌ [Login] Login failed:', {
          status: response.status,
          message: errorMessage,
          data
        })

        setErrors({ submit: errorMessage })
      }
    } catch (error: any) {
      console.error('❌ [Login] Unexpected error:', {
        message: error.message,
        name: error.name,
        stack: error.stack
      })

      let errorMessage = t('loginPage.errors.connectionError')

      if (error.name === 'AbortError') {
        errorMessage = t('loginPage.errors.timeout')
      } else if (error.message?.includes('fetch')) {
        errorMessage = t('loginPage.errors.noInternet')
      } else if (error.message) {
        errorMessage = error.message
      }

      setErrors({ submit: errorMessage })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'} className="min-h-screen bg-gradient-hero flex items-center justify-center p-4 relative overflow-hidden">

      {/* ✅ Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-60"
        style={{
          backgroundImage: 'url("/img/background-login.jpg")',
        }}
        aria-hidden="true"
      />

      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl pulse-gentle" />
      </div>

      {/* Language Switcher */}
      <div className="absolute top-4 right-4 md:top-8 md:right-8 z-20">
        <LanguageSwitcher />
      </div>

      {/* Main Card */}
      <div className="relative w-full max-w-5xl z-10 fade-in" style={{ animationDelay: '200ms' }}>
        <div className="glass border-2 border-border/50 rounded-3xl shadow-2xl overflow-hidden">
          <div className="grid md:grid-cols-2">
            {/* Right Side - Branding */}
            <div className="relative overflow-hidden hidden md:flex p-12 transition-all duration-500">
              {/* Background Image */}
              <div
                className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                style={{
                  backgroundImage: 'url("/img/login-bg.jpg")',
                }}
                aria-hidden="true"
              />
              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-primary opacity-30" aria-hidden="true"></div>
              {/* Pattern Overlay */}
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjEpIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-30" aria-hidden="true"></div>

              <div className="relative z-10 flex flex-col justify-center">
                <div className="mb-8 fade-in" style={{ animationDelay: '250ms' }}>
                  <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                    <User className="w-8 h-8 text-white" />
                  </div>
                  <h1 className="text-responsive-4xl font-bold text-white mb-4" suppressHydrationWarning={true}>
                    {t('loginPage.welcomeBack')}
                  </h1>
                  <p className="text-responsive-base text-white/80 leading-relaxed" suppressHydrationWarning={true}>
                    {t('loginPage.welcomeSubtitle')}
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 card-hover stagger-1">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Lock className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-white font-bold text-responsive-base" suppressHydrationWarning={true}>{t('loginPage.highSecurity')}</h3>
                        <p className="text-white/70 text-responsive-sm" suppressHydrationWarning={true}>{t('loginPage.securityDesc')}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 card-hover stagger-2">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                        <LogIn className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-white font-bold text-responsive-base" suppressHydrationWarning={true}>{t('loginPage.fastAccess')}</h3>
                        <p className="text-white/70 text-responsive-sm" suppressHydrationWarning={true}>{t('loginPage.fastAccessDesc')}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-8 border-t border-white/20">
                  <p className="text-blue-100 text-sm" suppressHydrationWarning={true}>
                    💡 <span className="font-semibold">{t('loginPage.tipLabel')}:</span> {t('loginPage.tipText')}
                  </p>
                </div>
              </div>
            </div>

            {/* Left Side - Login Form */}
            <div className="p-8 md:p-12">
              {/* Header */}
              <div className="mb-8 fade-in" style={{ animationDelay: '300ms' }}>
                <h2 className="text-responsive-3xl font-bold text-foreground mb-2" suppressHydrationWarning={true}>{t('loginPage.title')}</h2>
                <p className="text-foreground-muted" suppressHydrationWarning={true}>{t('loginPage.subtitle')}</p>
              </div>

              {/* Login Form */}
              <form onSubmit={handleSubmit} className="space-y-6 fade-in" style={{ animationDelay: '350ms' }}>
                {/* Email */}
                <div>
                  <label className="block text-responsive-sm font-medium text-foreground mb-2" suppressHydrationWarning={true}>
                    {t('loginPage.emailLabel')}
                  </label>
                  <div className="relative">
                    <Mail className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-foreground-muted" />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={`w-full px-4 py-3 pr-11 bg-white/50 border ${
                        errors.email && touched.email ? 'border-error focus:ring-error' : 'border-border focus:ring-primary'
                      } rounded-xl text-foreground placeholder-foreground-muted focus:outline-none focus:ring-2 transition-all`}
                      placeholder="example@domain.com"
                      autoComplete="email"
                      aria-label={t('loginPage.emailLabel')}
                    />
                  </div>
                  {errors.email && touched.email && (
                    <p className="mt-2 text-responsive-sm text-error flex items-center gap-1 fade-in">
                      <AlertCircle className="w-4 h-4" aria-hidden="true" />
                      <span>{errors.email}</span>
                    </p>
                  )}
                </div>

                {/* Password */}
                <div>
                  <label className="block text-responsive-sm font-medium text-foreground mb-2" suppressHydrationWarning={true}>
                    {t('loginPage.passwordLabel')}
                  </label>
                  <div className="relative">
                    <Lock className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-foreground-muted" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={`w-full px-4 py-3 pr-11 pl-11 bg-white/50 border ${
                        errors.password && touched.password ? 'border-error focus:ring-error' : 'border-border focus:ring-primary'
                      } rounded-xl text-foreground placeholder-foreground-muted focus:outline-none focus:ring-2 transition-all`}
                      placeholder="••••••••"
                      autoComplete="current-password"
                      aria-label={t('loginPage.passwordLabel')}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 text-foreground-muted hover:text-foreground transition-all"
                      aria-label={showPassword ? t('loginPage.hidePassword') : t('loginPage.showPassword')}
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {errors.password && touched.password && (
                    <p className="mt-2 text-responsive-sm text-error flex items-center gap-1 fade-in">
                      <AlertCircle className="w-4 h-4" aria-hidden="true" />
                      <span>{errors.password}</span>
                    </p>
                  )}
                </div>

                {/* Remember Me & Forgot Password */}
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 cursor-pointer"
                    />
                    <span className="text-sm text-slate-400 group-hover:text-slate-300 transition-all" suppressHydrationWarning={true}>
                      {t('loginPage.rememberMe')}
                    </span>
                  </label>
                  <Link
                    href="/forgot-password"
                    className="text-sm text-blue-400 hover:text-blue-300 transition-all font-medium"
                    suppressHydrationWarning={true}
                  >
                    {t('loginPage.forgotPassword')}
                  </Link>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`w-full py-4 rounded-xl font-bold text-white transition-all duration-300 flex items-center justify-center gap-2 btn-hover-lift ${
                    !isSubmitting
                      ? 'bg-gradient-primary shadow-lg hover:shadow-xl'
                      : 'bg-muted cursor-not-allowed opacity-50'
                  }`}
                  suppressHydrationWarning={true}
                  aria-label={t('auth.loginButton')}
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      {t('loginPage.loggingIn')}
                    </>
                  ) : (
                    <>
                      <LogIn className="w-5 h-5" />
                      {t('auth.loginButton')}
                    </>
                  )}
                </button>

                {/* Error Message */}
                {errors.submit && (
                  <div className="bg-error/10 border border-error/30 rounded-xl p-4 fade-in">
                    <p className="text-error text-responsive-sm text-center flex items-center justify-center gap-2">
                      <AlertCircle className="w-5 h-5" aria-hidden="true" />
                      <span>{errors.submit}</span>
                    </p>
                  </div>
                )}

                {/* Divider */}
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-700"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-slate-900 text-slate-400" suppressHydrationWarning={true}>{t('loginPage.or')}</span>
                  </div>
                </div>

                {/* Social Login Options */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    className="py-3 px-4 bg-white/50 hover:bg-white/70 border border-border rounded-xl text-foreground font-medium transition-all flex items-center justify-center gap-2 btn-hover-lift"
                    aria-label="Sign in with Google"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    Google
                  </button>
                  <button
                    type="button"
                    className="py-3 px-4 bg-white/50 hover:bg-white/70 border border-border rounded-xl text-foreground font-medium transition-all flex items-center justify-center gap-2 btn-hover-lift"
                    aria-label="Sign in with Facebook"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                    Facebook
                  </button>
                </div>
              </form>

              {/* Sign Up Link */}
              <div className="mt-8 text-center fade-in" style={{ animationDelay: '400ms' }}>
                <p className="text-foreground-muted text-responsive-sm" suppressHydrationWarning={true}>
                  {t('loginPage.noAccount')}{' '}
                  <Link href="/auth/register" className="text-primary hover:text-primary-hover font-semibold transition-all inline-flex items-center gap-1 link-underline" suppressHydrationWarning={true}>
                    {t('auth.registerNow')}
                    <ArrowRight className="w-4 h-4" aria-hidden="true" />
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Note */}
        <div className="mt-6 text-center fade-in" style={{ animationDelay: '450ms' }}>
          <p className="text-foreground-muted text-responsive-sm" suppressHydrationWarning={true}>
            {t('loginPage.securityNote')}
          </p>
        </div>
      </div>
    </div>
  )
}