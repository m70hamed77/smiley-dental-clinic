'use client'

import { useState, useEffect } from 'react'
import { Eye, EyeOff, Upload, X, Check, ArrowRight, ArrowLeft, User, UserPlus, Send, Lock, Mail, Phone, AlertCircle, GraduationCap } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { LanguageSwitcher } from '@/components/language-switcher'
import { useTranslations } from '@/hooks/useTranslations'

export default function SignupPage() {
  const router = useRouter()
  const { t, locale } = useTranslations()
  const isRTL = locale === 'ar'

  // State Management
  const [userType, setUserType] = useState('student') // 'student' (طالب/دكتور) or 'patient' (مريض)
  const [step, setStep] = useState(1) // 1=بيانات أساسية+OTP، 2=إدخال الكود، 3=البيانات الكاملة (للطالب فقط)

  // Form Data
  const [formData, setFormData] = useState<{
    name: string
    email: string
    phone: string
    password: string
    confirmPassword: string
    verificationCode: string
    universityEmail: string
    academicYear: string
    carniehImage: File | null
  }>({
    // بيانات الخطوة 1
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',

    // بيانات الخطوة 2
    verificationCode: '',

    // بيانات الخطوة 3 (للطالب فقط)
    universityEmail: '',
    academicYear: '',
    carniehImage: null
  })

  // UI States
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [generatedOTP, setGeneratedOTP] = useState('')
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  // Password Strength Calculation
  const calculatePasswordStrength = (password: string) => {
    let strength = 0
    if (password.length >= 8) strength += 25
    if (/[A-Z]/.test(password)) strength += 25
    if (/[0-9]/.test(password)) strength += 25
    if (/[^A-Za-z0-9]/.test(password)) strength += 25
    return strength
  }

  const passwordStrength = calculatePasswordStrength(formData.password)

  // ========== تحسين الـ Validation ==========
  const validateField = (name: string, value: string) => {
    const newErrors = { ...errors }

    switch (name) {
      case 'name':
        // التحقق من أن الاسم حروف فقط (عربي أو إنجليزي) ومسافات
        const nameRegex = /^[\u0600-\u06FFa-zA-Z\s]+$/
        if (!value.trim()) {
          newErrors.name = t('registerPage.errors.nameRequired')
        } else if (value.trim().length < 3) {
          newErrors.name = t('registerPage.errors.nameMinLength')
        } else if (!nameRegex.test(value.trim())) {
          newErrors.name = t('registerPage.errors.nameLettersOnly')
        } else {
          delete newErrors.name
        }
        break

      case 'email':
      case 'universityEmail':
        // تحسين regex للإيميل
        const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
        if (!value.trim()) {
          newErrors[name] = t('registerPage.errors.emailRequired')
        } else if (!emailRegex.test(value.trim())) {
          newErrors[name] = t('registerPage.errors.emailInvalid')
        } else {
          delete newErrors[name]
        }
        break

      case 'phone':
        // تحسين regex للموبايل (مصري أو دولي)
        // يقبل: +20xxxxxxxxxx أو 01xxxxxxxxx أو 011xxxxxxxx
        const phoneRegex = /^(\+20|0)?1[0-2,5]{1}[0-9]{8}$/
        if (value.trim() && !phoneRegex.test(value.replace(/[\s-]/g, ''))) {
          newErrors.phone = t('registerPage.errors.phoneInvalid')
        } else {
          delete newErrors.phone
        }
        break

      case 'password':
        if (!value) {
          newErrors.password = t('registerPage.errors.passwordRequired')
        } else if (value.length < 6) {
          newErrors.password = t('registerPage.errors.passwordMinLength')
        } else {
          delete newErrors.password
        }
        break

      case 'confirmPassword':
        if (!value) {
          newErrors.confirmPassword = t('registerPage.errors.confirmPasswordRequired')
        } else if (value !== formData.password) {
          newErrors.confirmPassword = t('registerPage.errors.passwordMismatch')
        } else {
          delete newErrors.confirmPassword
        }
        break

      case 'academicYear':
        if (!value) {
          newErrors.academicYear = t('registerPage.errors.academicYearRequired')
        } else {
          delete newErrors.academicYear
        }
        break

      case 'verificationCode':
        // التحقق أن الكود 6 أرقام فقط
        if (!value) {
          newErrors.verificationCode = t('registerPage.errors.verificationCodeRequired')
        } else if (!/^\d{6}$/.test(value)) {
          newErrors.verificationCode = t('registerPage.errors.verificationCodeLength')
        } else {
          delete newErrors.verificationCode
        }
        break
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // ========== Handle Input Change with data cleaning ==========
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    let cleanedValue = value

    // Clean name from numbers and symbols
    if (name === 'name') {
      cleanedValue = value.replace(/[^a-zA-Z\u0600-\u06FF\s]/g, '')
    }

    // Clean phone number from letters
    if (name === 'phone') {
      cleanedValue = value.replace(/[^0-9+\s-]/g, '')
    }

    // Clean verification code (numbers only)
    if (name === 'verificationCode') {
      cleanedValue = value.replace(/\D/g, '').slice(0, 6)
    }

    setFormData(prev => ({ ...prev, [name]: cleanedValue }))

    // Mark field as touched immediately
    setTouched(prev => ({ ...prev, [name]: true }))

    // Validate data in real-time while typing
    validateField(name, cleanedValue)
  }

  // Handle Blur (Mark as touched)
  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setTouched(prev => ({ ...prev, [name]: true }))
    validateField(name, value)
  }

  // Generate and Send OTP (Step 1)
  const sendOTP = async () => {
    console.log('[Send OTP] Starting...')
    console.log('[Send OTP] Form data:', {
      name: formData.name,
      email: formData.email,
      hasPassword: !!formData.password,
      hasConfirm: !!formData.confirmPassword,
      passwordsMatch: formData.password === formData.confirmPassword
    })

    // Simple validation of fields
    if (!formData.name || formData.name.trim().length < 3) {
      setErrors({ submit: t('registerPage.errors.nameMinLengthSubmit') })
      return
    }

    if (!formData.email || !formData.email.includes('@') || !formData.email.includes('.')) {
      setErrors({ submit: t('registerPage.errors.emailInvalidSubmit') })
      return
    }

    if (!formData.password || formData.password.length < 6) {
      setErrors({ submit: t('registerPage.errors.passwordMinLengthSubmit') })
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setErrors({ submit: t('registerPage.errors.passwordMismatchSubmit') })
      return
    }

    console.log('[Send OTP] ✅ Validation passed')

    // Call API to send verification code directly
    // We rely on isFormValid() in the button itself
    try {
      setIsSubmitting(true)
      setErrors({})

      const response = await fetch('/api/auth/send-verification-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email.trim() })
      })

      const data = await response.json()

      console.log('[Send OTP] Response:', { ok: response.ok, data })

      if (response.ok && data.success) {
        // Sent code (shown in development)
        const otp = data.devCode || ''

        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
        console.log('🔐 OTP Verification Code')
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
        console.log(`📧 Sent to: ${formData.email}`)
        if (otp) {
          console.log(`🔢 Code: ${otp}`)
          setGeneratedOTP(otp)
        } else {
          // If code is not returned (in production), we should use another method
          // We'll generate a temporary code for development testing
          const tempOtp = Math.floor(100000 + Math.random() * 900000).toString()
          console.log(`🔢 Code (test): ${tempOtp}`)
          setGeneratedOTP(tempOtp)
        }
        console.log(`⏰ Valid for: 10 minutes`)
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

        // Move to step 2 (enter code)
        setTimeout(() => setStep(2), 500)
      } else {
        console.error('[Send OTP] Failed:', data.error)
        setErrors({ submit: data.error || t('registerPage.errors.sendCodeFailed') })
      }
    } catch (error) {
      console.error('[Send OTP] Error:', error)
      setErrors({ submit: t('registerPage.errors.connectionError') })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Verify OTP (Step 2)
  const verifyOTP = async () => {
    console.log('[OTP Verification] Verifying code:', formData.verificationCode)
    console.log('[OTP Verification] Generated code:', generatedOTP)

    // First validate the verification code
    validateField('verificationCode', formData.verificationCode)

    if (formData.verificationCode.length !== 6 || !/^\d{6}$/.test(formData.verificationCode)) {
      setErrors({ verificationCode: t('registerPage.errors.verificationCodeLength') })
      return
    }

    if (formData.verificationCode === generatedOTP) {
      console.log('[OTP Verification] Code is correct!')
      console.log('[OTP Verification] User type:', userType)

      if (userType === 'patient') {
        // Patient: Register immediately after verification
        console.log('[OTP Verification] Starting patient registration...')
        await handlePatientSubmit()
      } else {
        // Student: Move to step 3
        console.log('[OTP Verification] Moving to step 3 for student...')
        setStep(3)
        setErrors({})
      }
    } else {
      console.error('[OTP Verification] Wrong code!')
      setErrors({ verificationCode: t('registerPage.errors.verificationCodeInvalid') })
    }
  }

  // Handle Patient Submit (بعد التحقق من الكود مباشرة)
  const handlePatientSubmit = async () => {
    setIsSubmitting(true)

    console.log('[Patient Registration] Starting registration...')
    console.log('[Patient Registration] Form data:', {
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      role: 'PATIENT'
    })

    try {
      const response = await fetch('/api/auth/register-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim().toLowerCase(),
          password: formData.password,
          phone: formData.phone?.replace(/[\s-]/g, '') || null,
          role: 'PATIENT'
        })
      })

      const data = await response.json()

      console.log('[Patient Registration] Response:', {
        ok: response.ok,
        status: response.status,
        data
      })

      if (response.ok) {
        console.log('✅ تم تسجيل المريض بنجاح:', data)
        alert(data.message || t('registerPage.errors.accountCreated'))
        router.push('/auth/login?registered=true')
      } else {
        console.error('❌ Registration failed:', data.error)
        setErrors({ submit: data.error || t('registerPage.errors.registrationError') })
        setStep(1)
      }
    } catch (error) {
      console.error('❌ خطأ في تسجيل المريض:', error)
      setErrors({ submit: t('registerPage.errors.connectionError') })
      setStep(1)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle Image Upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
      if (!allowedTypes.includes(file.type)) {
        setErrors(prev => ({ ...prev, carniehImage: t('registerPage.errors.fileTypeNotSupported') }))
        return
      }

      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        setErrors(prev => ({ ...prev, carniehImage: t('registerPage.errors.fileSizeTooLarge') }))
        return
      }

      setFormData(prev => ({ ...prev, carniehImage: file }))
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors.carniehImage
        return newErrors
      })

      // Preview
      const reader = new FileReader()
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setImagePreview(reader.result)
        }
      }
      reader.readAsDataURL(file)
    }
  }

  // Remove Image
  const removeImage = () => {
    setFormData(prev => ({ ...prev, carniehImage: null }))
    setImagePreview(null)
    setErrors(prev => {
      const newErrors = { ...prev }
      delete newErrors.carniehImage
      return newErrors
    })
  }

  // Check if form is valid for each step - very simple
  const isFormValid = () => {
    // Step 1: Basic data
    if (step === 1) {
      const nameValid = formData.name && formData.name.trim().length >= 3
      const emailValid = formData.email && formData.email.includes('@') && formData.email.includes('.')
      const passwordValid = formData.password && formData.password.length >= 6
      const confirmValid = formData.confirmPassword && formData.confirmPassword.length >= 6 && formData.confirmPassword === formData.password

      const result = nameValid && emailValid && passwordValid && confirmValid

      if (process.env.NODE_ENV === 'development') {
        console.log('=== FORM VALIDATION ===')
        console.log('Step:', step)
        console.log('Name:', formData.name, '->', nameValid ? '✅' : '❌')
        console.log('Email:', formData.email, '->', emailValid ? '✅' : '❌')
        console.log('Password:', formData.password, '->', passwordValid ? '✅' : '❌')
        console.log('Confirm:', formData.confirmPassword, '->', confirmValid ? '✅' : '❌')
        console.log('Match:', formData.password === formData.confirmPassword)
        console.log('Result:', result ? '✅ VALID' : '❌ INVALID')
        console.log('=====================')
      }

      return result
    }

    // Step 2: Code verification
    if (step === 2) {
      const codeValid = formData.verificationCode && formData.verificationCode.length === 6 && /^\d{6}$/.test(formData.verificationCode)

      if (process.env.NODE_ENV === 'development') {
        console.log('=== CODE VALIDATION ===')
        console.log('Code:', formData.verificationCode)
        console.log('Valid:', codeValid ? '✅' : '❌')
        console.log('======================')
      }

      return codeValid
    }

    // Step 3: Complete data (student only)
    if (step === 3 && userType === 'student') {
      const hasUniEmail = formData.universityEmail && formData.universityEmail.trim().length > 0
      const hasYear = formData.academicYear && formData.academicYear.trim().length > 0
      const hasImage = !!formData.carniehImage

      const result = hasUniEmail && hasYear && hasImage

      if (process.env.NODE_ENV === 'development') {
        console.log('=== STUDENT VALIDATION ===')
        console.log('Uni Email:', formData.universityEmail, '->', hasUniEmail ? '✅' : '❌')
        console.log('Year:', formData.academicYear, '->', hasYear ? '✅' : '❌')
        console.log('Image:', hasImage ? '✅' : '❌')
        console.log('Result:', result ? '✅ VALID' : '❌ INVALID')
        console.log('===========================')
      }

      return result
    }

    return false
  }

  // Handle Student Submit (الخطوة 3)
  const handleStudentSubmit = async (e) => {
    e.preventDefault()

    // التحقق من جميع الحقول
    const fieldsToValidate = ['universityEmail', 'academicYear']
    const newTouched = {}

    fieldsToValidate.forEach(field => {
      newTouched[field] = true
      validateField(field, formData[field])
    })

    setTouched(newTouched)

    if (!formData.carniehImage) {
      setErrors(prev => ({ ...prev, carniehImage: t('registerPage.errors.idCardRequired') }))
    }

    if (!isFormValid()) {
      return
    }

    setIsSubmitting(true)

    try {
      const formDataToSend = new FormData()
      formDataToSend.append('name', formData.name.trim())
      formDataToSend.append('email', formData.email.trim().toLowerCase())
      formDataToSend.append('password', formData.password)
      formDataToSend.append('phone', formData.phone?.replace(/[\s-]/g, '') || '')
      formDataToSend.append('universityEmail', formData.universityEmail.trim().toLowerCase())
      formDataToSend.append('academicYear', formData.academicYear)
      formDataToSend.append('role', 'STUDENT')

      if (formData.carniehImage) {
        formDataToSend.append('carniehImage', formData.carniehImage)
      }

      const response = await fetch('/api/auth/register-user', {
        method: 'POST',
        body: formDataToSend
      })

      const data = await response.json()

      if (response.ok) {
        console.log('✅ تم تسجيل الطالب بنجاح:', data)
        alert(data.message || t('registerPage.errors.accountCreated'))
        router.push('/auth/login?registered=true')
      } else {
        setErrors({ submit: data.error || t('registerPage.errors.registrationError') })
      }
    } catch (error) {
      console.error('❌ خطأ في تسجيل الطالب:', error)
      setErrors({ submit: t('registerPage.errors.connectionError') })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Reset form when switching user type
  useEffect(() => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
      verificationCode: '',
      universityEmail: '',
      academicYear: '',
      carniehImage: null
    })
    setErrors({})
    setTouched({})
    setStep(1)
    setGeneratedOTP('')
    setImagePreview(null)
  }, [userType])

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'} className="min-h-screen bg-gradient-hero flex items-center justify-center p-4 relative overflow-hidden" suppressHydrationWarning={true}>
      {/* Background Image - Add your image to public/img/ */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-90"
        style={{
          // Change this path to your image name
          backgroundImage: 'url("/img/register-bg.jpg")',
          // Or use an online image for testing:
          // backgroundImage: 'url("https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=1920&q=80")',
        }}
        aria-hidden="true"
      />

      {/* Language Switcher */}
      <div className="absolute top-4 right-4 md:top-8 md:right-8 z-20">
        <LanguageSwitcher />
      </div>

      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" suppressHydrationWarning={true} aria-hidden="true">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl pulse-gentle"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl pulse-gentle" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl pulse-gentle" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Main Card */}
      <div className="relative w-full max-w-5xl z-10 fade-in" style={{ animationDelay: '200ms' }} suppressHydrationWarning={true}>
        <div className="glass border-2 border-border/50 rounded-3xl shadow-2xl overflow-hidden">
          <div className="grid md:grid-cols-2">
            {/* Right Side - Branding */}
            <div className="relative overflow-hidden hidden md:flex p-12 transition-all duration-500">
              {/* Background Image */}
              <div
                className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                style={{
                  backgroundImage: 'url("/img/register.jpg")',
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
                    {userType === 'student' ? <GraduationCap className="w-8 h-8 text-white" /> : <UserPlus className="w-8 h-8 text-white" />}
                  </div>
                  <h1 className="text-responsive-4xl font-bold text-white mb-4" suppressHydrationWarning={true}>
                    {t('registerPage.welcome')}
                  </h1>
                  <p className="text-responsive-base text-white/80 leading-relaxed" suppressHydrationWarning={true}>
                    {userType === 'student'
                      ? t('registerPage.studentSubtitle')
                      : t('registerPage.patientSubtitle')
                    }
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 card-hover stagger-1">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                        <Check className="w-5 h-5 text-white" aria-hidden="true" />
                      </div>
                      <div>
                        <h3 className="text-white font-semibold text-responsive-base mb-1" suppressHydrationWarning={true}>
                          {userType === 'student' ? t('registerPage.verificationSteps3') : t('registerPage.verificationSteps2')}
                        </h3>
                        <p className="text-white/70 text-responsive-sm" suppressHydrationWarning={true}>{t('registerPage.otpSecure')}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 card-hover stagger-2">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                        <Check className="w-5 h-5 text-white" aria-hidden="true" />
                      </div>
                      <div>
                        <h3 className="text-white font-semibold text-responsive-base mb-1" suppressHydrationWarning={true}>{t('registerPage.instantAccount')}</h3>
                        <p className="text-white/70 text-responsive-sm" suppressHydrationWarning={true}>{t('registerPage.instantAccountDesc')}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 card-hover stagger-3">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                        <Check className="w-5 h-5 text-white" aria-hidden="true" />
                      </div>
                      <div>
                        <h3 className="text-white font-semibold text-responsive-base mb-1" suppressHydrationWarning={true}>{t('registerPage.highSecurity')}</h3>
                        <p className="text-white/70 text-responsive-sm" suppressHydrationWarning={true}>{t('registerPage.highSecurityDesc')}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Left Side - Form */}
            <div className="p-8 md:p-12">
              {/* User Type Toggle */}
              <div className="mb-8 fade-in" style={{ animationDelay: '300ms' }}>
                <div className="bg-surface p-1.5 rounded-xl flex gap-2 border border-border">
                  <button
                    onClick={() => setUserType('student')}
                    className={`flex-1 py-3 px-6 rounded-lg font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${
                      userType === 'student'
                        ? 'bg-gradient-primary text-white shadow-lg btn-hover-lift'
                        : 'text-foreground-muted hover:text-foreground'
                    }`}
                    suppressHydrationWarning={true}
                    aria-label={t('registerPage.studentDoctor')}
                  >
                    <GraduationCap className="w-5 h-5" aria-hidden="true" />
                    {t('registerPage.studentDoctor')}
                  </button>
                  <button
                    onClick={() => setUserType('patient')}
                    className={`flex-1 py-3 px-6 rounded-lg font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${
                      userType === 'patient'
                        ? 'bg-gradient-primary text-white shadow-lg btn-hover-lift'
                        : 'text-foreground-muted hover:text-foreground'
                    }`}
                    suppressHydrationWarning={true}
                    aria-label={t('registerPage.patient')}
                  >
                    <UserPlus className="w-5 h-5" aria-hidden="true" />
                    {t('registerPage.patient')}
                  </button>
                </div>
              </div>

              {/* Form Title */}
              <div className="mb-8 fade-in" style={{ animationDelay: '350ms' }}>
                <h2 className="text-responsive-3xl font-bold text-foreground mb-2" suppressHydrationWarning={true}>
                  {step === 1
                    ? `${userType === 'student' ? t('registerPage.studentDoctor') : t('registerPage.patient')} - ${t('registerPage.step1Student')}`
                    : step === 2
                      ? t('registerPage.step2')
                      : t('registerPage.step3')
                  }
                </h2>
                <p className="text-foreground-muted" suppressHydrationWarning={true}>
                  {step === 1
                    ? t('registerPage.step1Desc')
                    : step === 2
                      ? t('registerPage.step2Desc')
                      : t('registerPage.step3Desc')
                  }
                </p>

                {/* Progress Indicator */}
                <div className="mt-4" role="progressbar" aria-valuenow={step} aria-valuemin="1" aria-valuemax={userType === 'student' ? 3 : 2}>
                  <div className="flex items-center gap-2">
                    {userType === 'student' ? (
                      <>
                        <div className={`flex-1 h-2 rounded-full transition-all ${step >= 1 ? 'bg-primary' : 'bg-border'}`}></div>
                        <div className={`flex-1 h-2 rounded-full transition-all ${step >= 2 ? 'bg-primary' : 'bg-border'}`}></div>
                        <div className={`flex-1 h-2 rounded-full transition-all ${step >= 3 ? 'bg-primary' : 'bg-border'}`}></div>
                      </>
                    ) : (
                      <>
                        <div className={`flex-1 h-2 rounded-full transition-all ${step >= 1 ? 'bg-primary' : 'bg-border'}`}></div>
                        <div className={`flex-1 h-2 rounded-full transition-all ${step >= 2 ? 'bg-primary' : 'bg-border'}`}></div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* ========== الخطوة 1: البيانات الأساسية + إرسال OTP ========== */}
              {step === 1 && (
                <div className="space-y-6 fade-in" style={{ animationDelay: '400ms' }}>
                  {/* Name */}
                  <div>
                    <label className="block text-responsive-sm font-medium text-foreground mb-2" suppressHydrationWarning={true} htmlFor="name">
                      {t('registerPage.fullNameLabel')}
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={`w-full px-4 py-3 bg-white/50 border ${
                        errors.name && touched.name ? 'border-error focus:ring-error' : 'border-border focus:ring-primary'
                      } rounded-xl text-foreground placeholder-foreground-muted focus:outline-none focus:ring-2 transition-all`}
                      placeholder={t('registerPage.fullNamePlaceholder')}
                      aria-invalid={errors.name && touched.name ? 'true' : 'false'}
                      aria-describedby={errors.name ? 'name-error' : undefined}
                    />
                    {errors.name && touched.name && (
                      <p id="name-error" className="mt-2 text-responsive-sm text-error flex items-center gap-1 fade-in">
                        <AlertCircle className="w-4 h-4" aria-hidden="true" />
                        <span>{errors.name}</span>
                      </p>
                    )}
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-responsive-sm font-medium text-foreground mb-2" suppressHydrationWarning={true} htmlFor="email">
                      {t('registerPage.emailLabel')}
                    </label>
                    <div className="relative">
                      <Mail className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-foreground-muted" aria-hidden="true" />
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        className={`w-full px-4 py-3 pr-11 bg-white/50 border ${
                          errors.email && touched.email ? 'border-error focus:ring-error' : 'border-border focus:ring-primary'
                        } rounded-xl text-foreground placeholder-foreground-muted focus:outline-none focus:ring-2 transition-all`}
                        placeholder="example@domain.com"
                        autoComplete="email"
                        aria-invalid={errors.email && touched.email ? 'true' : 'false'}
                        aria-describedby={errors.email ? 'email-error' : undefined}
                      />
                    </div>
                    {errors.email && touched.email && (
                      <p id="email-error" className="mt-2 text-responsive-sm text-error flex items-center gap-1 fade-in">
                        <AlertCircle className="w-4 h-4" aria-hidden="true" />
                        <span>{errors.email}</span>
                      </p>
                    )}
                  </div>

                  {/* Phone (Optional) */}
                  <div>
                    <label className="block text-responsive-sm font-medium text-foreground mb-2" suppressHydrationWarning={true} htmlFor="phone">
                      {t('registerPage.phoneLabel')}
                    </label>
                    <div className="relative">
                      <Phone className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-foreground-muted" aria-hidden="true" />
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        className={`w-full px-4 py-3 pr-11 bg-white/50 border ${
                          errors.phone && touched.phone ? 'border-error focus:ring-error' : 'border-border focus:ring-primary'
                        } rounded-xl text-foreground placeholder-foreground-muted focus:outline-none focus:ring-2 transition-all`}
                        placeholder="01012345678"
                        autoComplete="tel"
                        aria-invalid={errors.phone && touched.phone ? 'true' : 'false'}
                        aria-describedby={errors.phone ? 'phone-error' : undefined}
                      />
                    </div>
                    {errors.phone && touched.phone && (
                      <p id="phone-error" className="mt-2 text-responsive-sm text-error flex items-center gap-1 fade-in">
                        <AlertCircle className="w-4 h-4" aria-hidden="true" />
                        <span>{errors.phone}</span>
                      </p>
                    )}
                  </div>

                  {/* Password */}
                  <div>
                    <label className="block text-responsive-sm font-medium text-foreground mb-2" suppressHydrationWarning={true} htmlFor="password">
                      {t('registerPage.passwordLabel')}
                    </label>
                    <div className="relative">
                      <Lock className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-foreground-muted" aria-hidden="true" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        id="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        className={`w-full px-4 py-3 pr-11 pl-11 bg-white/50 border ${
                          errors.password && touched.password ? 'border-error focus:ring-error' : 'border-border focus:ring-primary'
                        } rounded-xl text-foreground placeholder-foreground-muted focus:outline-none focus:ring-2 transition-all`}
                        placeholder="••••••••"
                        autoComplete="new-password"
                        aria-invalid={errors.password && touched.password ? 'true' : 'false'}
                        aria-describedby={errors.password ? 'password-error' : 'password-strength'}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute left-3 top-1/2 transform -translate-y-1/2 text-foreground-muted hover:text-foreground transition-all"
                        aria-label={showPassword ? t('registerPage.hidePassword') : t('registerPage.showPassword')}
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>

                    {/* Password Strength Indicator */}
                    {formData.password && (
                      <div className="mt-3" id="password-strength">
                        <div className="flex gap-1 mb-2" role="progressbar" aria-valuenow={passwordStrength} aria-valuemin="0" aria-valuemax="100">
                          {[25, 50, 75, 100].map((threshold) => (
                            <div
                              key={threshold}
                              className={`h-1.5 flex-1 rounded-full transition-all ${
                                passwordStrength >= threshold
                                  ? passwordStrength === 100
                                    ? 'bg-success'
                                    : passwordStrength >= 75
                                      ? 'bg-warning'
                                      : 'bg-error'
                                  : 'bg-border'
                              }`}
                              aria-hidden="true"
                            />
                          ))}
                        </div>
                        <p className={`text-responsive-xs ${
                          passwordStrength === 100 ? 'text-success' :
                          passwordStrength >= 75 ? 'text-warning' :
                          'text-error'
                        }`} suppressHydrationWarning={true}>
                          {passwordStrength === 100 ? t('registerPage.passwordStrength.veryStrong') :
                           passwordStrength >= 75 ? t('registerPage.passwordStrength.good') :
                           passwordStrength >= 50 ? t('registerPage.passwordStrength.medium') :
                           t('registerPage.passwordStrength.weak')}
                        </p>
                      </div>
                    )}

                    {errors.password && touched.password && (
                      <p id="password-error" className="mt-2 text-responsive-sm text-error flex items-center gap-1 fade-in">
                        <AlertCircle className="w-4 h-4" aria-hidden="true" />
                        <span>{errors.password}</span>
                      </p>
                    )}

                    <p className="mt-2 text-responsive-xs text-foreground-muted" suppressHydrationWarning={true}>
                      {t('registerPage.passwordHint')}
                    </p>
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label className="block text-responsive-sm font-medium text-foreground mb-2" suppressHydrationWarning={true} htmlFor="confirmPassword">
                      {t('registerPage.confirmPasswordLabel')}
                    </label>
                    <div className="relative">
                      <Lock className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-foreground-muted" aria-hidden="true" />
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        id="confirmPassword"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        className={`w-full px-4 py-3 pr-11 pl-11 bg-white/50 border ${
                          errors.confirmPassword && touched.confirmPassword ? 'border-error focus:ring-error' :
                          formData.confirmPassword && formData.confirmPassword === formData.password ? 'border-success' :
                          'border-border'
                        } rounded-xl text-foreground placeholder-foreground-muted focus:outline-none focus:ring-2 transition-all`}
                        placeholder="••••••••"
                        autoComplete="new-password"
                        aria-invalid={errors.confirmPassword && touched.confirmPassword ? 'true' : 'false'}
                        aria-describedby={errors.confirmPassword ? 'confirmPassword-error' : undefined}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute left-3 top-1/2 transform -translate-y-1/2 text-foreground-muted hover:text-foreground transition-all"
                        aria-label={showConfirmPassword ? t('registerPage.hidePassword') : t('registerPage.showPassword')}
                      >
                        {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    {formData.confirmPassword && formData.confirmPassword === formData.password && (
                      <p className="mt-2 text-responsive-sm text-success flex items-center gap-1 fade-in" suppressHydrationWarning={true}>
                        <Check className="w-4 h-4" aria-hidden="true" />
                        <span>{t('registerPage.passwordsMatch')}</span>
                      </p>
                    )}
                    {errors.confirmPassword && touched.confirmPassword && (
                      <p id="confirmPassword-error" className="mt-2 text-responsive-sm text-error flex items-center gap-1 fade-in">
                        <AlertCircle className="w-4 h-4" aria-hidden="true" />
                        <span>{errors.confirmPassword}</span>
                      </p>
                    )}
                  </div>

                  {/* Send OTP Button */}
                  <button
                    type="button"
                    onClick={sendOTP}
                    disabled={isSubmitting}
                    className={`w-full py-4 rounded-xl font-bold text-white transition-all duration-300 flex items-center justify-center gap-2 btn-hover-lift ${
                      !isSubmitting
                        ? 'bg-gradient-primary shadow-lg hover:shadow-xl'
                        : 'bg-muted cursor-not-allowed opacity-50'
                    }`}
                    suppressHydrationWarning={true}
                    aria-label={t('registerPage.sendCode')}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" aria-hidden="true" />
                        {t('registerPage.sending')}
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5" aria-hidden="true" />
                        {t('registerPage.sendCode')}
                      </>
                    )}
                  </button>

                  {/* Error Message */}
                  {errors.submit && step === 1 && (
                    <div className="bg-error/10 border border-error/30 rounded-xl p-4 fade-in" role="alert">
                      <p className="text-error text-responsive-sm text-center flex items-center justify-center gap-2">
                        <AlertCircle className="w-5 h-5" aria-hidden="true" />
                        <span>{errors.submit}</span>
                      </p>
                    </div>
                  )}

                  {/* Helper Message */}
                  {!isFormValid() && step === 1 && !isSubmitting && (
                    <div className="bg-warning/10 border border-warning/30 rounded-xl p-4 fade-in">
                      <p className="text-warning text-responsive-xs text-center" suppressHydrationWarning={true}>
                        {t('registerPage.fillAllRequired')}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* ========== الخطوة 2: التحقق من الكود ========== */}
              {step === 2 && (
                <div className="space-y-6 fade-in" style={{ animationDelay: '400ms' }}>
                  <div className="text-center mb-6">
                    <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Mail className="w-10 h-10 text-primary" aria-hidden="true" />
                    </div>
                    <p className="text-foreground" suppressHydrationWarning={true}>
                      {t('registerPage.codeSentTo')} {formData.email}
                    </p>
                    <p className="text-foreground-muted text-responsive-sm mt-2" suppressHydrationWarning={true}>
                      {t('registerPage.checkConsole')}
                    </p>
                  </div>

                  <div>
                    <label className="block text-responsive-sm font-medium text-foreground mb-2" suppressHydrationWarning={true} htmlFor="verificationCode">
                      {t('registerPage.enterCodeLabel')}
                    </label>
                    <input
                      type="text"
                      id="verificationCode"
                      inputMode="numeric"
                      name="verificationCode"
                      value={formData.verificationCode}
                      onChange={handleChange}
                      className={`w-full px-4 py-4 text-center text-2xl tracking-widest bg-white/50 border ${
                        errors.verificationCode ? 'border-error focus:ring-error' : 'border-border focus:ring-primary'
                      } rounded-xl text-foreground placeholder-foreground-muted focus:outline-none focus:ring-2 transition-all`}
                      placeholder="000000"
                      maxLength={6}
                      autoComplete="one-time-code"
                      aria-invalid={errors.verificationCode ? 'true' : 'false'}
                      aria-describedby={errors.verificationCode ? 'verificationCode-error' : undefined}
                    />
                    {errors.verificationCode && (
                      <p id="verificationCode-error" className="mt-2 text-responsive-sm text-error flex items-center gap-1 fade-in">
                        <AlertCircle className="w-4 h-4" aria-hidden="true" />
                        <span>{errors.verificationCode}</span>
                      </p>
                    )}
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setStep(1)
                        setErrors({})
                      }}
                      className="flex-1 py-3 rounded-xl font-semibold text-foreground-muted bg-surface hover:bg-surface-hover transition-all flex items-center justify-center gap-2 border border-border btn-hover-lift"
                      suppressHydrationWarning={true}
                      aria-label={t('registerPage.back')}
                    >
                      <ArrowLeft className="w-5 h-5" aria-hidden="true" />
                      {t('registerPage.back')}
                    </button>
                    <button
                      type="button"
                      onClick={verifyOTP}
                      disabled={!isFormValid() || isSubmitting}
                      className={`flex-1 py-3 rounded-xl font-bold text-white transition-all duration-300 flex items-center justify-center gap-2 btn-hover-lift ${
                        isFormValid() && !isSubmitting
                          ? 'bg-gradient-primary shadow-lg hover:shadow-xl'
                          : 'bg-muted cursor-not-allowed opacity-50'
                      }`}
                      suppressHydrationWarning={true}
                      aria-label={userType === 'patient' ? t('registerPage.createAccount') : t('registerPage.verifyCode')}
                    >
                      {isSubmitting ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" aria-hidden="true" />
                          {userType === 'patient' ? t('registerPage.creatingAccount') : t('registerPage.verifying')}
                        </>
                      ) : (
                        <>
                          {userType === 'patient' ? t('registerPage.createAccount') : t('registerPage.verifyCode')}
                          <ArrowRight className="w-5 h-5" aria-hidden="true" />
                        </>
                      )}
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      sendOTP()
                      setFormData(prev => ({ ...prev, verificationCode: '' }))
                      setErrors({})
                    }}
                    className="w-full text-primary hover:text-primary-hover text-responsive-sm py-2 transition-all"
                    suppressHydrationWarning={true}
                  >
                    {t('registerPage.didNotReceiveCode')} {t('registerPage.resendCode')}
                  </button>
                </div>
              )}

              {/* ========== الخطوة 3: البيانات الكاملة (للطالب فقط) ========== */}
              {step === 3 && userType === 'student' && (
                <form onSubmit={handleStudentSubmit} className="space-y-6 fade-in" style={{ animationDelay: '400ms' }}>
                  {/* University Email */}
                  <div>
                    <label className="block text-responsive-sm font-medium text-foreground mb-2" suppressHydrationWarning={true} htmlFor="universityEmail">
                      {t('registerPage.universityEmailLabel')}
                    </label>
                    <div className="relative">
                      <Mail className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-foreground-muted" aria-hidden="true" />
                      <input
                        type="email"
                        id="universityEmail"
                        name="universityEmail"
                        value={formData.universityEmail}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        className={`w-full px-4 py-3 pr-11 bg-white/50 border ${
                          errors.universityEmail && touched.universityEmail ? 'border-error focus:ring-error' : 'border-border focus:ring-primary'
                        } rounded-xl text-foreground placeholder-foreground-muted focus:outline-none focus:ring-2 transition-all`}
                        placeholder={t('registerPage.carniehPlaceholder')}
                        autoComplete="email"
                        aria-invalid={errors.universityEmail && touched.universityEmail ? 'true' : 'false'}
                        aria-describedby={errors.universityEmail ? 'universityEmail-error' : undefined}
                      />
                    </div>
                    {errors.universityEmail && touched.universityEmail && (
                      <p id="universityEmail-error" className="mt-2 text-responsive-sm text-error flex items-center gap-1 fade-in">
                        <AlertCircle className="w-4 h-4" aria-hidden="true" />
                        <span>{errors.universityEmail}</span>
                      </p>
                    )}
                  </div>

                  {/* Academic Year */}
                  <div>
                    <label className="block text-responsive-sm font-medium text-foreground mb-2" suppressHydrationWarning={true} htmlFor="academicYear">
                      {t('registerPage.academicYearLabel')}
                    </label>
                    <select
                      id="academicYear"
                      name="academicYear"
                      value={formData.academicYear}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={`w-full px-4 py-3 bg-white/50 border ${
                        errors.academicYear && touched.academicYear ? 'border-error focus:ring-error' : 'border-border focus:ring-primary'
                      } rounded-xl text-foreground focus:outline-none focus:ring-2 transition-all`}
                      suppressHydrationWarning={true}
                      aria-invalid={errors.academicYear && touched.academicYear ? 'true' : 'false'}
                      aria-describedby={errors.academicYear ? 'academicYear-error' : undefined}
                    >
                      <option value="" suppressHydrationWarning={true}>{t('registerPage.selectAcademicYear')}</option>
                      <option value="1" suppressHydrationWarning={true}>{t('registerPage.firstYear')}</option>
                      <option value="2" suppressHydrationWarning={true}>{t('registerPage.secondYear')}</option>
                      <option value="3" suppressHydrationWarning={true}>{t('registerPage.thirdYear')}</option>
                      <option value="4" suppressHydrationWarning={true}>{t('registerPage.fourthYear')}</option>
                      <option value="5" suppressHydrationWarning={true}>{t('registerPage.fifthYear')}</option>
                      <option value="6" suppressHydrationWarning={true}>{t('registerPage.sixthYear')}</option>
                    </select>
                    {errors.academicYear && touched.academicYear && (
                      <p id="academicYear-error" className="mt-2 text-responsive-sm text-error flex items-center gap-1 fade-in">
                        <AlertCircle className="w-4 h-4" aria-hidden="true" />
                        <span>{errors.academicYear}</span>
                      </p>
                    )}
                  </div>

                  {/* Carnieh Upload */}
                  <div>
                    <label className="block text-responsive-sm font-medium text-foreground mb-2" suppressHydrationWarning={true}>
                      {t('registerPage.carniehLabel')}
                    </label>

                    {!imagePreview ? (
                      <label className="block cursor-pointer">
                        <div className={`border-2 border-dashed ${
                          errors.carniehImage ? 'border-error' : 'border-border'
                        } rounded-xl p-8 text-center hover:border-primary transition-all bg-surface hover:bg-surface-hover card-hover`}>
                          <Upload className="w-12 h-12 text-foreground-muted mx-auto mb-3" aria-hidden="true" />
                          <p className="text-foreground font-semibold mb-1" suppressHydrationWarning={true}>{t('registerPage.uploadIdCardClick')}</p>
                          <p className="text-foreground-muted text-responsive-sm">{t('registerPage.idCardUploadHint')}</p>
                        </div>
                        <input
                          type="file"
                          id="carniehImage"
                          accept="image/jpeg,image/jpg,image/png,image/webp"
                          onChange={handleImageUpload}
                          className="hidden"
                          aria-describedby={errors.carniehImage ? 'carniehImage-error' : undefined}
                        />
                      </label>
                    ) : (
                      <div className="relative">
                        <img
                          src={imagePreview}
                          alt="Carnieh Preview"
                          className="w-full h-48 object-cover rounded-xl border-2 border-success"
                        />
                        <button
                          type="button"
                          onClick={removeImage}
                          className="absolute top-2 left-2 bg-error text-white p-2 rounded-full hover:bg-error-active transition-all shadow-lg"
                          aria-label={t('registerPage.removeImage')}
                        >
                          <X className="w-5 h-5" aria-hidden="true" />
                        </button>
                        <div className="absolute bottom-2 right-2 bg-success text-white px-3 py-1 rounded-full text-responsive-sm font-semibold flex items-center gap-1" suppressHydrationWarning={true}>
                          <Check className="w-4 h-4" aria-hidden="true" />
                          {t('registerPage.imageUploaded')}
                        </div>
                      </div>
                    )}

                    {errors.carniehImage && (
                      <p id="carniehImage-error" className="mt-2 text-responsive-sm text-error flex items-center gap-1 fade-in">
                        <AlertCircle className="w-4 h-4" aria-hidden="true" />
                        <span>{errors.carniehImage}</span>
                      </p>
                    )}
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={!isFormValid() || isSubmitting}
                    className={`w-full py-4 rounded-xl font-bold text-white transition-all duration-300 flex items-center justify-center gap-2 btn-hover-lift ${
                      isFormValid() && !isSubmitting
                        ? 'bg-gradient-primary shadow-lg hover:shadow-xl'
                        : 'bg-muted cursor-not-allowed opacity-50'
                    }`}
                    suppressHydrationWarning={true}
                    aria-label={t('registerPage.completeRegistration')}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" aria-hidden="true" />
                        {t('registerPage.submitting')}
                      </>
                    ) : (
                      <>
                        {t('registerPage.completeRegistration')}
                        <ArrowRight className="w-5 h-5" aria-hidden="true" />
                      </>
                    )}
                  </button>

                  {/* Info Message */}
                  <div className="bg-primary/10 border border-primary/30 rounded-xl p-4" role="alert">
                    <p className="text-primary text-responsive-sm text-center" suppressHydrationWarning={true}>
                      {t('registerPage.accountActivated')}
                    </p>
                  </div>
                </form>
              )}

              {/* General Error Message */}
              {errors.submit && (
                <div className="bg-error/10 border border-error/30 rounded-xl p-4 mt-6 fade-in" role="alert">
                  <p className="text-error text-responsive-sm text-center flex items-center justify-center gap-2">
                    <AlertCircle className="w-5 h-5" aria-hidden="true" />
                    <span>{errors.submit}</span>
                  </p>
                </div>
              )}

              {/* Footer */}
              <div className="mt-8 text-center fade-in" style={{ animationDelay: '450ms' }}>
                <p className="text-foreground-muted text-responsive-sm" suppressHydrationWarning={true}>
                  {t('registerPage.haveAccount')}{' '}
                  <Link href="/auth/login" className="text-primary hover:text-primary-hover font-semibold transition-all inline-flex items-center gap-1 link-underline" suppressHydrationWarning={true}>
                    {t('registerPage.loginLink')}
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Note */}
        <div className="mt-6 text-center fade-in" style={{ animationDelay: '500ms' }}>
          <p className="text-foreground-muted text-responsive-sm" suppressHydrationWarning={true}>
            {t('registerPage.termsAgreement')}{' '}
            <a href="#" className="text-foreground-muted hover:text-foreground transition-all link-underline" suppressHydrationWarning={true}>{t('registerPage.terms')}</a>
            {' '}{t('registerPage.and')}{' '}
            <a href="#" className="text-foreground-muted hover:text-foreground transition-all link-underline" suppressHydrationWarning={true}>{t('registerPage.privacy')}</a>
          </p>
        </div>
      </div>
    </div>
  )
}
