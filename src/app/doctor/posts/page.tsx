'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Navigation } from '@/components/navigation'
import { Footer } from '@/components/footer'
import { 
  FileText, 
  Calendar, 
  MapPin, 
  Users, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  XCircle,
  Edit,
  Trash2,
  Eye,
  MessageSquare,
  Plus,
  TrendingUp,
  Activity
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useCurrentUser } from '@/hooks/useCurrentUser'

interface Post {
  postId: string
  doctorId: string
  treatmentType: string
  description: string | null
  patientsNeeded: number | null
  patientsAccepted: number
  startDate: string | null
  endDate: string | null
  location: string
  status: string
  priority: string
  createdAt: string
  applicationsCount: number
  pendingApplications: number
  acceptedApplications: number
  rejectedApplications: number
  student: {
    id: string
    name: string
    email: string
    avatar: string | null
  }
}

export default function DoctorPostsPage() {
  const router = useRouter()
  const { user } = useCurrentUser()
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  console.log('[DoctorPosts] Component mounted, user:', user)

  useEffect(() => {
    console.log('[DoctorPosts] User from useCurrentUser:', user)
    if (!user) {
      console.log('[DoctorPosts] No user found, returning...')
      return
    }

    fetchDoctorPosts()
  }, [user])

  const fetchDoctorPosts = async () => {
    console.log('[DoctorPosts] fetchDoctorPosts called')
    try {
      setLoading(true)
      // نستخدم الـ studentId كـ doctorId (في مشروعنا Student = Doctor)
      const doctorId = user.id

      console.log('[DoctorPosts] Fetching posts for doctorId:', doctorId)

      if (!doctorId) {
        throw new Error('معرف الدكتور غير موجود')
      }

      const res = await fetch(`/api/posts/doctor/${doctorId}`)
      const data = await res.json()

      console.log('[DoctorPosts] API Response:', data)

      if (!res.ok) {
        throw new Error(data.error || 'حدث خطأ أثناء جلب البوستات')
      }

      console.log('[DoctorPosts] Posts fetched:', data.data?.length || 0)
      setPosts(data.data || [])
    } catch (err: any) {
      console.error('[DoctorPosts] Error:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge className="bg-green-100 text-green-700 border-green-200">🟢 نشط</Badge>
      case 'COMPLETED':
        return <Badge className="bg-blue-100 text-blue-700 border-blue-200">✅ مكتمل</Badge>
      case 'CANCELLED':
        return <Badge className="bg-red-100 text-red-700 border-red-200">❌ ملغي</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return <Badge variant="destructive">🔴 عاجل</Badge>
      case 'HIGH':
        return <Badge className="bg-orange-100 text-orange-700 border-orange-200">🟠 مرتفع</Badge>
      case 'NORMAL':
        return <Badge className="bg-gray-100 text-gray-700 border-gray-200">⚪ عادي</Badge>
      default:
        return <Badge>{priority}</Badge>
    }
  }

  const getProgress = (post: Post) => {
    if (!post.patientsNeeded || post.patientsNeeded === 0) return 0
    const progress = Math.min((post.patientsAccepted / post.patientsNeeded) * 100, 100)
    return Math.round(progress)
  }

  const getProgressColor = (progress: number) => {
    if (progress >= 100) return 'bg-green-500'
    if (progress >= 50) return 'bg-yellow-500'
    return 'bg-emerald-800'
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navigation />
        <main className="flex-1 flex items-center justify-center">
          <Card className="w-full max-w-md mx-4">
            <CardContent className="p-6 text-center">
              <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2" suppressHydrationWarning={true}>يجب تسجيل الدخول</h2>
              <p className="text-muted-foreground mb-4" suppressHydrationWarning={true}>
                يرجى تسجيل الدخول للوصول إلى بوستاتك
              </p>
              <Button asChild className="bg-gradient-to-r from-emerald-800 to-teal-800 hover:from-emerald-900 hover:to-teal-900" suppressHydrationWarning={true}>
                <a href="/auth/login">تسجيل الدخول</a>
              </Button>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    )
  }

  if (user.role !== 'STUDENT') {
    return (
      <div className="min-h-screen flex flex-col">
        <Navigation user={{
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatar
        }} />
        <main className="flex-1 flex items-center justify-center">
          <Card className="w-full max-w-md mx-4">
            <CardContent className="p-6 text-center">
              <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2" suppressHydrationWarning={true}>غير مصرح</h2>
              <p className="text-muted-foreground mb-4" suppressHydrationWarning={true}>
                هذه الصفحة متاحة للطلاب فقط
              </p>
              <Button asChild variant="outline" suppressHydrationWarning={true}>
                <a href="/">العودة للرئيسية</a>
              </Button>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation user={{
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar
      }} />

      <main className="flex-1 py-8 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold mb-2" suppressHydrationWarning={true}>📋 بوستاتي (الدكتور)</h1>
              <p className="text-muted-foreground" suppressHydrationWarning={true}>إدارة الحالات المنشورة الخاصة بك</p>
            </div>
            <Button
              onClick={() => router.push('/posts/create')}
              className="bg-gradient-to-r from-emerald-800 to-teal-800 hover:from-emerald-900 hover:to-teal-900"
              suppressHydrationWarning={true}
            >
              <Plus className="w-4 h-4 ml-2" />
              إنشاء بوست جديد
            </Button>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4 ml-2" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin w-8 h-8 border-4 border-emerald-800 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-muted-foreground" suppressHydrationWarning={true}>جاري تحميل البوستات...</p>
            </div>
          ) : posts.length === 0 ? (
            <Card className="border-2 border-dashed">
              <CardContent className="p-12 text-center">
                <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2" suppressHydrationWarning={true}>لا توجد بوستات بعد</h3>
                <p className="text-muted-foreground mb-6" suppressHydrationWarning={true}>
                  ابدأ بنشر حالاتك الأولى لتصل للمرضى
                </p>
                <Button
                  onClick={() => router.push('/posts/create')}
                  className="bg-gradient-to-r from-emerald-800 to-teal-800 hover:from-emerald-900 hover:to-teal-900"
                  suppressHydrationWarning={true}
                >
                  <Plus className="w-4 h-4 ml-2" />
                  إنشاء بوست جديد
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {/* إحصائيات سريعة */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-800 rounded-lg flex items-center justify-center">
                      <FileText className="w-5 h-5 text-emerald-50" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-emerald-800">{posts.length}</p>
                      <p className="text-xs text-muted-foreground" suppressHydrationWarning={true}>إجمالي البوستات</p>
                    </div>
                  </div>
                </Card>
                <Card className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Activity className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-blue-600">
                        {posts.filter(p => p.status === 'ACTIVE').length}
                      </p>
                      <p className="text-xs text-muted-foreground" suppressHydrationWarning={true}>نشط</p>
                    </div>
                  </div>
                </Card>
                <Card className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                      <Users className="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-orange-600">
                        {posts.reduce((sum, p) => sum + p.applicationsCount, 0)}
                      </p>
                      <p className="text-xs text-muted-foreground" suppressHydrationWarning={true}>إجمالي الطلبات</p>
                    </div>
                  </div>
                </Card>
                <Card className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-green-600">
                        {posts.reduce((sum, p) => sum + p.acceptedCount, 0)}
                      </p>
                      <p className="text-xs text-muted-foreground" suppressHydrationWarning={true}>مرضى مقبولين</p>
                    </div>
                  </div>
                </Card>
              </div>

              {/* قائمة البوستات */}
              <div className="space-y-4">
                {posts.map((post) => {
                  const progress = getProgress(post)
                  const progressColor = getProgressColor(progress)

                  return (
                    <Card key={post.postId} className="border-2 hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                              <CardTitle className="text-xl" suppressHydrationWarning={true}>
                                {post.treatmentType}
                              </CardTitle>
                              {getStatusBadge(post.status)}
                              {getPriorityBadge(post.priority)}
                            </div>
                            <CardDescription suppressHydrationWarning={true}>
                              {post.description || 'لا يوجد وصف'}
                            </CardDescription>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => router.push(`/posts/${post.postId}`)}
                            >
                              <Eye className="w-4 h-4 ml-1" />
                              عرض التفاصيل
                            </Button>
                          </div>
                        </div>
                      </CardHeader>

                      <CardContent className="space-y-4">
                        {/* معلومات البوست */}
                        <div className="flex flex-wrap gap-4 text-sm">
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <MapPin className="w-4 h-4" />
                            <span>{post.location}</span>
                          </div>
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Calendar className="w-4 h-4" />
                            <span suppressHydrationWarning={true}>
                              {post.startDate ? new Date(post.startDate).toLocaleDateString('ar-EG') : 'غير محدد'}
                            </span>
                          </div>
                        </div>

                        {/* شريط التقدم */}
                        {post.patientsNeeded && (
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-muted-foreground" suppressHydrationWarning={true}>التقدم</span>
                              <span className="font-medium">
                                {post.patientsAccepted} / {post.patientsNeeded}
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className={`${getProgressColor(getProgress(post))} h-2 rounded-full transition-all`}
                                style={{ width: `${getProgress(post)}%` }}
                              ></div>
                            </div>
                          </div>
                        )}

                        {/* الإحصائيات */}
                        <div className="grid grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
                          <div className="text-center">
                            <p className="text-2xl font-bold text-emerald-800">
                              {post.applicationsCount}
                            </p>
                            <p className="text-xs text-muted-foreground" suppressHydrationWarning={true}>الطلبات</p>
                          </div>
                          <div className="text-center">
                            <p className="text-2xl font-bold text-yellow-600">
                              {post.pendingApplications}
                            </p>
                            <p className="text-xs text-muted-foreground" suppressHydrationWarning={true}>قيد المراجعة</p>
                          </div>
                          <div className="text-center">
                            <p className="text-2xl font-bold text-green-600">
                              {post.acceptedApplications}
                            </p>
                            <p className="text-xs text-muted-foreground" suppressHydrationWarning={true}>مقبول</p>
                          </div>
                        </div>

                        {/* الأزرار */}
                        <div className="flex flex-wrap gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/posts/${post.postId}?tab=applications`)}
                            suppressHydrationWarning={true}
                          >
                            <Users className="w-4 h-4 ml-1" />
                            عرض الطلبات ({post.applicationsCount})
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/posts/${post.postId}?tab=chat`)}
                            suppressHydrationWarning={true}
                          >
                            <MessageSquare className="w-4 h-4 ml-1" />
                            المحادثات
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
