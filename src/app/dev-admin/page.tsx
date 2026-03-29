'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Shield, LogIn } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function DevAdminPage() {
  const router = useRouter()
  const [userId, setUserId] = useState('')

  // التحقق من URL query parameter
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const urlUserId = params.get('userId')
    if (urlUserId) {
      // حفظ في localStorage إن أمكن
      try {
        sessionStorage.setItem('userId', urlUserId)
        localStorage.setItem('userId', urlUserId)
      } catch (e) {
        // Ignore sandbox errors
      }
      // إعادة توجيه مباشر للوحة الأدمن
      window.location.href = `/admin?userId=${encodeURIComponent(urlUserId)}`
    }
  }, [])

  const handleLogin = () => {
    if (!userId.trim()) {
      alert('يرجى إدخال userId')
      return
    }

    // حفظ في storages
    try {
      sessionStorage.setItem('userId', userId.trim())
      localStorage.setItem('userId', userId.trim())
    } catch (e) {
      // Ignore sandbox errors
    }

    // الانتقال للوحة الأدمن مع userId في URL
    window.location.href = `/admin?userId=${encodeURIComponent(userId.trim())}`
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <div className="flex items-center gap-3 mb-2">
            <Shield className="w-8 h-8 text-emerald-600" />
            <CardTitle>تسجيل دخول الأدمن (التطوير)</CardTitle>
          </div>
          <p className="text-sm text-muted-foreground">
            هذه الصفحة للتطوير فقط. استخدمها لتسجيل الدخول للوحة الأدمن في بيئة المعاينة.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1.5 block">
              User ID
            </label>
            <Input
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="أدخل userId هنا..."
            />
          </div>
          <Button
            onClick={handleLogin}
            className="w-full bg-emerald-600 hover:bg-emerald-700"
          >
            <LogIn className="w-4 h-4 ml-2" />
            دخول لوحة الأدمن
          </Button>
          <div className="text-xs text-muted-foreground space-y-1">
            <p>💡 للحصول على userId:</p>
            <ol className="list-decimal list-inside space-y-1 mr-4">
              <li>سجل الدخول في بيئة عادية</li>
              <li>افتح المتصفح DevTools</li>
              <li>اكتب <code className="bg-muted px-1 rounded">localStorage.getItem('userId')</code> في Console</li>
              <li>انسخ الـ ID وأدخله هنا</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
