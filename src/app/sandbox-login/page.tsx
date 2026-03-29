'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Shield, LogIn, User, Mail, Lock } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'

export default function SandboxLoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [isRedirecting, setIsRedirecting] = useState(false)

  // حفظ userId من URL وإعادة توجيه للصفحة المطلوبة
  useEffect(() => {
    // فقط قم بإعادة التوجيه إذا لم يتم ذلك من قبل
    const hasRedirected = sessionStorage.getItem('hasRedirected')

    if (hasRedirected) {
      return // تم التوجيه بالفعل
    }

    const urlUserId = searchParams.get('userId')
    const redirect = searchParams.get('redirect') || '/admin'

    // فقط إذا كان userId موجوداً
    if (urlUserId) {
      setIsRedirecting(true)
      
      // حفظ userId في storages
      try {
        sessionStorage.setItem('userId', urlUserId)
        localStorage.setItem('userId', urlUserId)
      } catch (e) {
        // Ignore sandbox errors
      }

      // إعادة توجيه للصفحة المطلوبة مع userId
      const separator = redirect.includes('?') ? '&' : '?'
      window.location.href = `${redirect}${separator}userId=${encodeURIComponent(urlUserId)}`
    }
  }, [searchParams])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (response.ok && data.success && data.user) {
        // حفظ userId في storages
        try {
          sessionStorage.setItem('userId', data.user.id)
          localStorage.setItem('userId', data.user.id)
        } catch (e) {
          // Ignore sandbox errors
        }

        // حفظ بيانات المستخدم
        try {
          sessionStorage.setItem('currentUser', JSON.stringify(data.user))
          localStorage.setItem('currentUser', JSON.stringify(data.user))
        } catch (e) {
          // Ignore sandbox errors
        }

        // التوجيه للصفحة المطلوبة
        const redirect = searchParams.get('redirect') || '/admin'
        const separator = redirect.includes('?') ? '&' : '?'
        window.location.href = `${redirect}${separator}userId=${encodeURIComponent(data.user.id)}`
      } else if (response.ok && !data.success) {
        // حالة خاصة: تم تسجيل الدخول لكن هناك مشكلة في الحساب
        setError(data.message || data.error || 'فشل تسجيل الدخول')
      } else {
        setError(data.error || 'فشل تسجيل الدخول')
      }
    } catch (err) {
      setError('حدث خطأ أثناء تسجيل الدخول')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
          </div>
          <CardTitle className="text-center text-2xl">تسجيل الدخول</CardTitle>
          <p className="text-sm text-muted-foreground text-center">
            صفحة تسجيل دخول خاصة ببيئة المعاينة
          </p>
        </CardHeader>
        <CardContent>
          {isRedirecting ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-sm text-muted-foreground">جاري التوجيه...</p>
            </div>
          ) : (
            <form onSubmit={handleLogin} className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div>
                <label className="text-sm font-medium mb-1.5 block flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  البريد الإلكتروني
                </label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="أدخل بريدك الإلكتروني"
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-1.5 block flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  كلمة المرور
                </label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="أدخل كلمة المرور"
                  required
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    جاري تسجيل الدخول...
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4 ml-2" />
                    تسجيل الدخول
                  </>
                )}
              </Button>

              <div className="text-xs text-muted-foreground text-center">
                💡 هذه الصفحة مصممة للعمل في بيئة المعاينة (sandboxed)
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
