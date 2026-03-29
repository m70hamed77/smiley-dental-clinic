'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Lock, Eye, EyeOff, CheckCircle } from 'lucide-react'
import { Navigation } from '@/components/navigation'
import { Footer } from '@/components/footer'
import { useCurrentUser } from '@/hooks/useCurrentUser'

export default function ChangePasswordPage() {
  const { user } = useCurrentUser()
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    // التحقق من تطابق كلمة السر الجديدة
    if (formData.newPassword !== formData.confirmPassword) {
      setError('كلمة السر الجديدة غير متطابقة')
      return
    }

    // التحقق من أن كلمة السر الجديدة مختلفة عن الحالية
    if (formData.currentPassword === formData.newPassword) {
      setError('كلمة السر الجديدة يجب أن تكون مختلفة عن الحالية')
      return
    }

    // التحقق من طول كلمة السر
    if (formData.newPassword.length < 6) {
      setError('كلمة السر يجب أن تكون 6 أحرف على الأقل')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/user/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword,
          confirmPassword: formData.confirmPassword
        })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'حدث خطأ')
      }

      setSuccess('تم تغيير كلمة السر بنجاح')
      
      // نظف الحقول
      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      })

    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navigation />
        <main className="flex-1 flex items-center justify-center">
          <Card className="w-full max-w-md mx-4">
            <CardContent className="p-6 text-center">
              <Lock className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">يجب تسجيل الدخول</h2>
              <p className="text-muted-foreground mb-4">
                يرجى تسجيل الدخول للوصول إلى هذه الصفحة
              </p>
              <Button asChild className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700">
                <a href="/auth/login">تسجيل الدخول</a>
              </Button>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation user={{
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar
      }} />

      <main className="flex-1 py-8 px-4 bg-muted/30">
        <div className="container mx-auto max-w-lg">
          <Card className="border-2">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
                  <Lock className="w-6 h-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-2xl" suppressHydrationWarning={true}>
                    تغيير كلمة السر
                  </CardTitle>
                  <CardDescription suppressHydrationWarning={true}>
                    قم بتحديث كلمة السر الخاصة بك
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-6">
              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert className="mb-4 bg-green-50 text-green-700 border-green-200">
                  <CheckCircle className="w-4 h-4 ml-2" />
                  {success}
                </Alert>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* كلمة السر الحالية */}
                <div>
                  <label className="block mb-2 text-sm font-medium" suppressHydrationWarning={true}>
                    كلمة السر الحالية
                  </label>
                  <div className="relative">
                    <Input
                      type={showPasswords.current ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={formData.currentPassword}
                      onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPasswords.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* كلمة السر الجديدة */}
                <div>
                  <label className="block mb-2 text-sm font-medium" suppressHydrationWarning={true}>
                    كلمة السر الجديدة
                  </label>
                  <div className="relative">
                    <Input
                      type={showPasswords.new ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={formData.newPassword}
                      onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPasswords.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    • 6 أحرف على الأقل
                  </p>
                </div>

                {/* تأكيد كلمة السر الجديدة */}
                <div>
                  <label className="block mb-2 text-sm font-medium" suppressHydrationWarning={true}>
                    تأكيد كلمة السر الجديدة
                  </label>
                  <div className="relative">
                    <Input
                      type={showPasswords.confirm ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPasswords.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
                  disabled={loading}
                >
                  {loading ? 'جاري التغيير...' : 'تغيير كلمة السر'}
                </Button>

                <div className="text-center text-sm text-muted-foreground">
                  <p>تأكد من استخدام كلمة مرور قوية تحتوي على:</p>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>6 أحرف على الأقل</li>
                    <li>مزيج من أحرف كبيرة وصغيرة</li>
                    <li>أرقام ورموز</li>
                  </ul>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  )
}
