import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface User {
  id: string
  email: string
  name: string
  role: 'PATIENT' | 'STUDENT' | 'ADMIN'
  status: string
  phone?: string | null
  avatarUrl?: string | null
  createdAt: string
  student?: {
    id: string
    verificationStatus: string
    isVerified: boolean
  } | null
  patient?: {
    id: string
  } | null
}

interface AuthState {
  user: User | null
  loading: boolean
  authenticated: boolean
  error: string | null
}

/**
 * Hook لإدارة الجلسة والمستخدم الحالي
 */
export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    authenticated: false,
    error: null
  })
  
  const router = useRouter()

  // Fetch current session
  const fetchSession = async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }))

      const response = await fetch('/api/auth/session', {
        credentials: 'include'
      })

      const data = await response.json()

      if (response.ok && data.authenticated) {
        setState({
          user: data.user,
          loading: false,
          authenticated: true,
          error: null
        })
      } else {
        setState({
          user: null,
          loading: false,
          authenticated: false,
          error: data.error || null
        })
      }
    } catch (error: any) {
      setState({
        user: null,
        loading: false,
        authenticated: false,
        error: error.message || 'فشل في جلب بيانات الجلسة'
      })
    }
  }

  // Logout
  const logout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      })

      // Clear localStorage
      localStorage.removeItem('currentUser')
      localStorage.removeItem('authToken')
      sessionStorage.removeItem('authToken')

      // Reset state
      setState({
        user: null,
        loading: false,
        authenticated: false,
        error: null
      })

      // Redirect to login
      router.push('/auth/login')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  // Refresh session
  const refresh = async () => {
    await fetchSession()
  }

  // Fetch session on mount
  useEffect(() => {
    let isMounted = true

    const fetchData = async () => {
      if (isMounted) {
        await fetchSession()
      }
    }

    fetchData()

    return () => {
      isMounted = false
    }
  }, [])

  return {
    ...state,
    logout,
    refresh,
    fetchSession
  }
}
