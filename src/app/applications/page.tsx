'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { Navigation } from '@/components/navigation'
import { Footer } from '@/components/footer'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { useTranslations } from '@/hooks/useTranslations'
import {
  User,
  Calendar,
  CheckCircle2,
  XCircle,
  MessageSquare,
  Clock,
  FileText,
  ArrowRight,
  ShieldCheck,
  Filter,
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface Application {
  id: string
  patientName: string
  patientAvatar: string | null
  postTitle: string
  postId: string
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED'
  submittedAt: string
  timeAgo: string
}

interface ApplicationsResponse {
  success: boolean
  pendingCount: number
  recentApplications: Application[]
}

const getStatusMap = (t: any, isRTL: boolean) => ({
  PENDING: {
    label: t('applicationsPage.status.pending'),
    color: 'bg-amber-100 text-amber-700 border-amber-200',
    icon: <Clock className={`w-3 h-3 ${isRTL ? 'mr-1' : 'ml-1'}`} />
  },
  ACCEPTED: {
    label: t('applicationsPage.status.accepted'),
    color: 'bg-emerald-800 text-emerald-50 border-emerald-700',
    icon: <CheckCircle2 className={`w-3 h-3 ${isRTL ? 'mr-1' : 'ml-1'}`} />
  },
  REJECTED: {
    label: t('applicationsPage.status.rejected'),
    color: 'bg-red-100 text-red-700 border-red-200',
    icon: <XCircle className={`w-3 h-3 ${isRTL ? 'mr-1' : 'ml-1'}`} />
  }
})

export default function AllApplicationsPage() {
  const router = useRouter()
  const { user, loading: userLoading } = useCurrentUser()
  const { t, locale } = useTranslations()
  const isRTL = locale === 'ar'
  const statusMap = getStatusMap(t, isRTL)
  const [applications, setApplications] = useState<Application[]>([])
  const [pendingCount, setPendingCount] = useState(0)
  const [loadingData, setLoadingData] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'ACCEPTED' | 'REJECTED'>('ALL')
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // Fetch all applications
  useEffect(() => {
    const fetchApplications = async () => {
      if (!user) return
      
      try {
        setLoadingData(true)
        const response = await fetch('/api/student/applications', {
          credentials: 'include'
        })

        const data: ApplicationsResponse = await response.json()

        if (!response.ok) {
          setError(data.error || t('applicationsPage.errors.fetchFailed'))
          return
        }

        if (data.success) {
          setApplications(data.recentApplications || [])
          setPendingCount(data.pendingCount || 0)
        }
      } catch (err: any) {
        setError(err.message || t('applicationsPage.errors.generalError'))
      } finally {
        setLoadingData(false)
      }
    }

    fetchApplications()
  }, [user])

  const handleOpenChat = async (applicationId: string, postId: string) => {
    // Prevent multiple clicks
    if (actionLoading === `chat-${applicationId}`) {
      return
    }

    try {
      setActionLoading(`chat-${applicationId}`)
      const response = await fetch(
        `/api/posts/${postId}/applications/${applicationId}/chat`,
        {
          method: 'POST',
          credentials: 'include'
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || t('applicationsPage.errors.openChatFailed'))
      }

      // Use query parameter for conversation ID
      router.push(`/chat?conversation=${data.conversationId}`)
    } catch (err: any) {
      alert(err.message || t('applicationsPage.errors.openChatError'))
    } finally {
      setActionLoading(null)
    }
  }

  const handleAccept = async (applicationId: string, postId: string) => {
    // Prevent multiple clicks
    if (actionLoading === applicationId) {
      return
    }

    if (!confirm(t('applicationsPage.confirmations.accept'))) {
      return
    }

    try {
      setActionLoading(applicationId)
      const response = await fetch(
        `/api/posts/${postId}/applications/${applicationId}/accept`,
        {
          method: 'POST',
          credentials: 'include'
        }
      )

      const data = await response.json()

      if (!response.ok) {
        // Show specific error message from API
        alert(data.error || t('applicationsPage.errors.acceptFailed'))
        return
      }

      // Update local state immediately to avoid UI issues
      setApplications((prev) =>
        prev.map((app) =>
          app.id === applicationId
            ? { ...app, status: data.application?.status || 'ACCEPTED' }
            : app
        )
      )

      // Show success message
      if (data.alreadyProcessed) {
        alert(data.message)
      } else {
        alert(data.message || 'تم قبول الطلب بنجاح')
      }

      // Only refresh if needed (for other applications that might have been auto-rejected)
      if (data.postIsFull) {
        const appsResponse = await fetch('/api/student/applications', {
          credentials: 'include'
        })
        const appsData = await appsResponse.json()
        if (appsData.success) {
          setApplications(appsData.recentApplications || [])
          setPendingCount(appsData.pendingCount || 0)
        }
      } else {
        // Just update pending count
        setPendingCount((prev) => Math.max(0, prev - 1))
      }
    } catch (err: any) {
      alert(err.message || t('applicationsPage.errors.acceptError'))
    } finally {
      setActionLoading(null)
    }
  }

  const handleReject = async (applicationId: string, postId: string) => {
    // Prevent multiple clicks
    if (actionLoading === applicationId) {
      return
    }

    if (!confirm(t('applicationsPage.confirmations.reject'))) {
      return
    }

    try {
      setActionLoading(applicationId)
      const response = await fetch(
        `/api/posts/${postId}/applications/${applicationId}/reject`,
        {
          method: 'POST',
          credentials: 'include'
        }
      )

      const data = await response.json()

      if (!response.ok) {
        // Show specific error message from API
        alert(data.error || t('applicationsPage.errors.rejectFailed'))
        return
      }

      // Update local state immediately to avoid UI issues
      setApplications((prev) =>
        prev.map((app) =>
          app.id === applicationId
            ? { ...app, status: data.application?.status || 'REJECTED' }
            : app
        )
      )

      // Show success message
      if (data.alreadyProcessed) {
        alert(data.message)
      } else {
        alert(data.message || 'تم رفض الطلب بنجاح')
      }

      // Update pending count
      setPendingCount((prev) => Math.max(0, prev - 1))
    } catch (err: any) {
      alert(err.message || t('applicationsPage.errors.rejectError'))
    } finally {
      setActionLoading(null)
    }
  }

  const getStatusBadge = (status: string) => {
    const info = statusMap[status] || statusMap.PENDING
    return (
      <Badge className={info.color}>
        {info.icon}
        {info.label}
      </Badge>
    )
  }

  const filteredApplications = applications.filter(app => {
    if (filter === 'ALL') return true
    return app.status === filter
  })

  // Loading state
  if (userLoading || loadingData) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navigation user={user ? { id: user.id, name: user.name || 'مستخدم', email: user.email || '', role: user.role as 'STUDENT' | 'PATIENT', avatar: user.avatarUrl } : undefined} />
        <main className="flex-1 py-8 px-4 bg-muted/30">
          <div className="container mx-auto max-w-5xl">
            <Skeleton className="h-12 mb-6" />
            <Skeleton className="h-64" />
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navigation user={user ? { id: user.id, name: user.name || 'مستخدم', email: user.email || '', role: user.role as 'STUDENT' | 'PATIENT', avatar: user.avatarUrl } : undefined} />
        <main className="flex-1 py-8 px-4 bg-muted/30">
          <div className="container mx-auto max-w-5xl">
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <Button onClick={() => router.back()} variant="outline" className="mt-4">
              رجوع
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation user={user ? { id: user.id, name: user.name || 'مستخدم', email: user.email || '', role: user.role as 'STUDENT' | 'PATIENT', avatar: user.avatarUrl } : undefined} />

      <main className="flex-1 py-8 px-4 bg-muted/30">
        <div className="container mx-auto max-w-5xl">
          {/* Header */}
          <div className="mb-6">
            <Link
              href="/dashboard/student"
              className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1 mb-4"
            >
              {isRTL ? (
                <ArrowRight className="w-4 h-4" />
              ) : (
                <ArrowRight className="w-4 h-4 rotate-180" />
              )}
              <span suppressHydrationWarning={true}>{t('applicationsPage.backToDashboard')}</span>
            </Link>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold" suppressHydrationWarning={true}>{t('applicationsPage.title')}</h1>
                <p className="text-muted-foreground mt-2" suppressHydrationWarning={true}>
                  {t('applicationsPage.subtitle')}
                </p>
              </div>
              {pendingCount > 0 && (
                <Badge className="bg-blue-600 text-white px-4 py-2" suppressHydrationWarning={true}>
                  {pendingCount} <span className="mx-1" suppressHydrationWarning={true}>{t('applicationsPage.newRequest')}</span>
                </Badge>
              )}
            </div>
          </div>

          {/* Filters */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={filter === 'ALL' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter('ALL')}
                  suppressHydrationWarning={true}
                >
                  <Filter className={`w-4 h-4 ${isRTL ? 'mr-2' : 'ml-2'}`} />
                  <span suppressHydrationWarning={true}>{t('applicationsPage.filters.all')} ({applications.length})</span>
                </Button>
                <Button
                  variant={filter === 'PENDING' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter('PENDING')}
                  className="bg-amber-600 hover:bg-amber-700"
                  suppressHydrationWarning={true}
                >
                  <Clock className={`w-4 h-4 ${isRTL ? 'mr-2' : 'ml-2'}`} />
                  <span suppressHydrationWarning={true}>{t('applicationsPage.filters.new')} ({applications.filter(a => a.status === 'PENDING').length})</span>
                </Button>
                <Button
                  variant={filter === 'ACCEPTED' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter('ACCEPTED')}
                  className="bg-emerald-600 hover:bg-emerald-700"
                  suppressHydrationWarning={true}
                >
                  <CheckCircle2 className={`w-4 h-4 ${isRTL ? 'mr-2' : 'ml-2'}`} />
                  <span suppressHydrationWarning={true}>{t('applicationsPage.filters.accepted')} ({applications.filter(a => a.status === 'ACCEPTED').length})</span>
                </Button>
                <Button
                  variant={filter === 'REJECTED' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter('REJECTED')}
                  className="bg-red-600 hover:bg-red-700"
                  suppressHydrationWarning={true}
                >
                  <XCircle className={`w-4 h-4 ${isRTL ? 'mr-2' : 'ml-2'}`} />
                  <span suppressHydrationWarning={true}>{t('applicationsPage.filters.rejected')} ({applications.filter(a => a.status === 'REJECTED').length})</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Applications List */}
          {filteredApplications.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center">
                  <ShieldCheck className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2" suppressHydrationWarning={true}>
                    {filter === 'ALL' ? t('applicationsPage.noApplications') : `${t('applicationsPage.noApplicationsWithStatus')} ${statusMap[filter]?.label}`}
                  </h3>
                  <p className="text-muted-foreground" suppressHydrationWarning={true}>
                    {filter === 'ALL'
                      ? t('applicationsPage.noApplicationsDesc')
                      : t('applicationsPage.noApplicationsWithStatusDesc')}
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredApplications.map((application) => (
                <Card key={application.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-10 h-10 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <User className="w-5 h-5 text-emerald-800" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <CardTitle className="text-lg truncate" title={application.patientName}>{application.patientName}</CardTitle>
                            <CardDescription className="flex items-center gap-1 truncate">
                              <FileText className="w-3 h-3 flex-shrink-0" />
                              <span className="truncate" title={application.postTitle}>{application.postTitle}</span>
                            </CardDescription>
                          </div>
                        </div>
                        <div className="mt-2 flex items-center gap-2 flex-wrap">
                          {getStatusBadge(application.status)}
                          <span className="text-xs text-muted-foreground">
                            {application.timeAgo}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardHeader>

                  {application.status === 'PENDING' && (
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          onClick={() => handleAccept(application.id, application.postId)}
                          disabled={actionLoading === application.id}
                          className="flex-1 min-w-[140px] bg-emerald-600 hover:bg-emerald-700 whitespace-nowrap overflow-hidden text-ellipsis"
                          suppressHydrationWarning={true}
                        >
                          {actionLoading === application.id ? (
                            <span suppressHydrationWarning={true}>{t('applicationsPage.actions.processing')}</span>
                          ) : (
                            <>
                              <CheckCircle2 className={`w-4 h-4 ${isRTL ? 'mr-2' : 'ml-2'} flex-shrink-0`} />
                              <span suppressHydrationWarning={true} className="truncate">{t('applicationsPage.actions.accept')}</span>
                            </>
                          )}
                        </Button>
                        <Button
                          onClick={() => handleReject(application.id, application.postId)}
                          disabled={actionLoading === application.id}
                          variant="outline"
                          className="flex-1 min-w-[140px] text-red-600 hover:text-red-700 hover:bg-red-50 whitespace-nowrap overflow-hidden text-ellipsis"
                          suppressHydrationWarning={true}
                        >
                          {actionLoading === application.id ? (
                            <span suppressHydrationWarning={true}>{t('applicationsPage.actions.processing')}</span>
                          ) : (
                            <>
                              <XCircle className={`w-4 h-4 ${isRTL ? 'mr-2' : 'ml-2'} flex-shrink-0`} />
                              <span suppressHydrationWarning={true} className="truncate">{t('applicationsPage.actions.reject')}</span>
                            </>
                          )}
                        </Button>
                        <Button
                          onClick={() => handleOpenChat(application.id, application.postId)}
                          disabled={actionLoading === `chat-${application.id}`}
                          variant="outline"
                          className="flex-1 min-w-[140px] whitespace-nowrap overflow-hidden text-ellipsis"
                          suppressHydrationWarning={true}
                        >
                          {actionLoading === `chat-${application.id}` ? (
                            <span suppressHydrationWarning={true}>{t('applicationsPage.actions.openingChat')}</span>
                          ) : (
                            <>
                              <MessageSquare className={`w-4 h-4 ${isRTL ? 'mr-2' : 'ml-2'} flex-shrink-0`} />
                              <span suppressHydrationWarning={true} className="truncate">{t('applicationsPage.actions.openChat')}</span>
                            </>
                          )}
                        </Button>
                        <Button
                          onClick={() => router.push(`/posts/${application.postId}/applications`)}
                          disabled={actionLoading === application.id}
                          variant="outline"
                          className="flex-1 min-w-[140px] whitespace-nowrap overflow-hidden text-ellipsis"
                          suppressHydrationWarning={true}
                        >
                          <span suppressHydrationWarning={true} className="truncate">{t('applicationsPage.actions.viewDetails')}</span>
                        </Button>
                      </div>
                    </CardContent>
                  )}

                  {application.status === 'ACCEPTED' && (
                    <CardContent>
                      <Alert className="bg-slate-100 border-emerald-700">
                        <CheckCircle2 className="h-4 w-4 text-emerald-800" />
                        <AlertDescription className="text-emerald-900 font-medium">
                          {t('applicationsPage.status.acceptedAlert')}
                        </AlertDescription>
                      </Alert>
                      <div className="flex flex-wrap gap-2 mt-3">
                        <Button
                          onClick={() => handleOpenChat(application.id, application.postId)}
                          disabled={actionLoading === `chat-${application.id}`}
                          className="flex-1 min-w-[140px] whitespace-nowrap overflow-hidden text-ellipsis"
                          suppressHydrationWarning={true}
                        >
                          {actionLoading === `chat-${application.id}` ? (
                            <span suppressHydrationWarning={true}>{t('applicationsPage.actions.openingChat')}</span>
                          ) : (
                            <>
                              <MessageSquare className={`w-4 h-4 ${isRTL ? 'mr-2' : 'ml-2'} flex-shrink-0`} />
                              <span suppressHydrationWarning={true} className="truncate">{t('applicationsPage.actions.openChat')}</span>
                            </>
                          )}
                        </Button>
                        <Button
                          onClick={() => router.push(`/posts/${application.postId}/applications`)}
                          variant="outline"
                          className="flex-1 min-w-[140px] whitespace-nowrap overflow-hidden text-ellipsis"
                          suppressHydrationWarning={true}
                        >
                          <span suppressHydrationWarning={true} className="truncate">{t('applicationsPage.actions.viewDetails')}</span>
                        </Button>
                      </div>
                    </CardContent>
                  )}

                  {application.status === 'REJECTED' && (
                    <CardContent>
                      <Alert className="bg-red-50 border-red-200">
                        <XCircle className="h-4 w-4 text-red-600" />
                        <AlertDescription className="text-red-900 font-medium">
                          {t('applicationsPage.status.rejectedAlert')}
                        </AlertDescription>
                      </Alert>
                      <Button
                        onClick={() => router.push(`/posts/${application.postId}/applications`)}
                        variant="outline"
                        className="w-full mt-3 whitespace-nowrap overflow-hidden text-ellipsis"
                        suppressHydrationWarning={true}
                      >
                        <span suppressHydrationWarning={true} className="truncate">{t('applicationsPage.actions.viewDetails')}</span>
                      </Button>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
