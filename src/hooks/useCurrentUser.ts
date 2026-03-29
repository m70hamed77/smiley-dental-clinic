'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'

export interface CurrentUser {
  id: string
  name: string
  email: string
  role: string
  phone?: string
  status?: string
  avatarUrl?: string
}

/**
 * Hook لقراءة بيانات المستخدم الحالي من API
 * يعتمد على cookies/session + localStorage + sessionStorage + document.cookie + URL query parameter
 */
export function useCurrentUser(): { user: CurrentUser | null; loading: boolean } {
  const [user, setUser] = useState<CurrentUser | null>(null)
  const [loading, setLoading] = useState(true)
  const searchParams = useSearchParams()

  useEffect(() => {
    // ✅ منع infinite loop: تشغيل مرة واحدة فقط عند mount
    // ✅ إضافة flag لمنع التنفيذ المتكرر
    let isMounted = true

    // ✅ قراءة بيانات المستخدم من API (يعتمد على cookies/session + userId)
    const fetchCurrentUser = async () => {
      if (!isMounted) return

      try {
        // ✅ محاولة استخدام userId من عدة مصادر
        let localUserId: string | null = null

        // Method 1: URL query parameter (أولوية قصوى لـ sandboxed environment)
        try {
          const urlUserId = searchParams.get('userId')
          if (urlUserId) {
            localUserId = urlUserId
            console.log('[useCurrentUser] ✅ Got userId from URL:', urlUserId)
          }
        } catch (urlError) {
          console.warn('[useCurrentUser] URL query parameter not accessible:', urlError.message)
        }

        // Method 2: localStorage
        if (!localUserId) {
          try {
            localUserId = localStorage.getItem('userId')
            if (localUserId) {
              console.log('[useCurrentUser] ✅ Got userId from localStorage:', localUserId)
            }
          } catch (localError) {
            console.warn('[useCurrentUser] localStorage not accessible (sandboxed environment):', localError.message)
          }
        }

        // Method 3: sessionStorage
        if (!localUserId) {
          try {
            localUserId = sessionStorage.getItem('userId')
            if (localUserId) {
              console.log('[useCurrentUser] ✅ Got userId from sessionStorage:', localUserId)
            }
          } catch (sessionError) {
            console.warn('[useCurrentUser] sessionStorage not accessible:', sessionError.message)
          }
        }

        // Method 4: document.cookie
        if (!localUserId) {
          try {
            const cookies = document.cookie.split(';')
            for (const cookie of cookies) {
              const [name, value] = cookie.trim().split('=')
              if (name === 'userId' && value) {
                localUserId = value
                console.log('[useCurrentUser] ✅ Got userId from cookie:', value)
                break
              }
            }
          } catch (cookieError) {
            console.warn('[useCurrentUser] document.cookie not accessible:', cookieError.message)
          }
        }

        if (!localUserId) {
          console.error('[useCurrentUser] ❌ No userId found from any source!')
        }

        // إعداد URL مع userId كـ query parameter
        let apiUrl = '/api/auth/me'
        if (localUserId) {
          // إضافة userId كـ query parameter
          const separator = apiUrl.includes('?') ? '&' : '?'
          apiUrl = `${apiUrl}${separator}userId=${encodeURIComponent(localUserId)}`

          console.log('[useCurrentUser] API URL:', apiUrl)

          // حفظ في storages للاستخدام لاحقاً
          try { sessionStorage.setItem('userId', localUserId) } catch (e) {}
          try { document.cookie = `userId=${localUserId}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=lax` } catch (e) {}
        }

        // إرسال الطلب مع userId في header و query parameter
        console.log('[useCurrentUser] Sending request with X-User-Id:', localUserId)
        const response = await fetch(apiUrl, {
          credentials: 'include',
          headers: {
            'X-User-Id': localUserId || '', // ✅ إرسال userId في الهيدر
          }
        })

        console.log('[useCurrentUser] Response status:', response.status)

        if (response.ok) {
          const data = await response.json()
          if (isMounted) {
            setUser(data.user)

            // ✅ حفظ في جميع storages
            if (data.user) {
              try { localStorage.setItem('currentUser', JSON.stringify(data.user)) } catch (e) {}
              try { sessionStorage.setItem('currentUser', JSON.stringify(data.user)) } catch (e) {}
            }
          }
        } else {
          if (isMounted) {
            setUser(null)
            try { localStorage.removeItem('currentUser'); localStorage.removeItem('userId') } catch (e) {}
            try { sessionStorage.removeItem('currentUser'); sessionStorage.removeItem('userId') } catch (e) {}
          }
        }
      } catch (error: any) {
        console.error('[useCurrentUser] ❌ Error:', error)

        if (isMounted) {
          // Fallback: محاولة قراءة من جميع storages
          let userData: string | null = null

          try {
            userData = localStorage.getItem('currentUser')
            if (!userData) userData = sessionStorage.getItem('currentUser')
            if (userData) {
              const parsedUser = JSON.parse(userData)
              setUser(parsedUser)
            }
          } catch (localError: any) {
            // إذا فشل الوصول لـ storage (sandboxed)، نستخدم null
            if (localError.name === 'SecurityError') {
              console.warn('[useCurrentUser] Storage blocked in sandboxed environment')
              setUser(null)
            } else {
              console.error('[useCurrentUser] Storage Error:', localError)
              setUser(null)
              try { localStorage.removeItem('currentUser'); localStorage.removeItem('userId') } catch (e) {}
              try { sessionStorage.removeItem('currentUser'); sessionStorage.removeItem('userId') } catch (e) {}
            }
          }
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    fetchCurrentUser()

    // Cleanup function
    return () => {
      isMounted = false
    }
     
  }, []) // ✅ تشغيل مرة واحدة فقط

  return { user, loading }
}
