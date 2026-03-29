'use client'

import { useState, useEffect } from 'react'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Checkbox } from '@/components/ui/checkbox'
import { Skeleton } from '@/components/ui/skeleton'
import { Navigation } from '@/components/navigation'
import { Footer } from '@/components/footer'
import {
  User,
  Users,
  MapPin,
  Star,
  CheckCircle2,
  AlertCircle,
  Loader2,
  FileText,
  Heart,
  Phone,
  Info,
  Edit,
  Trash2,
  MessageSquare,
  X,
  ShieldCheck,
  ShieldX,
  Mail,
} from 'lucide-react'
import Link from 'next/link'
import { useRouter, useParams } from 'next/navigation'

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
  latitude?: number | null
  longitude?: number | null
  createdAt: string
  updatedAt: string
}

interface Student {
  user: {
    id: string
    name: string
    email: string
    avatarUrl?: string | null
  }
}

interface PostStats {
  totalApplications: number
  pendingApplications: number
  acceptedApplications: number
  rejectedApplications: number
  remainingCount: number
}

interface CurrentUser {
  id: string
  role: 'STUDENT' | 'PATIENT' | 'ADMIN'
  isOwner: boolean
  hasApplied: boolean
  isFull: boolean
}

interface PostResponse {
  success: boolean
  post: Post & { student: Student }
  stats: PostStats
  currentUser: CurrentUser
  conversationId?: string | null  // أضفنا هذا
}

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
  NORMAL: { label: 'عادي', color: 'bg-green-100 text-green-700' },
  MEDIUM: { label: 'متوسط', color: 'bg-amber-100 text-amber-700' },
  URGENT: { label: 'عاجل', color: 'bg-red-100 text-red-700' },
}

const statusMap: { [key: string]: { label: string; color: string } } = {
  ACTIVE: { label: 'نشط', color: 'bg-green-100 text-green-700' },
  COMPLETED: { label: 'مكتمل', color: 'bg-gray-100 text-gray-700' },
  ARCHIVED: { label: 'مؤرشف', color: 'bg-gray-100 text-gray-500' },
}

export default function PostDetailsPage() {
  const router = useRouter()
  const params = useParams()
  const { user, loading: userLoading } = useCurrentUser()
  const [postData, setPostData] = useState<PostResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Fetch post data
  useEffect(() => {
    const fetchPost = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/posts/${params.id}`, {
          credentials: 'include'
        })

        if (!response.ok) {
          throw new Error('فشل في جلب تفاصيل الحالة')
        }

        const data: PostResponse = await response.json()
        setPostData(data)
      } catch (err: any) {
        setError(err.message || 'حدث خطأ أثناء جلب تفاصيل الحالة')
      } finally {
        setLoading(false)
      }
    }

    fetchPost()
  }, [params.id])

  const getPriorityBadge = (priority: string) => {
    const info = priorityMap[priority] || priorityMap.NORMAL
    return <Badge className={info.color}>{info.label}</Badge>
  }

  const getStatusBadge = (status: string) => {
    const info = statusMap[status] || statusMap.ACTIVE
    return <Badge className={info.color}>{info.label}</Badge>
  }

  const getTreatmentTypeLabel = (type: string) => {
    return treatmentTypeMap[type] || type
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const handleApply = () => {
    // توجيه المريض إلى استمارة الملف الطبي مع معرف البوست
    router.push(`/profile?applyTo=${params.id}`)
  }

  const handleClosePost = async () => {
    if (!confirm('هل أنت متأكد من إغلاق هذه الحالة؟')) {
      return
    }

    try {
      const response = await fetch(`/api/posts/${params.id}/close`, {
        method: 'POST',
        credentials: 'include'
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'فشل في إغلاق الحالة')
      }

      alert('تم إغلاق الحالة بنجاح')
      router.push('/posts/my-posts')
    } catch (err: any) {
      alert(err.message || 'حدث خطأ أثناء إغلاق الحالة')
    }
  }

  const handleDeletePost = async () => {
    if (!confirm('هل أنت متأكد من حذف هذه الحالة نهائياً؟')) {
      return
    }

    try {
      const response = await fetch(`/api/posts/${params.id}`, {
        method: 'DELETE',
        credentials: 'include'
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'فشل في حذف الحالة')
      }

      alert('تم حذف الحالة بنجاح')
      router.push('/posts/my-posts')
    } catch (err: any) {
      alert(err.message || 'حدث خطأ أثناء حذف الحالة')
    }
  }

  // حالة التحميل
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navigation user={user ? { id: user.id, name: user.name || 'مستخدم', email: user.email || '', role: user.role as 'STUDENT' | 'PATIENT' } : undefined} />
        <main className="flex-1 py-8 px-4 bg-muted/30">
          <div className="container mx-auto max-w-6xl">
            <Skeleton className="h-64 mb-6" />
            <Skeleton className="h-96" />
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  // حالة الخطأ
  if (error) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navigation user={user ? { id: user.id, name: user.name || 'مستخدم', email: user.email || '', role: user.role as 'STUDENT' | 'PATIENT' } : undefined} />
        <main className="flex-1 py-8 px-4 bg-muted/30">
          <div className="container mx-auto max-w-6xl">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <Button onClick={() => router.back()} className="mt-4">رجوع</Button>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  // حالة البيانات غير موجودة
  if (!postData) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navigation user={user ? { id: user.id, name: user.name || 'مستخدم', email: user.email || '', role: user.role as 'STUDENT' | 'PATIENT' } : undefined} />
        <main className="flex-1 py-8 px-4 bg-muted/30">
          <div className="container mx-auto max-w-6xl">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>البوست غير موجود</AlertDescription>
            </Alert>
            <Button onClick={() => router.back()} className="mt-4">رجوع</Button>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  const { post, stats, currentUser } = postData

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation user={user ? { id: user.id, name: user.name || 'مستخدم', email: user.email || '', role: user.role as 'STUDENT' | 'PATIENT' } : undefined} />

      <main className="flex-1 py-8 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
            <Link href="/search" className="hover:text-primary">البحث</Link>
            <span>/</span>
            <span className="text-foreground font-medium" suppressHydrationWarning={true}>تفاصيل الحالة</span>
          </div>

          {/* ============ دكتور صاحب البوست ============ */}
          {currentUser.isOwner ? (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <CardTitle className="text-2xl">{post.title}</CardTitle>
                        {getPriorityBadge(post.priority)}
                      </div>
                      <CardDescription className="text-base">
                        نشر في {formatDate(post.createdAt)}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* وصف الحالة */}
                  <div>
                    <h3 className="font-semibold mb-2" suppressHydrationWarning={true}>الوصف</h3>
                    <p className="text-muted-foreground" suppressHydrationWarning={true}>
                      {post.description || 'لا يوجد وصف'}
                    </p>
                  </div>

                  {/* معلومات إدارية */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2" suppressHydrationWarning={true}>
                        <Info className="w-5 h-5 text-blue-600" />
                        معلومات إدارية
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-xs text-muted-foreground" suppressHydrationWarning={true}>حالة البوست</Label>
                          <div className="text-2xl font-bold">{getStatusBadge(post.status)}</div>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-xs text-muted-foreground" suppressHydrationWarning={true}>الطلبات المقدمة</Label>
                          <div className="text-2xl font-bold">{stats.totalApplications}</div>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-xs text-muted-foreground" suppressHydrationWarning={true}>المقبولين</Label>
                          <div className="text-2xl font-bold text-emerald-600">
                            {stats.acceptedApplications}/{post.requiredCount || '∞'}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-xs text-muted-foreground" suppressHydrationWarning={true}>المتبقي</Label>
                          <div className="text-2xl font-bold text-amber-600">
                            {stats.remainingCount}
                          </div>
                        </div>
                      </div>

                      {/* أزرار الإدارة */}
                      <div className="flex flex-wrap gap-2 pt-4 border-t">
                        <Link href={`/posts/${post.id}/applications`} className="flex-1">
                          <Button variant="outline" className="w-full gap-2" suppressHydrationWarning={true}>
                            <Users className="w-4 h-4" />
                            الطلبات
                          </Button>
                        </Link>
                        <Link href="/chat" className="flex-1">
                          <Button variant="outline" className="w-full gap-2" suppressHydrationWarning={true}>
                            <MessageSquare className="w-4 h-4" />
                            المحادثات
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                </CardContent>
              </Card>

              {/* معلومات الطالب */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2" suppressHydrationWarning={true}>
                    <User className="w-5 h-5 text-emerald-600" />
                    معلومات الطالب
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <User className="w-8 h-8 text-emerald-600" />
                    </div>
                    <div className="flex-1 space-y-2">
                      <div>
                        <h4 className="font-semibold text-lg">{post.student.user.name}</h4>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {post.student.user.email}
                      </p>
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span suppressHydrationWarning={true}>تم إنجاز {post.acceptedCount || 0} حالة</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : currentUser.role === 'STUDENT' && !currentUser.isOwner ? (
            <div className="flex items-center justify-center py-20">
              <Alert variant="destructive" className="max-w-md">
                <ShieldX className="h-4 w-4" />
                <AlertDescription>
                  <p className="font-semibold mb-1" suppressHydrationWarning={true}>ليس لديك صلاحية</p>
                  <p className="text-sm" suppressHydrationWarning={true}>لا يمكن عرض تفاصيل بوست دكتور آخر</p>
                </AlertDescription>
                <Button onClick={() => router.back()} variant="outline" className="mt-4" suppressHydrationWarning={true}>
                  رجوع
                </Button>
              </Alert>
            </div>
          ) : currentUser.role === 'PATIENT' ? (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <CardTitle className="text-2xl">{post.title}</CardTitle>
                        {getPriorityBadge(post.priority)}
                      </div>
                      <CardDescription className="text-base">
                        نشر في {formatDate(post.createdAt)}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* وصف الحالة */}
                  <div>
                    <h3 className="font-semibold mb-2" suppressHydrationWarning={true}>الوصف</h3>
                    <p className="text-muted-foreground" suppressHydrationWarning={true}>
                      {post.description || 'لا يوجد وصف'}
                    </p>
                  </div>

                  {/* معلومات العلاج */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground" suppressHydrationWarning={true}>نوع العلاج</Label>
                      <div className="text-lg font-semibold">
                        {getTreatmentTypeLabel(post.treatmentType)}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground" suppressHydrationWarning={true}>الموقع</Label>
                      <div className="text-lg font-semibold">
                        {post.city} - {post.address}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground" suppressHydrationWarning={true}>المقبولين</Label>
                      <div className="text-2xl font-bold text-emerald-600">
                        {stats.acceptedApplications}/{post.requiredCount || '∞'}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground" suppressHydrationWarning={true}>الحالة</Label>
                      <div className="text-2xl font-bold">
                        {getStatusBadge(post.status)}
                      </div>
                    </div>
                  </div>

                  {/* معلومات الطالب */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2" suppressHydrationWarning={true}>
                        <User className="w-5 h-5 text-emerald-600" />
                        معلومات الطالب
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-start gap-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-xl flex items-center justify-center flex-shrink-0">
                          <User className="w-8 h-8 text-emerald-600" />
                        </div>
                        <div className="flex-1 space-y-2">
                          <div>
                            <h4 className="font-semibold text-lg">{post.student.user.name}</h4>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {post.student.user.email}
                          </p>
                          <div className="flex items-center gap-2 text-sm">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span suppressHydrationWarning={true}>تم إنجاز {post.acceptedCount || 0} حالة</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* قسم التقديم - مريض فقط */}
                  <Card className="border-2 border-emerald-200">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2" suppressHydrationWarning={true}>
                        <Heart className="w-5 h-5 text-emerald-600" />
                        هل أنت مهتم؟
                      </CardTitle>
                      <CardDescription suppressHydrationWarning={true}>
                        يمكنك التقديم على هذه الحالة الآن
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* حالة التقديم */}
                      {currentUser.hasApplied ? (
                        <Alert className="bg-green-50 border-green-200">
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          <AlertDescription className="text-green-900">
                            <p className="font-semibold" suppressHydrationWarning={true}>تم التقديم بالفعل!</p>
                            <p className="text-sm mt-1" suppressHydrationWarning={true}>
                              سيتم إشعار الطالب بقبول طلبك
                            </p>
                          </AlertDescription>
                        </Alert>
                      ) : currentUser.isFull ? (
                        <Alert className="bg-red-50 border-red-200">
                          <AlertCircle className="h-4 w-4 text-red-600" />
                          <AlertDescription className="text-red-900">
                            <p className="font-semibold" suppressHydrationWarning={true}>اكتمل العدد المطلوب</p>
                            <p className="text-sm mt-1" suppressHydrationWarning={true}>
                              الحالة تحتاج {post.requiredCount} مرضى فقط
                            </p>
                          </AlertDescription>
                        </Alert>
                      ) : (
                        <>
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground" suppressHydrationWarning={true}>الطلبات المقدمة</span>
                              <span className="font-medium">{stats.totalApplications}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground" suppressHydrationWarning={true}>المقبولين</span>
                              <span className="font-medium text-emerald-600">{stats.acceptedApplications}/{post.requiredCount || '∞'}</span>
                            </div>
                            {post.requiredCount && (
                              <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground" suppressHydrationWarning={true}>المتبقي</span>
                                <span className="font-medium text-amber-600">{stats.remainingCount}</span>
                              </div>
                            )}
                          </div>

                          <Alert className="bg-blue-50 border-blue-200">
                            <Info className="h-4 w-4 text-blue-600" />
                            <AlertDescription className="text-blue-900 text-sm" suppressHydrationWarning={true}>
                              يمكنك التقديم على {post.requiredCount || 5} حالات كحد أقصى
                            </AlertDescription>
                          </Alert>

                          <Button
                            onClick={handleApply}
                            disabled={currentUser.isFull}
                            className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            suppressHydrationWarning={true}
                          >
                            <CheckCircle2 className="w-4 h-4 ml-2" />
                            {currentUser.isFull ? 'اكتمل العدد المطلوب' : 'التقديم على الحالة'}
                          </Button>
                        </>
                      )}
                    </CardContent>
                  </Card>

                  {/* معلومات التواصل */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2" suppressHydrationWarning={true}>
                        <Info className="w-5 h-5 text-blue-600" />
                        معلومات التواصل
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center gap-3 text-sm">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        <span>{post.city} - {post.address}</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <Phone className="w-4 h-4 text-muted-foreground" />
                        <span suppressHydrationWarning={true}>رقم الهاتف متاح بعد القبول</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <Mail className="w-4 h-4 text-muted-foreground" />
                        <span suppressHydrationWarning={true}>البريد الإلكتروني متاح بعد القبول</span>
                      </div>

                      {/* زر التحدث مع الطبيب - يظهر فقط إذا كان هناك محادثة */}
                      {postData.conversationId && (
                        <Button
                          onClick={() => router.push(`/chat?conversation=${postData.conversationId}`)}
                          className="w-full mt-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
                          suppressHydrationWarning={true}
                        >
                          <MessageSquare className="w-4 h-4 ml-2" />
                          التحدث مع الطبيب
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="flex items-center justify-center py-20">
              <Alert variant="destructive" className="max-w-md">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <p className="font-semibold mb-1" suppressHydrationWarning={true}>غير مصرح</p>
                  <p className="text-sm" suppressHydrationWarning={true}>يجب تسجيل الدخول لعرض تفاصيل الحالة</p>
                </AlertDescription>
                <Button onClick={() => router.push('/login')} variant="outline" className="mt-4" suppressHydrationWarning={true}>
                  تسجيل الدخول
                </Button>
              </Alert>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
