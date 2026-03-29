'use client'

import { useState, useEffect } from 'react'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Navigation } from '@/components/navigation'
import { Footer } from '@/components/footer'
import { useTranslations } from '@/hooks/useTranslations'
import {
  Bell,
  CheckCircle2,
  MessageCircle,
  Calendar,
  Award,
  AlertCircle,
  User,
  X,
  Trash2,
  Check,
  Star,
  FileText,
  Users,
  XCircle,
  AlertTriangle,
  Shield,
  ShieldAlert,
  Ban,
  Clock,
} from 'lucide-react'
import Link from 'next/link'

interface Notification {
  id: string
  type: string
  title: string
  message: string
  time: string
  isRead: boolean
  actionLink: string
  actionText: string
  data?: string | null
}

interface NotificationsResponse {
  success: boolean
  notifications: Notification[]
  unreadCount: number
  total: number
}

interface AdminActionData {
  actionType: 'RESOLVED' | 'WARNED' | 'SUSPENDED' | 'TEMP_BANNED' | 'PERM_BANNED'
  actionTitle: string
  actionMessage: string
  adminName: string
  actionDate: string
  reportId: string
  banDuration?: number | null
}

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'APPLICATION_ACCEPTED':
      return <CheckCircle2 className="w-5 h-5 text-emerald-600" />
    case 'APPLICATION_REJECTED':
      return <XCircle className="w-5 h-5 text-red-600" />
    case 'APPLICATION_SUBMITTED':
      return <FileText className="w-5 h-5 text-blue-600" />
    case 'NEW_APPLICATION':
      return <Users className="w-5 h-5 text-blue-600" />
    case 'NEW_MESSAGE':
      return <MessageCircle className="w-5 h-5 text-blue-600" />
    case 'APPOINTMENT_REMINDER':
      return <Calendar className="w-5 h-5 text-amber-600" />
    case 'NEW_BADGE':
      return <Award className="w-5 h-5 text-purple-600" />
    case 'CASE_COMPLETED':
      return <CheckCircle2 className="w-5 h-5 text-teal-600" />
    case 'NEW_REVIEW':
    case 'RATING_RECEIVED':
    case 'NEW_RATING':
      return <Star className="w-5 h-5 text-amber-500" />
    case 'APPOINTMENT':
      return <Calendar className="w-5 h-5 text-blue-600" />
    case 'REPORT_RESOLVED':
      return <AlertCircle className="w-5 h-5 text-emerald-600" />
    case 'STUDENT_VERIFICATION':
      return <ShieldAlert className="w-5 h-5 text-amber-600" />
    case 'STUDENT_VERIFIED':
      return <Shield className="w-5 h-5 text-emerald-600" />
    case 'NEW_REPORT':
      return <AlertTriangle className="w-5 h-5 text-red-600" />
    case 'ADMIN_ACTION_RESOLVED':
      return <Shield className="w-5 h-5 text-emerald-600" />
    case 'ADMIN_ACTION_WARNED':
      return <AlertTriangle className="w-5 h-5 text-amber-600" />
    case 'ADMIN_ACTION_SUSPENDED':
      return <Clock className="w-5 h-5 text-orange-600" />
    case 'ADMIN_ACTION_TEMP_BANNED':
    case 'ADMIN_ACTION_PERM_BANNED':
      return <Ban className="w-5 h-5 text-red-600" />
    default:
      return <Bell className="w-5 h-5 text-gray-600" />
  }
}

export default function NotificationsPage() {
  const { user } = useCurrentUser()
  const { t, locale } = useTranslations()
  const isRTL = locale === 'ar'
  
  const [activeTab, setActiveTab] = useState('all')
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [unreadCount, setUnreadCount] = useState(0)
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null)
  const [actionModalOpen, setActionModalOpen] = useState(false)
  const [actionData, setActionData] = useState<AdminActionData | null>(null)

  // ✅ دالة مساعدة لإضافة userId إلى الروابط
  const withUserId = (path: string) => {
    let userId = user?.id

    if (!userId) {
      try {
        userId = localStorage.getItem('userId')
      } catch (e) {}
    }

    if (!userId) {
      try {
        userId = sessionStorage.getItem('userId')
      } catch (e) {}
    }

    if (userId) {
      const separator = path.includes('?') ? '&' : '?'
      return `${path}${separator}userId=${encodeURIComponent(userId)}`
    }
    return path
  }

  // Fetch notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      if (!user) {
        setLoading(false)
        return
      }

      try {
        // ✅ الحصول على userId من مصادر متعددة
        let userId = user?.id

        if (!userId) {
          try {
            userId = localStorage.getItem('userId')
          } catch (e) {}
        }

        if (!userId) {
          try {
            userId = sessionStorage.getItem('userId')
          } catch (e) {}
        }

        const headers: HeadersInit = {
          'Content-Type': 'application/json',
        }

        // ✅ إرسال userId في الهيدر
        if (userId) {
          headers['X-User-Id'] = userId
        }

        // ✅ إضافة userId كـ query parameter أيضاً
        let apiUrl = '/api/notifications/new'
        if (userId) {
          const separator = apiUrl.includes('?') ? '&' : '?'
          apiUrl = `${apiUrl}${separator}userId=${encodeURIComponent(userId)}`
        }

        const response = await fetch(apiUrl, {
          credentials: 'include',
          headers
        })

        const data: NotificationsResponse = await response.json()

        if (data.success) {
          setNotifications(data.notifications)
          setUnreadCount(data.unreadCount)
        } else {
          console.error('[Notifications Page] ❌ API returned error:', data.error)
        }
      } catch (error) {
        console.error('[Notifications Page] ❌ Fetch error:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchNotifications()
  }, [user])

  const markAsRead = async (id: string) => {
    try {
      // ✅ الحصول على userId من مصادر متعددة
      let userId = user?.id

      if (!userId) {
        try {
          userId = localStorage.getItem('userId')
        } catch (e) {}
      }

      if (!userId) {
        try {
          userId = sessionStorage.getItem('userId')
        } catch (e) {}
      }

      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      }

      // ✅ إرسال userId في الهيدر
      if (userId) {
        headers['X-User-Id'] = userId
      }

      const response = await fetch('/api/notifications/mark-read', {
        method: 'PUT',
        credentials: 'include',
        headers,
        body: JSON.stringify({ notificationId: id })
      })

      if (response.ok) {
        setNotifications(notifications.map(n =>
          n.id === id ? { ...n, isRead: true } : n
        ))
        setUnreadCount(Math.max(0, unreadCount - 1))
      }
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const markAllAsRead = async () => {
    try {
      // ✅ الحصول على userId من مصادر متعددة
      let userId = user?.id

      if (!userId) {
        try {
          userId = localStorage.getItem('userId')
        } catch (e) {}
      }

      if (!userId) {
        try {
          userId = sessionStorage.getItem('userId')
        } catch (e) {}
      }

      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      }

      // ✅ إرسال userId في الهيدر
      if (userId) {
        headers['X-User-Id'] = userId
      }

      const response = await fetch('/api/notifications/mark-read', {
        method: 'PUT',
        credentials: 'include',
        headers,
        body: JSON.stringify({ markAll: true })
      })

      if (response.ok) {
        setNotifications(notifications.map(n => ({ ...n, isRead: true })))
        setUnreadCount(0)
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
    }
  }

  const deleteNotification = async (id: string) => {
    try {
      // ✅ الحصول على userId من مصادر متعددة
      let userId = user?.id

      if (!userId) {
        try {
          userId = localStorage.getItem('userId')
        } catch (e) {}
      }

      if (!userId) {
        try {
          userId = sessionStorage.getItem('userId')
        } catch (e) {}
      }

      const headers: HeadersInit = {}

      // ✅ إرسال userId في الهيدر
      if (userId) {
        headers['X-User-Id'] = userId
      }

      let apiUrl = `/api/notifications/mark-read?id=${id}`
      if (userId) {
        apiUrl += `&userId=${encodeURIComponent(userId)}`
      }

      const response = await fetch(apiUrl, {
        method: 'DELETE',
        credentials: 'include',
        headers
      })

      if (response.ok) {
        const filtered = notifications.filter(n => n.id !== id)
        setNotifications(filtered)
        if (!notifications.find(n => n.id === id)?.isRead) {
          setUnreadCount(Math.max(0, unreadCount - 1))
        }
      }
    } catch (error) {
      console.error('Error deleting notification:', error)
    }
  }

  const clearAll = async () => {
    try {
      // ✅ الحصول على userId من مصادر متعددة
      let userId = user?.id

      if (!userId) {
        try {
          userId = localStorage.getItem('userId')
        } catch (e) {}
      }

      if (!userId) {
        try {
          userId = sessionStorage.getItem('userId')
        } catch (e) {}
      }

      const headers: HeadersInit = {}

      // ✅ إرسال userId في الهيدر
      if (userId) {
        headers['X-User-Id'] = userId
      }

      let apiUrl = '/api/notifications/mark-read?deleteAll=true'
      if (userId) {
        apiUrl += `&userId=${encodeURIComponent(userId)}`
      }

      const response = await fetch(apiUrl, {
        method: 'DELETE',
        credentials: 'include',
        headers
      })

      if (response.ok) {
        setNotifications([])
        setUnreadCount(0)
      }
    } catch (error) {
      console.error('Error clearing all notifications:', error)
    }
  }

  // Handle showing admin action details
  const handleShowActionDetails = (notification: Notification) => {
    setSelectedNotification(notification)

    // Parse action data if available
    if (notification.data) {
      try {
        const parsed = JSON.parse(notification.data) as AdminActionData
        setActionData(parsed)
      } catch (e) {
        console.error('Error parsing notification data:', e)
        setActionData(null)
      }
    } else {
      setActionData(null)
    }

    setActionModalOpen(true)
    markAsRead(notification.id)
  }

  const allNotifications = notifications
  const unreadNotifications = notifications.filter(n => !n.isRead)

  // Check if notification is an admin action
  const isAdminAction = (type: string) => {
    return type.startsWith('ADMIN_ACTION_')
  }

  // Get action badge
  const getActionBadge = (actionType: string) => {
    const badgeText = t(`notifications.adminActions.${actionType}`) || actionType
    return <Badge className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white border-0 shadow-sm"><span suppressHydrationWarning={true}>{badgeText}</span></Badge>
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation user={user ? { id: user.id, name: user.name || 'مستخدم', email: user.email || '', role: user.role as 'PATIENT' | 'STUDENT' | 'ADMIN', avatar: user.avatarUrl } : undefined} />

      <main className="flex-1 py-8 px-4 bg-muted/30">
        <div className="container mx-auto max-w-4xl">
          {/* Header */}
          <div className="mb-8">
            <Card className="bg-gradient-to-br from-teal-50 to-emerald-100 border-2 border-teal-200 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-teal-600 to-emerald-700 rounded-xl flex items-center justify-center shadow-md">
                      <Bell className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h1 className="text-2xl font-bold text-teal-900 mb-1" suppressHydrationWarning={true}>{t('notifications.title')}</h1>
                      <p className="text-teal-700" suppressHydrationWarning={true}>
                        {unreadCount} {t('notifications.unreadCount')}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={markAllAsRead}
                      disabled={unreadCount === 0}
                      className="border-teal-300 text-teal-700 hover:bg-teal-50 hover:border-teal-400 transition-all duration-300"
                    >
                      <Check className={`w-4 h-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                      <span suppressHydrationWarning={true}>{t('notifications.markAllAsRead')}</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={clearAll}
                      disabled={allNotifications.length === 0}
                      className="border-rose-300 text-rose-700 hover:bg-rose-50 hover:border-rose-400 transition-all duration-300"
                    >
                      <Trash2 className={`w-4 h-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                      <span suppressHydrationWarning={true}>{t('notifications.clearAll')}</span>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Loading State */}
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="bg-gradient-to-br from-teal-50/50 to-emerald-50/50 border-2 border-teal-200 shadow-md">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <Skeleton className="w-12 h-12 rounded-full flex-shrink-0 bg-teal-100" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-5 w-1/3 bg-teal-200" />
                        <Skeleton className="h-4 w-2/3 bg-teal-200" />
                        <Skeleton className="h-4 w-1/2 bg-teal-200" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <>
              {/* Tabs */}
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6 bg-gradient-to-r from-teal-100 to-emerald-100 border-2 border-teal-200 shadow-md">
                  <TabsTrigger value="all" className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-teal-600 data-[state=active]:to-emerald-700 data-[state=active]:text-white transition-all duration-300">
                    <Bell className="w-4 h-4" />
                    <span suppressHydrationWarning={true}>{t('notifications.all')}</span>
                    <Badge variant="secondary" className={activeTab === 'all' ? 'bg-white/20 text-white border-white/30' : 'bg-teal-100 text-teal-700 border-teal-200'}>{allNotifications.length}</Badge>
                  </TabsTrigger>
                  <TabsTrigger value="unread" className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-teal-600 data-[state=active]:to-emerald-700 data-[state=active]:text-white transition-all duration-300">
                    <MessageCircle className="w-4 h-4" />
                    <span suppressHydrationWarning={true}>{t('notifications.unread')}</span>
                    <Badge variant="secondary" className={activeTab === 'unread' ? 'bg-white/20 text-white border-white/30' : 'bg-teal-100 text-teal-700 border-teal-200'}>{unreadCount}</Badge>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="all">
                  <div className="space-y-3">
                    {allNotifications.map((notification) => (
                      <Card
                        key={notification.id}
                        className={`border-2 shadow-md hover:shadow-lg transition-all duration-300 ${
                          !notification.isRead 
                            ? 'bg-gradient-to-br from-teal-50 to-emerald-100 border-teal-400' 
                            : 'bg-gradient-to-br from-gray-50 to-slate-100 border-gray-200'
                        }`}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start gap-4">
                            {/* Icon */}
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm ${
                              !notification.isRead 
                                ? 'bg-gradient-to-br from-teal-500 to-emerald-600' 
                                : 'bg-gradient-to-br from-gray-200 to-slate-300'
                            }`}>
                              <div className={
                                !notification.isRead ? 'text-white' : 'text-gray-600'
                              }>
                                {getNotificationIcon(notification.type)}
                              </div>
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <h3 className={`font-semibold mb-1 flex items-center gap-2 ${
                                    !notification.isRead ? 'text-teal-900' : 'text-gray-800'
                                  }`}>
                                    {notification.title}
                                    {!notification.isRead && (
                                      <Badge className="bg-gradient-to-br from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white border-0 shadow-sm"><span suppressHydrationWarning={true}>{t('notifications.newBadge')}</span></Badge>
                                    )}
                                  </h3>
                                  <p className={`text-sm mb-2 whitespace-pre-line ${
                                    !notification.isRead ? 'text-teal-700' : 'text-gray-600'
                                  }`}>
                                    {notification.message}
                                  </p>
                                  <p className={`text-xs ${
                                    !notification.isRead ? 'text-teal-600' : 'text-gray-500'
                                  }`}>
                                    {notification.time}
                                  </p>
                                </div>
                              </div>

                              {/* Actions */}
                              <div className="flex items-center gap-2 mt-3">
                                {isAdminAction(notification.type) && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleShowActionDetails(notification)}
                                    className="border-teal-300 text-teal-700 hover:bg-teal-50 hover:border-teal-400 transition-all duration-300"
                                  >
                                    <FileText className={`w-4 h-4 ${isRTL ? 'ml-1' : 'mr-1'}`} />
                                    <span suppressHydrationWarning={true}>{t('notifications.viewActionDetails')}</span>
                                  </Button>
                                )}
                                {notification.actionLink && !isAdminAction(notification.type) && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    asChild
                                    onClick={() => markAsRead(notification.id)}
                                    className="border-teal-300 text-teal-700 hover:bg-teal-50 hover:border-teal-400 transition-all duration-300"
                                  >
                                    <Link href={withUserId(notification.actionLink)}>
                                      {notification.actionText}
                                    </Link>
                                  </Button>
                                )}
                                {!notification.isRead && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => markAsRead(notification.id)}
                                    className="text-teal-700 hover:bg-teal-50 transition-all duration-300"
                                  >
                                    <Check className={`w-4 h-4 ${isRTL ? 'ml-1' : 'mr-1'}`} />
                                    <span suppressHydrationWarning={true}>{t('notifications.markAsRead')}</span>
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => deleteNotification(notification.id)}
                                  className="text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition-all duration-300"
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}

                    {allNotifications.length === 0 && (
                      <Card className="bg-gradient-to-br from-teal-50 to-emerald-100 border-2 border-teal-200 shadow-lg">
                        <CardContent className="py-12 text-center">
                          <div className="w-20 h-20 bg-gradient-to-br from-teal-100 to-emerald-200 rounded-full flex items-center justify-center mx-auto mb-4 shadow-md">
                            <Bell className="w-10 h-10 text-teal-400" />
                          </div>
                          <h3 className="text-lg font-semibold mb-2 text-teal-900" suppressHydrationWarning={true}>{t('notifications.noNotifications')}</h3>
                          <p className="text-teal-700" suppressHydrationWarning={true}>
                            {t('notifications.noNotificationsDesc')}
                          </p>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="unread">
                  <div className="space-y-3">
                    {unreadNotifications.map((notification) => (
                      <Card
                        key={notification.id}
                        className="bg-gradient-to-br from-teal-50 to-emerald-100 border-2 border-teal-400 shadow-md hover:shadow-lg transition-all duration-300"
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start gap-4">
                            {/* Icon */}
                            <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-md">
                              <div className="text-white">
                                {getNotificationIcon(notification.type)}
                              </div>
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <h3 className="font-semibold mb-1 flex items-center gap-2 text-teal-900">
                                    {notification.title}
                                    <Badge className="bg-gradient-to-br from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white border-0 shadow-sm"><span suppressHydrationWarning={true}>{t('notifications.newBadge')}</span></Badge>
                                  </h3>
                                  <p className="text-sm text-teal-700 mb-2 whitespace-pre-line">
                                    {notification.message}
                                  </p>
                                  <p className="text-xs text-teal-600">
                                    {notification.time}
                                  </p>
                                </div>
                              </div>

                              {/* Actions */}
                              <div className="flex items-center gap-2 mt-3">
                                {isAdminAction(notification.type) && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleShowActionDetails(notification)}
                                    className="border-teal-300 text-teal-700 hover:bg-teal-50 hover:border-teal-400 transition-all duration-300"
                                  >
                                    <FileText className={`w-4 h-4 ${isRTL ? 'ml-1' : 'mr-1'}`} />
                                    <span suppressHydrationWarning={true}>{t('notifications.viewActionDetails')}</span>
                                  </Button>
                                )}
                                {notification.actionLink && !isAdminAction(notification.type) && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    asChild
                                    onClick={() => markAsRead(notification.id)}
                                    className="border-teal-300 text-teal-700 hover:bg-teal-50 hover:border-teal-400 transition-all duration-300"
                                  >
                                    <Link href={withUserId(notification.actionLink)}>
                                      {notification.actionText}
                                    </Link>
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => markAsRead(notification.id)}
                                  className="text-teal-700 hover:bg-teal-50 transition-all duration-300"
                                >
                                  <Check className={`w-4 h-4 ${isRTL ? 'ml-1' : 'mr-1'}`} />
                                  <span suppressHydrationWarning={true}>{t('notifications.markAsRead')}</span>
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => deleteNotification(notification.id)}
                                  className="text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition-all duration-300"
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}

                    {unreadNotifications.length === 0 && (
                      <Card className="bg-gradient-to-br from-teal-50 to-emerald-100 border-2 border-teal-200 shadow-lg">
                        <CardContent className="py-12 text-center">
                          <div className="w-20 h-20 bg-gradient-to-br from-teal-100 to-emerald-200 rounded-full flex items-center justify-center mx-auto mb-4 shadow-md">
                            <Bell className="w-10 h-10 text-teal-400" />
                          </div>
                          <h3 className="text-lg font-semibold mb-2 text-teal-900" suppressHydrationWarning={true}>{t('notifications.noUnreadNotifications')}</h3>
                          <p className="text-teal-700" suppressHydrationWarning={true}>
                            {t('notifications.allNotificationsRead')}
                          </p>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </>
          )}
        </div>
      </main>

      <Footer />

      {/* Admin Action Details Modal */}
      <Dialog open={actionModalOpen} onOpenChange={setActionModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-teal-50 to-emerald-100 border-2 border-teal-200 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl text-teal-900">
              {actionData && getActionBadge(actionData.actionType)}
              <span className={isRTL ? 'mr-2' : 'ml-2'}>{selectedNotification?.title}</span>
            </DialogTitle>
          </DialogHeader>

          {actionData && (
            <div className="space-y-4 mt-4">
              {/* Action Type Badge */}
              <div className="flex items-center justify-center p-4 bg-gradient-to-br from-teal-100 to-emerald-200 border-2 border-teal-300 rounded-xl shadow-md">
                {getActionBadge(actionData.actionType)}
              </div>

              {/* Admin Message */}
              <div>
                <label className="text-sm font-medium text-teal-800 mb-2 block" suppressHydrationWarning={true}>
                  {t('notifications.adminMessage')}:
                </label>
                <div className="p-4 bg-gradient-to-br from-white/70 to-teal-50 border-2 border-teal-300 rounded-xl shadow-sm">
                  <p className="text-base whitespace-pre-line text-teal-900">{actionData.actionMessage}</p>
                </div>
              </div>

              {/* Admin Name */}
              <div className="flex items-center gap-3 p-4 bg-gradient-to-br from-blue-50 to-sky-100 border-2 border-blue-200 rounded-xl shadow-sm">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-sky-600 rounded-lg flex items-center justify-center shadow-md">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-blue-700" suppressHydrationWarning={true}>{t('notifications.admin')}:</p>
                  <p className="font-medium text-blue-900">{actionData.adminName}</p>
                </div>
              </div>

              {/* Action Date */}
              <div className="flex items-center gap-3 p-4 bg-gradient-to-br from-purple-50 to-violet-100 border-2 border-purple-200 rounded-xl shadow-sm">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-violet-600 rounded-lg flex items-center justify-center shadow-md">
                  <Clock className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-purple-700" suppressHydrationWarning={true}>{t('notifications.actionDate')}:</p>
                  <p className="font-medium text-purple-900">
                    {new Date(actionData.actionDate).toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>

              {/* Ban Duration (if applicable) */}
              {actionData.banDuration && (
                <div className="flex items-center gap-3 p-4 bg-gradient-to-br from-red-50 to-rose-100 border-2 border-red-200 rounded-xl shadow-sm">
                  <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-rose-600 rounded-lg flex items-center justify-center shadow-md">
                    <Ban className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-red-700" suppressHydrationWarning={true}>{t('notifications.banDuration')}:</p>
                    <p className="font-medium text-red-900">
                      {actionData.banDuration} <span className="mx-1" suppressHydrationWarning={true}>{t('notifications.days')}</span>
                    </p>
                  </div>
                </div>
              )}

              {/* Additional Info */}
              <div className="text-sm text-teal-700 text-center pt-2 bg-gradient-to-br from-teal-50/50 to-emerald-50/50 p-4 rounded-xl border border-teal-200">
                <p><span suppressHydrationWarning={true}>{t('notifications.reportNumber')}:</span> {actionData.reportId}</p>
              </div>
            </div>
          )}

          {!actionData && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gradient-to-br from-amber-50 to-orange-100 rounded-full flex items-center justify-center mx-auto mb-3 shadow-md">
                <AlertCircle className="w-8 h-8 text-amber-500" />
              </div>
              <p className="text-teal-700" suppressHydrationWarning={true}>{t('notifications.noAdditionalDetails')}</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
