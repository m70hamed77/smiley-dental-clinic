'use client'

import { useState, useEffect, Suspense } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Switch } from '@/components/ui/switch'
import { Skeleton } from '@/components/ui/skeleton'
import { Navigation } from '@/components/navigation'
import { Footer } from '@/components/footer'
import { PhotoCarousel } from '@/components/photo-carousel'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { useTranslations } from '@/hooks/useTranslations'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  FileText,
  Star,
  Award,
  Zap,
  Clock,
  CheckCircle2,
  XCircle,
  Settings,
  Camera,
  Save,
  Edit3,
  Shield,
  ShieldCheck,
  GraduationCap,
  Stethoscope,
  Heart,
  Info,
  Upload,
  X,
  Plus,
  Download,
  FileCheck,
  Search,
  Eye,
  EyeOff,
  Loader2,
  Send,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

// Types
interface StudentStats {
  totalCases: number
  completedCases: number
  activeCases: number
  rating: number
  points: number
  level: string
}

interface PatientStats {
  totalApplications: number
  acceptedApplications: number
  completedTreatments: number
  pendingApplications: number
}

interface Post {
  id: string
  title: string
  status: string
  applicationsCount: number
  requiredCount: number
  createdAt: string
}

interface Activity {
  id: string
  type: string
  title: string
  timeAgo: string
  date: string
  colorClass: string
  icon: string
}

interface StudentProfile {
  universityName: string | null
  universityEmail: string | null
  academicYear: number | null
  academicYearName: string | null
  studentIdNumber: string | null
  isVerified: boolean
  verificationStatus: 'PENDING' | 'APPROVED' | 'REJECTED' | null  // Full verification status
  rejectionReason: string | null  // Rejection reason
  specialization: string | null
  bio: string | null
  location: string | null
  city: string | null
  collegeName: string | null
  collegeAddress: string | null
  completedCases: number
  activeCases: number
  cancelledCases: number
}

function ProfileContent() {
  const { user, loading: userLoading } = useCurrentUser()
  const { t, locale, loading: i18nLoading } = useTranslations()
  const searchParams = useSearchParams()
  
  const isRTL = locale === 'ar'
  const localeDate = locale === 'ar' ? 'ar-EG' : 'en-US'
  const [activeTab, setActiveTab] = useState('overview')
  
  // Define isStudent early to avoid "before initialization" error
  const isStudent = user?.role === 'STUDENT'
  
  const [studentStats, setStudentStats] = useState<StudentStats | null>(null)
  const [patientStats, setPatientStats] = useState<PatientStats | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [loadingStats, setLoadingStats] = useState(true)
  const [loadingPosts, setLoadingPosts] = useState(true)
  const [activities, setActivities] = useState<Activity[]>([])
  const [loadingActivities, setLoadingActivities] = useState(true)
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null)
  const [loadingStudentProfile, setLoadingStudentProfile] = useState(true)
  
  // Cases state for students
  const [cases, setCases] = useState<any[]>([])
  const [loadingCases, setLoadingCases] = useState(true)
  const [selectedCase, setSelectedCase] = useState<any>(null)
  const [showUploadModal, setShowUploadModal] = useState(false)

  // Privacy Settings state for students
  const [privacySettings, setPrivacySettings] = useState({
    publicProfileEnabled: true,
    showCases: true,
    showRatings: true,
    showReviews: true,
    showActivePosts: true,
    showLocation: true,
    showSpecialization: true,
    showBio: true,
    showCompletedCount: true
  })
  
  // Track which privacy setting is being updated
  const [updatingPrivacySetting, setUpdatingPrivacySetting] = useState<string | null>(null)

  // Reviews/Ratings state for students
  const [ratings, setRatings] = useState<any[]>([])
  const [loadingRatings, setLoadingRatings] = useState(true)
  const [updatingRating, setUpdatingRating] = useState<string | null>(null)

  // Patient ratings state
  const [rateableCases, setRateableCases] = useState<any[]>([])
  const [loadingRateableCases, setLoadingRateableCases] = useState(true)
  const [selectedRateableCase, setSelectedRateableCase] = useState<any>(null)
  const [ratingForm, setRatingForm] = useState({
    overallRating: 5,
    qualityRating: 5,
    professionalRating: 5,
    punctualityRating: 5,
    cleanlinessRating: 5,
    explanationRating: 5,
    reviewText: ''
  })
  const [submittingRating, setSubmittingRating] = useState(false)

  // Medical form state for patients
  const [medicalForm, setMedicalForm] = useState({
    fullName: '',
    age: '',
    gender: '',
    phone: '',
    address: '',
    bloodType: '',
    chronicDiseases: '',
    currentMedications: '',
    allergies: '',
    dentalHistory: '',
    additionalNotes: ''
  })

  // Check if coming from apply flow
  const [applyToPostId, setApplyToPostId] = useState<string | null>(null)

  // Check for applyTo parameter
  useEffect(() => {
    const applyTo = searchParams.get('applyTo')
    if (applyTo) {
      setApplyToPostId(applyTo)
      // Switch to medical info tab
      setActiveTab('medical')
      // Show alert to user
      alert(t('profile.pleaseFillMedicalForm'))
    }
  }, [searchParams])

  // Handle hash navigation for notifications
  useEffect(() => {
    const hash = window.location.hash.replace('#', '')
    if (hash === 'ratings' && isStudent) {
      setActiveTab('reviews')
    }
  }, [])

  // Fetch patient medical profile
  useEffect(() => {
    if (!user || user.role !== 'PATIENT') return

    const fetchMedicalProfile = async () => {
      try {
        const response = await fetch('/api/patient/medical-profile', {
          credentials: 'include'
        })
        const data = await response.json()
        if (data.success && data.profile) {
          setMedicalForm({
            fullName: data.profile.fullName || user.name || '',
            age: data.profile.age?.toString() || '',
            gender: data.profile.gender || '',
            phone: data.profile.phone || user.phone || '',
            address: data.profile.address || user.phone || '',
            bloodType: data.profile.bloodType || '',
            chronicDiseases: data.profile.chronicDiseases || '',
            currentMedications: data.profile.currentMedications || '',
            allergies: data.profile.allergies || '',
            dentalHistory: data.profile.dentalHistory || '',
            additionalNotes: data.profile.additionalNotes || ''
          })
        } else {
          // Initialize with user data
          setMedicalForm(prev => ({
            ...prev,
            fullName: user.name || '',
            phone: user.phone || '',
          }))
        }
      } catch (error) {
        console.error('Error fetching medical profile:', error)
      }
    }

    fetchMedicalProfile()
  }, [user])

  // Fetch stats and posts based on user role
  useEffect(() => {
    if (!user) return

    const fetchData = async () => {
      try {
        if (user.role === 'STUDENT') {
          // Fetch student stats
          const statsResponse = await fetch('/api/student/stats', {
            credentials: 'include'
          })
          const statsData = await statsResponse.json()
          if (statsData.success) {
            setStudentStats(statsData.stats)
          }

          // Fetch student posts
          const postsResponse = await fetch('/api/posts/my-posts', {
            credentials: 'include'
          })
          const postsData = await postsResponse.json()
          if (postsData.success) {
            setPosts(postsData.posts.filter((p: Post) => p.status === 'ACTIVE'))
          }

          // Fetch student profile (academic info)
          const profileResponse = await fetch(`/api/student/profile?t=${Date.now()}`, {
            credentials: 'include'
          })
          const profileData = await profileResponse.json()
          if (profileData.success) {
            setStudentProfile(profileData.student)

            // Load privacy settings from student data
            setPrivacySettings({
              publicProfileEnabled: profileData.student.publicProfileEnabled ?? true,
              showCases: profileData.student.showCases ?? true,
              showRatings: profileData.student.showRatings ?? true,
              showReviews: profileData.student.showReviews ?? true,
              showActivePosts: profileData.student.showActivePosts ?? true,
              showLocation: profileData.student.showLocation ?? true,
              showSpecialization: profileData.student.showSpecialization ?? true,
              showBio: profileData.student.showBio ?? true,
              showCompletedCount: profileData.student.showCompletedCount ?? true
            })
          }
        } else if (user.role === 'PATIENT') {
          // Fetch patient stats
          const statsResponse = await fetch('/api/patient/stats', {
            credentials: 'include'
          })
          const statsData = await statsResponse.json()
          if (statsData.success) {
            setPatientStats(statsData.stats)
          }
        }

        // Fetch activities
        const activityResponse = await fetch('/api/activity', {
          credentials: 'include'
        })
        const activityData = await activityResponse.json()
        if (activityData.success) {
          setActivities(activityData.activities)
        }
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoadingStats(false)
        setLoadingPosts(false)
        setLoadingActivities(false)
        setLoadingStudentProfile(false)
      }
    }

    fetchData()
  }, [user])

  // Fetch cases for students
  useEffect(() => {
    if (!user || user.role !== 'STUDENT') return

    const fetchCases = async () => {
      try {
        setLoadingCases(true)
        const response = await fetch('/api/cases', {
          credentials: 'include'
        })
        const data = await response.json()
        if (data.success) {
          setCases(data.cases || [])
        }
      } catch (error) {
        console.error('Error fetching cases:', error)
      } finally {
        setLoadingCases(false)
      }
    }

    fetchCases()
  }, [user])

  // Fetch ratings for students
  useEffect(() => {
    if (!user || user.role !== 'STUDENT') return

    const fetchRatings = async () => {
      try {
        const response = await fetch('/api/ratings/my-ratings', {
          credentials: 'include'
        })
        const data = await response.json()
        if (data.success) {
          setRatings(data.ratings || [])
        }
      } catch (error) {
        console.error('Error fetching ratings:', error)
      } finally {
        setLoadingRatings(false)
      }
    }

    fetchRatings()
  }, [user])

  // Fetch rateable cases for patients
  useEffect(() => {
    if (!user || user.role !== 'PATIENT') return

    const fetchRateableCases = async () => {
      try {
        setLoadingRateableCases(true)

        // Get patient's cases that need rating
        const patient = await fetch('/api/patient/me', {
          credentials: 'include'
        }).then(res => res.json())

        if (patient.success && patient.patient) {
          // Get all accepted applications for this patient
          const applicationsResponse = await fetch('/api/patient/applications', {
            credentials: 'include'
          })
          const applicationsData = await applicationsResponse.json()

          if (applicationsData.success) {
            // Filter cases that are completed but not rated yet
            const casesWithStatus = await Promise.all(
              applicationsData.applications.map(async (app: any) => {
                // Check if this application has a case
                const caseResponse = await fetch(`/api/cases/by-application/${app.id}`, {
                  credentials: 'include'
                }).catch(() => null)

                if (caseResponse && caseResponse.ok) {
                  const caseData = await caseResponse.json()
                  return {
                    ...app,
                    case_: caseData.case || null
                  }
                }
                return {
                  ...app,
                  case_: null
                }
              })
            )

            // Filter completed cases without ratings
            const rateable = casesWithStatus
              .filter((item: any) =>
                item.case_ &&
                item.case_.isCompleted &&
                !item.case_.rating &&
                item.status === 'ACCEPTED'
              )
              .map((item: any) => ({
                id: item.case_.id,
                postTitle: item.postTitle,
                postTreatmentType: item.postTreatmentType,
                studentName: item.studentName,
                studentId: item.studentId,
                completedAt: item.case_.endDate || item.case_.updatedAt
              }))

            setRateableCases(rateable)
          }
        }
      } catch (error) {
        console.error('Error fetching rateable cases:', error)
        setRateableCases([])
      } finally {
        setLoadingRateableCases(false)
      }
    }

    fetchRateableCases()
  }, [user])

  // Helper function to convert base64 to data URL
  const getPhotoUrl = (fileUrl: string) => {
    if (!fileUrl) return ''

    // If it's already a data URL, return as is
    if (fileUrl.startsWith('data:')) {
      return fileUrl
    }

    // If it's a URL (http/https), return as is
    if (fileUrl.startsWith('http')) {
      return fileUrl
    }

    // If it looks like base64, add prefix
    const looksLikeBase64 = !fileUrl.includes(' ') && !fileUrl.includes('\n') && fileUrl.length > 100
    if (looksLikeBase64) {
      return `data:image/jpeg;base64,${fileUrl}`
    }

    // Otherwise, assume it's a relative path
    return fileUrl
  }

  // Handle upload photos
  const handleUploadPhotos = async (caseId: string, formData: FormData) => {
    try {
      console.log('[Profile] Uploading photos for case:', caseId)
      console.log('[Profile] FormData entries:')
      for (const [key, value] of formData.entries()) {
        console.log(`  ${key}:`, {
          type: typeof value,
          isFile: value instanceof File,
          name: value instanceof File ? value.name : 'N/A',
          size: value instanceof File ? value.size : 'N/A'
        })
      }

      const response = await fetch(`/api/cases/${caseId}/photos`, {
        method: 'POST',
        credentials: 'include',
        body: formData
      })
      const data = await response.json()

      console.log('[Profile] Upload response:', data)

      if (data.success) {
        alert(t('profile.uploadModal.uploadSuccess'))
        // Refresh cases
        const casesResponse = await fetch('/api/cases', { credentials: 'include' })
        const casesData = await casesResponse.json()
        if (casesData.success) setCases(casesData.cases || [])
        setShowUploadModal(false)
      } else {
        throw new Error(data.error)
      }
    } catch (error: any) {
      console.error('[Profile] Upload error:', error)
      alert(error.message || t('profile.alerts.uploadError'))
    }
  }

  // Handle toggle public/private
  const handleTogglePublic = async (photoId: string, isPublic: boolean) => {
    try {
      const response = await fetch(`/api/cases/photos/${photoId}/toggle-public`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ isPublic })
      })
      if (response.ok) {
        // Refresh cases
        const casesResponse = await fetch('/api/cases', { credentials: 'include' })
        const casesData = await casesResponse.json()
        if (casesData.success) setCases(casesData.cases || [])
      }
    } catch (error) {
      console.error('Error toggling visibility:', error)
    }
  }

  // Handle update privacy setting
  const updatePrivacySetting = async (setting: string, value: boolean) => {
    // Prevent duplicate clicks
    if (updatingPrivacySetting === setting) {
      console.log('[Profile] Already updating:', setting)
      return
    }

    try {
      console.log('[Profile] Updating privacy setting:', setting, 'to:', value)

      // Mark as updating
      setUpdatingPrivacySetting(setting)

      const response = await fetch('/api/student/privacy-settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ [setting]: value })
      })

      const data = await response.json()

      console.log('[Profile] Response:', response.status, data)

      if (response.ok && data.success) {
        setPrivacySettings(prev => ({ ...prev, [setting]: value }))
        console.log('[Profile] ✅ Privacy setting updated successfully')
        alert(t('profile.alerts.settingsUpdated'))
      } else {
        console.error('[Profile] ❌ Failed to update:', data.error)
        alert(data.error || t('profile.alerts.settingsUpdateFailed'))
        // Revert the switch
        setPrivacySettings(prev => ({ ...prev, [setting]: !value }))
      }
    } catch (error: any) {
      console.error('[Profile] ❌ Error updating privacy settings:', error)
      console.error('[Profile] Error details:', {
        message: error.message,
        stack: error.stack
      })
      alert(t('profile.alerts.errorUpdatingSettings'))
      // Revert the switch
      setPrivacySettings(prev => ({ ...prev, [setting]: !value }))
    } finally {
      // Remove updating flag
      setUpdatingPrivacySetting(null)
    }
  }

  // Handle toggle rating visibility
  const toggleRatingVisibility = async (ratingId: string) => {
    // Prevent duplicate clicks
    if (updatingRating === ratingId) {
      console.log('[Profile] Already updating this rating')
      return
    }

    try {
      console.log('[Profile] ===== Toggle Rating Visibility =====')
      console.log('[Profile] Rating ID:', ratingId)
      console.log('[Profile] Rating ID type:', typeof ratingId)
      console.log('[Profile] User:', user?.name, 'Role:', user?.role)

      setUpdatingRating(ratingId)

      const url = `/api/ratings/${ratingId}/toggle-visibility`
      console.log('[Profile] Fetching:', url)
      console.log('[Profile] Method: POST')
      console.log('[Profile] Credentials: include')

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      })

      console.log('[Profile] Response status:', response.status)
      console.log('[Profile] Response ok:', response.ok)
      console.log('[Profile] Response statusText:', response.statusText)

      // Log raw response text before parsing JSON
      const responseText = await response.text()
      console.log('[Profile] Raw response text:', responseText)

      const data = JSON.parse(responseText)
      console.log('[Profile] Parsed data:', data)

      if (response.ok && data.success) {
        console.log('[Profile] ✅ Success!')
        console.log('[Profile] data.rating exists:', !!data.rating)
        console.log('[Profile] data.rating.isVisible:', data.rating?.isVisible)

        if (!data.rating || typeof data.rating.isVisible === 'undefined') {
          console.error('[Profile] ❌ Invalid response - rating or isVisible missing')
          alert(t('profile.alerts.serverResponseError'))
          setUpdatingRating(null)
          return
        }

        const newVisibility = data.rating.isVisible
        console.log('[Profile] New visibility value:', newVisibility)

        // Update ratings list
        setRatings(prev =>
          prev.map(r =>
            r.id === ratingId
              ? { ...r, isVisible: newVisibility }
              : r
          )
        )

        // Update cases list
        setCases(prev =>
          prev.map(c =>
            c.rating?.id === ratingId
              ? { ...c, rating: { ...c.rating, isVisible: newVisibility } }
              : c
          )
        )

        console.log('[Profile] ✅ State updated')
        alert(newVisibility ? t('profile.alerts.ratingShowSuccess') : t('profile.alerts.ratingHideSuccess'))
      } else {
        console.error('[Profile] ❌ Request failed')
        console.error('[Profile] response.ok:', response.ok)
        console.error('[Profile] data.success:', data.success)
        console.error('[Profile] data.error:', data?.error)
        console.error('[Profile] data.details:', data?.details)
        console.error('[Profile] Full data:', data)

        const errorMessage = data?.error || t('profile.alerts.unknownError')
        const statusMessage = response.status ? `(${t('profile.alerts.status')}: ${response.status})` : ''
        let alertMessage = `${t('profile.alerts.failedToUpdate')} ${statusMessage}\n\n${errorMessage}`

        if (data?.details) {
          alertMessage += `\n\n${t('profile.alerts.details')}:\n${JSON.stringify(data.details, null, 2)}`
        }

        alert(alertMessage)
      }
    } catch (error: any) {
      console.error('[Profile] ❌ Exception:', error)
      console.error('[Profile] Error message:', error.message)
      console.error('[Profile] Error stack:', error.stack)
      alert(`${t('profile.alerts.serverResponseError')}: ${error.message}`)
    } finally {
      setUpdatingRating(null)
    }
  }

  // Handle submit rating for patient
  const handleSubmitRating = async () => {
    if (!selectedRateableCase) return

    try {
      setSubmittingRating(true)

      const response = await fetch('/api/ratings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          caseId: selectedRateableCase.id,
          ...ratingForm
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || t('profile.ratings.error'))
      }

      alert(t('profile.ratings.success'))

      // Reset form and refresh list
      setSelectedRateableCase(null)
      setRatingForm({
        overallRating: 5,
        qualityRating: 5,
        professionalRating: 5,
        punctualityRating: 5,
        cleanlinessRating: 5,
        explanationRating: 5,
        reviewText: ''
      })

      // Refresh rateable cases list
      const patient = await fetch('/api/patient/me', {
        credentials: 'include'
      }).then(res => res.json())

      if (patient.success) {
        const applicationsResponse = await fetch('/api/patient/applications', {
          credentials: 'include'
        })
        const applicationsData = await applicationsResponse.json()

        if (applicationsData.success) {
          const casesWithStatus = await Promise.all(
            applicationsData.applications.map(async (app: any) => {
              const caseResponse = await fetch(`/api/cases/by-application/${app.id}`, {
                credentials: 'include'
              }).catch(() => null)

              if (caseResponse && caseResponse.ok) {
                const caseData = await caseResponse.json()
                return { ...app, case_: caseData.case || null }
              }
              return { ...app, case_: null }
            })
          )

          const rateable = casesWithStatus
            .filter((item: any) =>
              item.case_ &&
              item.case_.isCompleted &&
              !item.case_.rating &&
              item.status === 'ACCEPTED'
            )
            .map((item: any) => ({
              id: item.case_.id,
              postTitle: item.postTitle,
              postTreatmentType: item.postTreatmentType,
              studentName: item.studentName,
              studentId: item.studentId,
              completedAt: item.case_.endDate || item.case_.updatedAt
            }))

          setRateableCases(rateable)
        }
      }
    } catch (error: any) {
      console.error('Error submitting rating:', error)
      alert(error.message || t('profile.ratings.uploadError'))
    } finally {
      setSubmittingRating(false)
    }
  }

  const handleSaveMedicalForm = async () => {
    if (!user || user.role !== 'PATIENT') return

    try {
      const response = await fetch('/api/patient/medical-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          fullName: medicalForm.fullName,
          age: parseInt(medicalForm.age) || null,
          gender: medicalForm.gender,
          phone: medicalForm.phone,
          address: medicalForm.address,
          bloodType: medicalForm.bloodType,
          chronicDiseases: medicalForm.chronicDiseases,
          currentMedications: medicalForm.currentMedications,
          allergies: medicalForm.allergies,
          dentalHistory: medicalForm.dentalHistory,
          additionalNotes: medicalForm.additionalNotes
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || t('profile.uploadModal.medicalFormSaveFailed'))
      }

      alert(t('profile.uploadModal.medicalFormSaved'))

      // If applying to a post, redirect to apply
      if (applyToPostId) {
        const applyResponse = await fetch(`/api/posts/${applyToPostId}/apply`, {
          method: 'POST',
          credentials: 'include'
        })

        const applyData = await applyResponse.json()

        if (!applyResponse.ok) {
          throw new Error(applyData.error || t('profile.uploadModal.applicationFailed'))
        }

        alert(t('profile.uploadModal.applicationSent'))
        setApplyToPostId(null)
        window.location.href = `/posts/${applyToPostId}`
      }
    } catch (error: any) {
      alert(error.message || t('profile.uploadModal.medicalFormSaveError'))
    }
  }

  if (userLoading || loadingStats || loadingPosts || loadingActivities || (user?.role === 'STUDENT' && loadingStudentProfile)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-800 mx-auto"></div>
          <p className="mt-4 text-muted-foreground">{t('profile.loading')}</p>
        </div>
      </div>
    )
  }

  const userName = isStudent ? `Dr. ${user?.name}` : user?.name

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation
        user={
          user
            ? {
                id: user.id,
                name: userName,
                email: user.email,
                role: user.role as 'PATIENT' | 'STUDENT',
                avatar: user.avatarUrl,
              }
            : undefined
        }
      />

      <main className="flex-1 py-8 px-4 bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
        <div className="container mx-auto max-w-6xl">
          {/* Profile Header */}
          <Card className="mb-6 bg-gradient-to-br from-teal-400 via-emerald-500 to-teal-600 border-2 border-teal-300 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-6 items-start">
                {/* Avatar */}
                <div className="relative">
                  <Avatar className="w-24 h-24">
                    <AvatarImage 
                      src={getPhotoUrl(user?.avatarUrl || '')} 
                      alt={user?.name || 'Avatar'} 
                    />
                    <AvatarFallback className="text-3xl bg-gradient-to-br from-emerald-800 to-teal-900 text-white">
                      {user?.name?.charAt(0) || t('profile.uploadModal.avatarFallback')}
                    </AvatarFallback>
                  </Avatar>
                  <Button
                    size="icon"
                    variant="secondary"
                    className="absolute -bottom-2 -right-2 rounded-full w-8 h-8 bg-gradient-to-br from-white to-gray-100 hover:from-gray-50 hover:to-gray-200 text-teal-700 border-2 border-white hover:shadow-lg transition-all duration-300"
                    onClick={() => window.location.href = '/settings'}
                  >
                    <Camera className="w-4 h-4" />
                  </Button>
                </div>

                {/* User Info */}
                <div className="flex-1">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                      <h1 className="text-2xl font-bold mb-1">{userName}</h1>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        {isStudent ? (
                          <>
                            <GraduationCap className={`w-4 h-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                            <span suppressHydrationWarning={true}>{t('profile.dentalStudent')}</span>
                          </>
                        ) : (
                          <>
                            <User className={`w-4 h-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                            <span suppressHydrationWarning={true}>{t('profile.patient')}</span>
                          </>
                        )}
                        <Badge variant="secondary" className="text-xs">
                          {user?.status === 'ACTIVE' ? t('profile.active') : t('profile.inactive')}
                        </Badge>
                      </div>
                    </div>
                    <Button variant="outline" className="gap-2 border-2 border-white bg-white/50 text-teal-900 hover:bg-white hover:border-white hover:shadow-lg focus:border-white focus:ring-white transition-all duration-300" asChild>
                      <Link href="/settings" suppressHydrationWarning={true}>
                        <Edit3 className={`w-4 h-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                        {t('profile.editProfile')}
                      </Link>
                    </Button>
                  </div>

                  <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <span className="text-teal-700 truncate">{user?.email}</span>
                    </div>
                    {user?.phone && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="w-4 h-4 text-muted-foreground" />
                        <span className="text-teal-700">{user.phone}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className={`w-4 h-4 text-muted-foreground ${isRTL ? 'ml-2' : 'mr-2'}`} />
                      <span className="text-teal-700" suppressHydrationWarning={true}>
                        {t('profile.joined')} {new Date(user?.createdAt || Date.now()).toLocaleDateString(localeDate, { year: 'numeric', month: 'long', day: 'numeric' })}
                      </span>
                    </div>
                    {isStudent && (
                      <div className="flex items-center gap-2 text-sm">
                        <Star className={`w-4 h-4 text-amber-500 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                        <span className="text-teal-700">{t('profile.rating')}: {studentStats?.rating || 0}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className={`grid ${!isStudent ? 'w-full grid-cols-5' : 'w-full grid-cols-2 md:grid-cols-4'} lg:w-auto lg:inline-grid bg-white/50`}>
              <TabsTrigger value="overview" suppressHydrationWarning={true} className="bg-gradient-to-br from-teal-400 to-emerald-500 text-white hover:from-teal-500 hover:to-emerald-600 focus:ring-teal-500 data-[state=active]:bg-gradient-to-br data-[state=active]:from-teal-500 data-[state=active]:to-emerald-600 data-[state=active]:text-white transition-all duration-300">
                <span suppressHydrationWarning={true}>{t('profile.tabs.overview')}</span>
              </TabsTrigger>
              {isStudent && (
                <TabsTrigger value="cases" suppressHydrationWarning={true} className="bg-gradient-to-br from-blue-400 to-sky-500 text-white hover:from-blue-500 hover:to-sky-600 focus:ring-blue-500 data-[state=active]:bg-gradient-to-br data-[state=active]:from-blue-500 data-[state=active]:to-sky-600 data-[state=active]:text-white transition-all duration-300">
                  <span suppressHydrationWarning={true}>{t('profile.tabs.myCases')}</span>
                </TabsTrigger>
              )}
              {isStudent && (
                <TabsTrigger value="reviews" suppressHydrationWarning={true} className="bg-gradient-to-br from-purple-400 to-violet-500 text-white hover:from-purple-500 hover:to-violet-600 focus:ring-purple-500 data-[state=active]:bg-gradient-to-br data-[state=active]:from-purple-500 data-[state=active]:to-violet-600 data-[state=active]:text-white transition-all duration-300">
                  <span suppressHydrationWarning={true}>{t('profile.tabs.testimonials')}</span>
                </TabsTrigger>
              )}
              {!isStudent && (
                <TabsTrigger value="medical" suppressHydrationWarning={true} className="bg-gradient-to-br from-sky-400 to-blue-500 text-white hover:from-sky-500 hover:to-blue-600 focus:ring-sky-500 data-[state=active]:bg-gradient-to-br data-[state=active]:from-sky-500 data-[state=active]:to-blue-600 data-[state=active]:text-white transition-all duration-300">
                  <span suppressHydrationWarning={true}>{t('profile.tabs.medicalRecord')}</span>
                </TabsTrigger>
              )}
              {!isStudent && (
                <TabsTrigger value="ratings" suppressHydrationWarning={true} className="bg-gradient-to-br from-amber-400 to-orange-500 text-white hover:from-amber-500 hover:to-orange-600 focus:ring-amber-500 data-[state=active]:bg-gradient-to-br data-[state=active]:from-amber-500 data-[state=active]:to-orange-600 data-[state=active]:text-white transition-all duration-300">
                  <span suppressHydrationWarning={true}>{t('profile.tabs.ratings')}</span>
                </TabsTrigger>
              )}
              <TabsTrigger value="activity" suppressHydrationWarning={true} className="bg-gradient-to-br from-indigo-400 to-purple-500 text-white hover:from-indigo-500 hover:to-purple-600 focus:ring-indigo-500 data-[state=active]:bg-gradient-to-br data-[state=active]:from-indigo-500 data-[state=active]:to-purple-600 data-[state=active]:text-white transition-all duration-300">
                <span suppressHydrationWarning={true}>{t('profile.tabs.activity')}</span>
              </TabsTrigger>
              <TabsTrigger value="settings" suppressHydrationWarning={true} className="bg-gradient-to-br from-rose-400 to-pink-500 text-white hover:from-rose-500 hover:to-pink-600 focus:ring-rose-500 data-[state=active]:bg-gradient-to-br data-[state=active]:from-rose-500 data-[state=active]:to-pink-600 data-[state=active]:text-white transition-all duration-300">
                <span suppressHydrationWarning={true}>{t('profile.tabs.settings')}</span>
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {isStudent ? (
                  <>
                    <Card className="bg-gradient-to-br from-teal-100 to-emerald-200 border-2 border-teal-300 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                      <CardHeader className="pb-3">
                        <CardDescription className="text-xs text-teal-600" suppressHydrationWarning={true}>{t('profile.stats.totalCases')}</CardDescription>
                        <CardTitle className="text-3xl text-teal-800">{studentStats?.totalCases || 0}</CardTitle>
                      </CardHeader>
                    </Card>
                    <Card className="bg-gradient-to-br from-emerald-100 to-green-200 border-2 border-emerald-300 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                      <CardHeader className="pb-3">
                        <CardDescription className="text-xs text-emerald-600" suppressHydrationWarning={true}>{t('profile.stats.completed')}</CardDescription>
                        <CardTitle className="text-3xl text-emerald-800">{studentStats?.completedCases || 0}</CardTitle>
                      </CardHeader>
                    </Card>
                    <Card className="bg-gradient-to-br from-amber-100 to-orange-200 border-2 border-amber-300 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                      <CardHeader className="pb-3">
                        <CardDescription className="text-xs text-amber-600" suppressHydrationWarning={true}>{t('profile.rating')}</CardDescription>
                        <CardTitle className="text-3xl text-amber-700 flex items-center gap-1">
                          <Star className="w-5 h-5 fill-amber-400" />
                          {studentStats?.rating || 0}
                        </CardTitle>
                      </CardHeader>
                    </Card>
                    <Card className="bg-gradient-to-br from-purple-100 to-violet-200 border-2 border-purple-300 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                      <CardHeader className="pb-3">
                        <CardDescription className="text-xs text-purple-600" suppressHydrationWarning={true}>{t('profile.stats.points')}</CardDescription>
                        <CardTitle className="text-3xl text-purple-700 flex items-center gap-1">
                          <Zap className={`w-5 h-5 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                          {studentStats?.points || 0}
                        </CardTitle>
                      </CardHeader>
                    </Card>
                  </>
                ) : (
                  <>
                    <Card className="bg-gradient-to-br from-sky-100 to-blue-200 border-2 border-sky-300 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                      <CardHeader className="pb-3">
                        <CardDescription className="text-xs text-sky-600" suppressHydrationWarning={true}>{t('profile.stats.totalApplications')}</CardDescription>
                        <CardTitle className="text-3xl text-sky-800">{patientStats?.totalApplications || 0}</CardTitle>
                      </CardHeader>
                    </Card>
                    <Card className="bg-gradient-to-br from-emerald-100 to-green-200 border-2 border-emerald-300 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                      <CardHeader className="pb-3">
                        <CardDescription className="text-xs text-emerald-600" suppressHydrationWarning={true}>{t('profile.stats.accepted')}</CardDescription>
                        <CardTitle className="text-3xl text-emerald-800">
                          {patientStats?.acceptedApplications || 0}
                        </CardTitle>
                      </CardHeader>
                    </Card>
                    <Card className="bg-gradient-to-br from-blue-100 to-sky-200 border-2 border-blue-300 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                      <CardHeader className="pb-3">
                        <CardDescription className="text-xs text-blue-600" suppressHydrationWarning={true}>{t('profile.stats.completed')}</CardDescription>
                        <CardTitle className="text-3xl text-blue-800">
                          {patientStats?.completedTreatments || 0}
                        </CardTitle>
                      </CardHeader>
                    </Card>
                    <Card className="bg-gradient-to-br from-amber-100 to-orange-200 border-2 border-amber-300 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                      <CardHeader className="pb-3">
                        <CardDescription className="text-xs text-amber-600" suppressHydrationWarning={true}>{t('profile.stats.pending')}</CardDescription>
                        <CardTitle className="text-3xl text-amber-700">
                          {patientStats?.pendingApplications || 0}
                        </CardTitle>
                      </CardHeader>
                    </Card>
                  </>
                )}
              </div>

              {/* Student Specific: Academic Info */}
              {isStudent && (
                <Card className="bg-gradient-to-br from-teal-100 to-emerald-200 border-2 border-teal-300 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-teal-800">
                      <GraduationCap className={`w-5 h-5 text-teal-700 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                      {t('profile.academicInfo.title')}
                    </CardTitle>
                    <CardDescription className="text-teal-600">{t('profile.academicInfo.description')}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label suppressHydrationWarning={true} className="text-teal-700">{t('profile.academicInfo.university')}</Label>
                        <div className="text-sm text-teal-900">
                          {studentProfile?.universityName || t('profile.academicInfo.notAdded')}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label suppressHydrationWarning={true} className="text-teal-700">{t('profile.academicInfo.academicYear')}</Label>
                        <div className="text-sm text-teal-900">
                          {studentProfile?.academicYearName || t('profile.academicInfo.notAdded')}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label suppressHydrationWarning={true} className="text-teal-700">{t('profile.academicInfo.college')}</Label>
                        <div className="text-sm text-teal-900">
                          {studentProfile?.collegeName || t('profile.academicInfo.notAdded')}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label suppressHydrationWarning={true} className="text-teal-700">{t('profile.academicInfo.collegeAddress')}</Label>
                        <div className="text-sm text-teal-900">
                          {studentProfile?.collegeAddress || t('profile.academicInfo.notAdded')}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label suppressHydrationWarning={true} className="text-teal-700">{t('profile.academicInfo.studentId')}</Label>
                        <div className="text-sm text-teal-900">
                          {studentProfile?.studentIdNumber || t('profile.academicInfo.notAddedYet')}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label suppressHydrationWarning={true} className="text-teal-700">{t('profile.academicInfo.specialization')}</Label>
                        <div className="text-sm text-teal-900">
                          {studentProfile?.specialization || t('profile.academicInfo.notSpecifiedYet')}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label suppressHydrationWarning={true} className="text-teal-700">{t('profile.academicInfo.verificationStatus')}</Label>
                        {studentProfile?.verificationStatus === 'APPROVED' ? (
                          <Badge className="bg-gradient-to-r from-emerald-600 to-green-700 text-white border-emerald-700">
                            <CheckCircle2 className={`w-3 h-3 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                            {t('profile.academicInfo.verified')}
                          </Badge>
                        ) : studentProfile?.verificationStatus === 'PENDING' ? (
                          <Badge className="bg-gradient-to-r from-amber-100 to-orange-100 text-amber-700 border-amber-300">
                            <Clock className={`w-3 h-3 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                            {t('profile.academicInfo.pendingReview')}
                          </Badge>
                        ) : studentProfile?.verificationStatus === 'REJECTED' ? (
                          <Badge className="bg-gradient-to-r from-red-100 to-rose-100 text-red-700 border-red-300">
                            <XCircle className={`w-3 h-3 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                            {t('profile.academicInfo.rejected')}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="border-teal-300 text-teal-700">
                            {t('profile.academicInfo.notSpecified')}
                          </Badge>
                        )}
                        {studentProfile?.verificationStatus === 'REJECTED' && studentProfile?.rejectionReason && (
                          <Alert className="mt-2 bg-gradient-to-r from-red-50 to-rose-50 border-2 border-red-200">
                            <AlertDescription className="text-red-700">
                              <strong>{t('profile.academicInfo.rejectionReason')}:</strong> {studentProfile.rejectionReason}
                            </AlertDescription>
                          </Alert>
                        )}
                      </div>
                      {studentProfile?.city && (
                        <div className="space-y-2">
                          <Label suppressHydrationWarning={true} className="text-teal-700">{t('profile.academicInfo.city')}</Label>
                          <div className="text-sm text-teal-900">
                            {studentProfile.city}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Patient Specific: Treatment Stats */}
              {!isStudent && (
                <Card className="bg-gradient-to-br from-sky-100 to-blue-200 border-2 border-sky-300 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-sky-800">
                      <Heart className={`w-5 h-5 text-rose-600 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                      {t('profile.treatmentStats.title')}
                    </CardTitle>
                    <CardDescription className="text-sky-600">{t('profile.treatmentStats.description')}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="text-center p-4 bg-gradient-to-br from-emerald-100 to-green-200 rounded-lg border-2 border-emerald-300 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
                        <div className="text-3xl font-bold text-emerald-800">{patientStats?.completedTreatments || 0}</div>
                        <div className="text-sm text-emerald-700">{t('profile.treatmentStats.treatmentCompleted')}</div>
                      </div>
                      <div className="text-center p-4 bg-gradient-to-br from-blue-100 to-sky-200 rounded-lg border-2 border-blue-300 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
                        <div className="text-3xl font-bold text-blue-800">{patientStats?.acceptedApplications || 0}</div>
                        <div className="text-sm text-blue-700">{t('profile.treatmentStats.applicationAccepted')}</div>
                      </div>
                      <div className="text-center p-4 bg-gradient-to-br from-amber-100 to-orange-200 rounded-lg border-2 border-amber-300 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
                        <div className="text-3xl font-bold text-amber-700">{patientStats?.pendingApplications || 0}</div>
                        <div className="text-sm text-amber-600">{t('profile.stats.pending')}</div>
                      </div>
                      <div className="text-center p-4 bg-gradient-to-br from-purple-100 to-violet-200 rounded-lg border-2 border-purple-300 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
                        <div className="text-3xl font-bold text-purple-800">{patientStats?.totalApplications || 0}</div>
                        <div className="text-sm text-purple-700">{t('profile.stats.totalApplications')}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Student Specific: Badges & Level */}
              {isStudent && (
                <div className="grid md:grid-cols-2 gap-6">
                  <Card className="bg-gradient-to-br from-purple-100 to-violet-200 border-2 border-purple-300 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-purple-800">
                        <Award className="w-5 h-5 text-amber-500" />
                        {t('profile.badgesSection.title')}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <div className="flex items-center justify-between text-sm mb-2 text-purple-700">
                            <span className="text-purple-800">{t('profile.badgesSection.level')}: {studentStats?.level || t('profile.badgesSection.beginner')}</span>
                            <span className="text-purple-800">{studentStats?.points || 0} {t('profile.badgesSection.points')}</span>
                          </div>
                          <div className="w-full bg-purple-100 rounded-full h-3">
                            <div
                              className="bg-gradient-to-r from-purple-600 to-violet-700 h-3 rounded-full"
                              style={{ width: `${Math.min(((studentStats?.points || 0) / 300) * 100, 100)}%` }}
                            />
                          </div>
                        </div>

                        <div>
                          <p className="text-sm font-medium mb-3 text-purple-800">{t('profile.badgesSection.badgesEarned')}</p>
                          <div className="flex flex-wrap gap-2">
                            {(studentStats?.points || 0) >= 10 && (
                              <Badge variant="outline" className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300 text-amber-700">
                                <Award className={`w-3 h-3 ${isRTL ? 'ml-1' : 'mr-1'}`} />
                                {t('profile.badgesSection.firstCase')}
                              </Badge>
                            )}
                            {(studentStats?.points || 0) >= 50 && (
                              <Badge variant="outline" className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300 text-amber-700">
                                <Award className={`w-3 h-3 ${isRTL ? 'ml-1' : 'mr-1'}`} />
                                {t('profile.badgesSection.risingStar')}
                              </Badge>
                            )}
                            {(studentStats?.points || 0) >= 100 && (
                              <Badge variant="outline" className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300 text-amber-700">
                                <Award className={`w-3 h-3 ${isRTL ? 'ml-1' : 'mr-1'}`} />
                                {t('profile.badgesSection.professional')}
                              </Badge>
                            )}
                            {(studentStats?.points || 0) >= 300 && (
                              <Badge variant="outline" className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300 text-amber-700">
                                <Award className={`w-3 h-3 ${isRTL ? 'ml-1' : 'mr-1'}`} />
                                {t('profile.badgesSection.expert')}
                              </Badge>
                            )}
                            {(studentStats?.points || 0) === 0 && (
                              <p className="text-sm text-purple-600">{t('profile.badgesSection.earnFirstBadges')}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-emerald-100 to-teal-200 border-2 border-emerald-300 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-emerald-800">
                        <FileText className="w-5 h-5 text-emerald-600" />
                        {t('profile.activePostsSection.title')}
                      </CardTitle>
                      <CardDescription className="text-emerald-600">{posts.length} {t('profile.activePostsSection.description')}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {posts.length === 0 ? (
                          <p className="text-center text-emerald-600 py-4">{t('profile.activePostsSection.noActivePosts')}</p>
                        ) : (
                          posts.map((post) => (
                            <div key={post.id} className="flex items-center justify-between p-3 bg-white/80 rounded-lg border-2 border-emerald-200 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
                              <div className="flex-1">
                                <p className="font-medium text-sm text-emerald-900">{post.title}</p>
                                <p className="text-xs text-emerald-700">{post.applicationsCount} {t('profile.activePostsSection.application')}</p>
                              </div>
                              <Badge className="bg-gradient-to-r from-emerald-600 to-green-700 text-white border-emerald-700">{t('profile.activePostsSection.active')}</Badge>
                            </div>
                          ))
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Patient Specific: Medical History */}
              {!isStudent && (
                <Card className="bg-gradient-to-br from-sky-100 to-blue-200 border-2 border-sky-300 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-sky-800">
                      <Heart className="w-5 h-5 text-rose-600" />
                      {t('profile.uploadModal.medicalHistory')}
                    </CardTitle>
                    <CardDescription className="text-sky-600">{t('profile.uploadModal.lastTreatments')}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {patientStats?.completedTreatments === 0 ? (
                        <div className="text-center py-12">
                          <Heart className="w-16 h-16 mx-auto text-sky-300 mb-4" />
                          <h3 className="text-lg font-semibold mb-2 text-sky-800">{t('profile.uploadModal.noMedicalHistory')}</h3>
                          <p className="text-sky-600">
                            {t('profile.uploadModal.noMedicalHistoryDesc')}
                          </p>
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <p className="text-sky-700">
                            {patientStats?.completedTreatments || 0} {t('profile.uploadModal.treatmentsCompleted')}
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Medical Info Tab - Patients Only */}
            {!isStudent && (
              <TabsContent value="medical" className="space-y-6">
                <Card className="bg-gradient-to-br from-sky-100 to-blue-200 border-2 border-sky-300 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-sky-800">
                      <Stethoscope className="w-5 h-5 text-sky-600" />
                      <span suppressHydrationWarning={true}>{t('profile.medicalRecord.title')}</span>
                    </CardTitle>
                    <CardDescription className="text-sky-600" suppressHydrationWarning={true}>
                      {applyToPostId ? t('profile.medicalRecord.fillForm') : t('profile.medicalRecord.updateInfo')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {applyToPostId && (
                      <Alert className="bg-gradient-to-r from-blue-100 to-sky-100 border-2 border-blue-300">
                        <Info className="h-4 w-4 text-blue-600" />
                        <AlertDescription className="text-blue-900">
                          {t('profile.medicalRecord.autoSubmit')}
                        </AlertDescription>
                      </Alert>
                    )}

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="fullName" className="text-sky-700">{t('profile.medicalRecord.fullName')}</Label>
                        <Input
                          id="fullName"
                          value={medicalForm.fullName}
                          onChange={(e) => setMedicalForm({ ...medicalForm, fullName: e.target.value })}
                          placeholder={t('profile.medicalRecord.fullNamePlaceholder')}
                          className="bg-white/70 border-2 border-sky-300 focus:border-sky-500 focus:ring-sky-500 transition-all duration-300"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="age" className="text-sky-700">{t('profile.medicalRecord.age')}</Label>
                        <Input
                          id="age"
                          type="number"
                          value={medicalForm.age}
                          onChange={(e) => setMedicalForm({ ...medicalForm, age: e.target.value })}
                          placeholder={t('profile.medicalRecord.agePlaceholder')}
                          className="bg-white/70 border-2 border-sky-300 focus:border-sky-500 focus:ring-sky-500 transition-all duration-300"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="gender" className="text-sky-700">{t('profile.medicalRecord.gender')}</Label>
                        <Select
                          value={medicalForm.gender}
                          onValueChange={(value) => setMedicalForm({ ...medicalForm, gender: value })}
                        >
                          <SelectTrigger id="gender" className="bg-white/70 border-2 border-sky-300 focus:border-sky-500 focus:ring-sky-500 transition-all duration-300">
                            <SelectValue placeholder={t('profile.medicalRecord.selectGender')} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="male">{t('profile.medicalRecord.male')}</SelectItem>
                            <SelectItem value="female">{t('profile.medicalRecord.female')}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="bloodType" className="text-sky-700">{t('profile.medicalRecord.bloodType')}</Label>
                        <Select
                          value={medicalForm.bloodType}
                          onValueChange={(value) => setMedicalForm({ ...medicalForm, bloodType: value })}
                        >
                          <SelectTrigger id="bloodType" className="bg-white/70 border-2 border-sky-300 focus:border-sky-500 focus:ring-sky-500 transition-all duration-300">
                            <SelectValue placeholder={t('profile.medicalRecord.selectBloodType')} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="A+">A+</SelectItem>
                            <SelectItem value="A-">A-</SelectItem>
                            <SelectItem value="B+">B+</SelectItem>
                            <SelectItem value="B-">B-</SelectItem>
                            <SelectItem value="AB+">AB+</SelectItem>
                            <SelectItem value="AB-">AB-</SelectItem>
                            <SelectItem value="O+">O+</SelectItem>
                            <SelectItem value="O-">O-</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="phone" className="text-sky-700">{t('profile.medicalRecord.phone')}</Label>
                        <Input
                          id="phone"
                          type="tel"
                          value={medicalForm.phone}
                          onChange={(e) => setMedicalForm({ ...medicalForm, phone: e.target.value })}
                          placeholder={t('profile.medicalRecord.phonePlaceholder')}
                          className="bg-white/70 border-2 border-sky-300 focus:border-sky-500 focus:ring-sky-500 transition-all duration-300"
                        />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="address" className="text-sky-700">{t('profile.medicalRecord.address')}</Label>
                        <Input
                          id="address"
                          value={medicalForm.address}
                          onChange={(e) => setMedicalForm({ ...medicalForm, address: e.target.value })}
                          placeholder={t('profile.medicalRecord.addressPlaceholder')}
                          className="bg-white/70 border-2 border-sky-300 focus:border-sky-500 focus:ring-sky-500 transition-all duration-300"
                        />
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="chronicDiseases" className="text-sky-700">{t('profile.medicalRecord.chronicDiseases')}</Label>
                        <Textarea
                          id="chronicDiseases"
                          value={medicalForm.chronicDiseases}
                          onChange={(e) => setMedicalForm({ ...medicalForm, chronicDiseases: e.target.value })}
                          placeholder={t('profile.medicalRecord.chronicDiseasesPlaceholder')}
                          rows={3}
                          className="bg-white/70 border-2 border-sky-300 focus:border-sky-500 focus:ring-sky-500 transition-all duration-300"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="currentMedications" className="text-sky-700">{t('profile.medicalRecord.currentMedications')}</Label>
                        <Textarea
                          id="currentMedications"
                          value={medicalForm.currentMedications}
                          onChange={(e) => setMedicalForm({ ...medicalForm, currentMedications: e.target.value })}
                          placeholder={t('profile.medicalRecord.currentMedicationsPlaceholder')}
                          rows={3}
                          className="bg-white/70 border-2 border-sky-300 focus:border-sky-500 focus:ring-sky-500 transition-all duration-300"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="allergies" className="text-sky-700">{t('profile.medicalRecord.allergies')}</Label>
                        <Textarea
                          id="allergies"
                          value={medicalForm.allergies}
                          onChange={(e) => setMedicalForm({ ...medicalForm, allergies: e.target.value })}
                          placeholder={t('profile.medicalRecord.allergiesPlaceholder')}
                          rows={3}
                          className="bg-white/70 border-2 border-sky-300 focus:border-sky-500 focus:ring-sky-500 transition-all duration-300"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="dentalHistory" className="text-sky-700">{t('profile.medicalRecord.dentalHistory')}</Label>
                        <Textarea
                          id="dentalHistory"
                          value={medicalForm.dentalHistory}
                          onChange={(e) => setMedicalForm({ ...medicalForm, dentalHistory: e.target.value })}
                          placeholder={t('profile.medicalRecord.dentalHistoryPlaceholder')}
                          rows={3}
                          className="bg-white/70 border-2 border-sky-300 focus:border-sky-500 focus:ring-sky-500 transition-all duration-300"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="additionalNotes" className="text-sky-700">{t('profile.medicalRecord.additionalNotes')}</Label>
                        <Textarea
                          id="additionalNotes"
                          value={medicalForm.additionalNotes}
                          onChange={(e) => setMedicalForm({ ...medicalForm, additionalNotes: e.target.value })}
                          placeholder={t('profile.medicalRecord.additionalNotesPlaceholder')}
                          rows={3}
                          className="bg-white/70 border-2 border-sky-300 focus:border-sky-500 focus:ring-sky-500 transition-all duration-300"
                        />
                      </div>
                    </div>

                    <Button
                      onClick={handleSaveMedicalForm}
                      className="w-full bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white border-0 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
                    >
                      <Save className="w-4 h-4 ml-2" />
                      {applyToPostId ? t('profile.medicalRecord.saveAndSend') : t('profile.medicalRecord.saveMedicalRecord')}
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>
            )}

            {/* Activity Tab */}
            <TabsContent value="activity" className="space-y-6">
              <Card className="bg-gradient-to-br from-purple-100 to-violet-200 border-2 border-purple-300 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-purple-800">
                    <Clock className="w-5 h-5 text-purple-600" />
                    <span suppressHydrationWarning={true}>{t('profile.activity.title')}</span>
                  </CardTitle>
                  <CardDescription className="text-purple-600" suppressHydrationWarning={true}>{t('profile.activity.description')}</CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingActivities ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-700"></div>
                    </div>
                  ) : activities.length === 0 ? (
                    <div className="text-center py-12">
                      <Clock className="w-16 h-16 mx-auto text-purple-300 mb-4" />
                      <h3 className="text-lg font-semibold mb-2 text-purple-800">{t('profile.activity.noActivity')}</h3>
                      <p className="text-purple-600">
                        {isStudent 
                          ? t('profile.activity.startCasesStudent')
                          : t('profile.activity.startCasesPatient')
                        }
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {activities.map((activity) => {
                        // Get the correct icon component based on the icon name
                        const getIcon = (iconName: string) => {
                          switch (iconName) {
                            case 'FileText':
                              return <FileText className="w-5 h-5" />
                            case 'Star':
                              return <Star className="w-5 h-5" />
                            case 'Calendar':
                              return <Calendar className="w-5 h-5" />
                            case 'Users':
                              return <User className="w-5 h-5" />
                            case 'CheckCircle2':
                              return <CheckCircle2 className="w-5 h-5" />
                            default:
                              return <Clock className="w-5 h-5" />
                          }
                        }

                        return (
                          <div key={activity.id} className="flex items-start gap-4 p-4 bg-white/80 rounded-lg border-2 border-purple-200 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${activity.colorClass}`}>
                              {getIcon(activity.icon)}
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-purple-900">{activity.title}</p>
                              <p className="text-sm text-purple-700">{activity.timeAgo}</p>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Ratings Tab - For patients only */}
            {!isStudent && (
              <TabsContent value="ratings" className="space-y-6">
                <Card className="bg-gradient-to-br from-amber-100 to-orange-200 border-2 border-amber-300 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-amber-800">
                      <Star className="w-5 h-5 text-amber-600" />
                      {t('profile.ratings.title')}
                    </CardTitle>
                    <CardDescription className="text-amber-600">
                      {t('profile.ratings.description')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {loadingRateableCases ? (
                      <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-700 mx-auto mb-4"></div>
                        <p className="text-amber-600">{t('profile.ratings.loading')}</p>
                      </div>
                    ) : selectedRateableCase ? (
                      /* Rating Form */
                      <div className="space-y-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold text-lg text-amber-900">{selectedRateableCase.postTitle}</h3>
                            <p className="text-sm text-amber-700">{t('profile.ratings.doctor')}: {selectedRateableCase.studentName}</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedRateableCase(null)}
                          >
                            <X className={`w-4 h-4 ${isRTL ? 'ml-1' : 'mr-1'}`} />
                            {t('profile.ratings.cancel')}
                          </Button>
                        </div>

                        {/* Rating Stars */}
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <label className="text-sm font-medium">{t('profile.ratings.overallRating')}</label>
                            <div className="flex items-center gap-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                  key={star}
                                  type="button"
                                  onClick={() => setRatingForm(prev => ({ ...prev, overallRating: star }))}
                                  className={`text-2xl transition-colors ${
                                    star <= ratingForm.overallRating
                                      ? 'text-amber-400'
                                      : 'text-gray-300 hover:text-amber-200'
                                  }`}
                                >
                                  ★
                                </button>
                              ))}
                              <span className={`${isRTL ? 'ml-2' : 'mr-2'} text-sm text-muted-foreground`}>
                                {ratingForm.overallRating}/5
                              </span>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <label className="text-sm font-medium">{t('profile.ratings.qualityRating')}</label>
                            <div className="flex items-center gap-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                  key={star}
                                  type="button"
                                  onClick={() => setRatingForm(prev => ({ ...prev, qualityRating: star }))}
                                  className={`text-2xl transition-colors ${
                                    star <= ratingForm.qualityRating
                                      ? 'text-amber-400'
                                      : 'text-gray-300 hover:text-amber-200'
                                  }`}
                                >
                                  ★
                                </button>
                              ))}
                            </div>
                          </div>

                          <div className="space-y-2">
                            <label className="text-sm font-medium">{t('profile.ratings.professionalRating')}</label>
                            <div className="flex items-center gap-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                  key={star}
                                  type="button"
                                  onClick={() => setRatingForm(prev => ({ ...prev, professionalRating: star }))}
                                  className={`text-2xl transition-colors ${
                                    star <= ratingForm.professionalRating
                                      ? 'text-amber-400'
                                      : 'text-gray-300 hover:text-amber-200'
                                  }`}
                                >
                                  ★
                                </button>
                              ))}
                            </div>
                          </div>

                          <div className="space-y-2">
                            <label className="text-sm font-medium">{t('profile.ratings.punctualityRating')}</label>
                            <div className="flex items-center gap-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                  key={star}
                                  type="button"
                                  onClick={() => setRatingForm(prev => ({ ...prev, punctualityRating: star }))}
                                  className={`text-2xl transition-colors ${
                                    star <= ratingForm.punctualityRating
                                      ? 'text-amber-400'
                                      : 'text-gray-300 hover:text-amber-200'
                                  }`}
                                >
                                  ★
                                </button>
                              ))}
                            </div>
                          </div>

                          <div className="space-y-2">
                            <label className="text-sm font-medium">{t('profile.ratings.cleanlinessRating')}</label>
                            <div className="flex items-center gap-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                  key={star}
                                  type="button"
                                  onClick={() => setRatingForm(prev => ({ ...prev, cleanlinessRating: star }))}
                                  className={`text-2xl transition-colors ${
                                    star <= ratingForm.cleanlinessRating
                                      ? 'text-amber-400'
                                      : 'text-gray-300 hover:text-amber-200'
                                  }`}
                                >
                                  ★
                                </button>
                              ))}
                            </div>
                          </div>

                          <div className="space-y-2">
                            <label className="text-sm font-medium">{t('profile.ratings.explanationRating')}</label>
                            <div className="flex items-center gap-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                  key={star}
                                  type="button"
                                  onClick={() => setRatingForm(prev => ({ ...prev, explanationRating: star }))}
                                  className={`text-2xl transition-colors ${
                                    star <= ratingForm.explanationRating
                                      ? 'text-amber-400'
                                      : 'text-gray-300 hover:text-amber-200'
                                  }`}
                                >
                                  ★
                                </button>
                              ))}
                            </div>
                          </div>

                          <div className="space-y-2">
                            <label className="text-sm font-medium">{t('profile.ratings.comment')}</label>
                            <Textarea
                              placeholder={t('profile.ratings.commentPlaceholder')}
                              value={ratingForm.reviewText}
                              onChange={(e) => setRatingForm(prev => ({ ...prev, reviewText: e.target.value }))}
                              maxLength={500}
                              rows={4}
                            />
                            <p className="text-xs text-muted-foreground text-left">
                              {ratingForm.reviewText.length}/500
                            </p>
                          </div>
                        </div>

                        <Button
                          onClick={handleSubmitRating}
                          disabled={submittingRating}
                          className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white border-0 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
                        >
                          {submittingRating ? (
                            <>
                              <Loader2 className={`w-4 h-4 ${isRTL ? 'ml-2' : 'mr-2'} animate-spin`} />
                              {t('profile.ratings.submitting')}
                            </>
                          ) : (
                            <>
                              <Send className={`w-4 h-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                              {t('profile.ratings.sendRating')}
                            </>
                          )}
                        </Button>
                      </div>
                    ) : rateableCases.length === 0 ? (
                      /* No cases to rate */
                      <div className="text-center py-12 bg-white/50 rounded-lg border-2 border-dashed border-amber-400">
                        <Star className="w-16 h-16 mx-auto text-amber-300 mb-4" />
                        <h3 className="text-lg font-semibold mb-2 text-amber-800">{t('profile.ratings.noCasesToRate')}</h3>
                        <p className="text-sm text-amber-600">
                          {t('profile.ratings.noCasesToRateDesc')}
                        </p>
                      </div>
                    ) : (
                      /* List of rateable cases */
                      <div className="space-y-4">
                        {rateableCases.map((rateableCase) => (
                          <Card key={rateableCase.id} className="border-2 border-amber-300 bg-gradient-to-br from-amber-50 to-orange-100 hover:border-amber-500 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                  <h3 className="font-semibold mb-1 text-amber-900">{rateableCase.postTitle}</h3>
                                  <div className="flex items-center gap-2 text-sm text-amber-700 mb-2">
                                    <GraduationCap className="w-4 h-4" />
                                    <span>{t('profile.ratings.doctor')} {rateableCase.studentName}</span>
                                  </div>
                                  <div className="flex items-center gap-2 text-sm text-amber-700">
                                    <Calendar className="w-4 h-4" />
                                    <span>
                                      {new Date(rateableCase.completedAt).toLocaleDateString(localeDate, {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                      })}
                                    </span>
                                  </div>
                                </div>
                                <Button
                                  onClick={() => setSelectedRateableCase(rateableCase)}
                                  size="sm"
                                >
                                  <Star className={`w-4 h-4 ${isRTL ? 'ml-1' : 'mr-1'}`} />
                                  {t('profile.ratings.rate')}
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            )}

            {/* Cases Tab - For students only */}
            {isStudent && (
              <TabsContent value="cases" className="space-y-6">
                <Card className="bg-gradient-to-br from-emerald-100 to-teal-200 border-2 border-emerald-300 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-emerald-800">
                      <FileText className="w-5 h-5 text-emerald-600" />
                      {t('profile.myCases.title')}
                    </CardTitle>
                    <CardDescription className="text-emerald-600">
                      {t('profile.myCases.description')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {loadingCases ? (
                      <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-700 mx-auto mb-4"></div>
                        <p className="text-emerald-600">{t('profile.myCases.loading')}</p>
                      </div>
                    ) : cases.length === 0 ? (
                      <div className="text-center py-12">
                        <FileCheck className="w-16 h-16 mx-auto text-emerald-300 mb-4" />
                        <h3 className="text-lg font-semibold mb-2 text-emerald-800">{t('profile.myCases.noCases')}</h3>
                        <p className="text-emerald-600 mb-4">
                          {t('profile.myCases.noCasesDesc')}
                        </p>
                        <Button asChild className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white border-0 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
                          <Link href="/applications">
                            <FileText className={`w-4 h-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                            {t('profile.myCases.viewRequests')}
                          </Link>
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {cases.map((caseItem: any) => (
                          <Card key={caseItem.id} className="border-2 border-emerald-400 bg-gradient-to-br from-emerald-100 to-teal-100 hover:border-emerald-600 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                            {/* Case Header */}
                            <CardHeader className="bg-gradient-to-r from-emerald-200 to-teal-200 border-b-2 border-emerald-300">
                              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <Badge className="bg-gradient-to-r from-emerald-600 to-green-700 text-white hover:shadow-md transition-all duration-300">
                                      {t('profile.myCases.case')}: #{caseItem.id.slice(-6)}
                                    </Badge>
                                    <Badge className="bg-gradient-to-r from-emerald-700 to-teal-800 text-emerald-50 border-emerald-700 hover:shadow-md transition-all duration-300">
                                      <CheckCircle2 className={`w-3 h-3 ${isRTL ? 'ml-1' : 'mr-1'}`} />
                                      {t('profile.myCases.approved')}
                                    </Badge>
                                  </div>
                                  <CardTitle className="text-xl text-emerald-900">
                                    {caseItem.application?.post?.title || t('profile.myCases.caseNoTitle')}
                                  </CardTitle>
                                  <CardDescription className="mt-2 flex items-center gap-4 text-sm text-emerald-700">
                                    <div className="flex items-center gap-1">
                                      <Calendar className="w-3 h-3" />
                                      <span>
                                        {t('profile.myCases.approvalDate')}: {new Date(caseItem.createdAt).toLocaleDateString(localeDate, {
                                          year: 'numeric',
                                          month: 'long',
                                          day: 'numeric'
                                        })}
                                      </span>
                                    </div>
                                    {isStudent && caseItem.application?.patient?.user?.name && (
                                      <div className="flex items-center gap-1">
                                        <User className="w-3 h-3" />
                                        <span>{t('profile.myCases.patient')}: {caseItem.application.patient.user.name}</span>
                                      </div>
                                    )}
                                    {!isStudent && caseItem.application?.student?.user?.name && (
                                      <div className="flex items-center gap-1">
                                        <GraduationCap className="w-3 h-3" />
                                        <span>{t('profile.myCases.doctor')}: {caseItem.application.student.user.name}</span>
                                      </div>
                                    )}
                                  </CardDescription>
                                </div>
                                {isStudent && (
                                  <div className="flex gap-2">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => {
                                        setSelectedCase(caseItem)
                                        setShowUploadModal(true)
                                      }}
                                    >
                                      <Camera className={`w-4 h-4 ${isRTL ? 'ml-1' : 'mr-1'}`} />
                                      {t('profile.myCases.uploadPhotos')}
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => {
                                        setSelectedCase(caseItem)
                                        setShowCertificateModal(true)
                                      }}
                                    >
                                      <FileText className={`w-4 h-4 ${isRTL ? 'ml-1' : 'mr-1'}`} />
                                      {t('profile.myCases.certificate')}
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </CardHeader>

                            <CardContent className="space-y-6 pt-6">
                              {/* Photos Carousel Section */}
                              <div>
                                <h4 className="font-semibold mb-3 flex items-center gap-2 text-emerald-800">
                                  <Camera className="w-4 h-4 text-emerald-600" />
                                  {t('profile.myCases.beforeAfterPhotos')}
                                </h4>
                                <PhotoCarousel photos={caseItem.photos || []} />
                              </div>

                              {/* Photos Section */}
                              {caseItem.photos && caseItem.photos.length > 0 && (
                                <div className="mt-6 p-4 bg-white/80 rounded-lg border-2 border-emerald-200 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
                                  <h4 className="font-semibold mb-3 flex items-center gap-2 text-sm text-emerald-800">
                                    <Download className="w-4 h-4 text-emerald-600" />
                                    {t('profile.myCases.photosAvailable')}
                                  </h4>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {caseItem.photos.map((photo: any) => (
                                      <a
                                        key={photo.id}
                                        href={getPhotoUrl(photo.fileUrl)}
                                        download={`case-${caseItem.id.slice(-6)}-${photo.photoType.toLowerCase()}.jpg`}
                                        className="flex items-center gap-2 p-2 bg-white/80 rounded border-2 border-emerald-300 hover:bg-emerald-50 hover:border-emerald-400 hover:shadow-md transition-all duration-300"
                                      >
                                        <Download className="w-4 h-4 text-emerald-600" />
                                        <span className="text-sm text-emerald-900">
                                          {photo.photoType === 'BEFORE' ? t('profile.myCases.beforePhoto') : t('profile.myCases.afterPhoto')}
                                        </span>
                                      </a>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Rating Section - Patient's rating for the case */}
                              {caseItem.rating && (
                                <div className={`mt-6 p-4 rounded-lg border-2 ${
                                  caseItem.rating.isVisible
                                    ? 'border-emerald-700 bg-gradient-to-br from-emerald-50 to-teal-50'
                                    : 'border-gray-300 bg-gray-50/50'
                                }`}>
                                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                                    <Star className="w-4 h-4 text-amber-500" />
                                    {t('profile.myCases.patientRating')}
                                  </h4>
                                  <div className="space-y-3">
                                    {/* Patient Info */}
                                    <div className="flex items-center gap-3">
                                      <div className="w-10 h-10 bg-gradient-to-br from-emerald-600 to-teal-700 rounded-full flex items-center justify-center border-2 border-white shadow-md">
                                        {caseItem.application?.patient?.user?.avatarUrl ? (
                                          <img
                                            src={getPhotoUrl(caseItem.application.patient.user.avatarUrl)}
                                            alt={caseItem.application.patient.user.name}
                                            className="w-full h-full rounded-full object-cover"
                                          />
                                        ) : (
                                          <User className="w-5 h-5 text-emerald-800" />
                                        )}
                                      </div>
                                      <div>
                                        <p className="font-medium text-sm">
                                          {caseItem.application?.patient?.user?.name || t('profile.myCases.patient')}
                                        </p>
                                        <div className="flex items-center gap-1">
                                          {[1, 2, 3, 4, 5].map((star) => (
                                            <Star
                                              key={star}
                                              className={`w-3 h-3 ${
                                                star <= (caseItem.rating.overallRating || 0)
                                                  ? 'fill-amber-400 text-amber-400'
                                                  : 'text-gray-300'
                                              }`}
                                            />
                                          ))}
                                          <span className={`text-sm font-bold text-amber-600 ${isRTL ? 'ml-1' : 'mr-1'}`}>
                                            {caseItem.rating.overallRating}/5
                                          </span>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Review Text */}
                                    {caseItem.rating.reviewText && (
                                      <p className="text-sm text-muted-foreground bg-white/70 p-3 rounded-lg border border-emerald-200">
                                        {caseItem.rating.reviewText}
                                      </p>
                                    )}

                                    {/* Visibility Controls */}
                                    <div className="flex items-center justify-between pt-2 border-t">
                                      <Badge className={caseItem.rating.isVisible ? "bg-emerald-800 text-emerald-50" : "bg-gray-100 text-gray-700"}>
                                        {caseItem.rating.isVisible ? (
                                          <>
                                            <Eye className={`w-3 h-3 ${isRTL ? 'ml-1' : 'mr-1'}`} />
                                            {t('profile.myCases.visibleToPatients')}
                                          </>
                                        ) : (
                                          <>
                                            <EyeOff className={`w-3 h-3 ${isRTL ? 'ml-1' : 'mr-1'}`} />
                                            {t('profile.myCases.hiddenFromPatients')}
                                          </>
                                        )}
                                      </Badge>
                                      <Button
                                        size="sm"
                                        variant={caseItem.rating.isVisible ? "outline" : "default"}
                                        onClick={() => toggleRatingVisibility(caseItem.rating.id)}
                                        disabled={updatingRating === caseItem.rating.id}
                                        className={caseItem.rating.isVisible ? "border-red-200 text-red-700 hover:bg-red-50" : ""}
                                      >
                                        {updatingRating === caseItem.rating.id ? (
                                          <>
                                            <Loader2 className={`w-3 h-3 ${isRTL ? 'ml-2' : 'mr-2'} animate-spin`} />
                                            {t('profile.myCases.updating')}
                                          </>
                                        ) : caseItem.rating.isVisible ? (
                                          <>
                                            <EyeOff className={`w-3 h-3 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                                            {t('profile.myCases.hide')}
                                          </>
                                        ) : (
                                          <>
                                            <Eye className={`w-3 h-3 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                                            {t('profile.myCases.show')}
                                          </>
                                        )}
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* No Rating Yet */}
                              {!caseItem.rating && caseItem.isCompleted && (
                                <div className="mt-6 p-4 bg-gradient-to-br from-amber-100 to-orange-100 rounded-lg border-2 border-amber-300">
                                  <div className="flex items-center gap-2 text-amber-700">
                                    <Star className="w-4 h-4" />
                                    <p className="text-sm font-medium">
                                      {t('profile.myCases.notRatedYet')}
                                    </p>
                                  </div>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            )}

            {/* Reviews Tab - Patient testimonials */}
            {isStudent && (
              <TabsContent value="reviews" id="ratings" className="space-y-6">
                <Card className="bg-gradient-to-br from-amber-100 to-orange-200 border-2 border-amber-300 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-amber-800">
                      <Award className="w-5 h-5 text-amber-600" />
                      {t('profile.testimonials.title')}
                    </CardTitle>
                    <CardDescription className="text-amber-600">
                      {t('profile.testimonials.description')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {loadingRatings ? (
                      <div className="space-y-4">
                        <Skeleton className="h-24" />
                        <Skeleton className="h-24" />
                        <Skeleton className="h-24" />
                      </div>
                    ) : ratings.length === 0 ? (
                      <div className="text-center py-12 bg-white/50 rounded-lg border-2 border-dashed border-amber-400">
                        <Star className="w-16 h-16 mx-auto text-amber-300 mb-4" />
                        <h3 className="text-lg font-semibold mb-2 text-amber-800">{t('profile.testimonials.noRatings')}</h3>
                        <p className="text-amber-600">
                          {t('profile.testimonials.noRatingsDesc')}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {ratings.map((rating) => (
                          <Card key={rating.id} className={`border-2 ${rating.isVisible ? 'border-amber-400 bg-gradient-to-br from-amber-100 to-orange-100' : 'border-amber-300 bg-amber-50/50'} hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300`}>
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between gap-4 mb-3">
                                <div className="flex items-center gap-3">
                                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-600 to-teal-700 rounded-full flex items-center justify-center border-2 border-white shadow-md">
                                    {rating.patientAvatar ? (
                                      <img
                                        src={rating.patientAvatar}
                                        alt={rating.patientName}
                                        className="w-full h-full rounded-full object-cover"
                                      />
                                    ) : (
                                      <User className="w-6 h-6 text-emerald-800" />
                                    )}
                                  </div>
                                  <div>
                                    <p className="font-semibold text-sm">{rating.patientName}</p>
                                    <p className="text-xs text-muted-foreground">
                                      {rating.postTitle} - {rating.treatmentType}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-1 bg-white px-2 py-1 rounded-full shadow-sm">
                                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                                  <span className="font-bold text-sm">{rating.overallRating}</span>
                                </div>
                              </div>

                              {rating.reviewText && (
                                <div className="mb-3 p-3 bg-white/70 rounded-lg border border-amber-200">
                                  <p className="text-sm text-muted-foreground">{rating.reviewText}</p>
                                </div>
                              )}

                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  {rating.isVisible ? (
                                    <Badge className="bg-emerald-800 text-emerald-50">
                                      <Eye className={`w-3 h-3 ${isRTL ? 'ml-1' : 'mr-1'}`} />
                                      {t('profile.testimonials.ratingVisible')}
                                    </Badge>
                                  ) : (
                                    <Badge variant="secondary">
                                      <EyeOff className={`w-3 h-3 ${isRTL ? 'ml-1' : 'mr-1'}`} />
                                      {t('profile.testimonials.ratingHidden')}
                                    </Badge>
                                  )}
                                  <span className="text-xs text-muted-foreground">
                                    {new Date(rating.createdAt).toLocaleDateString(localeDate)}
                                  </span>
                                </div>
                                <Button
                                  size="sm"
                                  variant={rating.isVisible ? "outline" : "default"}
                                  onClick={() => toggleRatingVisibility(rating.id)}
                                  disabled={updatingRating === rating.id}
                                  className={rating.isVisible ? "border-red-200 text-red-700 hover:bg-red-50" : ""}
                                >
                                  {updatingRating === rating.id ? (
                                    <>
                                      <Loader2 className={`w-4 h-4 ${isRTL ? 'ml-2' : 'mr-2'} animate-spin`} />
                                      {t('profile.testimonials.updating')}
                                    </>
                                  ) : rating.isVisible ? (
                                    <>
                                      <EyeOff className={`w-4 h-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                                      {t('profile.testimonials.hide')}
                                    </>
                                  ) : (
                                    <>
                                      <Eye className={`w-4 h-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                                      {t('profile.testimonials.show')}
                                    </>
                                  )}
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            )}

            {/* Settings Tab */}
            <TabsContent value="settings" className="space-y-6">
              {/* Privacy Settings Card - For students only */}
              {isStudent && (
                <Card className="bg-gradient-to-br from-teal-100 to-emerald-200 border-2 border-teal-300 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-teal-800">
                      <ShieldCheck className="w-5 h-5 text-teal-600" />
                      {t('profile.privacySettings.title')}
                    </CardTitle>
                    <CardDescription className="text-teal-600">
                      {t('profile.privacySettings.description')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center justify-between p-4 bg-white/80 rounded-lg border-2 border-teal-200 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
                      <div className="flex-1">
                        <p className="font-medium">{t('profile.privacySettings.enablePublicProfile')}</p>
                        <p className="text-sm text-muted-foreground">
                          {t('profile.privacySettings.enablePublicProfileDesc')}
                        </p>
                      </div>
                      <Switch
                        checked={privacySettings.publicProfileEnabled}
                        disabled={updatingPrivacySetting === 'publicProfileEnabled'}
                        onCheckedChange={(checked) =>
                          updatePrivacySetting('publicProfileEnabled', checked)
                        }
                      />
                    </div>

                    <Separator />

                    <div className="space-y-4">
                      <h4 className="font-semibold text-sm">{t('profile.privacySettings.displayContent')}</h4>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{t('profile.privacySettings.showCompletedCases')}</p>
                            <p className="text-xs text-muted-foreground">
                              {t('profile.privacySettings.showCompletedCasesDesc')}
                            </p>
                          </div>
                          <Switch
                            checked={privacySettings.showCases}
                            disabled={updatingPrivacySetting === 'showCases'}
                            onCheckedChange={(checked) =>
                              updatePrivacySetting('showCases', checked)
                            }
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{t('profile.privacySettings.showRatings')}</p>
                            <p className="text-xs text-muted-foreground">
                              {t('profile.privacySettings.showRatingsDesc')}
                            </p>
                          </div>
                          <Switch
                            checked={privacySettings.showRatings}
                            disabled={updatingPrivacySetting === 'showRatings'}
                            onCheckedChange={(checked) =>
                              updatePrivacySetting('showRatings', checked)
                            }
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{t('profile.privacySettings.showReviews')}</p>
                            <p className="text-xs text-muted-foreground">
                              {t('profile.privacySettings.showReviewsDesc')}
                            </p>
                          </div>
                          <Switch
                            checked={privacySettings.showReviews}
                            disabled={updatingPrivacySetting === 'showReviews'}
                            onCheckedChange={(checked) =>
                              updatePrivacySetting('showReviews', checked)
                            }
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{t('profile.privacySettings.showActivePosts')}</p>
                            <p className="text-xs text-muted-foreground">
                              {t('profile.privacySettings.showActivePostsDesc')}
                            </p>
                          </div>
                          <Switch
                            checked={privacySettings.showActivePosts}
                            disabled={updatingPrivacySetting === 'showActivePosts'}
                            onCheckedChange={(checked) =>
                              updatePrivacySetting('showActivePosts', checked)
                            }
                          />
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-4">
                      <h4 className="font-semibold text-sm">{t('profile.privacySettings.personalInfo')}</h4>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{t('profile.privacySettings.showSpecialization')}</p>
                            <p className="text-xs text-muted-foreground">
                              {t('profile.privacySettings.showSpecializationDesc')}
                            </p>
                          </div>
                          <Switch
                            checked={privacySettings.showSpecialization}
                            disabled={updatingPrivacySetting === 'showSpecialization'}
                            onCheckedChange={(checked) =>
                              updatePrivacySetting('showSpecialization', checked)
                            }
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{t('profile.privacySettings.showBio')}</p>
                            <p className="text-xs text-muted-foreground">
                              {t('profile.privacySettings.showBioDesc')}
                            </p>
                          </div>
                          <Switch
                            checked={privacySettings.showBio}
                            disabled={updatingPrivacySetting === 'showBio'}
                            onCheckedChange={(checked) =>
                              updatePrivacySetting('showBio', checked)
                            }
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{t('profile.privacySettings.showLocation')}</p>
                            <p className="text-xs text-muted-foreground">
                              {t('profile.privacySettings.showLocationDesc')}
                            </p>
                          </div>
                          <Switch
                            checked={privacySettings.showLocation}
                            disabled={updatingPrivacySetting === 'showLocation'}
                            onCheckedChange={(checked) =>
                              updatePrivacySetting('showLocation', checked)
                            }
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{t('profile.privacySettings.showCompletedCount')}</p>
                            <p className="text-xs text-muted-foreground">
                              {t('profile.privacySettings.showCompletedCountDesc')}
                            </p>
                          </div>
                          <Switch
                            checked={privacySettings.showCompletedCount}
                            disabled={updatingPrivacySetting === 'showCompletedCount'}
                            onCheckedChange={(checked) =>
                              updatePrivacySetting('showCompletedCount', checked)
                            }
                          />
                        </div>
                      </div>
                    </div>

                    <Alert className="bg-gradient-to-br from-blue-100 to-sky-100 border-2 border-blue-300">
                      <Info className="h-4 w-4 text-blue-600" />
                      <AlertDescription className="text-blue-900 text-sm">
                        {t('profile.privacySettings.info')}
                      </AlertDescription>
                    </Alert>
                  </CardContent>
                </Card>
              )}

              <Card className="bg-gradient-to-br from-sky-100 to-blue-200 border-2 border-sky-300 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-sky-800">
                    <Settings className="w-5 h-5 text-sky-600" />
                    {t('profile.accountSettings.title')}
                  </CardTitle>
                  <CardDescription className="text-sky-600">{t('profile.accountSettings.description')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="font-semibold">{t('profile.accountSettings.notifications')}</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{t('profile.accountSettings.emailNotifications')}</p>
                          <p className="text-sm text-muted-foreground">{t('profile.accountSettings.emailNotificationsDesc')}</p>
                        </div>
                        <Badge variant="outline" className="bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-700 border-2 border-emerald-300 hover:shadow-md transition-all duration-300">
                          {t('profile.accountSettings.enabled')}
                        </Badge>
                      </div>
                      <Separator />
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{t('profile.accountSettings.smsNotifications')}</p>
                          <p className="text-sm text-muted-foreground">{t('profile.accountSettings.smsNotificationsDesc')}</p>
                        </div>
                        <Badge variant="outline" className="bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-700 border-2 border-emerald-300 hover:shadow-md transition-all duration-300">
                          {t('profile.accountSettings.enabled')}
                        </Badge>
                      </div>
                      <Separator />
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{t('profile.accountSettings.appointmentReminders')}</p>
                          <p className="text-sm text-muted-foreground">{t('profile.accountSettings.appointmentRemindersDesc')}</p>
                        </div>
                        <Badge variant="outline" className="bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-700 border-2 border-emerald-300 hover:shadow-md transition-all duration-300">
                          {t('profile.accountSettings.enabled')}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h3 className="font-semibold">{t('profile.accountSettings.security')}</h3>
                    <div className="space-y-3">
                      <Button variant="outline" className="w-full justify-start gap-2">
                        <Shield className="w-4 h-4" />
                        {t('profile.accountSettings.changePassword')}
                      </Button>
                      <Button variant="outline" className="w-full justify-start gap-2">
                        <Phone className="w-4 h-4" />
                        {t('profile.accountSettings.updatePhone')}
                      </Button>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h3 className="font-semibold text-rose-600">{t('profile.accountSettings.dangerZone')}</h3>
                    <p className="text-sm text-rose-600">
                      {t('profile.accountSettings.dangerZoneDesc')}
                    </p>
                    <Button variant="destructive" className="w-full bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
                      {t('profile.accountSettings.deleteAccount')}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Upload Photos Modal */}
          {selectedCase && (
            <Dialog open={showUploadModal} onOpenChange={setShowUploadModal}>
              <DialogContent className="sm bg-gradient-to-br from-purple-100 to-violet-100 border-2 border-purple-300">
                <DialogHeader>
                  <DialogTitle>{t('profile.uploadModal.title')}</DialogTitle>
                  <DialogDescription>
                    {t('profile.uploadModal.description')} {selectedCase.application?.post?.title}
                  </DialogDescription>
                </DialogHeader>
                <form
                  onSubmit={async (e: React.FormEvent<HTMLFormElement>) => {
                    e.preventDefault()
                    const formData = new FormData(e.currentTarget)

                    await handleUploadPhotos(selectedCase.id, formData)
                  }}
                >
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="beforePhoto">{t('profile.uploadModal.beforePhoto')}</Label>
                      <Input
                        id="beforePhoto"
                        name="beforePhoto"
                        type="file"
                        accept="image/*"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="afterPhoto">{t('profile.uploadModal.afterPhoto')}</Label>
                      <Input
                        id="afterPhoto"
                        name="afterPhoto"
                        type="file"
                        accept="image/*"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="description">{t('profile.uploadModal.caseDescription')}</Label>
                      <Input
                        id="description"
                        name="description"
                        type="text"
                        placeholder={t('profile.uploadModal.descriptionPlaceholder')}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="isPublic"
                        name="isPublic"
                        value="true"
                        defaultChecked={true}
                        className="rounded"
                      />
                      <Label htmlFor="isPublic" className="text-sm">
                        {t('profile.uploadModal.publicDisplay')}
                      </Label>
                    </div>
                    <div className="flex justify-end gap-2 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowUploadModal(false)}
                        className="bg-white/70 border-2 border-purple-300 text-purple-700 hover:bg-white hover:border-purple-400 hover:shadow-lg transition-all duration-300"
                      >
                        <X className={`w-4 h-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                        {t('profile.uploadModal.cancel')}
                      </Button>
                      <Button type="submit" disabled={loadingCases} className="bg-gradient-to-r from-purple-500 to-violet-600 hover:from-purple-600 hover:to-violet-700 text-white border-0 hover:shadow-lg transition-all duration-300">
                        {loadingCases ? t('profile.uploadModal.uploading') : t('profile.uploadModal.uploadPhotos')}
                      </Button>
                    </div>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}

export const dynamic = 'force-dynamic'

export default function ProfilePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    }>
      <ProfileContent />
    </Suspense>
  )
}
