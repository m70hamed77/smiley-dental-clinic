'use client'

import { useState, useEffect } from 'react'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
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
  UserPlus,
  UserCheck,
  ShieldCheck,
} from 'lucide-react'

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
    case 'NEW_VERIFICATION_REQUEST':
    case 'STUDENT_VERIFICATION':
      return <ShieldAlert className="w-5 h-5" style={{color: '#f59e0b'}} />
    case 'STUDENT_VERIFIED':
      return <ShieldCheck className="w-5 h-5" style={{color: '#00BFA6'}} />
    case 'NEW_REPORT':
      return <AlertTriangle className="w-5 h-5" style={{color: '#ef4444'}} />
    case 'REPORT_RESOLVED':
      return <AlertCircle className="w-5 h-5" style={{color: '#00BFA6'}} />
    case 'USER_REGISTERED':
      return <UserPlus className="w-5 h-5" style={{color: '#6C3FC5'}} />
    case 'USER_APPROVED':
      return <UserCheck className="w-5 h-5" style={{color: '#00BFA6'}} />
    case 'ADMIN_ACTION_RESOLVED':
      return <Shield className="w-5 h-5" style={{color: '#00BFA6'}} />
    case 'ADMIN_ACTION_WARNED':
      return <AlertTriangle className="w-5 h-5" style={{color: '#f59e0b'}} />
    case 'ADMIN_ACTION_SUSPENDED':
      return <Clock className="w-5 h-5" style={{color: '#f97316'}} />
    case 'ADMIN_ACTION_TEMP_BANNED':
    case 'ADMIN_ACTION_PERM_BANNED':
      return <Ban className="w-5 h-5" style={{color: '#ef4444'}} />
    case 'SYSTEM_ALERT':
      return <AlertCircle className="w-5 h-5" style={{color: '#ef4444'}} />
    case 'NEW_MESSAGE':
      return <MessageCircle className="w-5 h-5" style={{color: '#6C3FC5'}} />
    default:
      return <Bell className="w-5 h-5" style={{color: '#94a3b8'}} />
  }
}

const getNotificationBackground = (type: string, isRead: boolean) => {
  if (isRead) {
    return 'linear-gradient(135deg, #F8F4FF 0%, #E8F8F5 100%)'
  }
  
  switch (type) {
    case 'NEW_VERIFICATION_REQUEST':
    case 'STUDENT_VERIFICATION':
      return 'linear-gradient(135deg, #FFF8E1 0%, #FFEDD5 100%)'
    case 'STUDENT_VERIFIED':
      return 'linear-gradient(135deg, #E8F8F5 0%, #D1F2EB 100%)'
    case 'NEW_REPORT':
      return 'linear-gradient(135deg, #FEE2E2 0%, #FECACA 100%)'
    case 'REPORT_RESOLVED':
    case 'ADMIN_ACTION_RESOLVED':
    case 'USER_APPROVED':
      return 'linear-gradient(135deg, #E8F8F5 0%, #D1F2EB 100%)'
    case 'USER_REGISTERED':
    case 'NEW_MESSAGE':
      return 'linear-gradient(135deg, #F3E8FF 0%, #E9D5FF 100%)'
    case 'SYSTEM_ALERT':
    case 'ADMIN_ACTION_TEMP_BANNED':
    case 'ADMIN_ACTION_PERM_BANNED':
      return 'linear-gradient(135deg, #FEE2E2 0%, #FECACA 100%)'
    case 'ADMIN_ACTION_WARNED':
    case 'ADMIN_ACTION_SUSPENDED':
      return 'linear-gradient(135deg, #FFF8E1 0%, #FFEDD5 100%)'
    default:
      return 'linear-gradient(135deg, #F8F4FF 0%, #E8F8F5 100%)'
  }
}

const getNotificationBorderColor = (type: string, isRead: boolean) => {
  if (isRead) {
    return '2px solid rgba(0,191,166,0.15)'
  }
  
  switch (type) {
    case 'NEW_VERIFICATION_REQUEST':
    case 'STUDENT_VERIFICATION':
    case 'ADMIN_ACTION_WARNED':
    case 'ADMIN_ACTION_SUSPENDED':
      return '2px solid rgba(245, 158, 11, 0.4)'
    case 'STUDENT_VERIFIED':
    case 'REPORT_RESOLVED':
    case 'ADMIN_ACTION_RESOLVED':
    case 'USER_APPROVED':
      return '2px solid rgba(0,191,166,0.4)'
    case 'NEW_REPORT':
    case 'SYSTEM_ALERT':
    case 'ADMIN_ACTION_TEMP_BANNED':
    case 'ADMIN_ACTION_PERM_BANNED':
      return '2px solid rgba(239, 68, 68, 0.4)'
    case 'USER_REGISTERED':
    case 'NEW_MESSAGE':
      return '2px solid rgba(108,63,197,0.4)'
    default:
      return '2px solid rgba(0,191,166,0.2)'
  }
}

export default function AdminNotificationsPage() {
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

  // Fetch notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      if (!user || user.role !== 'ADMIN') {
        setLoading(false)
        return
      }

      try {
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

        if (userId) {
          headers['X-User-Id'] = userId
        }

        let apiUrl = '/api/notifications/new'
        if (userId) {
          const separator = apiUrl.includes('?') ? '&' : '?'
          apiUrl = `${apiUrl}${separator}userId=${encodeURIComponent(userId)}`
        }

        const response = await fetch(apiUrl, {
          credentials: 'include',
          headers
        })

        const data = await response.json()

        if (data.success) {
          setNotifications(data.notifications || [])
          setUnreadCount(data.unreadCount || 0)
        }
      } catch (error) {
        console.error('[Admin Notifications] ❌ Fetch error:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchNotifications()
  }, [user])

  const markAsRead = async (id: string) => {
    try {
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

  const handleShowActionDetails = (notification: Notification) => {
    setSelectedNotification(notification)

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

  const isAdminAction = (type: string) => {
    return type.startsWith('ADMIN_ACTION_')
  }

  // Check if user is admin
  if (user && user.role !== 'ADMIN') {
    return (
      <div className="min-h-screen flex flex-col">
        <Navigation user={user ? { id: user.id, name: user.name || 'مستخدم', email: user.email || '', role: user.role as 'PATIENT' | 'STUDENT' | 'ADMIN' } : undefined} />
        <main className="flex-1" style={{background: 'linear-gradient(135deg, #F8F4FF 0%, #E8F8F5 100%)'}}>
          <div className="container mx-auto px-4 py-8 max-w-4xl">
            <Card style={{background: 'linear-gradient(135deg, #FEE2E2 0%, #FECACA 100%)', border: '2px solid rgba(239, 68, 68, 0.3)'}}>
              <CardContent className="py-16 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{background: 'linear-gradient(135deg, #f87171, #ef4444)'}}>
                  <Shield className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2" style={{color: '#0D1B40'}} suppressHydrationWarning={true}>{t('auth.unauthorized')}</h3>
                <p className="text-muted-foreground" suppressHydrationWarning={true}>{t('auth.adminOnly')}</p>
              </CardContent>
            </Card>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation user={user ? { id: user.id, name: user.name || 'مستخدم', email: user.email || '', role: user.role as 'PATIENT' | 'STUDENT' | 'ADMIN', avatar: user.avatarUrl } : undefined} />

      <main className="flex-1" style={{background: 'linear-gradient(135deg, #F8F4FF 0%, #E8F8F5 100%)'}}>
        <div className="container mx-auto px-4 py-8 max-w-5xl">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{background: 'linear-gradient(135deg, #6C3FC5, #2d1b69)'}}>
                <Bell className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold" style={{color: '#0D1B40'}} suppressHydrationWarning={true}>إشعارات الإدارة</h1>
                <p className="text-sm" style={{color: '#666'}} suppressHydrationWarning={true}>
                  {unreadCount} إشعار غير مقروء
                </p>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={markAllAsRead}
                disabled={unreadCount === 0}
                style={{borderColor: '#00BFA6', color: '#00BFA6'}}
                className="hover:bg-teal-50"
              >
                <Check className={`w-4 h-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                <span suppressHydrationWarning={true}>تحديد الكل كمقروء</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={clearAll}
                disabled={allNotifications.length === 0}
                style={{borderColor: '#ef4444', color: '#ef4444'}}
                className="hover:bg-red-50"
              >
                <Trash2 className={`w-4 h-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                <span suppressHydrationWarning={true}>حذف الكل</span>
              </Button>
            </div>
          </div>

          {/* Loading State */}
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} style={{background: 'linear-gradient(135deg, #F8F4FF 0%, #E8F8F5 100%)', border: '2px solid rgba(0,191,166,0.1)'}}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <Skeleton className="w-12 h-12 rounded-full flex-shrink-0" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-5 w-1/3" />
                        <Skeleton className="h-4 w-2/3" />
                        <Skeleton className="h-4 w-1/2" />
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
                <TabsList className="grid w-full grid-cols-2 mb-6" style={{background: 'linear-gradient(135deg, #E8F8F5 0%, #F8F4FF 100%)', border: '2px solid rgba(0,191,166,0.2)'}}>
                  <TabsTrigger value="all" className="gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                    <Bell className="w-4 h-4" />
                    <span suppressHydrationWarning={true}>الكل</span>
                    <Badge variant="secondary" style={{background: 'linear-gradient(135deg, #00BFA6, #008C7A)'}}>{allNotifications.length}</Badge>
                  </TabsTrigger>
                  <TabsTrigger value="unread" className="gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                    <MessageCircle className="w-4 h-4" />
                    <span suppressHydrationWarning={true}>غير مقروء</span>
                    <Badge variant="secondary" style={{background: 'linear-gradient(135deg, #f59e0b, #d97706)'}}>{unreadCount}</Badge>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="all">
                  <div className="space-y-4">
                    {allNotifications.map((notification) => (
                      <Card
                        key={notification.id}
                        style={{
                          background: getNotificationBackground(notification.type, notification.isRead),
                          border: getNotificationBorderColor(notification.type, notification.isRead)
                        }}
                        className="hover:shadow-lg transition-all"
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start gap-4">
                            {/* Icon */}
                            <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm" style={{background: 'rgba(255,255,255,0.8)'}}>
                              {getNotificationIcon(notification.type)}
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <h3 className="font-semibold mb-1 flex items-center gap-2" style={{color: '#0D1B40'}}>
                                    {notification.title}
                                    {!notification.isRead && (
                                      <Badge style={{background: 'linear-gradient(135deg, #00BFA6, #008C7A)'}}>
                                        <span suppressHydrationWarning={true}>جديد</span>
                                      </Badge>
                                    )}
                                  </h3>
                                  <p className="text-sm mb-2 whitespace-pre-line" style={{color: '#555'}}>
                                    {notification.message}
                                  </p>
                                  <p className="text-xs" style={{color: '#888'}}>
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
                                    style={{borderColor: '#6C3FC5', color: '#6C3FC5'}}
                                    className="hover:bg-purple-50"
                                  >
                                    <FileText className={`w-4 h-4 ${isRTL ? 'ml-1' : 'mr-1'}`} />
                                    <span suppressHydrationWarning={true}>تفاصيل الإجراء</span>
                                  </Button>
                                )}
                                {!notification.isRead && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => markAsRead(notification.id)}
                                    style={{color: '#00BFA6'}}
                                    className="hover:bg-teal-50"
                                  >
                                    <Check className={`w-4 h-4 ${isRTL ? 'ml-1' : 'mr-1'}`} />
                                    <span suppressHydrationWarning={true}>مقروء</span>
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => deleteNotification(notification.id)}
                                  style={{color: '#ef4444'}}
                                  className="hover:bg-red-50"
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
                      <Card style={{background: 'linear-gradient(135deg, #F8F4FF 0%, #E8F8F5 100%)', border: '2px solid rgba(0,191,166,0.2)'}}>
                        <CardContent className="py-16 text-center">
                          <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{background: 'linear-gradient(135deg, #E8F8F5, #D1F2EB)'}}>
                            <Bell className="w-8 h-8" style={{color: '#00BFA6'}} />
                          </div>
                          <h3 className="text-xl font-semibold mb-2" style={{color: '#0D1B40'}} suppressHydrationWarning={true}>لا توجد إشعارات</h3>
                          <p className="text-muted-foreground" suppressHydrationWarning={true}>
                            كل الإشعارات الحالية فارغة
                          </p>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="unread">
                  <div className="space-y-4">
                    {unreadNotifications.map((notification) => (
                      <Card
                        key={notification.id}
                        style={{
                          background: getNotificationBackground(notification.type, false),
                          border: getNotificationBorderColor(notification.type, false)
                        }}
                        className="hover:shadow-lg transition-all"
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start gap-4">
                            {/* Icon */}
                            <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm" style={{background: 'rgba(255,255,255,0.8)'}}>
                              {getNotificationIcon(notification.type)}
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <h3 className="font-semibold mb-1 flex items-center gap-2" style={{color: '#0D1B40'}}>
                                    {notification.title}
                                    <Badge style={{background: 'linear-gradient(135deg, #00BFA6, #008C7A)'}}>
                                      <span suppressHydrationWarning={true}>جديد</span>
                                    </Badge>
                                  </h3>
                                  <p className="text-sm mb-2 whitespace-pre-line" style={{color: '#555'}}>
                                    {notification.message}
                                  </p>
                                  <p className="text-xs" style={{color: '#888'}}>
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
                                    style={{borderColor: '#6C3FC5', color: '#6C3FC5'}}
                                    className="hover:bg-purple-50"
                                  >
                                    <FileText className={`w-4 h-4 ${isRTL ? 'ml-1' : 'mr-1'}`} />
                                    <span suppressHydrationWarning={true}>تفاصيل الإجراء</span>
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => markAsRead(notification.id)}
                                  style={{color: '#00BFA6'}}
                                  className="hover:bg-teal-50"
                                >
                                  <Check className={`w-4 h-4 ${isRTL ? 'ml-1' : 'mr-1'}`} />
                                  <span suppressHydrationWarning={true}>مقروء</span>
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => deleteNotification(notification.id)}
                                  style={{color: '#ef4444'}}
                                  className="hover:bg-red-50"
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
                      <Card style={{background: 'linear-gradient(135deg, #E8F8F5 0%, #F0FDF4 100%)', border: '2px solid rgba(0,191,166,0.2)'}}>
                        <CardContent className="py-16 text-center">
                          <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{background: 'linear-gradient(135deg, #E8F8F5, #D1F2EB)'}}>
                            <CheckCircle2 className="w-8 h-8" style={{color: '#00BFA6'}} />
                          </div>
                          <h3 className="text-xl font-semibold mb-2" style={{color: '#0D1B40'}} suppressHydrationWarning={true}>جميع الإشعارات مقروءة</h3>
                          <p className="text-muted-foreground" suppressHydrationWarning={true}>
                            لا توجد إشعارات جديدة
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" style={{background: 'linear-gradient(135deg, #F8F4FF 0%, #E8F8F5 100%)'}}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl" style={{color: '#0D1B40'}}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{background: 'linear-gradient(135deg, #6C3FC5, #2d1b69)'}}>
                <FileText className="w-4 h-4 text-white" />
              </div>
              <span className={isRTL ? 'mr-2' : 'ml-2'}>{selectedNotification?.title}</span>
            </DialogTitle>
          </DialogHeader>

          {actionData && (
            <div className="space-y-4 mt-4">
              {/* Action Type Badge */}
              <div className="flex items-center justify-center p-4 rounded-lg" style={{background: 'rgba(108,63,197,0.1)', border: '2px solid rgba(108,63,197,0.2)'}}>
                <Badge style={{background: 'linear-gradient(135deg, #6C3FC5, #2d1b69)'}}>
                  {actionData.actionTitle}
                </Badge>
              </div>

              {/* Admin Message */}
              <div>
                <label className="text-sm font-medium mb-2 block" style={{color: '#008C7A'}} suppressHydrationWarning={true}>
                  رسالة الإدارة:
                </label>
                <div className="p-4 rounded-lg" style={{background: 'rgba(255,255,255,0.8)', border: '2px solid rgba(0,191,166,0.2)'}}>
                  <p className="text-base whitespace-pre-line" style={{color: '#333'}}>{actionData.actionMessage}</p>
                </div>
              </div>

              {/* Admin Name */}
              <div className="flex items-center gap-3 p-4 rounded-lg" style={{background: 'rgba(0,191,166,0.1)', border: '2px solid rgba(0,191,166,0.2)'}}>
                <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{background: 'linear-gradient(135deg, #00BFA6, #008C7A)'}}>
                  <User className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-sm" style={{color: '#008C7A'}} suppressHydrationWarning={true}>المسؤول:</p>
                  <p className="font-medium" style={{color: '#0D1B40'}}>{actionData.adminName}</p>
                </div>
              </div>

              {/* Action Date */}
              <div className="flex items-center gap-3 p-4 rounded-lg" style={{background: 'rgba(108,63,197,0.1)', border: '2px solid rgba(108,63,197,0.2)'}}>
                <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{background: 'linear-gradient(135deg, #6C3FC5, #2d1b69)'}}>
                  <Clock className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-sm" style={{color: '#7C3AED'}} suppressHydrationWarning={true}>تاريخ الإجراء:</p>
                  <p className="font-medium" style={{color: '#0D1B40'}}>
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
                <div className="flex items-center gap-3 p-4 rounded-lg" style={{background: 'rgba(239, 68, 68, 0.1)', border: '2px solid rgba(239, 68, 68, 0.2)'}}>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{background: 'linear-gradient(135deg, #ef4444, #dc2626)'}}>
                    <Ban className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-sm" style={{color: '#dc2626'}} suppressHydrationWarning={true}>مدة الحظر:</p>
                    <p className="font-medium" style={{color: '#ef4444'}}>
                      {actionData.banDuration} <span className="mx-1" suppressHydrationWarning={true}>أيام</span>
                    </p>
                  </div>
                </div>
              )}

              {/* Additional Info */}
              <div className="text-sm text-center pt-2" style={{color: '#888'}}>
                <p><span suppressHydrationWarning={true}>رقم البلاغ:</span> {actionData.reportId}</p>
              </div>
            </div>
          )}

          {!actionData && (
            <div className="text-center py-8">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center" style={{background: 'linear-gradient(135deg, #FEE2E2, #FECACA)'}}>
                <AlertCircle className="w-6 h-6" style={{color: '#ef4444'}} />
              </div>
              <p className="text-muted-foreground" suppressHydrationWarning={true}>لا توجد تفاصيل إضافية</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
