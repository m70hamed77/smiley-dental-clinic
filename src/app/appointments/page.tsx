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
import {
  Calendar,
  MapPin,
  User,
  Clock,
  MessageSquare,
  ArrowRight,
  ShieldCheck,
  FileText,
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface Appointment {
  id: string
  caseId: string
  patientName: string
  patientAvatar: string | null
  postTitle: string
  postId: string
  scheduledAt: string
  location: string | null
  status: string
  duration: number | null
  caseAddress: string
}

interface AppointmentsResponse {
  success: boolean
  upcomingCount: number
  appointments: Appointment[]
}

const statusMap: {
  [key: string]: { label: string; color: string }
} = {
  SCHEDULED: {
    label: 'مجدول',
    color: 'bg-blue-100 text-blue-700 border-blue-200'
  },
  COMPLETED: {
    label: 'مكتمل',
    color: 'bg-emerald-800 text-emerald-50 border-emerald-700'
  },
  CANCELLED: {
    label: 'ملغي',
    color: 'bg-red-100 text-red-700 border-red-200'
  }
}

export default function AppointmentsPage() {
  const router = useRouter()
  const { user, loading } = useCurrentUser()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [upcomingCount, setUpcomingCount] = useState(0)
  const [loadingData, setLoadingData] = useState(true)
  const [error, setError] = useState('')

  // Fetch appointments
  useEffect(() => {
    const fetchAppointments = async () => {
      if (!user) return
      
      try {
        setLoadingData(true)
        const response = await fetch('/api/student/appointments', {
          credentials: 'include'
        })

        const data: AppointmentsResponse = await response.json()

        if (!response.ok) {
          setError(data.error || 'فشل في جلب المواعيد')
          return
        }

        if (data.success) {
          setAppointments(data.appointments || [])
          setUpcomingCount(data.upcomingCount || 0)
        }
      } catch (err: any) {
        setError(err.message || 'حدث خطأ أثناء جلب المواعيد')
      } finally {
        setLoadingData(false)
      }
    }

    fetchAppointments()
  }, [user])

  const handleOpenChat = async (caseId: string) => {
    try {
      const response = await fetch(`/api/cases/${caseId}/chat`, {
        method: 'POST',
        credentials: 'include'
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'فشل في فتح المحادثة')
      }

      router.push(`/chat/${data.conversationId}`)
    } catch (err: any) {
      alert(err.message || 'حدث خطأ أثناء فتح المحادثة')
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const today = new Date()
    const isToday = date.toDateString() === today.toDateString()

    if (isToday) {
      return `اليوم، ${date.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}`
    }

    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    const isTomorrow = date.toDateString() === tomorrow.toDateString()

    if (isTomorrow) {
      return `غداً، ${date.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}`
    }

    return date.toLocaleDateString('ar-EG', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusBadge = (status: string) => {
    const info = statusMap[status] || statusMap.SCHEDULED
    return (
      <Badge className={info.color}>
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

  // Filter upcoming appointments
  const now = new Date()
  const upcomingAppointments = appointments.filter(
    app => new Date(app.scheduledAt) > now
  )

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
              <ArrowRight className="w-4 h-4" />
              رجوع للوحة التحكم
            </Link>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold" suppressHydrationWarning={true}>المواعيد</h1>
                <p className="text-muted-foreground mt-2" suppressHydrationWarning={true}>
                  إدارة مواعيد العلاج مع المرضى
                </p>
              </div>
              {upcomingCount > 0 && (
                <Badge className="bg-purple-600 text-white px-4 py-2" suppressHydrationWarning={true}>
                  {upcomingCount} موعد قادم
                </Badge>
              )}
            </div>
          </div>

          {/* Upcoming Appointments */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2" suppressHydrationWarning={true}>
              <Calendar className="w-5 h-5 text-purple-600" />
              مواعيد قادمة
            </h2>

            {upcomingAppointments.length === 0 ? (
              <Card>
                <CardContent className="py-12">
                  <div className="text-center">
                    <ShieldCheck className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2" suppressHydrationWarning={true}>لا يوجد مواعيد قادمة حالياً</h3>
                    <p className="text-muted-foreground" suppressHydrationWarning={true}>
                      سيظهر هنا المواعيد القادمة مع المرضى
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {upcomingAppointments.map((appointment) => (
                  <Card key={appointment.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center">
                              <User className="w-5 h-5 text-purple-600" />
                            </div>
                            <div>
                              <CardTitle className="text-lg">{appointment.patientName}</CardTitle>
                              <CardDescription className="flex items-center gap-1">
                                <FileText className="w-3 h-3" />
                                {appointment.postTitle}
                              </CardDescription>
                            </div>
                          </div>
                          <div className="mt-2">{getStatusBadge(appointment.status)}</div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="w-4 h-4 text-purple-600" />
                        <span className="font-medium">{formatDate(appointment.scheduledAt)}</span>
                      </div>

                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground">
                          {appointment.location || appointment.caseAddress}
                        </span>
                      </div>

                      {appointment.duration && (
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="w-4 h-4 text-muted-foreground" />
                          <span className="text-muted-foreground" suppressHydrationWarning={true}>
                            المدة: {appointment.duration} دقيقة
                          </span>
                        </div>
                      )}

                      <div className="flex gap-2 pt-2 border-t">
                        <Button
                          onClick={() => handleOpenChat(appointment.caseId)}
                          variant="outline"
                          className="flex-1"
                          suppressHydrationWarning={true}
                        >
                          <MessageSquare className="w-4 h-4 ml-2" />
                          المحادثة
                        </Button>
                        <Button
                          onClick={() => router.push(`/posts/${appointment.postId}`)}
                          variant="outline"
                          className="flex-1"
                          suppressHydrationWarning={true}
                        >
                          <FileText className="w-4 h-4 ml-2" />
                          تفاصيل الحالة
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Past Appointments */}
          {appointments.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-muted-foreground" suppressHydrationWarning={true}>
                <Clock className="w-5 h-5" />
                المواعيد السابقة
              </h2>

              <div className="grid md:grid-cols-2 gap-4 opacity-60">
                {appointments
                  .filter(app => new Date(app.scheduledAt) <= now)
                  .map((appointment) => (
                    <Card key={appointment.id} className="border-dashed">
                      <CardHeader>
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                                <User className="w-5 h-5 text-gray-400" />
                              </div>
                              <div>
                                <CardTitle className="text-lg text-gray-600">{appointment.patientName}</CardTitle>
                                <CardDescription className="text-gray-400">
                                  {appointment.postTitle}
                                </CardDescription>
                              </div>
                            </div>
                            <div className="mt-2">{getStatusBadge(appointment.status)}</div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Calendar className="w-4 h-4" />
                          <span>{formatDate(appointment.scheduledAt)}</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
