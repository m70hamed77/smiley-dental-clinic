'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Navigation } from '@/components/navigation'
import { Footer } from '@/components/footer'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { useTranslations } from '@/hooks/useTranslations'
import {
  Search,
  Filter,
  MapPin,
  Calendar,
  Star,
  User,
  SlidersHorizontal,
  CheckCircle2,
  ArrowRight,
  Clock,
  UserCircle,
  ShieldCheck,
} from 'lucide-react'
import Link from 'next/link'

const treatmentTypes = [
  { value: 'FILLING', label: 'حشو' },
  { value: 'EXTRACTION', label: 'خلع' },
  { value: 'CLEANING', label: 'تنظيف' },
  { value: 'ROOT_CANAL', label: 'علاج عصب' },
  { value: 'PROSTHETICS', label: 'تركيبات' },
  { value: 'ORTHODONTICS', label: 'تقويم' },
  { value: 'SURGERY', label: 'جراحة' },
  { value: 'PERIODONTAL', label: 'علاج لثة' },
  { value: 'WHITENING', label: 'تبييض' },
  { value: 'X_RAY', label: 'أشعة' },
]

const cities = [
  'القاهرة',
  'الجيزة',
  'الإسكندرية',
  'الدقهلية',
  'الشرقية',
]

export default function SearchPage() {
  const { user } = useCurrentUser()
  const { t, locale } = useTranslations()
  const isRTL = locale === 'ar'

  const [filters, setFilters] = useState({
    treatmentType: '',
    city: '',
    distance: '',
    rating: '',
    priority: [] as string[],
    completedCases: '',
    searchQuery: '',
  })

  const [showFilters, setShowFilters] = useState(false)
  const [posts, setPosts] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // جلب البوستات من API
  const fetchPosts = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      if (filters.treatmentType) params.append('treatmentType', filters.treatmentType)
      if (filters.city) params.append('city', filters.city)
      if (filters.searchQuery) params.append('search', filters.searchQuery)

      const response = await fetch(`/api/posts/search?${params}`)
      const data = await response.json()

      if (data.success) {
        setPosts(data.posts || [])
      } else {
        console.error('[Search Page] API error:', data.error)
      }
    } catch (error) {
      console.error('Error fetching posts:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // جلب البوستات عند تغيير الفلاتر
  useEffect(() => {
    fetchPosts()
  }, [filters.treatmentType, filters.city, filters.searchQuery])

  const getPriorityBadge = (priority: string) => {
    const priorityKey = priority.toLowerCase() as 'urgent' | 'medium' | 'normal'
    const label = t(`searchPage.priority.${priorityKey}`) || priority
    const bgColor = priority === 'URGENT' ? 'bg-gradient-to-r from-rose-500 to-red-500 text-white hover:from-rose-600 hover:to-red-600 border-2 border-rose-300 shadow-md hover:shadow-lg transition-all duration-300' :
                   priority === 'MEDIUM' ? 'bg-gradient-to-r from-amber-400 to-orange-400 text-white hover:from-amber-500 hover:to-orange-500 border-2 border-amber-300 shadow-md hover:shadow-lg transition-all duration-300' :
                   'bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-600 hover:to-teal-600 border-2 border-emerald-300 shadow-md hover:shadow-lg transition-all duration-300'
    return <Badge className={bgColor}><span suppressHydrationWarning={true}>{label}</span></Badge>
  }

  const getTreatmentTypeLabel = (type: string) => {
    return t(`searchPage.treatmentTypes.${type}`) || type
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      <Navigation user={user ? { id: user.id, name: user.name || 'مستخدم', email: user.email || '', role: user.role as 'PATIENT' | 'STUDENT' | 'ADMIN', avatar: user.avatarUrl } : undefined} />

      <main className="flex-1 py-8 px-4">
        <div className="container mx-auto max-w-7xl">
          {/* Header */}
          <div className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 border-2 border-indigo-200 rounded-2xl p-8 mb-8 shadow-lg hover:shadow-xl transition-all duration-300">
            <h1 className="text-4xl font-bold mb-3 text-indigo-800" suppressHydrationWarning={true}>{t('searchPage.title')}</h1>
            <p className="text-lg text-indigo-700" suppressHydrationWarning={true}>
              {t('searchPage.subtitle')}
            </p>
          </div>

          {/* Search Bar */}
          <div className="bg-gradient-to-br from-emerald-50 to-teal-100 border-2 border-emerald-200 rounded-xl p-6 mb-6 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className={`absolute top-1/2 -translate-y-1/2 h-6 w-6 text-emerald-600 ${isRTL ? 'right-4' : 'left-4'}`} />
                <Input
                  placeholder={t('searchPage.searchPlaceholder')}
                  className={`${isRTL ? 'pr-4 pl-12' : 'pr-12 pl-4'} bg-white/70 border-2 border-emerald-300 focus:border-emerald-500 focus:ring-emerald-500 text-base h-12 rounded-xl transition-all duration-300`}
                  value={filters.searchQuery}
                  onChange={(e) => setFilters({ ...filters, searchQuery: e.target.value })}
                  suppressHydrationWarning={true}
                />
              </div>
            </div>
          </div>

          {/* Active Filters */}
          {(filters.treatmentType || filters.city || filters.priority.length > 0) && (
            <div className="bg-gradient-to-br from-blue-50 to-sky-100 border-2 border-blue-200 rounded-xl p-4 mb-6 shadow-md hover:shadow-lg transition-all duration-300">
              <div className="flex flex-wrap gap-2">
                {filters.treatmentType && (
                  <Badge variant="secondary" className="gap-1 bg-gradient-to-r from-purple-100 to-violet-100 text-purple-700 border-2 border-purple-300 px-3 py-1.5 hover:shadow-md transition-all duration-300">
                    {getTreatmentTypeLabel(filters.treatmentType)}
                    <button
                      onClick={() => setFilters({ ...filters, treatmentType: '' })}
                      className="hover:bg-red-100 rounded-full p-0.5 transition-colors"
                    >
                      ✕
                    </button>
                  </Badge>
                )}
                {filters.city && (
                  <Badge variant="secondary" className="gap-1 bg-gradient-to-r from-blue-100 to-sky-100 text-blue-700 border-2 border-blue-300 px-3 py-1.5 hover:shadow-md transition-all duration-300">
                    {filters.city}
                    <button
                      onClick={() => setFilters({ ...filters, city: '' })}
                      className="hover:bg-red-100 rounded-full p-0.5 transition-colors"
                    >
                      ✕
                    </button>
                  </Badge>
                )}
                {filters.priority.map((p) => (
                  <Badge key={p} variant="secondary" className="gap-1 px-3 py-1.5 hover:shadow-md transition-all duration-300">
                    {getPriorityBadge(p)}
                    <button
                      onClick={() => setFilters({
                        ...filters,
                        priority: filters.priority.filter(pr => pr !== p),
                      })}
                      className="hover:bg-red-100 rounded-full p-0.5 transition-colors"
                    >
                      ✕
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Results */}
          <div className="mb-4 flex items-center justify-between bg-gradient-to-r from-slate-50 to-gray-100 border-2 border-slate-200 rounded-xl p-4 shadow-md hover:shadow-lg transition-all duration-300">
            <p className="text-sm text-slate-700 font-medium" suppressHydrationWarning={true}>
              <span className="text-2xl font-bold text-indigo-600">{posts.length}</span> {t('searchPage.results')}
            </p>
            <Select defaultValue="recent">
              <SelectTrigger className="w-48 bg-white/70 border-2 border-slate-300 focus:border-indigo-500 focus:ring-indigo-500">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white/95 border-2 border-indigo-200">
                <SelectItem value="recent" suppressHydrationWarning={true} className="hover:bg-indigo-50">{t('searchPage.sort.recent')}</SelectItem>
                <SelectItem value="nearest" suppressHydrationWarning={true} className="hover:bg-indigo-50">{t('searchPage.sort.nearest')}</SelectItem>
                <SelectItem value="highest-rated" suppressHydrationWarning={true} className="hover:bg-indigo-50">{t('searchPage.sort.highestRated')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Results Grid with Scroll */}
          <div className="max-h-[700px] overflow-y-auto pr-2 space-y-4 scrollbar-thin scrollbar-thumb-indigo-600 scrollbar-track-gray-100 scrollbar-thumb-rounded-full">
            {isLoading ? (
              <div className="bg-gradient-to-br from-indigo-50 to-purple-100 border-2 border-indigo-200 rounded-2xl p-12 text-center shadow-lg">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-200 border-t-indigo-600 mx-auto mb-6"></div>
                <p className="text-lg text-indigo-800 font-medium" suppressHydrationWarning={true}>{t('searchPage.searching')}</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 pb-4">
                {posts.map((post, index) => {
                  // استخدام ألوان مختلفة لكل بطاقة بناءً على الترتيب
                  const cardColors = [
                    { from: 'emerald', to: 'teal', border: 'emerald', icon: 'emerald' },
                    { from: 'blue', to: 'sky', border: 'blue', icon: 'blue' },
                    { from: 'purple', to: 'violet', border: 'purple', icon: 'purple' },
                    { from: 'amber', to: 'orange', border: 'amber', icon: 'amber' },
                    { from: 'rose', to: 'pink', border: 'rose', icon: 'rose' },
                    { from: 'indigo', to: 'purple', border: 'indigo', icon: 'indigo' },
                  ]
                  const colors = cardColors[index % cardColors.length]

                  return (
                    <div key={post.id} className={`bg-gradient-to-br from-white to-${colors.to}-50 border-2 border-${colors.border}-200 rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 hover:border-${colors.border}-300`}>
                      <div className="p-5">
                        <div className="flex items-start justify-between gap-3 mb-4">
                          <div className="flex-1">
                            <h3 className="text-xl font-bold text-slate-800 mb-2">{post.title}</h3>
                            <div className="flex items-center gap-2 text-sm text-slate-700 mb-2 bg-gradient-to-r from-slate-50 to-gray-100 px-3 py-1.5 rounded-lg">
                              <User className="w-4 h-4 text-slate-600" />
                              <span className="font-medium">{post.studentName}</span>
                            </div>
                            <div className="flex items-center gap-2 bg-gradient-to-r from-amber-100 to-yellow-100 px-3 py-1.5 rounded-lg border border-amber-300 w-fit">
                              <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                              <span className="font-bold text-amber-800">{post.rating}</span>
                              <span className="text-xs text-amber-700">({post.totalRatings})</span>
                            </div>
                          </div>
                          <div className="flex-shrink-0">
                            {getPriorityBadge(post.priority)}
                          </div>
                        </div>

                        <div className="space-y-3 mb-5">
                          <div className="flex items-center gap-3 text-sm bg-gradient-to-r from-indigo-50 to-blue-50 px-3 py-2 rounded-lg border border-indigo-200">
                            <Calendar className="w-5 h-5 text-indigo-600 flex-shrink-0" />
                            <span className="text-indigo-700 font-medium" suppressHydrationWarning={true}>{t('searchPage.labels.treatmentType')}</span>
                            <span className="font-bold text-indigo-900">{getTreatmentTypeLabel(post.treatmentType)}</span>
                          </div>
                          <div className="flex items-center gap-3 text-sm bg-gradient-to-r from-emerald-50 to-teal-50 px-3 py-2 rounded-lg border border-emerald-200">
                            <MapPin className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                            <span className="text-emerald-700 font-medium" suppressHydrationWarning={true}>{t('searchPage.labels.location')}</span>
                            <span className="font-bold text-emerald-900">{post.city} - {post.location}</span>
                          </div>
                          <div className="flex items-center gap-3 text-sm bg-gradient-to-r from-blue-50 to-sky-50 px-3 py-2 rounded-lg border border-blue-200">
                            <CheckCircle2 className="w-5 h-5 text-blue-600 flex-shrink-0" />
                            <span className="text-blue-700 font-medium" suppressHydrationWarning={true}>{t('searchPage.labels.completedCases')}</span>
                            <span className="font-bold text-blue-900">{post.completedCases}</span>
                          </div>
                          <div className="flex items-center gap-3 text-sm bg-gradient-to-r from-purple-50 to-violet-50 px-3 py-2 rounded-lg border border-purple-200">
                            <MapPin className="w-5 h-5 text-purple-600 flex-shrink-0" />
                            <span className="text-purple-700 font-medium" suppressHydrationWarning={true}>{t('searchPage.labels.distance')}</span>
                            <span className="font-bold text-purple-900">{post.distance}</span>
                          </div>
                        </div>

                        <div className="space-y-3 pt-4 border-t-2 border-slate-200">
                          <Button asChild className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white border-2 border-emerald-300 shadow-md hover:shadow-lg transition-all duration-300 h-12 text-base font-semibold">
                            <Link href={`/posts/${post.id}`}>
                              <span suppressHydrationWarning={true}>{t('searchPage.labels.viewDetails')}</span>
                              <ArrowRight className={`w-5 h-5 ${isRTL ? 'mr-2' : 'ml-2'}`} />
                            </Link>
                          </Button>
                          <Button
                            asChild
                            variant="outline"
                            className="w-full bg-gradient-to-r from-blue-50 to-sky-50 border-2 border-blue-300 text-blue-700 hover:from-blue-100 hover:to-sky-100 hover:border-blue-400 shadow-md hover:shadow-lg transition-all duration-300 h-12 text-base font-semibold"
                          >
                            <Link href={`/doctors/${post.studentId}`}>
                              <UserCircle className={`w-5 h-5 ${isRTL ? 'mr-2' : 'ml-2'}`} />
                              <span suppressHydrationWarning={true}>{t('searchPage.labels.viewDoctorProfile')}</span>
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* No Results */}
          {posts.length === 0 && !isLoading && (
            <div className="bg-gradient-to-br from-slate-50 to-gray-100 border-2 border-slate-300 rounded-2xl p-12 text-center shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="w-24 h-24 bg-gradient-to-br from-slate-200 to-gray-300 rounded-full flex items-center justify-center mx-auto mb-6 shadow-md">
                <Search className="w-12 h-12 text-slate-500" />
              </div>
              <h3 className="text-2xl font-bold text-slate-800 mb-3" suppressHydrationWarning={true}>{t('searchPage.noResults')}</h3>
              <p className="text-slate-600 mb-6 text-lg" suppressHydrationWarning={true}>
                {t('searchPage.noResultsDesc')}
              </p>
              <Button
                onClick={() => setFilters({
                  treatmentType: '',
                  city: '',
                  distance: '',
                  rating: '',
                  priority: [],
                  completedCases: '',
                  searchQuery: '',
                })}
                className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white border-2 border-indigo-300 shadow-md hover:shadow-lg transition-all duration-300 h-12 px-8 text-base font-semibold"
              >
                <span suppressHydrationWarning={true}>{t('searchPage.clearFilters')}</span>
              </Button>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
