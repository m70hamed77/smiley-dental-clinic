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
import { PhotoCarousel } from '@/components/photo-carousel'
import { StarRating } from '@/components/star-rating'
import { RatingModal } from '@/components/rating-modal'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Star,
  Award,
  CheckCircle2,
  ShieldCheck,
  Clock,
  MessageSquare,
  FileText,
  ArrowRight,
  ArrowLeft,
  UserCircle,
  AlertTriangle,
  Send,
  X,
  GraduationCap,
  Stethoscope,
} from 'lucide-react'
import Link from 'next/link'

interface CompletedCase {
  id: string
  patientId: string
  postTitle: string
  treatmentType: string
  patientName: string
  photos: Array<{
    id: string
    fileUrl: string
    photoType: 'BEFORE' | 'AFTER'
    description?: string | null
  }>
  hasCertificate: boolean
  rating: {
    overallRating: number
    reviewText: string | null
  } | null
  createdAt: string
}

interface Review {
  id: string
  patientId: string
  patientName: string
  patientAvatar: string | null
  overallRating: number
  qualityRating: number | null
  professionalRating: number | null
  punctualityRating: number | null
  cleanlinessRating: number | null
  explanationRating: number | null
  reviewText: string | null
  createdAt: string
}

interface PublicProfile {
  student: {
    id: string
    name: string
    email: string | null
    phone: string | null
    avatarUrl: string | null
    universityName: string | null
    collegeName: string | null
    collegeAddress: string | null
    academicYear: number | null
    completedCases: number
    activeCases: number
    cancelledCases: number
    isVerified: boolean
    specialization: string | null
    bio: string | null
    location: string | null
    city: string | null
  }
  stats: {
    totalCases: number
    avgRating: number
    totalRatings: number
    activePosts: number
  }
  completedCases: CompletedCase[]
  reviews: Review[]
  activePosts: Array<{
    id: string
    title: string
    treatmentType: string
    city: string
    priority: string
    acceptedCount: number
    requiredCount: number
  }>
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

export default function DoctorProfilePage() {
  const params = useParams()
  const router = useRouter()
  const [profile, setProfile] = useState<PublicProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showRatingModal, setShowRatingModal] = useState(false)
  const [selectedCaseForRating, setSelectedCaseForRating] = useState<CompletedCase | null>(null)
  const [currentUser, setCurrentUser] = useState<any>(null)

  // Report dialog state
  const [reportDialogOpen, setReportDialogOpen] = useState(false)
  const [reportForm, setReportForm] = useState({
    reportedUserName: '',
    reportedUserEmail: '',
    description: ''
  })
  const [submittingReport, setSubmittingReport] = useState(false)

  // Get current user on mount
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        // Try to get userId from multiple sources
        let userId = null
        
        // Method 1: URL query params
        const urlParams = new URLSearchParams(window.location.search)
        userId = urlParams.get('userId')
        
        // Method 2: Try cookies
        if (!userId) {
          try {
            const cookies = document.cookie.split(';')
            for (const cookie of cookies) {
              const [name, value] = cookie.trim().split('=')
              if (name === 'userId' && value) {
                userId = value
                break
              }
            }
          } catch (e) {
            // Ignore cookie errors
          }
        }
        
        // Method 3: Try localStorage
        if (!userId) {
          try {
            userId = localStorage.getItem('userId')
          } catch (e) {
            // Ignore localStorage errors
          }
        }

        // Method 4: Try sessionStorage
        if (!userId) {
          try {
            userId = sessionStorage.getItem('userId')
          } catch (e) {
            // Ignore sessionStorage errors
          }
        }

        // Fetch user data if we have userId
        if (userId) {
          const headers: HeadersInit = {
            'Content-Type': 'application/json',
          }
          
          if (userId) {
            headers['X-User-Id'] = userId
          }

          const response = await fetch('/api/auth/me', {
            credentials: 'include',
            headers
          })
          
          if (response.ok) {
            const data = await response.json()
            setCurrentUser(data.user)
          }
        }
      } catch (err) {
        // User might not be logged in, that's okay
      }
    }
    fetchCurrentUser()
  }, [])

  // Helper function to convert base64 to data URL
  const getPhotoUrl = (fileUrl: string) => {
    if (!fileUrl) return ''

    // If it's already a data URL, return as is
    if (fileUrl.startsWith('data:')) {
      return fileUrl
    }

    // If it's a URL, return as is
    if (fileUrl.startsWith('http')) {
      return fileUrl
    }

    // If it looks like base64, add prefix
    const looksLikeBase64 = !fileUrl.includes(' ') && fileUrl.length > 100
    if (looksLikeBase64) {
      return `data:image/jpeg;base64,${fileUrl}`
    }

    return fileUrl
  }

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/students/${params.id}/public-profile`)

        const data = await response.json()

        if (!response.ok) {
          setError(data.error || 'فشل في جلب البروفايل')
          return
        }

        if (data.success) {
          // Process photos to add data URL prefix
          const processedProfile = {
            ...data.profile,
            completedCases: data.profile.completedCases.map(c => ({
              ...c,
              photos: c.photos.map(p => ({
                ...p,
                fileUrl: getPhotoUrl(p.fileUrl)
              }))
            }))
          }
          setProfile(processedProfile)
        }
      } catch (err: any) {
        setError(err.message || 'حدث خطأ أثناء جلب البروفايل')
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [params.id])

  const getTreatmentTypeLabel = (type: string) => {
    return treatmentTypeMap[type] || type
  }

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return <Badge className="bg-red-100 text-red-700">عاجل</Badge>
      case 'MEDIUM':
        return <Badge className="bg-amber-100 text-amber-700">متوسط</Badge>
      default:
        return <Badge className="bg-green-100 text-green-700">عادي</Badge>
    }
  }

  // Handle report submission
  const handleSubmitReport = async () => {
    if (!reportForm.reportedUserName || !reportForm.reportedUserEmail || !reportForm.description) {
      alert('يرجى ملء جميع الحقول المطلوبة')
      return
    }

    try {
      setSubmittingReport(true)
      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          reportedUserName: reportForm.reportedUserName,
          reportedUserEmail: reportForm.reportedUserEmail,
          description: reportForm.description,
        })
      })

      const data = await response.json()

      if (response.ok && data.success) {
        alert('✅ تم إرسال البلاغ بنجاح! سيقوم الأدمن بمراجعته قريبًا')
        setReportDialogOpen(false)
        setReportForm({
          reportedUserName: '',
          reportedUserEmail: '',
          description: ''
        })
      } else {
        alert(data.error || 'حدث خطأ أثناء إرسال البلاغ')
      }
    } catch (error) {
      console.error('Error submitting report:', error)
      alert('حدث خطأ أثناء إرسال البلاغ')
    } finally {
      setSubmittingReport(false)
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navigation user={currentUser} />
        <main className="flex-1 py-8 px-4 bg-muted/30">
          <div className="container mx-auto max-w-6xl">
            <Skeleton className="h-8 mb-6 w-48" />
            <div className="grid md:grid-cols-3 gap-6">
              <Skeleton className="h-80" />
              <div className="md:col-span-2 space-y-4">
                <Skeleton className="h-64" />
                <Skeleton className="h-64" />
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  // Error state
  if (error || !profile) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navigation user={currentUser} />
        <main className="flex-1 py-8 px-4 bg-muted/30">
          <div className="container mx-auto max-w-6xl">
            <Alert variant="destructive">
              <AlertDescription>{error || 'البروفايل غير موجود'}</AlertDescription>
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

  const { student, stats, completedCases, reviews, activePosts } = profile

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation user={currentUser} />

      <main className="flex-1 py-8 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 mb-6 text-sm text-muted-foreground">
            <Link href="/search" className="hover:text-primary flex items-center gap-1">
              <ArrowRight className="w-4 h-4" />
              البحث عن حالات
            </Link>
            <span>/</span>
            <span className="text-foreground font-medium">{student.name}</span>
          </div>

          {/* Doctor Profile Header */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-6 items-start">
                {/* Avatar */}
                <div className="relative">
                  <div className="w-32 h-32 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-full flex items-center justify-center border-4 border-white shadow-lg">
                    {student.avatarUrl ? (
                      <img
                        src={getPhotoUrl(student.avatarUrl)}
                        alt={student.name}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <UserCircle className="w-20 h-20 text-emerald-800" />
                    )}
                  </div>
                  {student.isVerified && (
                    <div className="absolute -bottom-2 -right-2 bg-slate-1000 text-white rounded-full p-1.5">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div>
                      <h1 className="text-2xl font-bold mb-1">
                        د. {student.name}
                        {student.isVerified && (
                          <Badge className="bg-emerald-800 text-emerald-50 mr-2">
                            <ShieldCheck className="w-3 h-3 ml-1" />
                            موثق
                          </Badge>
                        )}
                      </h1>
                      {student.specialization && (
                        <p className="text-muted-foreground text-lg">{student.specialization}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1 bg-amber-50 px-3 py-1.5 rounded-full">
                        <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
                        <span className="font-bold text-lg">{stats.avgRating}</span>
                        <span className="text-sm text-muted-foreground">({stats.totalRatings} تقييم)</span>
                      </div>

                      {/* Report Button - Only show if logged in and not viewing own profile */}
                      {currentUser && currentUser.id !== student.id && (
                        <Dialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 transition-all"
                              onClick={() => setReportForm({
                                reportedUserName: student.name,
                                reportedUserEmail: '',
                                description: ''
                              })}
                            >
                              <AlertTriangle className="w-4 h-4 ml-2" />
                              تقديم بلاغ
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-lg">
                            <DialogHeader>
                              <DialogTitle className="flex items-center gap-2 text-red-600">
                                <AlertTriangle className="w-5 h-5" />
                                تقديم بلاغ
                              </DialogTitle>
                              <DialogDescription>
                                يرجى تقديم تفاصيل الشكوى بدقة
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                              <div>
                                <Label htmlFor="reportedName">اسم الشخص المُبلغ عنه *</Label>
                                <Input
                                  id="reportedName"
                                  value={reportForm.reportedUserName}
                                  onChange={(e) => setReportForm({ ...reportForm, reportedUserName: e.target.value })}
                                  placeholder="اسم الشخص المُبلغ عنه"
                                  className="mt-1.5"
                                />
                              </div>
                              <div>
                                <Label htmlFor="reportedEmail">البريد الإلكتروني للشخص المُبلغ عنه *</Label>
                                <Input
                                  id="reportedEmail"
                                  type="email"
                                  value={reportForm.reportedUserEmail}
                                  onChange={(e) => setReportForm({ ...reportForm, reportedUserEmail: e.target.value })}
                                  placeholder="example@email.com"
                                  className="mt-1.5"
                                />
                              </div>
                              <div>
                                <Label htmlFor="description">تفاصيل الشكوى *</Label>
                                <Textarea
                                  id="description"
                                  value={reportForm.description}
                                  onChange={(e) => setReportForm({ ...reportForm, description: e.target.value })}
                                  placeholder="اكتب تفاصيل الشكوى هنا..."
                                  rows={5}
                                  className="mt-1.5"
                                />
                              </div>
                            </div>
                            <DialogFooter>
                              <Button
                                variant="outline"
                                onClick={() => setReportDialogOpen(false)}
                                disabled={submittingReport}
                              >
                                <X className="w-4 h-4 ml-2" />
                                إلغاء
                              </Button>
                              <Button
                                onClick={handleSubmitReport}
                                disabled={submittingReport || !reportForm.reportedUserName || !reportForm.reportedUserEmail || !reportForm.description}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                {submittingReport ? (
                                  <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                                    جاري الإرسال...
                                  </>
                                ) : (
                                  <>
                                    <Send className="w-4 h-4 ml-2" />
                                    إرسال البلاغ
                                  </>
                                )}
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      )}
                    </div>
                  </div>

                  {student.bio && (
                    <p className="text-muted-foreground mb-4">{student.bio}</p>
                  )}

                  <div className="flex flex-wrap gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <span>{student.city || student.location || 'غير محدد'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Award className="w-4 h-4 text-emerald-800" />
                      <span>{stats.totalCases} حالة منجزة</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-blue-600" />
                      <span>{stats.activePosts} بوست نشط</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-3xl font-bold text-emerald-800">{stats.totalCases}</div>
                <div className="text-sm text-muted-foreground">حالة منجزة</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-3xl font-bold text-blue-600">{stats.activeCases}</div>
                <div className="text-sm text-muted-foreground">حالة نشطة</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-3xl font-bold text-amber-600">{stats.avgRating}</div>
                <div className="text-sm text-muted-foreground">متوسط التقييم</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-3xl font-bold text-purple-600">{stats.totalRatings}</div>
                <div className="text-sm text-muted-foreground">تقييم</div>
              </CardContent>
            </Card>
          </div>

          {/* Contact & Academic Info */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5 text-blue-600" />
                معلومات التواصل والدراسة
              </CardTitle>
              <CardDescription>
                بيانات الاتصال والمعلومات الأكاديمية للطالب
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                {/* Contact Info */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                    <Mail className="w-5 h-5 text-blue-600" />
                    معلومات الاتصال
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <Mail className="w-5 h-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm text-muted-foreground">البريد الإلكتروني</p>
                        <p className="font-medium">{student.email || 'غير متوفر'}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Phone className="w-5 h-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm text-muted-foreground">رقم الهاتف</p>
                        <p className="font-medium" dir="ltr">{student.phone || 'غير متوفر'}</p>
                      </div>
                    </div>
                    {student.location && (
                      <div className="flex items-start gap-3">
                        <MapPin className="w-5 h-5 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="text-sm text-muted-foreground">الموقع</p>
                          <p className="font-medium">{student.location}</p>
                          {student.city && <p className="text-sm text-muted-foreground">{student.city}</p>}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Academic Info */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                    <GraduationCap className="w-5 h-5 text-purple-600" />
                    المعلومات الأكاديمية
                  </h3>
                  <div className="space-y-3">
                    {student.universityName && (
                      <div className="flex items-start gap-3">
                        <FileText className="w-5 h-5 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="text-sm text-muted-foreground">الجامعة</p>
                          <p className="font-medium">{student.universityName}</p>
                        </div>
                      </div>
                    )}
                    {student.collegeName && (
                      <div className="flex items-start gap-3">
                        <FileText className="w-5 h-5 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="text-sm text-muted-foreground">الكلية</p>
                          <p className="font-medium">{student.collegeName}</p>
                        </div>
                      </div>
                    )}
                    {student.collegeAddress && (
                      <div className="flex items-start gap-3">
                        <MapPin className="w-5 h-5 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="text-sm text-muted-foreground">عنوان الكلية</p>
                          <p className="font-medium">{student.collegeAddress}</p>
                        </div>
                      </div>
                    )}
                    {student.academicYear && (
                      <div className="flex items-start gap-3">
                        <Calendar className="w-5 h-5 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="text-sm text-muted-foreground">السنة الدراسية</p>
                          <p className="font-medium">الفرقة {student.academicYear}</p>
                        </div>
                      </div>
                    )}
                    {student.specialization && (
                      <div className="flex items-start gap-3">
                        <Stethoscope className="w-5 h-5 text-emerald-800 mt-0.5" />
                        <div>
                          <p className="text-sm text-muted-foreground">التخصص</p>
                          <p className="font-medium">{student.specialization}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Completed Cases Section */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="w-5 h-5 text-emerald-800" />
                الحالات المنجزة
              </CardTitle>
              <CardDescription>
                عرض الصور قبل وبعد للحالات التي تم إنجازها
              </CardDescription>
            </CardHeader>
            <CardContent>
              {completedCases.length === 0 ? (
                <div className="text-center py-12 bg-muted/50 rounded-lg border-2 border-dashed">
                  <FileText className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">لا توجد حالات منجزة</h3>
                  <p className="text-muted-foreground">
                    لم يقم الدكتور برفع أي حالات منجزة بعد
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {completedCases.map((case_) => (
                    <Card key={case_.id} className="border">
                      <CardHeader>
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <CardTitle className="text-lg mb-1">{case_.postTitle}</CardTitle>
                            <CardDescription className="flex items-center gap-2">
                              <FileText className="w-3 h-3" />
                              {getTreatmentTypeLabel(case_.treatmentType)}
                              <span>•</span>
                              <Calendar className="w-3 h-3" />
                              {new Date(case_.createdAt).toLocaleDateString('ar-EG')}
                            </CardDescription>
                          </div>
                          {case_.hasCertificate && (
                            <Badge className="bg-purple-100 text-purple-700">
                              <Award className="w-3 h-3 ml-1" />
                              شهادة
                            </Badge>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="mb-4 p-3 bg-muted/50 rounded-lg">
                          <p className="text-sm text-muted-foreground">
                            <User className="w-4 h-4 inline mr-1" />
                            مريض: {case_.patientName}
                          </p>
                        </div>
                        {case_.photos.length > 0 && (
                          <PhotoCarousel photos={case_.photos} />
                        )}

                        {/* Rating Button - Show only if current user is the patient of this case */}
                        {currentUser?.role === 'PATIENT' && currentUser.patientId === case_.patientId && (
                          <div className="mt-4 pt-4 border-t">
                            {case_.rating ? (
                              <div className="flex items-center gap-2 text-sm text-muted-foreground bg-slate-100 p-3 rounded-lg">
                                <CheckCircle2 className="w-4 h-4 text-emerald-800" />
                                <span>لقد قيّمت هذه الحالة بالفعل</span>
                                {case_.rating.overallRating && (
                                  <span className="flex items-center gap-1 text-amber-600 font-medium">
                                    <Star className="w-4 h-4 fill-current" />
                                    {case_.rating.overallRating}/5
                                  </span>
                                )}
                              </div>
                            ) : (
                              <Button
                                onClick={() => {
                                  setSelectedCaseForRating(case_)
                                  setShowRatingModal(true)
                                }}
                                className="w-full bg-gradient-to-r from-emerald-800 to-teal-900 hover:from-emerald-700 hover:to-teal-700"
                              >
                                <Star className="w-4 h-4 ml-2" />
                                قيم هذه الحالة
                              </Button>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Reviews Section */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="w-5 h-5 text-amber-500" />
                التقييمات من المرضى
              </CardTitle>
              <CardDescription>
                آراء المرضى الذين تعاملوا مع الدكتور
              </CardDescription>
            </CardHeader>
            <CardContent>
              {reviews.length === 0 ? (
                <div className="text-center py-12 bg-muted/50 rounded-lg border-2 border-dashed">
                  <Star className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">لا توجد تقييمات</h3>
                  <p className="text-muted-foreground">
                    لم يقم أي مريض بتقييم الدكتور بعد
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <Card key={review.id} className="border">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4 mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-full flex items-center justify-center border-2 border-white shadow">
                              {review.patientAvatar ? (
                                <img
                                  src={review.patientAvatar}
                                  alt={review.patientName}
                                  className="w-full h-full rounded-full object-cover"
                                />
                              ) : (
                                <User className="w-6 h-6 text-emerald-800" />
                              )}
                            </div>
                            <div>
                              <p className="font-semibold text-sm">{review.patientName}</p>
                              <div className="flex items-center gap-2">
                                <div className="flex items-center gap-1">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <Star
                                      key={star}
                                      className={`w-3.5 h-3.5 ${
                                        star <= review.overallRating
                                          ? 'fill-amber-400 text-amber-400'
                                          : 'text-muted-foreground'
                                      }`}
                                    />
                                  ))}
                                </div>
                                <span className="font-bold text-sm">{review.overallRating}</span>
                              </div>
                            </div>
                          </div>
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {new Date(review.createdAt).toLocaleDateString('ar-EG')}
                          </span>
                        </div>

                        {review.reviewText && (
                          <p className="text-sm text-muted-foreground mb-3 bg-muted/50 p-3 rounded-lg">
                            {review.reviewText}
                          </p>
                        )}

                        {(review.qualityRating || review.professionalRating || review.punctualityRating) && (
                          <div className="flex flex-wrap gap-3 text-xs">
                            {review.qualityRating && (
                              <div className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-full">
                                <Award className="w-3 h-3 text-emerald-800" />
                                <span className="text-emerald-50 font-medium">
                                  الجودة: {review.qualityRating}/5
                                </span>
                              </div>
                            )}
                            {review.professionalRating && (
                              <div className="flex items-center gap-1 bg-blue-50 px-2 py-1 rounded-full">
                                <ShieldCheck className="w-3 h-3 text-blue-600" />
                                <span className="text-blue-700 font-medium">
                                  المهنية: {review.professionalRating}/5
                                </span>
                              </div>
                            )}
                            {review.punctualityRating && (
                              <div className="flex items-center gap-1 bg-amber-50 px-2 py-1 rounded-full">
                                <Clock className="w-3 h-3 text-amber-600" />
                                <span className="text-amber-700 font-medium">
                                  المواعيد: {review.punctualityRating}/5
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Active Posts Section */}
          {activePosts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  البوستات النشطة
                </CardTitle>
                <CardDescription>
                  حالات يبحث الدكتور عن مرضى لها الآن
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {activePosts.map((post) => (
                    <Link key={post.id} href={`/posts/${post.id}`}>
                      <Card className="border hover:shadow-md transition-shadow cursor-pointer">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <h4 className="font-semibold mb-1">{post.title}</h4>
                              <div className="flex items-center gap-3 text-sm text-muted-foreground mb-2">
                                <span>{getTreatmentTypeLabel(post.treatmentType)}</span>
                                <span>•</span>
                                <span>{post.city}</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm">
                                <span className="text-muted-foreground">
                                  {post.acceptedCount}/{post.requiredCount} مقبول
                                </span>
                                {getPriorityBadge(post.priority)}
                              </div>
                            </div>
                            <ArrowRight className="w-5 h-5 text-muted-foreground" />
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Rating Modal */}
          {profile && (
            <RatingModal
              open={showRatingModal}
              onOpenChange={setShowRatingModal}
              caseData={selectedCaseForRating}
              studentName={student.name}
              onSuccess={async () => {
                // Refresh the profile to show new rating
                const response = await fetch(`/api/students/${params.id}/public-profile`)
                const data = await response.json()
                if (data.success) {
                  const processedProfile = {
                    ...data.profile,
                    completedCases: data.profile.completedCases.map((c: any) => ({
                      ...c,
                      photos: c.photos.map((p: any) => ({
                        ...p,
                        fileUrl: getPhotoUrl(p.fileUrl)
                      }))
                    }))
                  }
                  setProfile(processedProfile)
                }
              }}
            />
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
