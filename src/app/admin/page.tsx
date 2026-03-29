'use client'

import { useState, useEffect } from 'react'
import { Navigation } from '@/components/navigation'
import { Footer } from '@/components/footer'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { useTranslations } from '@/hooks/useTranslations'
import { useSearchParams } from 'next/navigation'
import {
  Users,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  Shield,
  UserCheck,
  FileText,
  ArrowRight,
  XCircle,
  Trash2,
  Ban,
  PauseCircle,
} from 'lucide-react'

interface DashboardStats {
  pendingVerifications: number
  totalUsers: number
  approvedDoctors: number      // ✅ عدد الدكاترة الفعالين
  rejectedDoctors: number      // ❌ عدد الدكاترة المرفوضين
  deletedUsers: number         // 🗑️ عدد الحسابات المحذوفة
  bannedUsers: number          // 🚫 عدد الحسابات المحظورة
  suspendedUsers: number       // ⏸️ عدد الحسابات الموقوفة
  activePatients: number
  pendingReports: number
  resolvedReports: number
  dismissedReports: number     // 📤 عدد البلاغات المتجاهلة
  rejectedReports: number      // ❌ عدد البلاغات المرفوضة
  totalReports: number          // ⚠️ إجمالي البلاغات
}

export default function AdminDashboardPage() {
  const { user } = useCurrentUser()
  const { t, locale, loading: i18nLoading } = useTranslations()
  const searchParams = useSearchParams()
  const userIdParam = searchParams.get('userId')
  const isRTL = locale === 'ar'

  const [stats, setStats] = useState<DashboardStats>({
    pendingVerifications: 0,
    totalUsers: 0,
    approvedDoctors: 0,
    rejectedDoctors: 0,
    deletedUsers: 0,
    bannedUsers: 0,
    suspendedUsers: 0,
    activePatients: 0,
    pendingReports: 0,
    resolvedReports: 0,
    dismissedReports: 0,
    rejectedReports: 0,
    totalReports: 0,
  })
  const [loading, setLoading] = useState(true)

  // Fetch dashboard stats
  const fetchStats = async () => {
    if (!user || user.role !== 'ADMIN') return

    try {
      setLoading(true)
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      }

      // ✅ إرسال userId في الهيدر
      if (user?.id) {
        headers['X-User-Id'] = user.id
      }

      const response = await fetch('/api/admin/dashboard-stats', {
        credentials: 'include',
        headers
      })

      if (response.ok) {
        const data = await response.json()
        setStats(data.stats || {})
      } else {
        console.error('[ADMIN DASHBOARD] Failed to fetch stats:', response.status)
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }

  // Ensure admin record exists
  const ensureAdminRecord = async () => {
    if (!user || user.role !== 'ADMIN') return

    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      }

      // ✅ إرسال userId في الهيدر
      if (user?.id) {
        headers['X-User-Id'] = user.id
      }

      const response = await fetch('/api/admin/ensure-admin', {
        method: 'POST',
        credentials: 'include',
        headers
      })

      if (response.ok) {
        const data = await response.json()
        // Admin record created/updated
      }
    } catch (error) {
      console.error('Error ensuring admin record:', error)
    }
  }

  // دالة مساعدة لإضافة userId إلى الروابط
  const withUserId = (path: string) => {
    let userId = user?.id

    // إذا لم يكن user.id متاحاً، حاول من localStorage
    if (!userId) {
      try {
        userId = localStorage.getItem('userId')
      } catch (e) {
        // ignore
      }
    }

    // إذا لم يكن متاحاً، حاول من sessionStorage
    if (!userId) {
      try {
        userId = sessionStorage.getItem('userId')
      } catch (e) {
        // ignore
      }
    }

    if (userId) {
      const separator = path.includes('?') ? '&' : '?'
      return `${path}${separator}userId=${encodeURIComponent(userId)}`
    }
    return path
  }

  useEffect(() => {
    // ✅ تحقق من وجود userId من أي مصدر
    let userId = user?.id

    if (!userId) {
      try {
        userId = localStorage.getItem('userId')
      } catch (e) {}
    }

    if (!userId) {
      try {
        userId = sessionStorage.getItem('userId')
      } catch (e) {}
    }

    // إذا لم يتم العثور على userId من أي مصدر، أعد التوجيه لصفحة تسجيل الدخول
    if (!userId && !loading) {
      console.warn('[ADMIN PAGE] No userId found, redirecting to login')
      window.location.href = `/sandbox-login?redirect=${encodeURIComponent('/admin')}`
      return
    }

    // ✅ لا نعيد التوجيه إذا كان userId موجوداً في URL - هذا كان يسبب infinite loop
    const currentUserId = searchParams.get('userId')
    if (userId && !currentUserId) {
      console.log('[ADMIN PAGE] Adding userId to URL')
      const currentUrl = new URL(window.location.href)
      currentUrl.searchParams.set('userId', userId)
      window.location.href = currentUrl.toString()
      return
    }

    // ✅ جلب الإحصائيات فقط إذا كان المستخدم هو أدمن
    if (user && user.role === 'ADMIN') {
      console.log('[ADMIN PAGE] Fetching stats...')
      ensureAdminRecord()
      fetchStats()
    }
     
  }, [user])

  // Check if user is not authenticated after loading
  if (!loading && !user) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navigation user={undefined} />
        <main className="flex-1 flex items-center justify-center bg-muted/30">
          <Card className="max-w-md mx-4">
            <CardContent className="py-12 text-center">
              <Shield className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2" suppressHydrationWarning={true}>يجب تسجيل الدخول</h3>
              <p className="text-muted-foreground mb-4" suppressHydrationWarning={true}>{t('auth.loginRequired')}</p>
              <Button
                onClick={() => {
                  window.location.href = `/sandbox-login?redirect=${encodeURIComponent('/admin')}`
                }}
                style={{background: 'linear-gradient(135deg, #00BFA6, #008C7A)', boxShadow: '0 4px 14px rgba(0,191,166,0.4)'}}
              >
                {t('auth.login')}
              </Button>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    )
  }

  // Check if user is admin
  if (user && user.role !== 'ADMIN') {
    return (
      <div className="min-h-screen flex flex-col">
        <Navigation user={user ? { id: user.id, name: user.name || 'مستخدم', email: user.email || '', role: user.role as 'PATIENT' | 'STUDENT' | 'ADMIN' } : undefined} />
        <main className="flex-1 flex items-center justify-center bg-muted/30">
          <Card className="max-w-md mx-4">
            <CardContent className="py-12 text-center">
              <Shield className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2" suppressHydrationWarning={true}>{t('auth.unauthorized')}</h3>
              <p className="text-muted-foreground" suppressHydrationWarning={true}>{t('auth.adminOnly')}</p>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navigation user={user ? { id: user.id, name: user.name || 'مستخدم', email: user.email || '', role: user.role as 'PATIENT' | 'STUDENT' | 'ADMIN' } : undefined} />
        <main className="flex-1 flex items-center justify-center bg-muted/30">
          <div className="text-center">
            <div className="w-16 h-16 border-4 rounded-full animate-spin mx-auto mb-4" style={{borderTopColor: '#00BFA6', borderRightColor: 'transparent', borderBottomColor: '#008C7A', borderLeftColor: 'transparent'}} />
            <p className="text-muted-foreground" suppressHydrationWarning={true}>{t('common.loading')}</p>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation user={user ? { id: user.id, name: user.name || 'مستخدم', email: user.email || '', role: user.role as 'PATIENT' | 'STUDENT' | 'ADMIN' } : undefined} />

      <main className="flex-1" style={{background: 'linear-gradient(135deg, #F8F4FF 0%, #E8F8F5 100%)'}}>
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          {/* Hero Header Section */}
          <div className="relative mb-12 overflow-hidden rounded-2xl" style={{background: 'linear-gradient(145deg, #0D1B40 0%, #1a2a6c 50%, #2d1b69 100%)', padding: '3rem'}}>
            {/* Glow Blobs */}
            <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full" style={{background: 'radial-gradient(circle, rgba(0,191,166,0.3) 0%, transparent 70%)'}}></div>
            <div className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full" style={{background: 'radial-gradient(circle, rgba(108,63,197,0.3) 0%, transparent 70%)'}}></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full" style={{background: 'radial-gradient(circle, rgba(0,191,166,0.1) 0%, transparent 70%)'}}></div>
            
            <div className="relative z-10">
              <div className="flex items-center gap-4 mb-3">
                <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)'}}>
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-4xl font-bold text-white" suppressHydrationWarning={true}>{t('admin.title')}</h1>
              </div>
              <p className="text-lg text-white/90 max-w-2xl" suppressHydrationWarning={true}>
                {t('admin.subtitle')}
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <Button
              className="h-auto p-6 flex items-center justify-between text-white border-0"
              style={{background: 'linear-gradient(135deg, #00BFA6, #008C7A)', boxShadow: '0 4px 14px rgba(0,191,166,0.4)'}}
              onClick={() => {
                let userId = user?.id

                // إذا لم يكن user.id متاحاً، حاول من localStorage
                if (!userId) {
                  try {
                    userId = localStorage.getItem('userId')
                  } catch (e) {
                    // ignore
                  }
                }

                // إذا لم يكن متاحاً، حاول من sessionStorage
                if (!userId) {
                  try {
                    userId = sessionStorage.getItem('userId')
                  } catch (e) {
                    // ignore
                  }
                }

                if (userId) {
                  window.location.href = `/admin/users?userId=${encodeURIComponent(userId)}`
                } else {
                  alert('عذراً، لم نتمكن من العثور على معرف المستخدم')
                }
              }}
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <Users className="w-6 h-6" />
                </div>
                <div className="text-right">
                  <div className="font-bold text-lg" suppressHydrationWarning={true}>{t('admin.manageUsers')}</div>
                  <div className="text-sm opacity-90" suppressHydrationWarning={true}>{stats.pendingVerifications} {t('admin.waitingRequests')}</div>
                </div>
              </div>
              <ArrowRight className="w-5 h-5" />
            </Button>

            <Button
              variant="outline"
              className="h-auto p-6 flex items-center justify-between border-2 text-white hover:text-white hover:border-opacity-75"
              style={{background: 'linear-gradient(135deg, #6C3FC5, #2d1b69)', borderColor: '#6C3FC5', boxShadow: '0 4px 14px rgba(108,63,197,0.3)'}}
              onClick={() => {
                let userId = user?.id

                // إذا لم يكن user.id متاحاً، حاول من localStorage
                if (!userId) {
                  try {
                    userId = localStorage.getItem('userId')
                  } catch (e) {
                    // ignore
                  }
                }

                // إذا لم يكن متاحاً، حاول من sessionStorage
                if (!userId) {
                  try {
                    userId = sessionStorage.getItem('userId')
                  } catch (e) {
                    // ignore
                  }
                }

                if (userId) {
                  window.location.href = `/admin/reports?userId=${encodeURIComponent(userId)}`
                } else {
                  alert('عذراً، لم نتمكن من العثور على معرف المستخدم')
                }
              }}
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div className="text-right">
                  <div className="font-bold text-lg" suppressHydrationWarning={true}>{t('navbar.reports')}</div>
                  <div className="text-sm opacity-90" suppressHydrationWarning={true}>{stats.pendingReports} {t('admin.newReports')}</div>
                </div>
              </div>
              <ArrowRight className="w-5 h-5" />
            </Button>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {/* Total Doctors (Approved) */}
            <Card style={{background: 'linear-gradient(135deg, #E8F8F5 0%, #D1F2EB 100%)', border: '2px solid rgba(0,191,166,0.2)'}}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium" style={{color: '#008C7A'}} suppressHydrationWarning={true}>{t('admin.totalDoctors')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{background: 'linear-gradient(135deg, #00BFA6, #008C7A)'}}>
                      <CheckCircle className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <div className="text-3xl font-bold" style={{color: '#00BFA6'}}>{stats.approvedDoctors}</div>
                      <div className="text-xs" style={{color: '#008C7A'}} suppressHydrationWarning={true}>{t('admin.activeDoctor')}</div>
                    </div>
                  </div>
                  <TrendingUp className="w-5 h-5" style={{color: '#008C7A'}} />
                </div>
              </CardContent>
            </Card>

            {/* Pending Verifications */}
            <Card
              className="cursor-pointer hover:shadow-lg transition-all hover:scale-105"
              style={{background: 'linear-gradient(135deg, #FFF8E1 0%, #FFE082 100%)', border: '2px solid rgba(245, 158, 11, 0.3)'}}
              onClick={() => {
                let userId = user?.id

                // إذا لم يكن user.id متاحاً، حاول من localStorage
                if (!userId) {
                  try {
                    userId = localStorage.getItem('userId')
                  } catch (e) {
                    // ignore
                  }
                }

                // إذا لم يكن متاحاً، حاول من sessionStorage
                if (!userId) {
                  try {
                    userId = sessionStorage.getItem('userId')
                  } catch (e) {
                    // ignore
                  }
                }

                if (userId) {
                  window.location.href = `/admin/users?userId=${encodeURIComponent(userId)}`
                } else {
                  alert('عذراً، لم نتمكن من العثور على معرف المستخدم')
                }
              }}
            >
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium" style={{color: '#B8860B'}} suppressHydrationWarning={true}>{t('admin.pendingVerifications')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{background: 'linear-gradient(135deg, #f59e0b, #d97706)'}}>
                      <Clock className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <div className="text-3xl font-bold" style={{color: '#f59e0b'}}>{stats.pendingVerifications}</div>
                      <div className="text-xs" style={{color: '#B8860B'}} suppressHydrationWarning={true}>{t('admin.waitingApproval')}</div>
                    </div>
                  </div>
                  {stats.pendingVerifications > 0 && (
                    <Badge style={{background: 'linear-gradient(135deg, #f59e0b, #d97706)'}}>{t('admin.new')}</Badge>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Rejected Doctors */}
            <Card style={{background: 'linear-gradient(135deg, #FEE2E2 0%, #FECACA 100%)', border: '2px solid rgba(239, 68, 68, 0.3)'}}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium" style={{color: '#dc2626'}} suppressHydrationWarning={true}>{t('admin.rejectedAccounts')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{background: 'linear-gradient(135deg, #f87171, #ef4444)'}}>
                      <XCircle className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <div className="text-3xl font-bold" style={{color: '#ef4444'}}>{stats.rejectedDoctors}</div>
                      <div className="text-xs" style={{color: '#dc2626'}} suppressHydrationWarning={true}>{t('admin.rejected')}</div>
                    </div>
                  </div>
                  <XCircle className="w-5 h-5" style={{color: '#fca5a5'}} />
                </div>
              </CardContent>
            </Card>

            {/* Total Reports */}
            <Card style={{background: 'linear-gradient(135deg, #F3E8FF 0%, #E9D5FF 100%)', border: '2px solid rgba(108,63,197,0.2)'}}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium" style={{color: '#7C3AED'}} suppressHydrationWarning={true}>{t('admin.totalReports')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{background: 'linear-gradient(135deg, #6C3FC5, #2d1b69)'}}>
                      <AlertTriangle className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <div className="text-3xl font-bold" style={{color: '#6C3FC5'}}>{stats.totalReports}</div>
                      <div className="text-xs" style={{color: '#7C3AED'}} suppressHydrationWarning={true}>{t('admin.reportInSystem')}</div>
                    </div>
                  </div>
                  {stats.pendingReports > 0 && (
                    <Badge style={{background: 'linear-gradient(135deg, #6C3FC5, #2d1b69)'}}>{stats.pendingReports} {t('admin.new')}</Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Account Status Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {/* Deleted Users */}
            <Card style={{background: 'linear-gradient(135deg, #F1F5F9 0%, #E2E8F0 100%)', border: '2px solid rgba(100, 116, 139, 0.3)'}}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium" style={{color: '#64748b'}} suppressHydrationWarning={true}>{t('admin.deletedAccounts')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{background: 'linear-gradient(135deg, #94a3b8, #64748b)'}}>
                      <Trash2 className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <div className="text-3xl font-bold" style={{color: '#64748b'}}>{stats.deletedUsers}</div>
                      <div className="text-xs" style={{color: '#475569'}} suppressHydrationWarning={true}>{t('admin.deleted')}</div>
                    </div>
                  </div>
                  <Trash2 className="w-5 h-5" style={{color: '#94a3b8'}} />
                </div>
              </CardContent>
            </Card>

            {/* Banned Users */}
            <Card style={{background: 'linear-gradient(135deg, #E2E8F0 0%, #CBD5E1 100%)', border: '2px solid rgba(71, 85, 105, 0.3)'}}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium" style={{color: '#334155'}} suppressHydrationWarning={true}>{t('admin.bannedAccounts')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{background: 'linear-gradient(135deg, #475569, #334155)'}}>
                      <Ban className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <div className="text-3xl font-bold" style={{color: '#475569'}}>{stats.bannedUsers}</div>
                      <div className="text-xs" style={{color: '#334155'}} suppressHydrationWarning={true}>{t('admin.banned')}</div>
                    </div>
                  </div>
                  <Ban className="w-5 h-5" style={{color: '#64748b'}} />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* System Health */}
          <Card style={{background: 'linear-gradient(135deg, #F8F4FF 0%, #E8F8F5 100%)', border: '2px solid rgba(0,191,166,0.2)'}}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{background: 'linear-gradient(135deg, #00BFA6, #008C7A)'}}>
                  <Shield className="w-4 h-4 text-white" />
                </div>
                <span style={{color: '#0D1B40'}} suppressHydrationWarning={true}>{t('admin.systemHealth')}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-3 p-4 rounded-lg" style={{background: 'rgba(0,191,166,0.1)', border: '1px solid rgba(0,191,166,0.2)'}}>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{background: 'linear-gradient(135deg, #00BFA6, #008C7A)'}}>
                    <CheckCircle className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <div className="font-medium" style={{color: '#0D1B40'}} suppressHydrationWarning={true}>{t('admin.database')}</div>
                    <div className="text-sm" style={{color: '#008C7A'}} suppressHydrationWarning={true}>{t('admin.workingNormally')}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 rounded-lg" style={{background: 'rgba(108,63,197,0.1)', border: '1px solid rgba(108,63,197,0.2)'}}>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{background: 'linear-gradient(135deg, #6C3FC5, #2d1b69)'}}>
                    <CheckCircle className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <div className="font-medium" style={{color: '#0D1B40'}} suppressHydrationWarning={true}>{t('admin.server')}</div>
                    <div className="text-sm" style={{color: '#7C3AED'}} suppressHydrationWarning={true}>{t('admin.connectedStable')}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 rounded-lg" style={{background: 'rgba(0,191,166,0.1)', border: '1px solid rgba(0,191,166,0.2)'}}>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{background: 'linear-gradient(135deg, #00BFA6, #008C7A)'}}>
                    <CheckCircle className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <div className="font-medium" style={{color: '#0D1B40'}} suppressHydrationWarning={true}>{t('admin.authSystem')}</div>
                    <div className="text-sm" style={{color: '#008C7A'}} suppressHydrationWarning={true}>{t('admin.activeSecure')}</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  )
}
