'use client'

import { useCurrentUser } from '@/hooks/useCurrentUser'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Navigation } from '@/components/navigation'
import { Footer } from '@/components/footer'
import { useTranslations } from '@/hooks/useTranslations'
import {
  FileText,
  Users,
  CheckCircle2,
  TrendingUp,
  Award,
  Calendar,
  MessageCircle,
  Plus,
  Star,
  Zap,
  Loader2,
} from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'

interface Post {
  id: string
  title: string
  treatmentType: string
  status: string
  priority: string
  applicationsCount: number
  acceptedApplications: number
  requiredCount?: number | null
  city: string
  address: string
  createdAt: string
}

export default function StudentDashboard() {
  const { user, loading } = useCurrentUser()
  const { t, locale } = useTranslations()
  const isRTL = locale === 'ar'
  const userName = user?.name ? t('studentDashboard.doctor') + ' ' + user.name : t('studentDashboard.doctor') + ' User'

  // State for posts
  const [posts, setPosts] = useState<Post[]>([])
  const [loadingPosts, setLoadingPosts] = useState(true)
  const [activePostsCount, setActivePostsCount] = useState(0)

  // State for stats
  const [stats, setStats] = useState({
    totalCases: 0,
    completedCases: 0,
    activeCases: 0,
    rating: 0,
    points: 0,
    level: t('studentDashboard.achievements.badges.firstCase')
  })
  const [loadingStats, setLoadingStats] = useState(true)

  // State for applications
  const [pendingApplicationsCount, setPendingApplicationsCount] = useState(0)
  const [recentApplications, setRecentApplications] = useState<any[]>([])
  const [loadingApplications, setLoadingApplications] = useState(true)

  // State for appointments
  const [upcomingAppointmentsCount, setUpcomingAppointmentsCount] = useState(0)
  const [loadingAppointments, setLoadingAppointments] = useState(true)

  // Fetch posts from API
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoadingPosts(true)
        const response = await fetch('/api/posts/my-posts', {
          credentials: 'include'
        })

        if (!response.ok) {
          throw new Error(t('studentDashboard.errors.fetchPostsFailed'))
        }

        const data = await response.json()
        const activePosts = data.posts.filter((post: Post) => post.status === 'ACTIVE')
        setPosts(activePosts)
        setActivePostsCount(activePosts.length)
      } catch (error) {
        console.error('Error fetching posts:', error)
        setPosts([])
        setActivePostsCount(0)
      } finally {
        setLoadingPosts(false)
      }
    }

    // Fetch stats from API
    const fetchStats = async () => {
      try {
        setLoadingStats(true)
        const response = await fetch('/api/student/stats', {
          credentials: 'include'
        })

        if (!response.ok) {
          throw new Error(t('studentDashboard.errors.fetchStatsFailed'))
        }

        const data = await response.json()
        setStats(data.stats)
      } catch (error) {
        console.error('Error fetching stats:', error)
        // Keep default stats (all zeros) on error
      } finally {
        setLoadingStats(false)
      }
    }

    // Fetch applications from API
    const fetchApplications = async () => {
      try {
        setLoadingApplications(true)
        const response = await fetch('/api/student/applications', {
          credentials: 'include'
        })

        if (!response.ok) {
          throw new Error(t('studentDashboard.errors.fetchApplicationsFailed'))
        }

        const data = await response.json()
        setPendingApplicationsCount(data.pendingCount || 0)
        setRecentApplications(data.recentApplications || [])
      } catch (error) {
        console.error('Error fetching applications:', error)
        setPendingApplicationsCount(0)
        setRecentApplications([])
      } finally {
        setLoadingApplications(false)
      }
    }

    // Fetch appointments from API
    const fetchAppointments = async () => {
      try {
        setLoadingAppointments(true)
        const response = await fetch('/api/student/appointments', {
          credentials: 'include'
        })

        if (!response.ok) {
          throw new Error(t('studentDashboard.errors.fetchAppointmentsFailed'))
        }

        const data = await response.json()
        setUpcomingAppointmentsCount(data.upcomingCount || 0)
      } catch (error) {
        console.error('Error fetching appointments:', error)
        setUpcomingAppointmentsCount(0)
      } finally {
        setLoadingAppointments(false)
      }
    }

    fetchPosts()
    fetchStats()
    fetchApplications()
    fetchAppointments()
  }, [])

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return <Badge className="bg-red-100 text-red-700 hover:bg-red-200">{t('studentDashboard.priority.urgent')}</Badge>
      case 'MEDIUM':
        return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-200">{t('studentDashboard.priority.medium')}</Badge>
      default:
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-200">{t('studentDashboard.priority.normal')}</Badge>
    }
  }

  const getTreatmentTypeLabel = (type: string) => {
    const types: { [key: string]: string } = {
      FILLING: t('studentDashboard.treatmentTypes.FILLING'),
      EXTRACTION: t('studentDashboard.treatmentTypes.EXTRACTION'),
      CLEANING: t('studentDashboard.treatmentTypes.CLEANING'),
      ROOT_CANAL: t('studentDashboard.treatmentTypes.ROOT_CANAL'),
      PROSTHETICS: t('studentDashboard.treatmentTypes.PROSTHETICS'),
      ORTHODONTICS: t('studentDashboard.treatmentTypes.ORTHODONTICS'),
      SURGERY: t('studentDashboard.treatmentTypes.SURGERY'),
      PERIODONTAL: t('studentDashboard.treatmentTypes.PERIODONTAL'),
      WHITENING: t('studentDashboard.treatmentTypes.WHITENING'),
      X_RAY: t('studentDashboard.treatmentTypes.X_RAY'),
    }
    return types[type] || type
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation user={user ? { id: user.id, name: user.name || 'مستخدم', email: user.email || '', role: user.role || 'STUDENT', avatar: user.avatarUrl } : undefined} />

      <main className="flex-1 py-8 px-4 bg-muted/30">
        <div className="container mx-auto max-w-7xl">
          {/* Header */}
          <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold mb-2" suppressHydrationWarning={true}>
                {t('studentDashboard.welcome')} {userName} <span suppressHydrationWarning={true}>👨‍⚕️</span>
              </h1>
              <p className="text-muted-foreground" suppressHydrationWarning={true}>
                {t('studentDashboard.subtitle')}
              </p>
            </div>
            <Button asChild className="bg-gradient-to-r from-emerald-800 to-teal-900 hover:from-emerald-700 hover:to-teal-700">
              <Link href="/posts/create">
                <Plus className={`w-4 h-4 ${isRTL ? 'mr-2' : 'ml-2'}`} />
                <span suppressHydrationWarning={true}>{t('studentDashboard.createPost')}</span>
              </Link>
            </Button>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
            <Card className="bg-gradient-to-br from-emerald-50 to-teal-100 border-2 border-teal-200 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader className="pb-3">
                <CardDescription className="text-xs text-teal-700" suppressHydrationWarning={true}>
                  {t('studentDashboard.stats.totalCases')}
                </CardDescription>
                <CardTitle className="text-2xl text-teal-900">
                  {loadingStats ? <Skeleton className="h-8 w-12" /> : stats.totalCases}
                </CardTitle>
              </CardHeader>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-emerald-100 border-2 border-emerald-200 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader className="pb-3">
                <CardDescription className="text-xs text-emerald-700" suppressHydrationWarning={true}>{t('studentDashboard.stats.completed')}</CardDescription>
                <CardTitle className="text-2xl text-emerald-800">
                  {loadingStats ? <Skeleton className="h-8 w-12" /> : stats.completedCases}
                </CardTitle>
              </CardHeader>
            </Card>

            <Card className="bg-gradient-to-br from-blue-50 to-sky-100 border-2 border-sky-200 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader className="pb-3">
                <CardDescription className="text-xs text-sky-700" suppressHydrationWarning={true}>{t('studentDashboard.stats.active')}</CardDescription>
                <CardTitle className="text-2xl text-sky-800">
                  {loadingStats ? <Skeleton className="h-8 w-12" /> : stats.activeCases}
                </CardTitle>
              </CardHeader>
            </Card>

            <Card className="bg-gradient-to-br from-amber-50 to-yellow-100 border-2 border-amber-200 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader className="pb-3">
                <CardDescription className="text-xs text-amber-700" suppressHydrationWarning={true}>{t('studentDashboard.stats.rating')}</CardDescription>
                <CardTitle className="text-2xl text-amber-800 flex items-center gap-1">
                  {loadingStats ? <Skeleton className="h-8 w-12" /> : (
                    <>
                      <Star className="w-5 h-5 fill-amber-500" />
                      {stats.rating > 0 ? stats.rating : '-'}
                    </>
                  )}
                </CardTitle>
              </CardHeader>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-violet-100 border-2 border-violet-200 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader className="pb-3">
                <CardDescription className="text-xs text-violet-700" suppressHydrationWarning={true}>{t('studentDashboard.stats.points')}</CardDescription>
                <CardTitle className="text-2xl text-violet-800 flex items-center gap-1">
                  {loadingStats ? <Skeleton className="h-8 w-12" /> : (
                    <>
                      <Zap className="w-5 h-5 text-violet-600" />
                      {stats.points}
                    </>
                  )}
                </CardTitle>
              </CardHeader>
            </Card>

            <Card className="bg-gradient-to-br from-rose-50 to-pink-100 border-2 border-rose-200 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader className="pb-3">
                <CardDescription className="text-xs text-rose-700" suppressHydrationWarning={true}>{t('studentDashboard.stats.level')}</CardDescription>
                <CardTitle className="text-xl text-rose-900">
                  {loadingStats ? <Skeleton className="h-6 w-16" /> : stats.level}
                </CardTitle>
              </CardHeader>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="grid md:grid-cols-4 gap-4 mb-8">
            <Card className="bg-gradient-to-br from-emerald-50 to-teal-100 border-2 border-teal-200 shadow-lg hover:shadow-xl hover:border-teal-400 transition-all duration-300 cursor-pointer">
              <Link href="/posts">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-emerald-600 to-teal-700 rounded-lg flex items-center justify-center shadow-md">
                      <FileText className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm text-teal-900" suppressHydrationWarning={true}>{t('studentDashboard.quickActions.myPosts')}</h3>
                      <p className="text-xs text-teal-700">{activePostsCount} {t('studentDashboard.quickActions.active')}</p>
                    </div>
                  </div>
                </CardContent>
              </Link>
            </Card>

            <Card className="bg-gradient-to-br from-blue-50 to-sky-100 border-2 border-sky-200 shadow-lg hover:shadow-xl hover:border-sky-400 transition-all duration-300 cursor-pointer">
              <Link href="/applications">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-sky-600 rounded-lg flex items-center justify-center shadow-md">
                      <Users className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm text-sky-900" suppressHydrationWarning={true}>{t('studentDashboard.quickActions.applications')}</h3>
                      <p className="text-xs text-sky-700">{loadingApplications ? '-' : pendingApplicationsCount} {t('studentDashboard.quickActions.new')}</p>
                    </div>
                  </div>
                </CardContent>
              </Link>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-violet-100 border-2 border-violet-200 shadow-lg hover:shadow-xl hover:border-violet-400 transition-all duration-300 cursor-pointer">
              <Link href="/appointments">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-violet-600 rounded-lg flex items-center justify-center shadow-md">
                      <Calendar className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm text-violet-900" suppressHydrationWarning={true}>{t('studentDashboard.quickActions.appointments')}</h3>
                      <p className="text-xs text-violet-700">{loadingAppointments ? '-' : upcomingAppointmentsCount} {t('studentDashboard.quickActions.upcoming')}</p>
                    </div>
                  </div>
                </CardContent>
              </Link>
            </Card>

            <Card className="bg-gradient-to-br from-amber-50 to-orange-100 border-2 border-amber-200 shadow-lg hover:shadow-xl hover:border-amber-400 transition-all duration-300 cursor-pointer">
              <Link href="/chat">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg flex items-center justify-center shadow-md">
                      <MessageCircle className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm text-amber-900" suppressHydrationWarning={true}>{t('studentDashboard.quickActions.chats')}</h3>
                      <p className="text-xs text-amber-700">{loadingStats ? '-' : stats.activeCases} {t('studentDashboard.quickActions.active')}</p>
                    </div>
                  </div>
                </CardContent>
              </Link>
            </Card>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* My Posts */}
            <div className="lg:col-span-2">
              <Card className="bg-gradient-to-br from-teal-50 to-emerald-100 border-2 border-emerald-200 shadow-lg">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-emerald-900" suppressHydrationWarning={true}>{t('studentDashboard.myPosts.title')}</CardTitle>
                      <CardDescription className="text-emerald-700" suppressHydrationWarning={true}>{t('studentDashboard.myPosts.description')}</CardDescription>
                    </div>
                    <Button variant="outline" size="sm" className="border-emerald-300 text-emerald-700 hover:bg-emerald-100" asChild>
                      <Link href="/posts">{t('studentDashboard.myPosts.viewAll')}</Link>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {loadingPosts ? (
                    <div className="space-y-4">
                      {[1, 2].map((i) => (
                        <div key={i} className="bg-gradient-to-br from-teal-50/50 to-emerald-50/50 border-2 border-emerald-200 rounded-lg p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="space-y-2 flex-1">
                              <Skeleton className="h-6 w-3/4" />
                              <Skeleton className="h-4 w-1/2" />
                              <Skeleton className="h-4 w-2/3" />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : posts.length === 0 ? (
                    <div className="text-center py-12">
                      <FileText className="w-16 h-16 mx-auto mb-4 text-teal-300" />
                      <h3 className="text-lg font-semibold text-teal-900 mb-2" suppressHydrationWarning={true}>
                        {t('studentDashboard.myPosts.noActivePosts')}
                      </h3>
                      <p className="text-sm text-teal-700 mb-6" suppressHydrationWarning={true}>
                        {t('studentDashboard.myPosts.noActivePostsDesc')}
                      </p>
                      <Button asChild className="bg-gradient-to-r from-emerald-700 to-teal-800 hover:from-emerald-600 hover:to-teal-700">
                        <Link href="/posts/create">
                          <Plus className={`w-4 h-4 ${isRTL ? 'mr-2' : 'ml-2'}`} />
                          {t('studentDashboard.createPost')}
                        </Link>
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {posts.map((post) => (
                        <Card key={post.id} className="bg-gradient-to-br from-teal-50 to-emerald-100 border-2 border-emerald-200 shadow-md hover:shadow-lg transition-all duration-300">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between gap-4">
                              <div className="space-y-2 flex-1">
                                <div className="flex items-center gap-2">
                                  <h3 className="font-semibold text-teal-900">{post.title}</h3>
                                  {getPriorityBadge(post.priority)}
                                  <Badge variant="outline" className="bg-emerald-50 border-emerald-300 text-emerald-700">
                                    {getTreatmentTypeLabel(post.treatmentType)}
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-4 text-sm text-teal-700">
                                  <span>{t('studentDashboard.myPosts.location')} {post.city} - {post.address}</span>
                                  <span>{t('studentDashboard.myPosts.date')} {formatDate(post.createdAt)}</span>
                                </div>
                                <div className="flex items-center gap-4 text-sm text-teal-800">
                                  <div className="flex items-center gap-1">
                                    <Users className="w-4 h-4 text-emerald-600" />
                                    <span>{post.applicationsCount} {t('studentDashboard.myPosts.applications')}</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                    <span>{post.acceptedApplications}{post.requiredCount ? `/${post.requiredCount}` : ''} {t('studentDashboard.myPosts.accepted')}</span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Button size="sm" variant="outline" className="border-emerald-300 text-emerald-700 hover:bg-emerald-100" asChild>
                                  <Link href={`/posts/${post.id}`}>{t('studentDashboard.myPosts.view')}</Link>
                                </Button>
                                <Button size="sm" variant="outline" className="border-emerald-300 text-emerald-700 hover:bg-emerald-100" asChild>
                                  <Link href={`/posts/${post.id}/applications`}>
                                    <span suppressHydrationWarning={true}>{t('studentDashboard.myPosts.viewApplications')}</span>
                                  </Link>
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Recent Applications & Gamification */}
            <div className="space-y-6">
              {/* Recent Applications */}
              <Card className="bg-gradient-to-br from-amber-50 to-orange-100 border-2 border-amber-200 shadow-lg">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base text-amber-900 flex items-center gap-2" suppressHydrationWarning={true}>
                      <Users className="w-5 h-5 text-amber-600" />
                      {t('studentDashboard.recentApplications.title')}
                    </CardTitle>
                    <Badge variant="secondary" className="bg-amber-100 text-amber-700 border-amber-300">{loadingApplications ? '-' : pendingApplicationsCount}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {loadingApplications ? (
                    <div className="space-y-3">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="p-3 bg-gradient-to-br from-amber-50/50 to-orange-50/50 border border-amber-200 rounded-lg">
                          <Skeleton className="h-4 w-3/4 mb-2" />
                          <Skeleton className="h-3 w-1/2" />
                        </div>
                      ))}
                    </div>
                  ) : recentApplications.length === 0 ? (
                    <div className="text-center py-6">
                      <Users className="w-12 h-12 mx-auto mb-3 text-amber-300" />
                      <p className="text-sm text-amber-700" suppressHydrationWarning={true}>{t('studentDashboard.recentApplications.noNewApplications')}</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {recentApplications.slice(0, 4).map((app) => (
                        <div key={app.id} className="flex items-center justify-between p-3 bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-lg hover:shadow-md hover:border-amber-300 transition-all duration-300 cursor-pointer" onClick={() => window.location.href = `/posts/${app.postId}/applications`}>
                          <div className="space-y-1">
                            <p className="font-medium text-sm text-amber-900">{app.patientName}</p>
                            <p className="text-xs text-amber-700">{app.postTitle}</p>
                          </div>
                          <div className="text-left">
                            <p className="text-xs text-amber-700">{app.timeAgo}</p>
                            {app.status === 'PENDING' && (
                              <Badge className="bg-amber-200 text-amber-800 mt-1 border-amber-300">{t('studentDashboard.quickActions.new')}</Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Gamification */}
              <Card className="bg-gradient-to-br from-purple-50 to-violet-100 border-2 border-violet-200 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2 text-violet-900" suppressHydrationWarning={true}>
                    <Award className="w-5 h-5 text-violet-600" />
                    {t('studentDashboard.achievements.title')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between text-sm mb-2 text-violet-800">
                        <span>{t('studentDashboard.achievements.level')} {loadingStats ? '...' : stats.level}</span>
                        <span>{loadingStats ? '...' : stats.points} {t('studentDashboard.achievements.points')}</span>
                      </div>
                      <div className="w-full bg-violet-100 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-violet-500 to-violet-700 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${Math.min((stats.points / 300) * 100, 100)}%` }}
                        />
                      </div>
                      <p className="text-xs text-violet-700 mt-1">
                        {stats.points < 100 && t('studentDashboard.achievements.levels.beginner')}
                        {stats.points >= 100 && stats.points < 300 && t('studentDashboard.achievements.levels.intermediate')}
                        {stats.points >= 300 && t('studentDashboard.achievements.levels.advanced')}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm font-medium mb-2 text-violet-900" suppressHydrationWarning={true}>{t('studentDashboard.achievements.badgesEarned')}</p>
                      <div className="flex flex-wrap gap-2">
                        {stats.points >= 10 && (
                          <Badge variant="outline" className="bg-gradient-to-br from-amber-50 to-yellow-100 border-2 border-amber-300 text-amber-800 shadow-sm" suppressHydrationWarning={true}>
                            <Award className={`w-3 h-3 ${isRTL ? 'ml-1' : 'mr-1'} text-amber-600`} />
                            {t('studentDashboard.achievements.badges.firstCase')}
                          </Badge>
                        )}
                        {stats.points >= 50 && (
                          <Badge variant="outline" className="bg-gradient-to-br from-amber-50 to-yellow-100 border-2 border-amber-300 text-amber-800 shadow-sm" suppressHydrationWarning={true}>
                            <Award className={`w-3 h-3 ${isRTL ? 'ml-1' : 'mr-1'} text-amber-600`} />
                            {t('studentDashboard.achievements.badges.risingStar')}
                          </Badge>
                        )}
                        {stats.points >= 100 && (
                          <Badge variant="outline" className="bg-gradient-to-br from-amber-50 to-yellow-100 border-2 border-amber-300 text-amber-800 shadow-sm" suppressHydrationWarning={true}>
                            <Award className={`w-3 h-3 ${isRTL ? 'ml-1' : 'mr-1'} text-amber-600`} />
                            {t('studentDashboard.achievements.badges.professional')}
                          </Badge>
                        )}
                        {stats.points >= 300 && (
                          <Badge variant="outline" className="bg-gradient-to-br from-amber-50 to-yellow-100 border-2 border-amber-300 text-amber-800 shadow-sm" suppressHydrationWarning={true}>
                            <Award className={`w-3 h-3 ${isRTL ? 'ml-1' : 'mr-1'} text-amber-600`} />
                            {t('studentDashboard.achievements.badges.expert')}
                          </Badge>
                        )}
                        {stats.points === 0 && (
                          <p className="text-xs text-violet-700" suppressHydrationWarning={true}>{t('studentDashboard.achievements.earnFirstBadges')}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
