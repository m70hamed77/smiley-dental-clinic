'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Navigation } from '@/components/navigation'
import { Footer } from '@/components/footer'
import {
  FileText,
  MapPin,
  Users,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Lightbulb,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { useTranslations } from '@/hooks/useTranslations'

export default function CreatePostPage() {
  const router = useRouter()
  const { user } = useCurrentUser()
  const { t, locale } = useTranslations()
  const isRTL = locale === 'ar'
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    title: '',
    treatmentType: '',
    priority: 'NORMAL',
    city: '',
    address: '',
    requiredCount: '',
    description: '',
  })

  const treatmentTypes = [
    { value: 'FILLING', label: t('createPostPage.treatmentTypes.FILLING') },
    { value: 'EXTRACTION', label: t('createPostPage.treatmentTypes.EXTRACTION') },
    { value: 'CLEANING', label: t('createPostPage.treatmentTypes.CLEANING') },
    { value: 'ROOT_CANAL', label: t('createPostPage.treatmentTypes.ROOT_CANAL') },
    { value: 'PROSTHETICS', label: t('createPostPage.treatmentTypes.PROSTHETICS') },
    { value: 'ORTHODONTICS', label: t('createPostPage.treatmentTypes.ORTHODONTICS') },
    { value: 'SURGERY', label: t('createPostPage.treatmentTypes.SURGERY') },
    { value: 'PERIODONTAL', label: t('createPostPage.treatmentTypes.PERIODONTAL') },
    { value: 'WHITENING', label: t('createPostPage.treatmentTypes.WHITENING') },
    { value: 'X_RAY', label: t('createPostPage.treatmentTypes.X_RAY') },
  ]

  const cities = [
    t('createPostPage.cities.cairo'),
    t('createPostPage.cities.giza'),
    t('createPostPage.cities.alexandria'),
    t('createPostPage.cities.dakahlia'),
    t('createPostPage.cities.sharqia'),
    t('createPostPage.cities.monufia'),
    t('createPostPage.cities.qalyubia'),
    t('createPostPage.cities.gharbia'),
    t('createPostPage.cities.ismailia'),
    t('createPostPage.cities.aswan'),
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/posts', {
        method: 'POST',
        credentials: 'include', // مهم لإرسال cookies
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: formData.title,
          treatmentType: formData.treatmentType,
          description: formData.description,
          requiredCount: parseInt(formData.requiredCount) || undefined,
          city: formData.city,
          address: formData.address,
          priority: formData.priority,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || t('createPostPage.errors.publishFailed'))
      }

      // نجح النشر
      router.push('/posts/my-posts')
    } catch (err: any) {
      setError(err.message || t('createPostPage.errors.generalError'))
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation user={user ? { id: user.id, name: user.name || 'مستخدم', email: user.email || '', role: user.role || 'STUDENT', avatar: user.avatarUrl } : undefined} />

      <main className="flex-1 py-8 px-4 bg-muted/30">
        <div className="container mx-auto max-w-4xl">
          {/* Breadcrumb */}
          <div className={`flex items-center gap-2 text-sm text-muted-foreground mb-6 ${isRTL ? 'flex-row' : 'flex-row'}`}>
            <Link href="/dashboard/student" className="hover:text-primary">{t('createPostPage.breadcrumb.dashboard')}</Link>
            {isRTL ? (
              <ArrowLeft className="w-4 h-4" />
            ) : (
              <ArrowRight className="w-4 h-4" />
            )}
            <span className="text-foreground font-medium" suppressHydrationWarning={true}>{t('createPostPage.breadcrumb.create')}</span>
          </div>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2 text-teal-900" suppressHydrationWarning={true}>{t('createPostPage.title')}</h1>
            <p className="text-teal-700" suppressHydrationWarning={true}>
              {t('createPostPage.subtitle')}
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="space-y-6">
              {/* Basic Information */}
              <Card className="bg-gradient-to-br from-teal-50 to-emerald-100 border-2 border-teal-200 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-teal-900" suppressHydrationWarning={true}>
                    <div className="w-8 h-8 bg-gradient-to-br from-teal-600 to-emerald-700 rounded-lg flex items-center justify-center shadow-md">
                      <FileText className="w-5 h-5 text-white" />
                    </div>
                    {t('createPostPage.basicInfo.title')}
                  </CardTitle>
                  <CardDescription className="text-teal-700" suppressHydrationWarning={true}>
                    {t('createPostPage.basicInfo.description')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {error && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="title" className="text-teal-800" suppressHydrationWarning={true}>{t('createPostPage.basicInfo.titleLabel')}</Label>
                    <Input
                      id="title"
                      placeholder={t('createPostPage.basicInfo.titlePlaceholder')} suppressHydrationWarning={true}
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      required
                      className="bg-white/70 border-teal-300 focus:border-teal-500 focus:ring-teal-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="treatmentType" className="text-teal-800" suppressHydrationWarning={true}>{t('createPostPage.basicInfo.treatmentLabel')}</Label>
                      <Select
                        value={formData.treatmentType}
                        onValueChange={(value) => setFormData({ ...formData, treatmentType: value })}
                        required
                      >
                        <SelectTrigger id="treatmentType" className="bg-white/70 border-teal-300 focus:border-teal-500 focus:ring-teal-500">
                          <SelectValue placeholder={t('createPostPage.basicInfo.treatmentPlaceholder')} suppressHydrationWarning={true} />
                        </SelectTrigger>
                        <SelectContent>
                          {treatmentTypes.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="priority" className="text-teal-800" suppressHydrationWarning={true}>{t('createPostPage.basicInfo.priorityLabel')}</Label>
                      <Select
                        value={formData.priority}
                        onValueChange={(value) => setFormData({ ...formData, priority: value })}
                        required
                      >
                        <SelectTrigger id="priority" className="bg-white/70 border-teal-300 focus:border-teal-500 focus:ring-teal-500">
                          <SelectValue placeholder={t('createPostPage.basicInfo.priorityPlaceholder')} suppressHydrationWarning={true} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="NORMAL">{t('createPostPage.priorities.normal')}</SelectItem>
                          <SelectItem value="MEDIUM">{t('createPostPage.priorities.medium')}</SelectItem>
                          <SelectItem value="URGENT">{t('createPostPage.priorities.urgent')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description" className="text-teal-800" suppressHydrationWarning={true}>{t('createPostPage.basicInfo.descriptionLabel')}</Label>
                    <Textarea
                      id="description"
                      placeholder={t('createPostPage.basicInfo.descriptionPlaceholder')} suppressHydrationWarning={true}
                      rows={4}
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="bg-white/70 border-teal-300 focus:border-teal-500 focus:ring-teal-500"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Location Information */}
              <Card className="bg-gradient-to-br from-blue-50 to-sky-100 border-2 border-blue-200 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-blue-900" suppressHydrationWarning={true}>
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-sky-600 rounded-lg flex items-center justify-center shadow-md">
                      <MapPin className="w-5 h-5 text-white" />
                    </div>
                    {t('createPostPage.location.title')}
                  </CardTitle>
                  <CardDescription className="text-blue-700" suppressHydrationWarning={true}>
                    {t('createPostPage.location.description')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="city" className="text-blue-800" suppressHydrationWarning={true}>{t('createPostPage.location.cityLabel')}</Label>
                    <Select
                      value={formData.city}
                      onValueChange={(value) => setFormData({ ...formData, city: value })}
                      required
                    >
                      <SelectTrigger id="city" className="bg-white/70 border-blue-300 focus:border-blue-500 focus:ring-blue-500">
                        <SelectValue placeholder={t('createPostPage.location.cityPlaceholder')} suppressHydrationWarning={true} />
                      </SelectTrigger>
                      <SelectContent>
                        {cities.map((city) => (
                          <SelectItem key={city} value={city}>
                            {city}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address" className="text-blue-800" suppressHydrationWarning={true}>{t('createPostPage.location.addressLabel')}</Label>
                    <Input
                      id="address"
                      placeholder={t('createPostPage.location.addressPlaceholder')} suppressHydrationWarning={true}
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      required
                      className="bg-white/70 border-blue-300 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Required Count */}
              <Card className="bg-gradient-to-br from-purple-50 to-violet-100 border-2 border-purple-200 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-purple-900" suppressHydrationWarning={true}>
                    <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-violet-600 rounded-lg flex items-center justify-center shadow-md">
                      <Users className="w-5 h-5 text-white" />
                    </div>
                    {t('createPostPage.patientCount.title')}
                  </CardTitle>
                  <CardDescription className="text-purple-700" suppressHydrationWarning={true}>
                    {t('createPostPage.patientCount.description')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Label htmlFor="requiredCount" className="text-purple-800" suppressHydrationWarning={true}>{t('createPostPage.patientCount.countLabel')}</Label>
                    <Input
                      id="requiredCount"
                      type="number"
                      min="1"
                      max="50"
                      placeholder={t('createPostPage.patientCount.countPlaceholder')} suppressHydrationWarning={true}
                      value={formData.requiredCount}
                      onChange={(e) => setFormData({ ...formData, requiredCount: e.target.value })}
                      required
                      className="bg-white/70 border-purple-300 focus:border-purple-500 focus:ring-purple-500"
                    />
                    <p className="text-xs text-purple-700" suppressHydrationWarning={true}>
                      {t('createPostPage.patientCount.hint')}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Tips */}
              <Alert className="bg-gradient-to-br from-amber-50 to-orange-100 border-2 border-amber-300 shadow-md">
                <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg flex items-center justify-center shadow-sm">
                  <Lightbulb className="h-5 w-5 text-white" />
                </div>
                <AlertDescription className="text-amber-900" suppressHydrationWarning={true}>
                  <strong>{t('createPostPage.tips.title')}:</strong>
                  <ul className={`list-disc ${isRTL ? 'mr-5' : 'ml-5'} mt-2 space-y-1 text-sm`}> 
                    <li>{t('createPostPage.tips.tip1')}</li>
                    <li>{t('createPostPage.tips.tip2')}</li>
                    <li>{t('createPostPage.tips.tip3')}</li>
                  </ul>
                </AlertDescription>
              </Alert>

              {/* Submit Buttons */}
              <div className={`flex gap-4 ${isRTL ? 'flex-row-reverse' : 'flex-row'}`}>
                <Button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-emerald-700 to-teal-800 hover:from-emerald-600 hover:to-teal-700 shadow-lg hover:shadow-xl transition-all duration-300 text-white font-semibold"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className={`w-4 h-4 ${isRTL ? 'mr-2' : 'ml-2'} animate-spin`} />
                      {t('createPostPage.actions.publishing')}
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className={`w-4 h-4 ${isRTL ? 'mr-2' : 'ml-2'}`} />
                      {t('createPostPage.actions.publish')}
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="border-2 border-rose-300 text-rose-700 hover:bg-rose-50 hover:border-rose-400 transition-all duration-300"
                  onClick={() => router.back()}
                  disabled={isLoading}
                >
                  {t('createPostPage.actions.cancel')}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  )
}
