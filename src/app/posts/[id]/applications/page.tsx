'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { Navigation } from '@/components/navigation'
import { Footer } from '@/components/footer'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import {
  User,
  Calendar,
  CheckCircle2,
  XCircle,
  MessageSquare,
  AlertCircle,
  ArrowRight,
  Clock,
  ShieldCheck,
  ShieldX,
  Mail,
  Phone,
  MapPin,
  UserCircle,
} from 'lucide-react'
import Link from 'next/link'

interface Application {
  id: string
  patientId: string
  patientName: string
  patientEmail: string
  patientPhone?: string | null
  patientAge?: number | null
  patientGender?: string | null
  patientAddress?: string | null
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED'
  createdAt: string
  updatedAt: string
  medicalSnapshot: string
}

interface ApplicationsResponse {
  success: boolean
  applications: Application[]
}

const statusMap: {
  [key: string]: { label: string; color: string; icon: React.ReactNode }
} = {
  PENDING: {
    label: 'قيد المراجعة',
    color: 'bg-amber-100 text-amber-700 border-amber-200',
    icon: <Clock className="w-3 h-3 ml-1" />
  },
  ACCEPTED: {
    label: 'مقبول',
    color: 'bg-emerald-800 text-emerald-50 border-emerald-700',
    icon: <CheckCircle2 className="w-3 h-3 ml-1" />
  },
  REJECTED: {
    label: 'مرفوض',
    color: 'bg-red-100 text-red-700 border-red-200',
    icon: <XCircle className="w-3 h-3 ml-1" />
  }
}

export default function ApplicationsPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useCurrentUser()
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // Fetch applications
  useEffect(() => {
    const fetchApplications = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/posts/${params.id}/applications`, {
          credentials: 'include'
        })

        const data: ApplicationsResponse = await response.json()

        if (!response.ok) {
          if (response.status === 403) {
            setError('غير مصرح - يمكنك فقط عرض طلبات البوستات الخاصة بك')
          } else {
            setError(data.error || 'فشل في جلب الطلبات')
          }
          return
        }

        if (data.success) {
          setApplications(data.applications)
        }
      } catch (err: any) {
        setError(err.message || 'حدث خطأ أثناء جلب الطلبات')
      } finally {
        setLoading(false)
      }
    }

    fetchApplications()
  }, [params.id])

  const handleAccept = async (applicationId: string) => {
    // Prevent multiple clicks
    if (actionLoading === applicationId) {
      return
    }

    if (!confirm('هل أنت متأكد من قبول هذا الطلب؟')) {
      return
    }

    try {
      setActionLoading(applicationId)
      const response = await fetch(
        `/api/posts/${params.id}/applications/${applicationId}/accept`,
        {
          method: 'POST',
          credentials: 'include'
        }
      )

      const data = await response.json()

      if (!response.ok) {
        // Show specific error message from API
        alert(data.error || 'فشل في قبول الطلب')
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
        const appsResponse = await fetch(`/api/posts/${params.id}/applications`, {
          credentials: 'include'
        })
        const appsData = await appsResponse.json()
        if (appsData.success) {
          setApplications(appsData.applications)
        }
      }
    } catch (err: any) {
      alert(err.message || 'حدث خطأ أثناء قبول الطلب')
    } finally {
      setActionLoading(null)
    }
  }

  const handleReject = async (applicationId: string) => {
    // Prevent multiple clicks
    if (actionLoading === applicationId) {
      return
    }

    if (!confirm('هل أنت متأكد من رفض هذا الطلب؟')) {
      return
    }

    try {
      setActionLoading(applicationId)
      const response = await fetch(
        `/api/posts/${params.id}/applications/${applicationId}/reject`,
        {
          method: 'POST',
          credentials: 'include'
        }
      )

      const data = await response.json()

      if (!response.ok) {
        // Show specific error message from API
        alert(data.error || 'فشل في رفض الطلب')
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
    } catch (err: any) {
      alert(err.message || 'حدث خطأ أثناء رفض الطلب')
    } finally {
      setActionLoading(null)
    }
  }

  const handleOpenChat = async (applicationId: string) => {
    // Prevent multiple clicks
    if (actionLoading === `chat-${applicationId}`) {
      return
    }

    try {
      setActionLoading(`chat-${applicationId}`)
      const response = await fetch(
        `/api/posts/${params.id}/applications/${applicationId}/chat`,
        {
          method: 'POST',
          credentials: 'include'
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'فشل في فتح المحادثة')
      }

      // Navigate to the chat page with query parameter
      router.push(`/chat?conversation=${data.conversationId}`)
    } catch (err: any) {
      alert(err.message || 'حدث خطأ أثناء فتح المحادثة')
    } finally {
      setActionLoading(null)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
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

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navigation user={user ? { id: user.id, name: user.name || 'مستخدم', email: user.email || '', role: user.role as 'STUDENT' | 'PATIENT', avatar: user.avatarUrl } : undefined} />
        <main className="flex-1 py-8 px-4 bg-muted/30">
          <div className="container mx-auto max-w-4xl">
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
          <div className="container mx-auto max-w-4xl">
            <Alert variant="destructive">
              <ShieldX className="h-4 w-4" />
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
        <div className="container mx-auto max-w-4xl">
          {/* Header */}
          <div className="mb-6">
            <Link
              href={`/posts/${params.id}`}
              className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1 mb-4"
            >
              <ArrowRight className="w-4 h-4" />
              رجوع للبوست
            </Link>
            <h1 className="text-3xl font-bold" suppressHydrationWarning={true}>الطلبات المقدمة</h1>
            <p className="text-muted-foreground mt-2" suppressHydrationWarning={true}>
              إدارة الطلبات المقدمة على هذا البوست
            </p>
          </div>

          {/* Applications List */}
          {applications.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center">
                  <ShieldCheck className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2" suppressHydrationWarning={true}>لا يوجد طلبات مقدمة حتى الآن</h3>
                  <p className="text-muted-foreground" suppressHydrationWarning={true}>
                    سيظهر هنا الطلبات المقدمة من المرضى على هذا البوست
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {applications.map((application) => (
                <Card key={application.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-10 h-10 bg-gradient-to-br from-emerald-800 to-teal-800 rounded-full flex items-center justify-center">
                            <UserCircle className="w-5 h-5 text-emerald-800" />
                          </div>
                          <div>
                            <CardTitle className="text-lg">{application.patientName}</CardTitle>
                            <CardDescription className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {formatDate(application.createdAt)}
                            </CardDescription>
                          </div>
                        </div>
                        <div className="mt-2">{getStatusBadge(application.status)}</div>
                      </div>
                    </div>
                  </CardHeader>

                  {/* معلومات المريض */}
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4 bg-muted/50 rounded-lg">
                      {application.patientEmail && (
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="w-4 h-4 text-muted-foreground" />
                          <span className="text-muted-foreground truncate">{application.patientEmail}</span>
                        </div>
                      )}
                      {application.patientPhone && (
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="w-4 h-4 text-muted-foreground" />
                          <span className="text-muted-foreground">{application.patientPhone}</span>
                        </div>
                      )}
                      {application.patientAge && (
                        <div className="flex items-center gap-2 text-sm">
                          <User className="w-4 h-4 text-muted-foreground" />
                          <span className="text-muted-foreground" suppressHydrationWarning={true}>العمر: {application.patientAge} سنة</span>
                        </div>
                      )}
                      {application.patientGender && (
                        <div className="flex items-center gap-2 text-sm">
                          <UserCircle className="w-4 h-4 text-muted-foreground" />
                          <span className="text-muted-foreground" suppressHydrationWarning={true}>الجنس: {application.patientGender}</span>
                        </div>
                      )}
                      {application.patientAddress && (
                        <div className="flex items-center gap-2 text-sm md:col-span-2">
                          <MapPin className="w-4 h-4 text-muted-foreground" />
                          <span className="text-muted-foreground truncate">{application.patientAddress}</span>
                        </div>
                      )}
                    </div>

                    {application.status === 'PENDING' && (
                      <div className="flex flex-wrap gap-2">
                        <Button
                          onClick={() => handleAccept(application.id)}
                          disabled={actionLoading === application.id}
                          className="flex-1 bg-emerald-800 hover:bg-emerald-900"
                          suppressHydrationWarning={true}
                        >
                          {actionLoading === application.id ? (
                            <>جاري المعالجة...</>
                          ) : (
                            <>
                              <CheckCircle2 className="w-4 h-4 ml-2" />
                              موافقة
                            </>
                          )}
                        </Button>
                        <Button
                          onClick={() => handleReject(application.id)}
                          disabled={actionLoading === application.id}
                          variant="outline"
                          className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                          suppressHydrationWarning={true}
                        >
                          {actionLoading === application.id ? (
                            <>جاري المعالجة...</>
                          ) : (
                            <>
                              <XCircle className="w-4 h-4 ml-2" />
                              رفض
                            </>
                          )}
                        </Button>
                        <Button
                          onClick={() => handleOpenChat(application.id)}
                          disabled={actionLoading === `chat-${application.id}`}
                          variant="outline"
                          className="flex-1"
                          suppressHydrationWarning={true}
                        >
                          {actionLoading === `chat-${application.id}` ? (
                            <>جاري إنشاء المحادثة...</>
                          ) : (
                            <>
                              <MessageSquare className="w-4 h-4 ml-2" />
                              فتح محادثة
                            </>
                          )}
                        </Button>
                      </div>
                    )}

                    {application.status === 'ACCEPTED' && (
                      <div>
                        <Alert className="bg-slate-100 border-emerald-700">
                          <CheckCircle2 className="h-4 w-4 text-emerald-800" />
                          <AlertDescription className="text-emerald-50 font-medium">
                            تم القبول
                          </AlertDescription>
                        </Alert>
                        <Button
                          onClick={() => handleOpenChat(application.id)}
                          disabled={actionLoading === `chat-${application.id}`}
                          className="w-full mt-3"
                          suppressHydrationWarning={true}
                        >
                          {actionLoading === `chat-${application.id}` ? (
                            <>جاري فتح المحادثة...</>
                          ) : (
                            <>
                              <MessageSquare className="w-4 h-4 ml-2" />
                              فتح محادثة
                            </>
                          )}
                        </Button>
                      </div>
                    )}

                    {application.status === 'REJECTED' && (
                      <Alert className="bg-red-50 border-red-200">
                        <XCircle className="h-4 w-4 text-red-600" />
                        <AlertDescription className="text-red-900 font-medium">
                          تم الرفض
                        </AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
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
