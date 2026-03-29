'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import {
  FileText,
  Users,
  CheckCircle,
  Clock,
  AlertCircle,
  Plus,
  Eye,
  MessageSquare,
  MapPin,
  Calendar,
  ArrowLeft
} from 'lucide-react'

interface Post {
  id: string
  title: string
  treatmentType: string
  description?: string
  city: string
  address: string
  priority: string
  status: string
  requiredCount?: number | null
  acceptedCount: number
  createdAt: string
  updatedAt: string
  applicationsCount: number
  pendingApplications: number
  acceptedApplications: number
  rejectedApplications: number
  lockedApplications: number
}

interface Stats {
  totalPosts: number
  activePosts: number
  totalApplications: number
  acceptedPatients: number
}

interface Response {
  success: boolean
  posts: Post[]
  stats: Stats
}

export default function MyPostsPage() {
  const router = useRouter()
  const [posts, setPosts] = useState<Post[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const treatmentTypeMap: { [key: string]: string } = {
    FILLING: 'حشو',
    EXTRACTION: 'خلع',
    CLEANING: 'تنظيف',
    ROOT_CANAL: 'علاج عصب',
    PROSTHETICS: 'تركيبات',
    ORTHODONTICS: 'تقويم',
    SURGERY: 'جراحة',
    PERIODONTAL: 'علاج لثة',
    WHITENING: 'تبييض',
    X_RAY: 'أشعة',
  }

  const priorityMap: { [key: string]: { label: string; color: string } } = {
    NORMAL: { label: 'عادي', color: 'bg-blue-500' },
    MEDIUM: { label: 'متوسط', color: 'bg-yellow-500' },
    URGENT: { label: 'عاجل', color: 'bg-red-500' },
  }

  const statusMap: { [key: string]: { label: string; color: string } } = {
    ACTIVE: { label: 'نشط', color: 'bg-green-500' },
    COMPLETED: { label: 'مكتمل', color: 'bg-gray-500' },
    ARCHIVED: { label: 'مؤرشف', color: 'bg-gray-400' },
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const fetchPosts = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/posts/my-posts', {
        credentials: 'include' // مهم لإرسال cookies
      })

      if (!response.ok) {
        throw new Error('فشل في جلب البوستات')
      }

      const data: Response = await response.json()
      setPosts(data.posts)
      setStats(data.stats)
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء جلب البوستات')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPosts()
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/dashboard/student">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white" suppressHydrationWarning={true}>بوستاتي</h1>
                <p className="text-sm text-gray-600 dark:text-gray-400" suppressHydrationWarning={true}>إدارة حالاتك ونشراتك الطبية</p>
              </div>
            </div>
            <Link href="/posts/create">
              <Button className="gap-2" suppressHydrationWarning={true}>
                <Plus className="h-4 w-4" />
                إنشاء بوست جديد
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {loading ? (
          <div className="space-y-6">
            {/* Stats Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-32" />
              ))}
            </div>
            {/* Posts Skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {[1, 2].map((i) => (
                <Skeleton key={i} className="h-80" />
              ))}
            </div>
          </div>
        ) : error ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : (
          <>
            {/* Quick Stats */}
            {stats && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <Card className="border-l-4 border-l-blue-500">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400" suppressHydrationWarning={true}>
                      إجمالي البوستات
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-3">
                      <FileText className="h-8 w-8 text-blue-500" />
                      <div>
                        <div className="text-3xl font-bold text-gray-900 dark:text-white">
                          {stats.totalPosts}
                        </div>
                        <p className="text-xs text-gray-500">منشوراتك</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-green-500">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400" suppressHydrationWarning={true}>
                      البوستات النشطة
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-3">
                      <Clock className="h-8 w-8 text-green-500" />
                      <div>
                        <div className="text-3xl font-bold text-gray-900 dark:text-white">
                          {stats.activePosts}
                        </div>
                        <p className="text-xs text-gray-500">نشط حالياً</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-yellow-500">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400" suppressHydrationWarning={true}>
                      إجمالي الطلبات
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-3">
                      <Users className="h-8 w-8 text-yellow-500" />
                      <div>
                        <div className="text-3xl font-bold text-gray-900 dark:text-white">
                          {stats.totalApplications}
                        </div>
                        <p className="text-xs text-gray-500">طلب مقدم</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-purple-500">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400" suppressHydrationWarning={true}>
                      المرضى المقبولين
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-8 w-8 text-purple-500" />
                      <div>
                        <div className="text-3xl font-bold text-gray-900 dark:text-white">
                          {stats.acceptedPatients}
                        </div>
                        <p className="text-xs text-gray-500">تم قبولهم</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Posts List */}
            {posts.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  <FileText className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2" suppressHydrationWarning={true}>
                    لا توجد بوستات بعد
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6" suppressHydrationWarning={true}>
                    ابدأ بنشر حالتك الطبية الأولى للتواصل مع المرضى
                  </p>
                  <Link href="/posts/create">
                    <Button className="gap-2" suppressHydrationWarning={true}>
                      <Plus className="h-4 w-4" />
                      إنشاء بوست جديد
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {posts.map((post) => {
                  const priorityInfo = priorityMap[post.priority] || priorityMap.NORMAL
                  const statusInfo = statusMap[post.status] || statusMap.ACTIVE
                  const treatmentLabel = treatmentTypeMap[post.treatmentType] || post.treatmentType

                  // حساب نسبة التقدم
                  const progressPercentage = post.requiredCount
                    ? Math.min((post.acceptedCount / post.requiredCount) * 100, 100)
                    : 0

                  return (
                    <Card key={post.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <CardTitle className="text-xl mb-2">{post.title}</CardTitle>
                            <CardDescription className="flex flex-wrap items-center gap-2">
                              <Badge variant="outline">{treatmentLabel}</Badge>
                              <Badge className={`${statusInfo.color} text-white`}>
                                {statusInfo.label}
                              </Badge>
                              <Badge className={`${priorityInfo.color} text-white`}>
                                {priorityInfo.label}
                              </Badge>
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>

                      <CardContent className="space-y-4">
                        {post.description && (
                          <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-2">
                            {post.description}
                          </p>
                        )}

                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                          <MapPin className="h-4 w-4" />
                          <span>{post.city} - {post.address}</span>
                        </div>

                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                          <Calendar className="h-4 w-4" />
                          <span>تم النشر: {formatDate(post.createdAt)}</span>
                        </div>

                        {/* Progress Bar */}
                        {post.requiredCount && post.requiredCount > 0 && (
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600 dark:text-gray-400" suppressHydrationWarning={true}>
                                التقدم: {post.acceptedCount} / {post.requiredCount}
                              </span>
                              <span className="font-semibold text-gray-900 dark:text-white">
                                {progressPercentage.toFixed(0)}%
                              </span>
                            </div>
                            <Progress value={progressPercentage} className="h-2" />
                          </div>
                        )}

                        {/* Applications Stats */}
                        <div className="grid grid-cols-4 gap-2 pt-4 border-t">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-gray-900 dark:text-white">
                              {post.applicationsCount}
                            </div>
                            <div className="text-xs text-gray-600 dark:text-gray-400" suppressHydrationWarning={true}>إجمالي</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                              {post.pendingApplications}
                            </div>
                            <div className="text-xs text-gray-600 dark:text-gray-400" suppressHydrationWarning={true}>قيد المراجعة</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                              {post.acceptedApplications}
                            </div>
                            <div className="text-xs text-gray-600 dark:text-gray-400" suppressHydrationWarning={true}>مقبول</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                              {post.rejectedApplications}
                            </div>
                            <div className="text-xs text-gray-600 dark:text-gray-400" suppressHydrationWarning={true}>مرفوض</div>
                          </div>
                        </div>
                      </CardContent>

                      <CardFooter className="flex flex-wrap gap-2">
                        <Link href={`/posts/${post.id}`} className="flex-1">
                          <Button variant="outline" className="w-full gap-2" suppressHydrationWarning={true}>
                            <Eye className="h-4 w-4" />
                            عرض التفاصيل
                          </Button>
                        </Link>
                        <Link href={`/posts/${post.id}/applications`} className="flex-1">
                          <Button variant="outline" className="w-full gap-2" suppressHydrationWarning={true}>
                            <Users className="h-4 w-4" />
                            الطلبات ({post.applicationsCount})
                          </Button>
                        </Link>
                        <Link href={`/chat?post=${post.id}`} className="flex-1">
                          <Button variant="outline" className="w-full gap-2" suppressHydrationWarning={true}>
                            <MessageSquare className="h-4 w-4" />
                            المحادثات
                          </Button>
                        </Link>
                      </CardFooter>
                    </Card>
                  )
                })}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
