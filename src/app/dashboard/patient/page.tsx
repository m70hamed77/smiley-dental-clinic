'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Navigation } from '@/components/navigation'
import { Footer } from '@/components/footer'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { useTranslations } from '@/hooks/useTranslations'
import {
  Calendar,
  Clock,
  FileText,
  MessageCircle,
  Search,
  CheckCircle2,
  XCircle,
  Lock,
  AlertCircle,
  Star,
  User,
  RefreshCw,
} from 'lucide-react'
import Link from 'next/link'

interface Application {
  id: string
  postId: string
  postTitle: string
  postCity: string
  postAddress: string
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'LOCKED'
  createdAt: string
  studentName: string
  studentRating?: number
  studentAvatar?: string | null
}

interface PatientStats {
  totalApplications: number
  pendingApplications: number
  acceptedApplications: number
  rejectedApplications: number
  completedTreatments: number
}

export default function PatientDashboard() {
  const { user, loading: userLoading } = useCurrentUser()
  const { t, locale, loading: i18nLoading } = useTranslations()
  const isRTL = locale === 'ar'

  const [applications, setApplications] = useState<Application[]>([])
  const [stats, setStats] = useState<PatientStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Fetch applications and stats
  const fetchData = async () => {
    if (!user) return

    try {
      setLoading(true)

      // Fetch patient stats
      const statsResponse = await fetch('/api/patient/stats', {
        credentials: 'include'
      })
      const statsData = await statsResponse.json()
      if (statsData.success) {
        setStats(statsData.stats)
      }

      // Fetch applications
      const appsResponse = await fetch('/api/patient/applications', {
        credentials: 'include'
      })
      const appsData = await appsResponse.json()
      if (appsData.success) {
        setApplications(appsData.applications || [])
      }
    } catch (err: any) {
      console.error('Error fetching data:', err)
      setError(t('patientDashboard.error'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [user])

  const getStatusBadge = (status: string) => {
    const iconClass = `w-3 h-3 ${isRTL ? 'ml-1' : 'mr-1'}`
    switch (status) {
      case 'ACCEPTED':
        return (
          <Badge className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-600 hover:to-teal-600 border-2 border-emerald-300 shadow-md hover:shadow-lg transition-all duration-300">
            <CheckCircle2 className={iconClass} />
            {t('patientDashboard.status.accepted')}
          </Badge>
        )
      case 'PENDING':
        return (
          <Badge className="bg-gradient-to-r from-amber-400 to-orange-400 text-white hover:from-amber-500 hover:to-orange-500 border-2 border-amber-300 shadow-md hover:shadow-lg transition-all duration-300">
            <Clock className={iconClass} />
            {t('patientDashboard.status.pending')}
          </Badge>
        )
      case 'LOCKED':
        return (
          <Badge className="bg-gradient-to-r from-slate-400 to-slate-500 text-white hover:from-slate-500 hover:to-slate-600 border-2 border-slate-300 shadow-md hover:shadow-lg transition-all duration-300">
            <Lock className={iconClass} />
            {t('patientDashboard.status.locked')}
          </Badge>
        )
      case 'REJECTED':
        return (
          <Badge className="bg-gradient-to-r from-rose-500 to-red-500 text-white hover:from-rose-600 hover:to-red-600 border-2 border-rose-300 shadow-md hover:shadow-lg transition-all duration-300">
            <XCircle className={iconClass} />
            {t('patientDashboard.status.rejected')}
          </Badge>
        )
      case 'COMPLETED':
        return (
          <Badge className="bg-gradient-to-r from-blue-500 to-sky-500 text-white hover:from-blue-600 hover:to-sky-600 border-2 border-blue-300 shadow-md hover:shadow-lg transition-all duration-300">
            <CheckCircle2 className={iconClass} />
            {t('patientDashboard.status.completed')}
          </Badge>
        )
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const localeDate = locale === 'ar' ? 'ar-EG' : 'en-US'
    return date.toLocaleDateString(localeDate, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  // Show loading state
  if (userLoading || loading) {
    return (
      <div className="min-h-screen flex flex-col">
      <Navigation user={user ? { id: user.id, name: user.name, email: user.email, role: user.role as 'PATIENT', avatar: user.avatarUrl } : undefined} />
        <main className="flex-1 py-8 px-4 bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
          <div className="container mx-auto max-w-7xl">
            <div className="bg-gradient-to-br from-teal-50 to-emerald-100 border-2 border-teal-200 rounded-2xl p-12 shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="text-center">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-emerald-200 border-t-emerald-600 mx-auto mb-6"></div>
                <p className="text-lg text-emerald-800 font-medium">{t('patientDashboard.loading')}</p>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50" suppressHydrationWarning={true}>
      <Navigation user={user ? { id: user.id, name: user.name, email: user.email, role: user.role as 'PATIENT', avatar: user.avatarUrl } : undefined} />

      <main className="flex-1 py-8 px-4">
        <div className="container mx-auto max-w-7xl">
          {/* Header */}
          <div className="bg-gradient-to-br from-teal-50 via-emerald-50 to-green-100 border-2 border-teal-200 rounded-2xl p-8 mb-8 shadow-lg hover:shadow-xl transition-all duration-300">
            <h1 className="text-4xl font-bold mb-3 text-emerald-800" suppressHydrationWarning={true}>
              {t('patientDashboard.welcome')} {user?.name} <span suppressHydrationWarning={true}>👋</span>
            </h1>
            <p className="text-emerald-700 text-lg" suppressHydrationWarning={true}>
              {t('patientDashboard.subtitle')}
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {/* Pending Applications */}
            <div className="bg-gradient-to-br from-amber-50 to-orange-100 border-2 border-amber-200 rounded-xl p-6 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-default">
              <div className="flex flex-col">
                <p className="text-sm font-medium text-amber-700 mb-2" suppressHydrationWarning={true}>
                  {t('patientDashboard.stats.pending')}
                </p>
                <p className="text-4xl font-bold text-amber-800">{stats?.pendingApplications || 0}</p>
                <div className="mt-3 w-12 h-1 bg-gradient-to-r from-amber-400 to-orange-400 rounded-full"></div>
              </div>
            </div>

            {/* Active Applications */}
            <div className="bg-gradient-to-br from-emerald-50 to-teal-100 border-2 border-emerald-200 rounded-xl p-6 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-default">
              <div className="flex flex-col">
                <p className="text-sm font-medium text-emerald-700 mb-2" suppressHydrationWarning={true}>
                  {t('patientDashboard.stats.active')}
                </p>
                <p className="text-4xl font-bold text-emerald-800">{stats?.acceptedApplications || 0}</p>
                <div className="mt-3 w-12 h-1 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full"></div>
              </div>
            </div>

            {/* Rejected Applications */}
            <div className="bg-gradient-to-br from-rose-50 to-red-100 border-2 border-rose-200 rounded-xl p-6 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-default">
              <div className="flex flex-col">
                <p className="text-sm font-medium text-rose-700 mb-2" suppressHydrationWarning={true}>
                  {t('patientDashboard.stats.rejected')}
                </p>
                <p className="text-4xl font-bold text-rose-800">{stats?.rejectedApplications || 0}</p>
                <div className="mt-3 w-12 h-1 bg-gradient-to-r from-rose-400 to-red-400 rounded-full"></div>
              </div>
            </div>

            {/* Completed Treatments */}
            <div className="bg-gradient-to-br from-blue-50 to-sky-100 border-2 border-blue-200 rounded-xl p-6 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-default">
              <div className="flex flex-col">
                <p className="text-sm font-medium text-blue-700 mb-2" suppressHydrationWarning={true}>
                  {t('patientDashboard.stats.completed')}
                </p>
                <p className="text-4xl font-bold text-blue-800">{stats?.completedTreatments || 0}</p>
                <div className="mt-3 w-12 h-1 bg-gradient-to-r from-blue-400 to-sky-400 rounded-full"></div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            {/* Search Cases */}
            <Link href="/search" className="group">
              <div className="bg-gradient-to-br from-emerald-50 to-teal-100 border-2 border-emerald-200 rounded-xl p-6 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer h-full">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300">
                    <Search className="w-7 h-7 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-emerald-800 text-lg mb-1" suppressHydrationWarning={true}>
                      {t('patientDashboard.quickActions.searchCases')}
                    </h3>
                    <p className="text-sm text-emerald-700" suppressHydrationWarning={true}>
                      {t('patientDashboard.quickActions.searchCasesDesc')}
                    </p>
                  </div>
                </div>
              </div>
            </Link>

            {/* Chats */}
            <Link href="/chat" className="group">
              <div className="bg-gradient-to-br from-blue-50 to-sky-100 border-2 border-blue-200 rounded-xl p-6 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer h-full">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-sky-500 rounded-xl flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300">
                    <MessageCircle className="w-7 h-7 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-blue-800 text-lg mb-1" suppressHydrationWarning={true}>
                      {t('patientDashboard.quickActions.chats')}
                    </h3>
                    <p className="text-sm text-blue-700" suppressHydrationWarning={true}>
                      {t('patientDashboard.quickActions.chatsDesc')}
                    </p>
                  </div>
                </div>
              </div>
            </Link>

            {/* My Profile */}
            <Link href="/profile" className="group">
              <div className="bg-gradient-to-br from-purple-50 to-violet-100 border-2 border-purple-200 rounded-xl p-6 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer h-full">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-violet-500 rounded-xl flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300">
                    <User className="w-7 h-7 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-purple-800 text-lg mb-1" suppressHydrationWarning={true}>
                      {t('patientDashboard.quickActions.myProfile')}
                    </h3>
                    <p className="text-sm text-purple-700" suppressHydrationWarning={true}>
                      {t('patientDashboard.quickActions.myProfileDesc')}
                    </p>
                  </div>
                </div>
              </div>
            </Link>

            {/* Refresh Data */}
            <Button
              onClick={() => {
                fetchData()
              }}
              variant="outline"
              className="w-full h-full bg-gradient-to-br from-rose-50 to-pink-100 border-2 border-rose-200 rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 p-6 group"
              disabled={loading}
            >
              <div className="flex items-center gap-4 w-full">
                <div className="w-14 h-14 bg-gradient-to-br from-rose-500 to-pink-500 rounded-xl flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300">
                  <RefreshCw className={`w-7 h-7 text-white ${loading ? 'animate-spin' : ''}`} />
                </div>
                <div className={isRTL ? 'text-right flex-1' : 'text-left flex-1'}>
                  <h3 className="font-bold text-rose-800 text-lg mb-1" suppressHydrationWarning={true}>
                    {t('patientDashboard.quickActions.refreshData')}
                  </h3>
                  <p className="text-sm text-rose-700" suppressHydrationWarning={true}>
                    {loading ? t('patientDashboard.quickActions.refreshing') : t('patientDashboard.quickActions.refreshDesc')}
                  </p>
                </div>
              </div>
            </Button>
          </div>

          {/* Applications List */}
          <div className="bg-gradient-to-br from-indigo-50 to-purple-100 border-2 border-indigo-200 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="p-6 border-b-2 border-indigo-200">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-indigo-800 mb-2" suppressHydrationWarning={true}>
                    {t('patientDashboard.myCases.title')}
                  </h2>
                  <p className="text-indigo-700" suppressHydrationWarning={true}>
                    {t('patientDashboard.myCases.description')}
                  </p>
                </div>
                <Button asChild className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white border-2 border-indigo-300 shadow-md hover:shadow-lg transition-all duration-300">
                  <Link href="/search" suppressHydrationWarning={true}>
                    <Search className={`w-5 h-5 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                    {t('patientDashboard.myCases.searchButton')}
                  </Link>
                </Button>
              </div>
            </div>
            <div className="p-6">
              {error && (
                <div className="mb-4 p-4 bg-gradient-to-r from-rose-50 to-red-50 border-2 border-rose-300 rounded-xl shadow-md">
                  <p className="text-sm text-rose-800 font-medium">{error}</p>
                </div>
              )}

              <div className="space-y-4">
                {applications.length === 0 ? (
                  <div className="bg-gradient-to-br from-slate-50 to-gray-100 border-2 border-slate-200 rounded-xl p-12 text-center shadow-md">
                    <FileText className="w-20 h-20 mx-auto text-slate-400 mb-6" />
                    <h3 className="text-xl font-bold text-slate-700 mb-3" suppressHydrationWarning={true}>
                      {t('patientDashboard.myCases.noApplications')}
                    </h3>
                    <p className="text-slate-600 mb-6" suppressHydrationWarning={true}>
                      {t('patientDashboard.myCases.noApplicationsDesc')}
                    </p>
                    <Button asChild className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white border-2 border-indigo-300 shadow-md hover:shadow-lg transition-all duration-300">
                      <Link href="/search" suppressHydrationWarning={true}>
                        <Search className={`w-5 h-5 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                        {t('patientDashboard.myCases.searchButton')}
                      </Link>
                    </Button>
                  </div>
                ) : (
                  applications.map((app) => (
                    <div key={app.id} className="bg-gradient-to-br from-white to-slate-50 border-2 border-slate-200 rounded-xl p-6 shadow-lg hover:shadow-xl hover:border-indigo-300 transition-all duration-300 hover:-translate-y-1">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-start gap-4 flex-1">
                          <div className="w-14 h-14 bg-gradient-to-br from-indigo-400 to-purple-400 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
                            <FileText className="w-7 h-7 text-white" />
                          </div>
                          <div className="space-y-2 flex-1">
                            <h3 className="font-bold text-xl text-slate-800">{app.postTitle}</h3>
                            <div className="flex items-center gap-2 text-sm text-slate-700">
                              <span className="font-medium text-indigo-700">{app.studentName}</span>
                              {app.studentRating && (
                                <>
                                  <span className="text-slate-400">•</span>
                                  <div className="flex items-center gap-1 bg-gradient-to-r from-amber-100 to-yellow-100 px-2 py-1 rounded-full">
                                    <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                                    <span className="font-bold text-amber-700">{app.studentRating}</span>
                                  </div>
                                </>
                              )}
                            </div>
                            <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
                              <span className="bg-gradient-to-r from-blue-50 to-sky-100 px-3 py-1 rounded-full border border-blue-200">
                                📍 {app.postCity} - {app.postAddress}
                              </span>
                              <span className="bg-gradient-to-r from-teal-50 to-emerald-100 px-3 py-1 rounded-full border border-teal-200">
                                📅 {formatDate(app.createdAt)}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          {getStatusBadge(app.status)}
                          {app.status === 'ACCEPTED' && (
                            <Button size="sm" asChild className="bg-gradient-to-r from-blue-500 to-sky-500 hover:from-blue-600 hover:to-sky-600 text-white border-2 border-blue-300 shadow-md hover:shadow-lg transition-all duration-300">
                              <Link href={`/chat`}>
                                <MessageCircle className={`w-4 h-4 ${isRTL ? 'ml-1' : 'mr-1'}`} />
                                {t('patientDashboard.myCases.chat')}
                              </Link>
                            </Button>
                          )}
                          {app.status === 'LOCKED' && (
                            <div className="bg-gradient-to-r from-slate-50 to-gray-100 px-3 py-2 rounded-lg border border-slate-300">
                              <AlertCircle className={`w-4 h-4 inline-block text-slate-600 ${isRTL ? 'ml-1' : 'mr-1'}`} />
                              <span className="text-sm text-slate-700">{t('patientDashboard.myCases.lockedReason')}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
