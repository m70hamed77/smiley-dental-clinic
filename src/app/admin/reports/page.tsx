'use client'

import { useState, useEffect } from 'react'
import { Navigation } from '@/components/navigation'
import { Footer } from '@/components/footer'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { useTranslations } from '@/hooks/useTranslations'
import {
  AlertTriangle,
  CheckCircle,
  XCircle,
  Shield,
  User,
  Clock,
  Flag,
  RefreshCw,
  FileText,
  Filter,
  AlertOctagon,
  Ban,
  Pause,
  ShieldAlert,
} from 'lucide-react'

interface Report {
  id: string
  reporterId: string
  reporterName: string
  reporterEmail: string
  reportedId: string
  reportedName: string
  reportedEmail: string
  reportType: string
  description: string
  status: 'PENDING' | 'RESOLVED' | 'DISMISSED'
  adminDecision: 'DISMISS' | 'WARN' | 'SUSPEND' | 'TEMP_BAN' | 'PERM_BAN' | null
  adminNotes: string | null
  banDuration: number | null
  resolvedBy: string | null
  resolvedAt: Date | null
  createdAt: Date
  updatedAt: Date
}

export default function AdminReportsPage() {
  const { user } = useCurrentUser()
  const { t, locale, loading: i18nLoading } = useTranslations()
  const isRTL = locale === 'ar'

  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'PENDING' | 'RESOLVED' | 'DISMISSED'>('ALL')
  const [selectedReport, setSelectedReport] = useState<Report | null>(null)
  const [resolveDialog, setResolveDialog] = useState(false)
  const [resolutionText, setResolutionText] = useState('')
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // Advanced actions state
  const [actionDialog, setActionDialog] = useState(false)
  const [selectedAction, setSelectedAction] = useState<'WARN' | 'SUSPEND' | 'TEMP_BAN' | 'PERM_BAN' | null>(null)
  const [actionForm, setActionForm] = useState({
    reason: '',
    duration: 7 // default 7 days for temp ban
  })

  // Fetch reports
  const fetchReports = async () => {
    if (!user || user.role !== 'ADMIN') return

    try {
      setLoading(true)
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      }

      if (user?.id) {
        headers['X-User-Id'] = user.id
      }

      const response = await fetch('/api/admin/reports', {
        credentials: 'include',
        headers
      })

      if (response.ok) {
        const data = await response.json()
        setReports(data.reports || [])
      } else {
        const errorData = await response.json()
        console.error('[Admin Reports] Error:', errorData)
      }
    } catch (error) {
      console.error('Error fetching reports:', error)
      alert(t('reports.errorFetchingReports'))
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
        console.log('[Admin Reports] Admin record ensured:', data)
      }
    } catch (error) {
      console.error('Error ensuring admin record:', error)
    }
  }

  useEffect(() => {
    ensureAdminRecord()
    fetchReports()
  }, [user])

  // Filter reports
  const filteredReports = reports.filter(report => {
    if (filterStatus === 'ALL') return true
    return report.status === filterStatus
  })

  // Handle resolve
  const handleResolve = async () => {
    if (!selectedReport || !resolutionText.trim()) {
      alert(t('reports.mustWriteSolution'))
      return
    }

    try {
      setActionLoading(selectedReport.id)
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      }

      if (user?.id) {
        headers['X-User-Id'] = user.id
      }

      const response = await fetch(`/api/admin/reports/${selectedReport.id}/resolve`, {
        method: 'POST',
        credentials: 'include',
        headers,
        body: JSON.stringify({ resolution: resolutionText })
      })

      if (response.ok) {
        await fetchReports()
        setResolveDialog(false)
        setResolutionText('')
        setSelectedReport(null)
        alert(t('reports.resolvedSuccessfully'))
      } else {
        const data = await response.json()
        alert(data.error || t('reports.errorResolving'))
      }
    } catch (error) {
      console.error('Error resolving report:', error)
      alert(t('reports.errorResolving'))
    } finally {
      setActionLoading(null)
    }
  }

  // Handle dismiss
  const handleDismiss = async (reportId: string) => {
    if (!confirm(t('reports.confirmDismiss'))) return

    try {
      setActionLoading(reportId)
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      }

      if (user?.id) {
        headers['X-User-Id'] = user.id
      }

      const response = await fetch(`/api/admin/reports/${reportId}/dismiss`, {
        method: 'POST',
        credentials: 'include',
        headers
      })

      if (response.ok) {
        await fetchReports()
        alert(t('reports.dismissedSuccessfully'))
      } else {
        const data = await response.json()
        alert(data.error || t('reports.errorDismissing'))
      }
    } catch (error) {
      console.error('Error dismissing report:', error)
      alert(t('reports.errorDismissing'))
    } finally {
      setActionLoading(null)
    }
  }

  // Handle advanced action (warn, suspend, ban)
  const handleAction = async () => {
    if (!selectedReport || !selectedAction || !actionForm.reason.trim()) {
      alert(t('reports.mustWriteReason'))
      return
    }

    const actionLabel = getActionLabel(selectedAction)
    const confirmed = confirm(`${t('reports.confirmAction')}\n\n${actionLabel}: ${actionForm.reason}`)
    if (!confirmed) return

    try {
      setActionLoading(selectedReport.id)
      
      let endpoint = ''
      let body = {}
      
      switch (selectedAction) {
        case 'WARN':
          endpoint = `/api/admin/reports/${selectedReport.id}/warn`
          body = { warningMessage: actionForm.reason }
          break
        case 'SUSPEND':
          endpoint = `/api/admin/reports/${selectedReport.id}/suspend`
          body = { suspensionReason: actionForm.reason }
          break
        case 'TEMP_BAN':
        case 'PERM_BAN':
          endpoint = `/api/admin/reports/${selectedReport.id}/ban`
          body = {
            banType: selectedAction,
            banReason: actionForm.reason,
            banDurationDays: selectedAction === 'TEMP_BAN' ? actionForm.duration : null
          }
          break
      }
      
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      }

      if (user?.id) {
        headers['X-User-Id'] = user.id
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        credentials: 'include',
        headers,
        body: JSON.stringify(body)
      })

      const data = await response.json()

      if (response.ok && data.success) {
        await fetchReports()
        setActionDialog(false)
        setSelectedAction(null)
        setActionForm({ reason: '', duration: 7 })
        alert(data.message || t('reports.actionExecutedSuccessfully'))
      } else {
        console.error('[Admin Reports] Action failed:', data)
        alert(data.error || data.details || t('reports.errorExecutingAction'))
      }
    } catch (error) {
      console.error('Error executing action:', error)
      alert(t('reports.errorExecutingAction'))
    } finally {
      setActionLoading(null)
    }
  }

  const getActionLabel = (action: string) => {
    return t(`reports.actionLabels.${action}`) || action
  }

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="secondary" className="bg-amber-100 text-amber-700">{t('reports.pending')}</Badge>
      case 'RESOLVED':
        return <Badge className="bg-emerald-800 text-emerald-50">{t('reports.resolved')}</Badge>
      case 'DISMISSED':
        return <Badge variant="destructive">{t('reports.dismissed')}</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Clock className="w-5 h-5 text-amber-600" />
      case 'RESOLVED':
        return <CheckCircle className="w-5 h-5 text-emerald-800" />
      case 'DISMISSED':
        return <XCircle className="w-5 h-5 text-red-600" />
      default:
        return null
    }
  }

  // Get admin decision label
  const getAdminDecisionLabel = (decision: string | null) => {
    if (!decision) return ''
    return t(`reports.decisionLabels.${decision}`) || decision
  }

  // Format date based on locale
  const formatDate = (date: Date) => {
    const localeDate = locale === 'ar' ? 'ar-EG' : 'en-US'
    return new Date(date).toLocaleDateString(localeDate, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Check if user is not authenticated after loading
  if (!loading && !user) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navigation user={undefined} />
        <main className="flex-1 flex items-center justify-center bg-muted/30">
          <Card className="max-w-md mx-4">
            <CardContent className="py-12 text-center">
              <Shield className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2" suppressHydrationWarning={true}>{t('auth.mustLogin')}</h3>
              <p className="text-muted-foreground mb-4" suppressHydrationWarning={true}>{t('auth.loginRequired')}</p>
              <Button
                onClick={() => {
                  const currentPath = encodeURIComponent('/admin/reports')
                  window.location.href = `/sandbox-login?redirect=${currentPath}`
                }}
                style={{background: 'linear-gradient(135deg, #6C3FC5, #2d1b69)', boxShadow: '0 4px 14px rgba(108,63,197,0.4)'}}
                suppressHydrationWarning={true}
              >
                {t('auth.loginButton')}
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
            <div className="w-16 h-16 border-4 rounded-full animate-spin mx-auto mb-4" style={{borderTopColor: '#6C3FC5', borderRightColor: 'transparent', borderBottomColor: '#2d1b69', borderLeftColor: 'transparent'}} />
            <p className="text-muted-foreground" suppressHydrationWarning={true}>{t('reports.loading')}</p>
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
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{background: 'linear-gradient(135deg, #6C3FC5, #2d1b69)'}}>
                <Shield className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-3xl font-bold" style={{color: '#0D1B40'}} suppressHydrationWarning={true}>{t('reports.title')}</h1>
            </div>
            <p className="text-muted-foreground" suppressHydrationWarning={true}>
              {t('reports.subtitle')}
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card style={{background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(10px)', border: '1px solid rgba(245, 158, 11, 0.3)'}}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground" suppressHydrationWarning={true}>{t('reports.pending')}</p>
                    <p className="text-2xl font-bold" style={{color: '#f59e0b'}}>
                      {reports.filter(r => r.status === 'PENDING').length}
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{background: 'rgba(245, 158, 11, 0.15)'}}>
                    <Clock className="w-5 h-5" style={{color: '#f59e0b'}} />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card style={{background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(10px)', border: '1px solid rgba(0,191,166,0.3)'}}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground" suppressHydrationWarning={true}>{t('reports.resolved')}</p>
                    <p className="text-2xl font-bold" style={{color: '#00BFA6'}}>
                      {reports.filter(r => r.status === 'RESOLVED').length}
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{background: 'rgba(0,191,166,0.15)'}}>
                    <CheckCircle className="w-5 h-5" style={{color: '#00BFA6'}} />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card style={{background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(10px)', border: '1px solid rgba(239, 68, 68, 0.3)'}}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground" suppressHydrationWarning={true}>{t('reports.dismissed')}</p>
                    <p className="text-2xl font-bold" style={{color: '#ef4444'}}>
                      {reports.filter(r => r.status === 'DISMISSED').length}
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{background: 'rgba(239, 68, 68, 0.15)'}}>
                    <XCircle className="w-5 h-5" style={{color: '#ef4444'}} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card className="mb-6" style={{background: 'linear-gradient(135deg, #F3E8FF 0%, #E9D5FF 100%)', backdropFilter: 'blur(10px)', border: '2px solid rgba(108,63,197,0.2)'}}>
            <CardContent className="p-4">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground" suppressHydrationWarning={true}>{t('reports.filter')}</span>
                </div>
                <Select value={filterStatus} onValueChange={(value: any) => setFilterStatus(value)}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder={t('reports.status')} suppressHydrationWarning={true} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL" suppressHydrationWarning={true}>{t('reports.all')}</SelectItem>
                    <SelectItem value="PENDING" suppressHydrationWarning={true}>{t('reports.pending')}</SelectItem>
                    <SelectItem value="RESOLVED" suppressHydrationWarning={true}>{t('reports.resolved')}</SelectItem>
                    <SelectItem value="DISMISSED" suppressHydrationWarning={true}>{t('reports.dismissed')}</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={fetchReports}
                >
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Reports List */}
          {filteredReports.length === 0 ? (
            <Card style={{background: 'linear-gradient(135deg, #F3E8FF 0%, #FEE2E2 100%)', border: '2px solid rgba(108,63,197,0.2)'}}>
              <CardContent className="py-16 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{background: 'linear-gradient(135deg, #F3E8FF, #E9D5FF)'}}>
                  <Flag className="w-8 h-8" style={{color: '#6C3FC5'}} />
                </div>
                <h3 className="text-xl font-semibold mb-2" style={{color: '#0D1B40'}} suppressHydrationWarning={true}>{t('reports.noReports')}</h3>
                <p className="text-muted-foreground" suppressHydrationWarning={true}>{t('reports.noReportsDesc')}</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredReports.map((report) => (
                <Card 
                  key={report.id}
                  style={{
                    background: report.status === 'PENDING'
                      ? 'linear-gradient(135deg, #FFF8E1 0%, #FFEDD5 100%)'
                      : report.status === 'RESOLVED'
                      ? 'linear-gradient(135deg, #E8F8F5 0%, #D1F2EB 100%)'
                      : 'linear-gradient(135deg, #FEE2E2 0%, #FECACA 100%)',
                    border: report.status === 'PENDING'
                      ? '2px solid rgba(245, 158, 11, 0.3)'
                      : report.status === 'RESOLVED'
                      ? '2px solid rgba(0,191,166,0.2)'
                      : '2px solid rgba(239, 68, 68, 0.3)'
                  }}
                  className="hover:shadow-lg transition-all"
                >
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                      <div className="flex-1 space-y-4">
                        <div className="flex items-start gap-4">
                          <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{background: 'linear-gradient(135deg, #f87171, #ef4444)'}}>
                            <AlertTriangle className="w-5 h-5 text-white" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold" suppressHydrationWarning={true}>{t('reports.newReport')}</h3>
                              {getStatusBadge(report.status)}
                            </div>
                            <div className="space-y-2 text-sm">
                              <div className="flex items-center gap-2">
                                <User className="w-4 h-4 text-muted-foreground" />
                                <span className="text-muted-foreground" suppressHydrationWarning={true}>{t('reports.reporter')}</span>
                                <span className="font-medium">{report.reporterName}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <User className="w-4 h-4 text-muted-foreground" />
                                <span className="text-muted-foreground" suppressHydrationWarning={true}>{t('reports.reportedUser')}</span>
                                <span className="font-medium">{report.reportedName}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <FileText className="w-4 h-4 text-muted-foreground" />
                                <span className="text-muted-foreground" suppressHydrationWarning={true}>{t('reports.type')}</span>
                                <span className="font-medium">{report.reportType}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-muted-foreground" />
                                <span className="text-muted-foreground" suppressHydrationWarning={true}>{t('reports.date')}</span>
                                <span className="font-medium">{formatDate(report.createdAt)}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="rounded-lg p-4" style={{background: 'rgba(255,255,255,0.7)'}}>
                          <p className="text-sm text-muted-foreground mb-2" suppressHydrationWarning={true}>{t('reports.description')}</p>
                          <p className="text-sm">{report.description}</p>
                        </div>

                        {/* Admin Decision Display */}
                        {report.adminDecision && (
                          <div className="rounded-lg p-4" style={{background: 'rgba(108,63,197,0.1)', border: '1px solid rgba(108,63,197,0.2)'}}>
                            <p className="text-sm mb-2 font-medium" style={{color: '#7C3AED'}} suppressHydrationWarning={true}>{t('reports.actionTaken')}</p>
                            <p className="text-sm mb-2" style={{color: '#6C3FC5'}}>
                              {getAdminDecisionLabel(report.adminDecision)}
                            </p>
                            {report.adminNotes && (
                              <p className="text-sm bg-white p-2 rounded" style={{color: '#7C3AED'}} suppressHydrationWarning={true}>
                                {t('reports.notes')} {report.adminNotes}
                              </p>
                            )}
                            {report.banDuration && report.adminDecision === 'TEMP_BAN' && (
                              <p className="text-sm bg-white p-2 rounded" style={{color: '#f97316'}} suppressHydrationWarning={true}>
                                {t('reports.banDuration')} {report.banDuration} {locale === 'ar' ? 'أيام' : 'days'}
                              </p>
                            )}
                          </div>
                        )}

                        {/* Legacy resolution support */}
                        {!report.adminDecision && report.adminNotes && report.status === 'RESOLVED' && (
                          <div className="rounded-lg p-4" style={{background: 'rgba(0,191,166,0.1)', border: '1px solid rgba(0,191,166,0.2)'}}>
                            <p className="text-sm mb-2 font-medium" style={{color: '#00BFA6'}} suppressHydrationWarning={true}>{t('reports.solution')}</p>
                            <p className="text-sm" style={{color: '#008C7A'}}>{report.adminNotes}</p>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col gap-2">
                        {report.status === 'PENDING' && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => {
                                setSelectedReport(report)
                                setResolveDialog(true)
                              }}
                              disabled={actionLoading === report.id}
                              className="bg-emerald-800 hover:bg-emerald-700"
                            >
                              <CheckCircle className={`w-4 h-4 ${isRTL ? 'ml-1' : 'mr-1'}`} />
                              {t('reports.resolve')}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedReport(report)
                                setSelectedAction('WARN')
                                setActionDialog(true)
                              }}
                              disabled={actionLoading === report.id}
                              className="text-amber-600 hover:text-amber-700 border-amber-200 hover:bg-amber-50"
                            >
                              <ShieldAlert className={`w-4 h-4 ${isRTL ? 'ml-1' : 'mr-1'}`} />
                              {t('reports.warn')}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedReport(report)
                                setSelectedAction('SUSPEND')
                                setActionDialog(true)
                              }}
                              disabled={actionLoading === report.id}
                              className="text-orange-600 hover:text-orange-700 border-orange-200 hover:bg-orange-50"
                            >
                              <Pause className={`w-4 h-4 ${isRTL ? 'ml-1' : 'mr-1'}`} />
                              {t('reports.suspend')}
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => {
                                setSelectedReport(report)
                                setSelectedAction('TEMP_BAN')
                                setActionDialog(true)
                              }}
                              disabled={actionLoading === report.id}
                            >
                              <Ban className={`w-4 h-4 ${isRTL ? 'ml-1' : 'mr-1'}`} />
                              {t('reports.tempBan')}
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => {
                                setSelectedReport(report)
                                setSelectedAction('PERM_BAN')
                                setActionDialog(true)
                              }}
                              disabled={actionLoading === report.id}
                              className="bg-red-700 hover:bg-red-800"
                            >
                              <AlertOctagon className={`w-4 h-4 ${isRTL ? 'ml-1' : 'mr-1'}`} />
                              {t('reports.permBan')}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDismiss(report.id)}
                              disabled={actionLoading === report.id}
                            >
                              <XCircle className={`w-4 h-4 ${isRTL ? 'ml-1' : 'mr-1'}`} />
                              {t('reports.dismiss')}
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />

      {/* Resolve Dialog */}
      <Dialog open={resolveDialog} onOpenChange={setResolveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2" suppressHydrationWarning={true}>
              <CheckCircle className="w-5 h-5 text-emerald-800" />
              {t('reports.resolveReport')}
            </DialogTitle>
            <DialogDescription suppressHydrationWarning={true}>
              {t('reports.resolveDescription')}
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder={t('reports.writeSolution')}
            value={resolutionText}
            onChange={(e) => setResolutionText(e.target.value)}
            rows={4}
            suppressHydrationWarning={true}
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setResolveDialog(false)
                setResolutionText('')
                setSelectedReport(null)
              }}
              suppressHydrationWarning={true}
            >
              {t('common.cancel')}
            </Button>
            <Button
              onClick={handleResolve}
              disabled={!resolutionText.trim()}
              className="bg-emerald-800 hover:bg-emerald-700"
              suppressHydrationWarning={true}
            >
              {t('reports.confirmResolve')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Action Dialog (Warn, Suspend, Ban) */}
      <Dialog open={actionDialog} onOpenChange={(open) => !open && setActionDialog(false)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600" suppressHydrationWarning={true}>
              {selectedAction === 'WARN' && <ShieldAlert className="w-5 h-5" />}
              {selectedAction === 'SUSPEND' && <Pause className="w-5 h-5" />}
              {(selectedAction === 'TEMP_BAN' || selectedAction === 'PERM_BAN') && <AlertOctagon className="w-5 h-5" />}
              {getActionLabel(selectedAction || '')}
            </DialogTitle>
            <DialogDescription suppressHydrationWarning={true}>
              {selectedReport && (`${t('reports.takeActionAgainst')} ${selectedReport.reportedName}`)}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block" suppressHydrationWarning={true}>
                {t('reports.actionReason')} *
              </label>
              <Textarea
                placeholder={t('reports.writeSolution')}
                value={actionForm.reason}
                onChange={(e) => setActionForm({ ...actionForm, reason: e.target.value })}
                rows={4}
                suppressHydrationWarning={true}
              />
            </div>
            {selectedAction === 'TEMP_BAN' && (
              <div>
                <label className="text-sm font-medium mb-1.5 block" suppressHydrationWarning={true}>
                  {t('reports.banDurationDays')} *
                </label>
                <Input
                  type="number"
                  min="1"
                  max="365"
                  value={actionForm.duration}
                  onChange={(e) => setActionForm({ ...actionForm, duration: parseInt(e.target.value) })}
                  className="text-left"
                />
              </div>
            )}
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-800" suppressHydrationWarning={true}>
                <strong>{t('reports.warningText')}</strong>
                {selectedAction === 'WARN' && t('reports.warnActionDesc')}
                {selectedAction === 'SUSPEND' && t('reports.suspendActionDesc')}
                {selectedAction === 'TEMP_BAN' && `${t('reports.tempBanActionDesc')} ${actionForm.duration} ${locale === 'ar' ? 'يوم' : 'day'}`}
                {selectedAction === 'PERM_BAN' && t('reports.permBanActionDesc')}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setActionDialog(false)
                setSelectedAction(null)
                setActionForm({ reason: '', duration: 7 })
              }}
              disabled={actionLoading !== null}
              suppressHydrationWarning={true}
            >
              {t('common.cancel')}
            </Button>
            <Button
              onClick={handleAction}
              disabled={actionLoading !== null || !actionForm.reason.trim()}
              variant="destructive"
            >
              {actionLoading === selectedReport?.id ? (
                <>
                  <div className={`w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin ${isRTL ? 'ml-2' : 'mr-2'}`} />
                  {t('reports.executing')}
                </>
              ) : (
                t('common.confirm')
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
