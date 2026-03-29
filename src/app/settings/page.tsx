'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Navigation } from '@/components/navigation'
import { Footer } from '@/components/footer'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { useTranslations } from '@/hooks/useTranslations'
import {
  User,
  Mail,
  Phone,
  Shield,
  Bell,
  Lock,
  Eye,
  EyeOff,
  Save,
  Globe,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Download,
  Trash2,
  Key,
  Smartphone,
  MessageSquare,
  MapPin,
  Camera,
  X,
  Check,
  GraduationCap,
} from 'lucide-react'

export default function SettingsPage() {
  const { user } = useCurrentUser()
  const { t, locale, loading: i18nLoading } = useTranslations()
  
  const isRTL = locale === 'ar'
  const localeDate = locale === 'ar' ? 'ar-EG' : 'en-US'
  const [activeTab, setActiveTab] = useState('account')
  const [isLoading, setIsLoading] = useState(false)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)

  // Helper function to convert base64 to data URL
  const getPhotoUrl = (fileUrl: string) => {
    if (!fileUrl) return ''

    // If it's already a data URL, return as is
    if (fileUrl.startsWith('data:')) {
      return fileUrl
    }

    // If it's a URL, return as is
    if (fileUrl.startsWith('http')) {
      return fileUrl
    }

    // If it looks like base64, add prefix
    const looksLikeBase64 = !fileUrl.includes(' ') && !fileUrl.includes('\n') && fileUrl.length > 100
    if (looksLikeBase64) {
      return `data:image/jpeg;base64,${fileUrl}`
    }

    // Otherwise, assume it's a relative path
    return fileUrl
  }

  // Notification settings
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    smsNotifications: true,
    pushNotifications: true,
    appointmentReminders: true,
    newApplications: true,
    statusUpdates: true,
    marketingEmails: false,
  })

  // Privacy settings
  const [privacySettings, setPrivacySettings] = useState({
    showProfile: true,
    showEmail: false,
    showPhone: false,
    showLocation: true,
    allowMessages: true,
    showStats: true,
  })

  // Password form
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  // Account form (Updated: 2024-01-XX)
  const [accountForm, setAccountForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: '',
    bio: '',
    academicYear: '',
    universityName: '',
    collegeName: '',
    collegeAddress: '',
  })

  // جلب البيانات الأكاديمية للطالب وتحديث النموذج
  useEffect(() => {
    const fetchData = async () => {
      if (user?.role === 'STUDENT') {
        try {
          const response = await fetch(`/api/student/profile?t=${Date.now()}`, {
            credentials: 'include'
          })
          const data = await response.json()
          if (data.success && data.student) {
            setAccountForm(prev => ({
              ...prev,
              academicYear: data.student.academicYear?.toString() || '',
              universityName: data.student.universityName || '',
              collegeName: data.student.collegeName || '',
              collegeAddress: data.student.collegeAddress || '',
            }))
          }
        } catch (error) {
          console.error('[Settings] Error fetching student profile:', error)
        }
      }

      // تحديث بيانات النموذج من المستخدم الحالي
      if (user) {
        setAccountForm(prev => ({
          ...prev,
          name: user.name || prev.name,
          email: user.email || prev.email,
          phone: user.phone || prev.phone,
        }))
      }
    }
    fetchData()
  }, [user])

  // Preferences
  const [preferences, setPreferences] = useState({
    language: 'ar',
    timezone: 'Africa/Cairo',
  })

  const handleSave = async (section: string) => {
    setIsLoading(true)
    setSaveMessage(null)

    if (section === 'account') {
      try {
        console.log('[Settings] Saving account data:', accountForm)

        // 1. تحديث الاسم والبيانات الأساسية
        const response = await fetch('/api/user/update', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: user?.id,
            name: accountForm.name,
            phone: accountForm.phone,
            bio: accountForm.bio,
          }),
        })

        const data = await response.json()
        console.log('[Settings] Update response:', response.status, data)

        if (response.ok) {
          // تحديث localStorage بالبيانات الجديدة
          if (user) {
            const updatedUser = {
              ...user,
              name: data.user.name,
              phone: data.user.phone,
            }
            localStorage.setItem('currentUser', JSON.stringify(updatedUser))
            console.log('[Settings] ✅ localStorage updated')
          }

          // تحديث البيانات في الـ state - التأكد من الاحتفاظ بجميع الحقول
          if (data.user) {
            setAccountForm(prev => ({
              ...prev,
              name: data.user.name,
              phone: data.user.phone,
            }))
          }

          // 2. تحديث البيانات الأكاديمية (السنة الدراسية والجامعة والكلية) إذا كان المستخدم طالباً
          if (user?.role === 'STUDENT') {
            try {
              // تحديث السنة الدراسية والجامعة
              const academicResponse = await fetch('/api/student/update-academic-year', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  academicYear: accountForm.academicYear ? parseInt(accountForm.academicYear) : undefined,
                  universityName: accountForm.universityName ? accountForm.universityName : undefined,
                })
              })

              const academicData = await academicResponse.json()
              console.log('[Settings] Academic year update response:', academicResponse.status, academicData)

              // تحديث الكلية وعنوان الكلية بشكل منفصل
              const collegeResponse = await fetch('/api/student/update-college', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  collegeName: accountForm.collegeName || '',
                  collegeAddress: accountForm.collegeAddress || ''
                })
              })

              const collegeData = await collegeResponse.json()
              console.log('[Settings] College update response:', collegeResponse.status, collegeData)

              if (collegeResponse.ok) {
                console.log('[Settings] ✅ College info updated successfully')
              }
            } catch (academicError) {
              console.error('[Settings] Error updating academic info:', academicError)
            }
          }

          setSaveMessage({
            type: 'success',
            message: t('profile.settingsPage.dataSaved'),
          })

          setIsLoading(false)
          setTimeout(() => setSaveMessage(null), 3000)
        } else {
          setSaveMessage({
            type: 'error',
            message: data.error || t('profile.settingsPage.dataSaveFailed'),
          })
          setIsLoading(false)
          setTimeout(() => setSaveMessage(null), 5000)
        }
      } catch (error) {
        console.error('[Settings] Save error:', error)
        setSaveMessage({
          type: 'error',
          message: t('profile.settingsPage.connectionError'),
        })
        setIsLoading(false)
        setTimeout(() => setSaveMessage(null), 5000)
      }
    } else if (section === 'security') {
      // معالجة تغيير الإيميل والباسورد
      if (accountForm.email && accountForm.email !== user?.email) {
        // تغيير الإيميل
        try {
          const emailResponse = await fetch('/api/user/change-email', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              userId: user?.id,
              newEmail: accountForm.email,
              currentPassword: passwordForm.currentPassword,
            }),
          })

          const emailData = await emailResponse.json()

          if (emailResponse.ok) {
            setSaveMessage({
              type: 'success',
              message: emailData.message || t('profile.settingsPage.passwordChanged'),
            })

            // تحديث localStorage
            if (user) {
              const updatedUser = {
                ...user,
                email: emailData.user.email,
              }
              localStorage.setItem('currentUser', JSON.stringify(updatedUser))
            }

            // إزالة بيانات المستخدم وإعادة التوجيه لتسجيل الدخول
            setTimeout(() => {
              localStorage.removeItem('currentUser')
              window.location.href = '/auth/login'
            }, 2000)

            setIsLoading(false)
            return
          } else {
            setSaveMessage({
              type: 'error',
              message: emailData.error || t('profile.settingsPage.passwordChangeFailed'),
            })
            setIsLoading(false)
            setTimeout(() => setSaveMessage(null), 5000)
            return
          }
        } catch (emailError) {
          console.error('[Settings] Email change error:', emailError)
          setSaveMessage({
            type: 'error',
            message: t('profile.settingsPage.passwordChangeFailed'),
          })
          setIsLoading(false)
          setTimeout(() => setSaveMessage(null), 5000)
          return
        }
      }

      // إذا تم تغيير الباسورد
      if (passwordForm.newPassword) {
        await handlePasswordChange()
        return
      }

      // إذا لم يتم تغيير شيء
      setSaveMessage({
        type: 'success',
        message: t('common.save'),
      })
      setIsLoading(false)
      setTimeout(() => setSaveMessage(null), 5000)
    } else {
      // للقسم الأخرى (الإشعارات، الخصوصية، إلخ)
      await new Promise((resolve) => setTimeout(resolve, 1000))
      setSaveMessage({
        type: 'success',
        message: t('common.save'),
      })
      setIsLoading(false)
      setTimeout(() => setSaveMessage(null), 5000)
    }
  }

  const handlePasswordChange = async () => {
    setIsLoading(true)
    setSaveMessage(null)

    // Validation
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setSaveMessage({
        type: 'error',
        message: t('profile.settingsPage.passwordMismatch'),
      })
      setIsLoading(false)
      setTimeout(() => setSaveMessage(null), 5000)
      return
    }

    if (passwordForm.newPassword.length < 8) {
      setSaveMessage({
        type: 'error',
        message: t('profile.settingsPage.passwordMinLength'),
      })
      setIsLoading(false)
      setTimeout(() => setSaveMessage(null), 5000)
      return
    }

    try {
      console.log('[Settings] Changing password for user:', user?.id)

      const response = await fetch('/api/user/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user?.id,
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      })

      const data = await response.json()
      console.log('[Settings] Password change response:', response.status, data)

      if (response.ok) {
        setSaveMessage({
          type: 'success',
          message: data.message || t('profile.settingsPage.passwordChanged'),
        })
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })

        // ✅ إزالة بيانات المستخدم من localStorage
        setTimeout(() => {
          console.log('[Settings] Clearing localStorage and redirecting to login')
          localStorage.removeItem('currentUser')
          window.location.href = '/auth/login'
        }, 2000)
      } else {
        setSaveMessage({
          type: 'error',
          message: data.error || t('profile.settingsPage.passwordChangeFailed'),
        })
        setTimeout(() => setSaveMessage(null), 5000)
      }
    } catch (error) {
      console.error('[Settings] Password change error:', error)
      setSaveMessage({
        type: 'error',
        message: t('profile.settingsPage.connectionError'),
      })
      setTimeout(() => setSaveMessage(null), 5000)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteAccount = () => {
    const confirmed = window.confirm(
      t('profile.settingsPage.confirmDeleteMessage')
    )

    if (confirmed) {
      // TODO: حذف الحساب في API
      alert(t('profile.settingsPage.deleteConfirmAlert'))
    }
  }

  const handleExportData = () => {
    // TODO: تصدير البيانات من API
    const data = {
      name: user?.name,
      email: user?.email,
      phone: user?.phone,
      createdAt: user?.createdAt,
      // ... بيانات أخرى
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `smiley-data-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Open file picker for avatar upload
  const handleOpenFilePicker = () => {
    const fileInput = document.getElementById('avatar-upload') as HTMLInputElement
    if (fileInput) {
      console.log('[Settings] Opening file picker')
      fileInput.click()
    } else {
      console.error('[Settings] File input not found')
    }
  }

  // Handle Avatar Upload
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    console.log('[Settings] File selected:', file.name, file.type, file.size)

    // التحقق من نوع الملف
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      setSaveMessage({
        type: 'error',
        message: t('profile.profileImageUpload.fileTypeError'),
      })
      setTimeout(() => setSaveMessage(null), 5000)
      return
    }

    // التحقق من حجم الملف (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setSaveMessage({
        type: 'error',
        message: t('profile.profileImageUpload.fileSizeError'),
      })
      setTimeout(() => setSaveMessage(null), 5000)
      return
    }

    // Preview الصورة
    const reader = new FileReader()
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string)
    }
    reader.readAsDataURL(file)

    setIsUploadingAvatar(true)

    // التحقق من وجود user.id
    if (!user?.id) {
      setSaveMessage({
        type: 'error',
        message: t('profile.profileImageUpload.loginRequired'),
      })
      setIsUploadingAvatar(false)
      setTimeout(() => setSaveMessage(null), 5000)
      return
    }

    try {
      const formData = new FormData()
      formData.append('avatar', file)
      formData.append('userId', user.id)

      console.log('[Settings] Uploading avatar for user:', user.id, 'File:', file.name, 'Size:', file.size)

      const response = await fetch('/api/user/profile-avatar', {
        method: 'POST',
        body: formData
      })

      const data = await response.json()

      console.log('[Settings] Upload response:', response.status, data)

      if (response.ok) {
        setSaveMessage({
          type: 'success',
          message: t('profile.profileImageUpload.uploadSuccess'),
        })

        // تحديث localStorage
        if (user) {
          const updatedUser = { ...user, avatarUrl: data.avatarUrl }
          localStorage.setItem('currentUser', JSON.stringify(updatedUser))
        }

        // إعادة تحميل الصفحة بعد فترة قصيرة
        setTimeout(() => {
          window.location.reload()
        }, 1000)
      } else {
        console.error('[Settings] Upload failed:', response.status, data)
        setSaveMessage({
          type: 'error',
          message: data.error || t('profile.profileImageUpload.uploadError'),
        })
      }
    } catch (error) {
      console.error('[Settings] Upload error:', error)
      setSaveMessage({
        type: 'error',
        message: t('profile.settingsPage.connectionError'),
      })
    } finally {
      setIsUploadingAvatar(false)
      setTimeout(() => setSaveMessage(null), 5000)
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation
        user={
          user
            ? {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role as 'PATIENT' | 'STUDENT',
                avatar: user.avatarUrl,
              }
            : undefined
        }
      />

      <main className="flex-1 py-8 px-4 bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
        <div className="container mx-auto max-w-5xl">
          {/* Header */}
          <div className="mb-8 p-6 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-100 border-2 border-indigo-200 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
            <h1 className="text-3xl font-bold mb-2 text-indigo-900" suppressHydrationWarning={true}>
              {t('profile.settingsPage.title')}
            </h1>
            <p className="text-indigo-700" suppressHydrationWarning={true}>
              {t('profile.settingsPage.subtitle')}
            </p>
          </div>

          {/* Tabs */}
          <div className="flex flex-wrap gap-2 mb-6">
            <Button
              variant={activeTab === 'account' ? 'default' : 'outline'}
              onClick={() => setActiveTab('account')}
              className={`gap-2 transition-all duration-300 ${
                activeTab === 'account'
                  ? 'bg-gradient-to-r from-teal-500 to-emerald-500 hover:shadow-xl'
                  : 'hover:bg-teal-50 hover:border-teal-300'
              }`}
            >
              <User className="w-4 h-4" />
              <span suppressHydrationWarning={true}>{t('profile.settingsPage.tabs.account')}</span>
            </Button>
            <Button
              variant={activeTab === 'notifications' ? 'default' : 'outline'}
              onClick={() => setActiveTab('notifications')}
              className={`gap-2 transition-all duration-300 ${
                activeTab === 'notifications'
                  ? 'bg-gradient-to-r from-blue-500 to-sky-500 hover:shadow-xl'
                  : 'hover:bg-blue-50 hover:border-blue-300'
              }`}
            >
              <Bell className="w-4 h-4" />
              <span suppressHydrationWarning={true}>{t('profile.settingsPage.tabs.notifications')}</span>
            </Button>
            <Button
              variant={activeTab === 'privacy' ? 'default' : 'outline'}
              onClick={() => setActiveTab('privacy')}
              className={`gap-2 transition-all duration-300 ${
                activeTab === 'privacy'
                  ? 'bg-gradient-to-r from-purple-500 to-violet-500 hover:shadow-xl'
                  : 'hover:bg-purple-50 hover:border-purple-300'
              }`}
            >
              <Eye className="w-4 h-4" />
              <span suppressHydrationWarning={true}>{t('profile.settingsPage.tabs.privacy')}</span>
            </Button>
            <Button
              variant={activeTab === 'security' ? 'default' : 'outline'}
              onClick={() => setActiveTab('security')}
              className={`gap-2 transition-all duration-300 ${
                activeTab === 'security'
                  ? 'bg-gradient-to-r from-rose-500 to-red-500 hover:shadow-xl'
                  : 'hover:bg-rose-50 hover:border-rose-300'
              }`}
            >
              <Shield className="w-4 h-4" />
              <span suppressHydrationWarning={true}>{t('profile.settingsPage.tabs.security')}</span>
            </Button>
            <Button
              variant={activeTab === 'preferences' ? 'default' : 'outline'}
              onClick={() => setActiveTab('preferences')}
              className={`gap-2 transition-all duration-300 ${
                activeTab === 'preferences'
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:shadow-xl'
                  : 'hover:bg-amber-50 hover:border-amber-300'
              }`}
            >
              <Globe className="w-4 h-4" />
              <span suppressHydrationWarning={true}>{t('profile.settingsPage.tabs.preferences')}</span>
            </Button>
          </div>

          {/* Save Message */}
          {saveMessage && (
            <div
              className={`mb-6 p-4 rounded-lg flex items-center gap-2 border-2 transition-all duration-300 hover:shadow-xl ${
                saveMessage.type === 'success'
                  ? 'bg-gradient-to-r from-emerald-50 to-teal-100 text-emerald-800 border-emerald-300'
                  : 'bg-gradient-to-r from-red-50 to-rose-100 text-red-800 border-red-300'
              }`}
            >
              {saveMessage.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-red-600" />
              )}
              <span className="font-medium">{saveMessage.message}</span>
            </div>
          )}

          {/* Account Settings */}
          {activeTab === 'account' && (
            <Card className="bg-gradient-to-br from-teal-50 to-emerald-100 border-2 border-teal-200 hover:shadow-xl transition-all duration-300">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-teal-800">
                  <User className="w-5 h-5 text-teal-600" />
                  <span suppressHydrationWarning={true}>{t('profile.settingsPage.accountSettings')}</span>
                </CardTitle>
                <CardDescription suppressHydrationWarning={true} className="text-teal-700">
                  {t('profile.settingsPage.accountSettingsDesc')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Avatar Upload Section */}
                <div className="flex items-center gap-6 p-6 border-2 border-dashed border-teal-300 rounded-xl bg-white/50 hover:bg-white/70 transition-all hover:shadow-lg">
                  <div className="relative">
                    <div className="w-24 h-24 rounded-full overflow-hidden bg-gradient-to-br from-teal-100 to-emerald-100 flex items-center justify-center border-4 border-white shadow-lg hover:shadow-xl transition-all duration-300">
                      {avatarPreview || user?.avatarUrl ? (
                        <img
                          src={getPhotoUrl(avatarPreview || user.avatarUrl)}
                          alt="Avatar"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="w-12 h-12 text-teal-500" />
                      )}
                    </div>
                    {isUploadingAvatar && (
                      <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center">
                        <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1">
                    <h3 className="font-semibold mb-1 text-teal-800">{t('profile.settingsPage.profileImage')}</h3>
                    <p className="text-sm text-teal-600 mb-3">
                      {t('profile.settingsPage.profileImageDesc')}
                    </p>
                    <div className="flex gap-2">
                      <input
                        type="file"
                        id="avatar-upload"
                        accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                        onChange={handleAvatarUpload}
                        disabled={isUploadingAvatar}
                        className="hidden"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={isUploadingAvatar}
                        onClick={handleOpenFilePicker}
                        className="gap-2 bg-gradient-to-r from-teal-500 to-emerald-500 text-white border-0 hover:shadow-xl transition-all duration-300"
                      >
                        <Camera className="w-4 h-4" />
                        {isUploadingAvatar ? t('profile.settingsPage.uploading') : t('profile.settingsPage.changeImage')}
                      </Button>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" suppressHydrationWarning={true} className="text-teal-700">{t('profile.settingsPage.fullName')}</Label>
                    <Input
                      id="name"
                      value={accountForm.name}
                      onChange={(e) => setAccountForm({ ...accountForm, name: e.target.value })}
                      className="bg-white/70 border-2 border-teal-200 focus:border-teal-500 focus:ring-teal-500 hover:shadow-lg transition-all duration-300"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="flex items-center gap-2 text-teal-700" suppressHydrationWarning={true}>
                      {t('profile.settingsPage.email')}
                      <Lock className="w-3 h-3 text-teal-500" />
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={accountForm.email}
                      disabled
                      readOnly
                      className="bg-teal-100/50 cursor-not-allowed opacity-70 border-2 border-teal-200"
                    />
                    <p className="text-xs text-teal-600 flex items-center gap-1">
                      <Lock className="w-3 h-3" />
                      {t('profile.settingsPage.emailLocked')}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="flex items-center gap-2 text-teal-700" suppressHydrationWarning={true}>
                      {t('profile.settingsPage.phone')}
                      <Lock className="w-3 h-3 text-teal-500" />
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        id="phone"
                        type="tel"
                        value={accountForm.phone}
                        disabled
                        readOnly
                        className="bg-teal-100/50 cursor-not-allowed opacity-70 border-2 border-teal-200"
                      />
                      <Button variant="outline" size="icon" disabled className="border-2 border-teal-200 bg-white/50">
                        <Smartphone className="w-4 h-4 text-teal-500" />
                      </Button>
                    </div>
                    <p className="text-xs text-teal-600 flex items-center gap-1">
                      <Lock className="w-3 h-3" />
                      {t('profile.settingsPage.phoneLocked')}
                    </p>
                  </div>

                  {/* حقل السنة الدراسية - يظهر فقط للطلاب */}
                  {user?.role === 'STUDENT' && (
                    <div className="space-y-2">
                      <Label htmlFor="academicYear" className="flex items-center gap-2 text-teal-700" suppressHydrationWarning={true}>
                        <GraduationCap className="w-4 h-4 text-teal-600" />
                        {t('profile.settingsPage.academicYear')}
                      </Label>
                      <Select
                        value={accountForm.academicYear}
                        onValueChange={(value) => setAccountForm({ ...accountForm, academicYear: value })}
                      >
                        <SelectTrigger id="academicYear" className="bg-white/70 border-2 border-teal-200 focus:border-teal-500 focus:ring-teal-500 hover:shadow-lg transition-all duration-300">
                          <SelectValue placeholder={t('profile.settingsPage.selectAcademicYear')} suppressHydrationWarning={true} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1" suppressHydrationWarning={true}>{t('profile.settingsPage.firstYear')}</SelectItem>
                          <SelectItem value="2" suppressHydrationWarning={true}>{t('profile.settingsPage.secondYear')}</SelectItem>
                          <SelectItem value="3" suppressHydrationWarning={true}>{t('profile.settingsPage.thirdYear')}</SelectItem>
                          <SelectItem value="4" suppressHydrationWarning={true}>{t('profile.settingsPage.fourthYear')}</SelectItem>
                          <SelectItem value="5" suppressHydrationWarning={true}>{t('profile.settingsPage.fifthYear')}</SelectItem>
                          <SelectItem value="6" suppressHydrationWarning={true}>{t('profile.settingsPage.sixthYear')}</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-teal-600">
                        {t('profile.settingsPage.updateAcademicYear')}
                      </p>
                    </div>
                  )}

                  {/* حقل الجامعة - يظهر فقط للطلاب */}
                  {user?.role === 'STUDENT' && (
                    <div className="space-y-2">
                      <Label htmlFor="universityName" className="flex items-center gap-2 text-teal-700" suppressHydrationWarning={true}>
                        <GraduationCap className="w-4 h-4 text-teal-600" />
                        {t('profile.settingsPage.university')}
                      </Label>
                      <Input
                        id="universityName"
                        value={accountForm.universityName}
                        onChange={(e) => setAccountForm({ ...accountForm, universityName: e.target.value })}
                        placeholder={t('profile.settingsPage.universityPlaceholder')}
                        suppressHydrationWarning={true}
                        className="bg-white/70 border-2 border-teal-200 focus:border-teal-500 focus:ring-teal-500 hover:shadow-lg transition-all duration-300"
                      />
                      <p className="text-xs text-teal-600">
                        {t('profile.settingsPage.updateUniversity')}
                      </p>
                    </div>
                  )}

                  {/* حقل الكلية - يظهر فقط للطلاب */}
                  {user?.role === 'STUDENT' && (
                    <div className="space-y-2">
                      <Label htmlFor="collegeName" className="flex items-center gap-2 text-teal-700" suppressHydrationWarning={true}>
                        <GraduationCap className="w-4 h-4 text-teal-600" />
                        {t('profile.settingsPage.college')}
                      </Label>
                      <Input
                        id="collegeName"
                        value={accountForm.collegeName}
                        onChange={(e) => setAccountForm({ ...accountForm, collegeName: e.target.value })}
                        placeholder={t('profile.settingsPage.collegePlaceholder')}
                        suppressHydrationWarning={true}
                        className="bg-white/70 border-2 border-teal-200 focus:border-teal-500 focus:ring-teal-500 hover:shadow-lg transition-all duration-300"
                      />
                      <p className="text-xs text-teal-600">
                        {t('profile.settingsPage.enterCollege')}
                      </p>
                    </div>
                  )}

                  {/* حقل عنوان الكلية - يظهر فقط للطلاب */}
                  {user?.role === 'STUDENT' && (
                    <div className="space-y-2">
                      <Label htmlFor="collegeAddress" className="flex items-center gap-2 text-teal-700" suppressHydrationWarning={true}>
                        <MapPin className="w-4 h-4 text-teal-600" />
                        {t('profile.settingsPage.collegeAddress')}
                      </Label>
                      <Input
                        id="collegeAddress"
                        value={accountForm.collegeAddress}
                        onChange={(e) => setAccountForm({ ...accountForm, collegeAddress: e.target.value })}
                        placeholder={t('profile.settingsPage.collegeAddressPlaceholder')}
                        suppressHydrationWarning={true}
                        className="bg-white/70 border-2 border-teal-200 focus:border-teal-500 focus:ring-teal-500 hover:shadow-lg transition-all duration-300"
                      />
                      <p className="text-xs text-teal-600">
                        {t('profile.settingsPage.enterCollegeAddress')}
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex justify-end">
                  <Button onClick={() => handleSave('account')} disabled={isLoading} className="gap-2 bg-gradient-to-r from-teal-500 to-emerald-500 hover:shadow-xl transition-all duration-300">
                    <Save className="w-4 h-4" />
                    {isLoading ? t('profile.settingsPage.updating') : t('profile.settingsPage.updateData')}
                  </Button>
                </div>

                {/* قسم طلب تغيير البريد أو الهاتف */}
                <Separator />

                <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg border-2 border-amber-300 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                  <div className="flex items-start gap-3">
                    <div className="bg-amber-200 rounded-full p-2">
                      <Lock className="w-4 h-4 text-amber-700" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-amber-800 mb-1 flex items-center gap-2">
                        {t('profile.settingsPage.wantToChangeEmailPhone')}
                      </h4>
                      <p className="text-sm text-amber-700 mb-3">
                        {t('profile.settingsPage.cannotModifyDirectly')}
                      </p>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="bg-white border-2 border-amber-300 hover:bg-amber-50 hover:shadow-lg transition-all duration-300">
                          <Mail className={`w-4 h-4 ${isRTL ? 'ml-2' : 'mr-2'} text-amber-600`} />
                          {t('profile.settingsPage.requestEmailChange')}
                        </Button>
                        <Button variant="outline" size="sm" className="bg-white border-2 border-amber-300 hover:bg-amber-50 hover:shadow-lg transition-all duration-300">
                          <Phone className={`w-4 h-4 ${isRTL ? 'ml-2' : 'mr-2'} text-amber-600`} />
                          {t('profile.settingsPage.requestPhoneChange')}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Notification Settings */}
          {activeTab === 'notifications' && (
            <Card className="bg-gradient-to-br from-blue-50 to-sky-100 border-2 border-blue-200 hover:shadow-xl transition-all duration-300">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-800">
                  <Bell className="w-5 h-5 text-blue-600" />
                  <span suppressHydrationWarning={true}>{t('profile.settingsPage.notificationSettings')}</span>
                </CardTitle>
                <CardDescription suppressHydrationWarning={true} className="text-blue-700">
                  {t('profile.settingsPage.howToReceive')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="font-semibold text-blue-800" suppressHydrationWarning={true}>{t('profile.settingsPage.generalNotifications')}</h3>

                  <div className="flex items-center justify-between p-4 border-2 border-blue-200 rounded-lg bg-white/50 hover:bg-white/70 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-200 to-sky-300 rounded-lg flex items-center justify-center shadow-md">
                        <Mail className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-blue-800">{t('profile.settingsPage.emailNotificationsLabel')}</p>
                        <p className="text-sm text-blue-600">{t('profile.settingsPage.emailNotificationsDesc')}</p>
                      </div>
                    </div>
                    <Switch
                      checked={notificationSettings.emailNotifications}
                      onCheckedChange={(checked) =>
                        setNotificationSettings({ ...notificationSettings, emailNotifications: checked })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 border-2 border-sky-200 rounded-lg bg-white/50 hover:bg-white/70 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-sky-200 to-blue-300 rounded-lg flex items-center justify-center shadow-md">
                        <MessageSquare className="w-5 h-5 text-sky-600" />
                      </div>
                      <div>
                        <p className="font-medium text-sky-800">{t('profile.settingsPage.smsNotificationsLabel')}</p>
                        <p className="text-sm text-sky-600">{t('profile.settingsPage.smsNotificationsDesc')}</p>
                      </div>
                    </div>
                    <Switch
                      checked={notificationSettings.smsNotifications}
                      onCheckedChange={(checked) =>
                        setNotificationSettings({ ...notificationSettings, smsNotifications: checked })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 border-2 border-blue-300 rounded-lg bg-white/50 hover:bg-white/70 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-300 to-sky-400 rounded-lg flex items-center justify-center shadow-md">
                        <Bell className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-blue-800">{t('profile.settingsPage.appNotifications')}</p>
                        <p className="text-sm text-blue-600">{t('profile.settingsPage.appNotificationsDesc')}</p>
                      </div>
                    </div>
                    <Switch
                      checked={notificationSettings.pushNotifications}
                      onCheckedChange={(checked) =>
                        setNotificationSettings({ ...notificationSettings, pushNotifications: checked })
                      }
                    />
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="font-semibold text-blue-800" suppressHydrationWarning={true}>{t('profile.settingsPage.notificationTypes')}</h3>

                  <div className="flex items-center justify-between p-4 border-2 border-blue-200 rounded-lg bg-white/50 hover:bg-white/70 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-200 to-sky-300 rounded-lg flex items-center justify-center shadow-md">
                        <Clock className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-blue-800">{t('profile.settingsPage.appointmentRemindersLabel')}</p>
                        <p className="text-sm text-blue-600">{t('profile.settingsPage.appointmentRemindersLabelDesc')}</p>
                      </div>
                    </div>
                    <Switch
                      checked={notificationSettings.appointmentReminders}
                      onCheckedChange={(checked) =>
                        setNotificationSettings({ ...notificationSettings, appointmentReminders: checked })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 border-2 border-sky-200 rounded-lg bg-white/50 hover:bg-white/70 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-sky-200 to-blue-300 rounded-lg flex items-center justify-center shadow-md">
                        <User className="w-5 h-5 text-sky-600" />
                      </div>
                      <div>
                        <p className="font-medium text-sky-800">{t('profile.settingsPage.newApplications')}</p>
                        <p className="text-sm text-sky-600">{t('profile.settingsPage.newApplicationsDesc')}</p>
                      </div>
                    </div>
                    <Switch
                      checked={notificationSettings.newApplications}
                      onCheckedChange={(checked) =>
                        setNotificationSettings({ ...notificationSettings, newApplications: checked })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 border-2 border-blue-200 rounded-lg bg-white/50 hover:bg-white/70 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-200 to-sky-300 rounded-lg flex items-center justify-center shadow-md">
                        <CheckCircle2 className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-blue-800">{t('profile.settingsPage.statusUpdates')}</p>
                        <p className="text-sm text-blue-600">{t('profile.settingsPage.statusUpdatesDesc')}</p>
                      </div>
                    </div>
                    <Switch
                      checked={notificationSettings.statusUpdates}
                      onCheckedChange={(checked) =>
                        setNotificationSettings({ ...notificationSettings, statusUpdates: checked })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 border-2 border-sky-200 rounded-lg bg-white/50 hover:bg-white/70 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-sky-200 to-blue-300 rounded-lg flex items-center justify-center shadow-md">
                        <Mail className="w-5 h-5 text-sky-600" />
                      </div>
                      <div>
                        <p className="font-medium text-sky-800">{t('profile.settingsPage.marketingEmails')}</p>
                        <p className="text-sm text-sky-600">{t('profile.settingsPage.marketingEmailsDesc')}</p>
                      </div>
                    </div>
                    <Switch
                      checked={notificationSettings.marketingEmails}
                      onCheckedChange={(checked) =>
                        setNotificationSettings({ ...notificationSettings, marketingEmails: checked })
                      }
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button onClick={() => handleSave('notifications')} disabled={isLoading} className="gap-2 bg-gradient-to-r from-blue-500 to-sky-500 hover:shadow-xl transition-all duration-300">
                    <Save className="w-4 h-4" />
                    {isLoading ? t('common.loading') : t('common.save')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Privacy Settings */}
          {activeTab === 'privacy' && (
            <Card className="bg-gradient-to-br from-purple-50 to-violet-100 border-2 border-purple-200 hover:shadow-xl transition-all duration-300">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-purple-800">
                  <Eye className="w-5 h-5 text-purple-600" />
                  <span suppressHydrationWarning={true}>{t('profile.settingsPage.privacySettingsTab')}</span>
                </CardTitle>
                <CardDescription suppressHydrationWarning={true} className="text-purple-700">
                  {t('profile.settingsPage.privacySettingsDesc')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border-2 border-purple-200 rounded-lg bg-white/50 hover:bg-white/70 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-200 to-violet-300 rounded-lg flex items-center justify-center shadow-md">
                        <Eye className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="font-medium text-purple-800">{t('profile.settingsPage.showProfile')}</p>
                        <p className="text-sm text-purple-600">{t('profile.settingsPage.showProfileDesc')}</p>
                      </div>
                    </div>
                    <Switch
                      checked={privacySettings.showProfile}
                      onCheckedChange={(checked) => setPrivacySettings({ ...privacySettings, showProfile: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 border-2 border-violet-200 rounded-lg bg-white/50 hover:bg-white/70 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-violet-200 to-purple-300 rounded-lg flex items-center justify-center shadow-md">
                        <Mail className="w-5 h-5 text-violet-600" />
                      </div>
                      <div>
                        <p className="font-medium text-violet-800">{t('profile.settingsPage.showEmail')}</p>
                        <p className="text-sm text-violet-600">{t('profile.settingsPage.showEmailDesc')}</p>
                      </div>
                    </div>
                    <Switch
                      checked={privacySettings.showEmail}
                      onCheckedChange={(checked) => setPrivacySettings({ ...privacySettings, showEmail: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 border-2 border-purple-200 rounded-lg bg-white/50 hover:bg-white/70 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-200 to-violet-300 rounded-lg flex items-center justify-center shadow-md">
                        <Phone className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="font-medium text-purple-800">{t('profile.settingsPage.showPhone')}</p>
                        <p className="text-sm text-purple-600">{t('profile.settingsPage.showPhoneDesc')}</p>
                      </div>
                    </div>
                    <Switch
                      checked={privacySettings.showPhone}
                      onCheckedChange={(checked) => setPrivacySettings({ ...privacySettings, showPhone: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 border-2 border-violet-200 rounded-lg bg-white/50 hover:bg-white/70 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-violet-200 to-purple-300 rounded-lg flex items-center justify-center shadow-md">
                        <MapPin className="w-5 h-5 text-violet-600" />
                      </div>
                      <div>
                        <p className="font-medium text-violet-800" suppressHydrationWarning={true}>{t('profile.settingsPage.showLocation')}</p>
                        <p className="text-sm text-violet-600" suppressHydrationWarning={true}>{t('profile.settingsPage.showLocationDesc')}</p>
                      </div>
                    </div>
                    <Switch
                      checked={privacySettings.showLocation}
                      onCheckedChange={(checked) => setPrivacySettings({ ...privacySettings, showLocation: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 border-2 border-purple-200 rounded-lg bg-white/50 hover:bg-white/70 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-200 to-violet-300 rounded-lg flex items-center justify-center shadow-md">
                        <MessageSquare className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="font-medium text-purple-800" suppressHydrationWarning={true}>{t('profile.settingsPage.allowMessages')}</p>
                        <p className="text-sm text-purple-600" suppressHydrationWarning={true}>{t('profile.settingsPage.allowMessagesDesc')}</p>
                      </div>
                    </div>
                    <Switch
                      checked={privacySettings.allowMessages}
                      onCheckedChange={(checked) => setPrivacySettings({ ...privacySettings, allowMessages: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 border-2 border-violet-200 rounded-lg bg-white/50 hover:bg-white/70 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-violet-200 to-purple-300 rounded-lg flex items-center justify-center shadow-md">
                        <CheckCircle2 className="w-5 h-5 text-violet-600" />
                      </div>
                      <div>
                        <p className="font-medium text-violet-800" suppressHydrationWarning={true}>{t('profile.settingsPage.showStats')}</p>
                        <p className="text-sm text-violet-600" suppressHydrationWarning={true}>{t('profile.settingsPage.showStatsDesc')}</p>
                      </div>
                    </div>
                    <Switch
                      checked={privacySettings.showStats}
                      onCheckedChange={(checked) => setPrivacySettings({ ...privacySettings, showStats: checked })}
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button onClick={() => handleSave('privacy')} disabled={isLoading} className="gap-2 bg-gradient-to-r from-purple-500 to-violet-500 hover:shadow-xl transition-all duration-300">
                    <Save className="w-4 h-4" />
                    {isLoading ? t('common.loading') : t('common.save')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Security Settings */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <Card className="bg-gradient-to-br from-rose-50 to-red-100 border-2 border-rose-200 hover:shadow-xl transition-all duration-300">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-rose-800">
                    <Key className="w-5 h-5 text-rose-600" />
                    <span suppressHydrationWarning={true}>{t('profile.settingsPage.securityTab')}</span>
                  </CardTitle>
                  <CardDescription suppressHydrationWarning={true} className="text-rose-700">
                    {t('profile.settingsPage.securityDesc')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword" suppressHydrationWarning={true} className="text-rose-700">
                      {t('profile.settingsPage.currentPassword')}
                    </Label>
                    <div className="relative">
                      <Input
                        id="currentPassword"
                        type={showCurrentPassword ? 'text' : 'password'}
                        value={passwordForm.currentPassword}
                        onChange={(e) =>
                          setPasswordForm({ ...passwordForm, currentPassword: e.target.value })
                        }
                        className="bg-white/70 border-2 border-rose-200 focus:border-rose-500 focus:ring-rose-500 hover:shadow-lg transition-all duration-300"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute left-0 top-0 text-rose-600 hover:text-rose-800 hover:bg-rose-100"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      >
                        {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="newPassword" suppressHydrationWarning={true} className="text-rose-700">
                      {t('profile.settingsPage.newPassword')}
                    </Label>
                    <div className="relative">
                      <Input
                        id="newPassword"
                        type={showNewPassword ? 'text' : 'password'}
                        value={passwordForm.newPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                        className="bg-white/70 border-2 border-rose-200 focus:border-rose-500 focus:ring-rose-500 hover:shadow-lg transition-all duration-300"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute left-0 top-0 text-rose-600 hover:text-rose-800 hover:bg-rose-100"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                      >
                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" suppressHydrationWarning={true} className="text-rose-700">
                      {t('profile.settingsPage.confirmPassword')}
                    </Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={passwordForm.confirmPassword}
                        onChange={(e) =>
                          setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })
                        }
                        className="bg-white/70 border-2 border-rose-200 focus:border-rose-500 focus:ring-rose-500 hover:shadow-lg transition-all duration-300"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute left-0 top-0 text-rose-600 hover:text-rose-800 hover:bg-rose-100"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button
                      onClick={handlePasswordChange}
                      disabled={isLoading}
                      variant="default"
                      className="gap-2 bg-gradient-to-r from-rose-500 to-red-500 hover:shadow-xl transition-all duration-300"
                    >
                      <Lock className="w-4 h-4" />
                      {isLoading ? t('profile.settingsPage.updating') : t('profile.settingsPage.securityTab')}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-red-50 to-rose-100 border-2 border-red-200 hover:shadow-xl transition-all duration-300">
                <CardHeader>
                  <CardTitle suppressHydrationWarning={true} className="text-red-800">{t('profile.settingsPage.accountInfo')}</CardTitle>
                  <CardDescription suppressHydrationWarning={true} className="text-red-700">{t('profile.settingsPage.accountInfoDesc')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-4 border-2 border-red-200 rounded-lg bg-white/50 hover:bg-white/70 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-red-200 to-rose-300 rounded-lg flex items-center justify-center shadow-md">
                        <Download className="w-5 h-5 text-red-600" />
                      </div>
                      <div>
                        <p className="font-medium text-red-800" suppressHydrationWarning={true}>{t('profile.settingsPage.exportData')}</p>
                        <p className="text-sm text-red-600" suppressHydrationWarning={true}>{t('profile.settingsPage.exportDataDesc')}</p>
                      </div>
                    </div>
                    <Button variant="outline" onClick={handleExportData} className="border-2 border-red-300 hover:bg-red-50 hover:shadow-lg hover:shadow-xl transition-all duration-300">
                      <Download className={`w-4 h-4 ${isRTL ? 'ml-2' : 'mr-2'} text-red-600`} />
                      {t('profile.settingsPage.export')}
                    </Button>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h3 className="font-semibold text-red-800 flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5" />
                      <span suppressHydrationWarning={true}>{t('profile.settingsPage.dangerZoneTab')}</span>
                    </h3>
                    <p className="text-sm text-red-700" suppressHydrationWarning={true}>
                      {t('profile.settingsPage.deleteAccountWarning')}
                    </p>
                    <Button variant="destructive" onClick={handleDeleteAccount} className="gap-2 bg-gradient-to-r from-red-600 to-rose-600 hover:shadow-xl hover:shadow-2xl transition-all duration-300">
                      <Trash2 className="w-4 h-4" />
                      <span suppressHydrationWarning={true}>{t('profile.settingsPage.deleteAccount')}</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Preferences */}
          {activeTab === 'preferences' && (
            <Card className="bg-gradient-to-br from-amber-50 to-orange-100 border-2 border-amber-200 hover:shadow-xl transition-all duration-300">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-amber-800">
                  <Globe className="w-5 h-5 text-amber-600" />
                  <span suppressHydrationWarning={true}>{t('profile.settingsPage.preferencesTab')}</span>
                </CardTitle>
                <CardDescription suppressHydrationWarning={true} className="text-amber-700">{t('profile.settingsPage.preferencesDesc')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="language" suppressHydrationWarning={true} className="text-amber-700">
                      {t('profile.settingsPage.language')}
                    </Label>
                    <Select value={preferences.language} onValueChange={(value) => setPreferences({ ...preferences, language: value })}>
                      <SelectTrigger id="language" className="bg-white/70 border-2 border-amber-200 focus:border-amber-500 focus:ring-amber-500 hover:shadow-lg transition-all duration-300">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ar" suppressHydrationWarning={true}>{t('profile.settingsPage.languages.ar')}</SelectItem>
                        <SelectItem value="en" suppressHydrationWarning={true}>{t('profile.settingsPage.languages.en')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="timezone" suppressHydrationWarning={true} className="text-amber-700">{t('profile.settingsPage.timezone')}</Label>
                    <Select
                      value={preferences.timezone}
                      onValueChange={(value) => setPreferences({ ...preferences, timezone: value })}
                    >
                      <SelectTrigger id="timezone" className="bg-white/70 border-2 border-amber-200 focus:border-amber-500 focus:ring-amber-500 hover:shadow-lg transition-all duration-300">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Africa/Cairo" suppressHydrationWarning={true}>Cairo (GMT+2)</SelectItem>
                        <SelectItem value="Asia/Riyadh" suppressHydrationWarning={true}>Riyadh (GMT+3)</SelectItem>
                        <SelectItem value="Europe/London" suppressHydrationWarning={true}>London (GMT+0)</SelectItem>
                        <SelectItem value="America/New_York" suppressHydrationWarning={true}>New York (GMT-5)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-amber-800" suppressHydrationWarning={true}>{t('profile.settingsPage.accountInfo')}</h3>
                  <div className="grid md:grid-cols-2 gap-4 p-4 bg-white/50 border-2 border-amber-200 rounded-lg hover:bg-white/70 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                    <div>
                      <p className="text-sm text-amber-600" suppressHydrationWarning={true}>{t('profile.settingsPage.accountId')}</p>
                      <p className="font-medium text-amber-800">{user?.id}</p>
                    </div>
                    <div>
                      <p className="text-sm text-amber-600" suppressHydrationWarning={true}>{t('profile.settingsPage.createdAt')}</p>
                      <p className="font-medium text-amber-800" suppressHydrationWarning={true}>
                        {new Date(user?.createdAt || Date.now()).toLocaleDateString(localeDate)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-amber-600" suppressHydrationWarning={true}>{t('common.status')}</p>
                      <Badge variant="secondary" className="bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-800 border-2 border-emerald-300">
                        {user?.status === 'ACTIVE' ? t('profile.settingsPage.active') : t('common.inactive')}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm text-amber-600" suppressHydrationWarning={true}>{t('profile.settingsPage.accountType')}</p>
                      <Badge variant="secondary" suppressHydrationWarning={true} className="bg-gradient-to-r from-amber-100 to-orange-100 text-amber-800 border-2 border-amber-300">
                        {user?.role === 'STUDENT' ? t('profile.settingsPage.student') : t('profile.settingsPage.patient')}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button onClick={() => handleSave('preferences')} disabled={isLoading} className="gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:shadow-xl transition-all duration-300">
                    <Save className="w-4 h-4" />
                    {isLoading ? t('common.loading') : t('common.save')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
