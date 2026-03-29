'use client'

import { useState, useEffect } from 'react'
import { Navigation } from '@/components/navigation'
import { Footer } from '@/components/footer'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { useTranslations } from '@/hooks/useTranslations'
import { useSearchParams } from 'next/navigation'
import {
  Check,
  X,
  User,
  Mail,
  Phone,
  Shield,
  AlertCircle,
  Image as ImageIcon,
  GraduationCap,
  Search,
  Filter,
  RefreshCw,
  Trash2,
  FileText,
  AlertTriangle,
} from 'lucide-react'

interface UserData {
  id: string
  userId: string
  name: string
  email: string
  phone: string | null
  role: 'STUDENT' | 'PATIENT'
  userStatus: string
  verificationStatus?: 'PENDING' | 'APPROVED' | 'REJECTED' | null
  universityEmail?: string | null
  idCardUrl?: string | null
  academicYear?: number | null
  createdAt: Date
  rejectionReason?: string | null
}

export default function AdminUsersPage() {
  const { user } = useCurrentUser()
  const { t, locale, loading: i18nLoading } = useTranslations()
  const searchParams = useSearchParams()
  const userIdParam = searchParams.get('userId') || ''
  const [users, setUsers] = useState<UserData[]>([])
  const [loading, setLoading] = useState(true)
  const [filterRole, setFilterRole] = useState<'ALL' | 'STUDENT' | 'PATIENT'>('ALL')
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'DELETED' | 'BANNED' | 'SUSPENDED'>('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [rejectDialog, setRejectDialog] = useState<{ open: boolean; studentId: string | null }>({
    open: false,
    studentId: null
  })
  const [rejectionReason, setRejectionReason] = useState('')
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null)
  const [viewUserDialog, setViewUserDialog] = useState(false)
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; userId: string | null }>({
    open: false,
    userId: null
  })
  const [deleteReason, setDeleteReason] = useState('')

  // Fetch users
  const fetchUsers = async () => {
    if (!user || user.role !== 'ADMIN') {
      return
    }

    try {
      setLoading(true)
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      }

      if (user?.id) {
        headers['X-User-Id'] = user.id
      }

      const response = await fetch('/api/admin/users', {
        credentials: 'include',
        headers
      })

      if (response.ok) {
        const data = await response.json()
        setUsers(data.users || [])
      } else {
        const errorData = await response.json()
        console.error('[Admin Users Page] ❌ Error response:', errorData)
        alert(`${t('common.error')}: ${errorData.error || t('users.errorFetchingUsers')}`)
      }
    } catch (error) {
      console.error('[Admin Users Page] ❌ Fetch error:', error)
      alert(t('users.errorConnectingServer'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [user])

  // Filter users
  const filteredUsers = users.filter(user => {
    // Role filter
    if (filterRole !== 'ALL' && user.role !== filterRole) return false

    // Status filter (for user status: DELETED, BANNED, SUSPENDED)
    if (filterStatus !== 'ALL' && ['DELETED', 'BANNED', 'SUSPENDED'].includes(filterStatus)) {
      if (user.userStatus !== filterStatus) return false
    }

    // Status filter (only for students verification status)
    if (filterStatus !== 'ALL' && ['PENDING', 'APPROVED', 'REJECTED'].includes(filterStatus)) {
      if (user.role === 'STUDENT' && user.verificationStatus !== filterStatus) {
        return false
      }
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return (
        user.name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        user.phone?.includes(query)
      )
    }

    return true
  })

  // Handle approve
  const handleApprove = async (studentId: string) => {
    try {
      setActionLoading(studentId)
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      }

      if (user?.id) {
        headers['X-User-Id'] = user.id
      }

      const response = await fetch(`/api/admin/verification/${studentId}/approve`, {
        method: 'POST',
        credentials: 'include',
        headers
      })

      if (response.ok) {
        await fetchUsers()
        alert(t('users.approvedSuccessfully'))
        if (viewUserDialog) setViewUserDialog(false)
      } else {
        const data = await response.json()
        alert(data.error || t('users.errorApproving'))
      }
    } catch (error) {
      console.error('Error approving student:', error)
      alert(t('users.errorApproving'))
    } finally {
      setActionLoading(null)
    }
  }

  // Handle delete user dialog
  const handleDeleteClick = (userId: string) => {
    setDeleteDialog({ open: true, userId })
    setDeleteReason('')
  }

  // Handle delete user
  const handleDelete = async () => {
    if (!deleteDialog.userId) return

    if (!deleteReason.trim()) {
      alert(t('users.mustWriteReason'))
      return
    }

    try {
      setActionLoading(deleteDialog.userId)
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      }

      if (user?.id) {
        headers['X-User-Id'] = user.id
      }

      const response = await fetch(`/api/admin/users/${deleteDialog.userId}/delete`, {
        method: 'POST',
        credentials: 'include',
        headers,
        body: JSON.stringify({ deleteReason: deleteReason.trim() })
      })

      if (response.ok) {
        await fetchUsers()
        setDeleteDialog({ open: false, userId: null })
        setDeleteReason('')
        alert(t('users.deletedSuccessfully'))
        if (viewUserDialog) setViewUserDialog(false)
      } else {
        const data = await response.json()
        alert(data.error || t('users.errorDeleting'))
      }
    } catch (error) {
      console.error('Error deleting user:', error)
      alert(t('users.errorDeleting'))
    } finally {
      setActionLoading(null)
    }
  }

  // Handle reject
  const handleReject = async () => {
    if (!rejectDialog.studentId || !rejectionReason.trim()) {
      alert(t('users.mustWriteRejectionReason'))
      return
    }

    try {
      setActionLoading(rejectDialog.studentId)
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      }

      if (user?.id) {
        headers['X-User-Id'] = user.id
      }

      const response = await fetch(`/api/admin/verification/${rejectDialog.studentId}/reject`, {
        method: 'POST',
        credentials: 'include',
        headers,
        body: JSON.stringify({ rejectionReason })
      })

      if (response.ok) {
        await fetchUsers()
        setRejectDialog({ open: false, studentId: null })
        setRejectionReason('')
        alert(t('users.rejectedSuccessfully'))
        if (viewUserDialog) setViewUserDialog(false)
      } else {
        const data = await response.json()
        alert(data.error || t('users.errorRejecting'))
      }
    } catch (error) {
      console.error('Error rejecting student:', error)
      alert(t('users.errorRejecting'))
    } finally {
      setActionLoading(null)
    }
  }

  // Get status badge
  const getStatusBadge = (user: UserData) => {
    // ✅ Check DELETED first (highest priority)
    if (user.userStatus === 'DELETED') {
      return <Badge variant="destructive">{t('users.deleted')}</Badge>
    }

    // ✅ Check BANNED
    if (user.userStatus === 'BANNED') {
      return <Badge variant="destructive">{t('users.suspended')}</Badge>
    }

    // ✅ Check SUSPENDED
    if (user.userStatus === 'SUSPENDED') {
      return <Badge className="bg-orange-100 text-orange-700">{t('users.suspended')}</Badge>
    }

    if (user.role === 'PATIENT') {
      return <Badge variant={user.userStatus === 'ACTIVE' ? 'default' : 'secondary'}>
        {user.userStatus === 'ACTIVE' ? t('common.yes') : user.userStatus}
      </Badge>
    }

    // Student
    switch (user.verificationStatus) {
      case 'PENDING':
        return <Badge variant="secondary" className="bg-amber-100 text-amber-700">{t('users.pending')}</Badge>
      case 'APPROVED':
        return <Badge className="bg-emerald-800 text-emerald-50">{t('users.verified')}</Badge>
      case 'REJECTED':
        return <Badge variant="destructive">{t('users.rejected')}</Badge>
      default:
        return <Badge variant="outline">{t('common.no')}</Badge>
    }
  }

  // Format date based on locale
  const formatDate = (date: Date) => {
    const localeDate = locale === 'ar' ? 'ar-EG' : 'en-US'
    return new Date(date).toLocaleDateString(localeDate, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  // Check if user is not authenticated after loading
  if (!loading && !user) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navigation user={undefined} />
        <main className="flex-1 flex items-center justify-center bg-muted/30">
          <Card className="max-w-md mx-4">
            <CardContent className="py-12 text-center">
              <Shield className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2" suppressHydrationWarning={true}>{t('auth.loginTitle')}</h3>
              <p className="text-muted-foreground mb-4" suppressHydrationWarning={true}>{t('auth.loginRequired')}</p>
              <Button
                onClick={() => {
                  const currentPath = encodeURIComponent('/admin/users')
                  window.location.href = `/sandbox-login?redirect=${currentPath}`
                }}
                style={{background: 'linear-gradient(135deg, #00BFA6, #008C7A)', boxShadow: '0 4px 14px rgba(0,191,166,0.4)'}}
                suppressHydrationWarning={true}
              >
                {t('auth.loginButton')}
              </Button>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    )
  }

  // Check if user is admin
  if (user && user.role !== 'ADMIN') {
    return (
      <div className="min-h-screen flex flex-col">
        <Navigation user={user ? { id: user.id, name: user.name || 'مستخدم', email: user.email || '', role: user.role as 'PATIENT' | 'STUDENT' | 'ADMIN' } : undefined} />
        <main className="flex-1 flex items-center justify-center bg-muted/30">
          <Card className="max-w-md mx-4">
            <CardContent className="py-12 text-center">
              <Shield className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2" suppressHydrationWarning={true}>{t('auth.unauthorized')}</h3>
              <p className="text-muted-foreground" suppressHydrationWarning={true}>{t('auth.adminOnly')}</p>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navigation user={user ? { id: user.id, name: user.name || 'مستخدم', email: user.email || '', role: user.role as 'PATIENT' | 'STUDENT' | 'ADMIN' } : undefined} />
        <main className="flex-1 flex items-center justify-center bg-muted/30">
          <div className="text-center">
            <div className="w-16 h-16 border-4 rounded-full animate-spin mx-auto mb-4" style={{borderTopColor: '#00BFA6', borderRightColor: 'transparent', borderBottomColor: '#008C7A', borderLeftColor: 'transparent'}} />
            <p className="text-muted-foreground" suppressHydrationWarning={true}>{t('common.loading')}</p>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation user={user ? { id: user.id, name: user.name || 'مستخدم', email: user.email || '', role: user.role as 'PATIENT' | 'STUDENT' | 'ADMIN' } : undefined} />

      <main className="flex-1" style={{background: 'linear-gradient(135deg, #F8F4FF 0%, #E8F8F5 100%)'}}>
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{background: 'linear-gradient(135deg, #00BFA6, #008C7A)'}}>
                <Shield className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-3xl font-bold" style={{color: '#0D1B40'}} suppressHydrationWarning={true}>{t('users.title')}</h1>
            </div>
            <p className="text-muted-foreground" suppressHydrationWarning={true}>
              {t('users.subtitle')}
            </p>
          </div>

          {/* Filters */}
          <Card className="mb-6" style={{background: 'linear-gradient(135deg, #E8F8F5 0%, #F0FDF4 100%)', backdropFilter: 'blur(10px)', border: '2px solid rgba(0,191,166,0.2)'}}>
            <CardContent className="p-4">
              <div className="flex flex-wrap gap-4">
                {/* Search */}
                <div className="flex-1 min-w-[200px]">
                  <div className="relative">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder={t('users.searchPlaceholder')}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pr-10"
                      suppressHydrationWarning={true}
                    />
                  </div>
                </div>

                {/* Role Filter */}
                <div className="w-48">
                  <Select value={filterRole} onValueChange={(value: any) => setFilterRole(value)}>
                    <SelectTrigger>
                      <Filter className="w-4 h-4 ml-2" />
                      <SelectValue placeholder={t('users.filterType')} suppressHydrationWarning={true} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL" suppressHydrationWarning={true}>{t('users.all')}</SelectItem>
                      <SelectItem value="STUDENT" suppressHydrationWarning={true}>{t('users.doctorsStudents')}</SelectItem>
                      <SelectItem value="PATIENT" suppressHydrationWarning={true}>{t('users.patients')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Status Filter */}
                <div className="w-48">
                  <Select value={filterStatus} onValueChange={(value: any) => setFilterStatus(value)}>
                    <SelectTrigger>
                      <Filter className="w-4 h-4 ml-2" />
                      <SelectValue placeholder={t('users.filterStatus')} suppressHydrationWarning={true} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL" suppressHydrationWarning={true}>{t('users.all')}</SelectItem>
                      <SelectItem value="PENDING" suppressHydrationWarning={true}>{t('users.pending')}</SelectItem>
                      <SelectItem value="APPROVED" suppressHydrationWarning={true}>{t('users.verified')}</SelectItem>
                      <SelectItem value="REJECTED" suppressHydrationWarning={true}>{t('users.rejected')}</SelectItem>
                      <SelectItem value="DELETED" suppressHydrationWarning={true}>{t('users.deleted')}</SelectItem>
                      <SelectItem value="BANNED" suppressHydrationWarning={true}>{t('users.suspended')}</SelectItem>
                      <SelectItem value="SUSPENDED" suppressHydrationWarning={true}>{t('users.suspended')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Refresh */}
                <Button
                  variant="outline"
                  size="icon"
                  onClick={fetchUsers}
                >
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Users List */}
          {!loading && users.length === 0 ? (
            <Card style={{background: 'linear-gradient(135deg, #F8F4FF 0%, #E8F8F5 100%)', border: '2px solid rgba(0,191,166,0.2)'}}>
              <CardContent className="py-16 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{background: 'linear-gradient(135deg, #E8F8F5, #D1F2EB)'}}>
                  <User className="w-8 h-8" style={{color: '#00BFA6'}} />
                </div>
                <h3 className="text-xl font-semibold mb-2" style={{color: '#0D1B40'}} suppressHydrationWarning={true}>{t('users.noUsers')}</h3>
                <p className="text-muted-foreground mb-4" suppressHydrationWarning={true}>{t('users.noUsersDesc')}</p>
                <Button variant="outline" onClick={fetchUsers} style={{borderColor: '#00BFA6', color: '#00BFA6'}} className="hover:bg-teal-50" suppressHydrationWarning={true}>
                  <RefreshCw className="w-4 h-4 ml-2" />
                  {t('users.retry')}
                </Button>
              </CardContent>
            </Card>
          ) : filteredUsers.length === 0 ? (
            <Card style={{background: 'linear-gradient(135deg, #F8F4FF 0%, #E8F8F5 100%)', border: '2px solid rgba(0,191,166,0.2)'}}>
              <CardContent className="py-16 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{background: 'linear-gradient(135deg, #F8F4FF, #E9D5FF)'}}>
                  <User className="w-8 h-8" style={{color: '#6C3FC5'}} />
                </div>
                <h3 className="text-xl font-semibold mb-2" style={{color: '#0D1B40'}} suppressHydrationWarning={true}>{t('users.noResults')}</h3>
                <p className="text-muted-foreground" suppressHydrationWarning={true}>{t('users.noResultsDesc')}</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredUsers.map((userData) => (
                <Card 
                  key={userData.id}
                  style={{
                    background: userData.role === 'STUDENT' 
                      ? 'linear-gradient(135deg, #E8F8F5 0%, #D1F2EB 100%)'
                      : 'linear-gradient(135deg, #F8F4FF 0%, #E9D5FF 100%)',
                    border: userData.role === 'STUDENT'
                      ? '2px solid rgba(0,191,166,0.2)'
                      : '2px solid rgba(108,63,197,0.2)'
                  }}
                  className="hover:shadow-lg transition-all"
                >
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{background: 'linear-gradient(135deg, #00BFA6, #008C7A)'}}>
                          {userData.role === 'STUDENT' ? (
                            <GraduationCap className="w-6 h-6 text-white" />
                          ) : (
                            <User className="w-6 h-6 text-white" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-lg">{userData.name}</h3>
                            {getStatusBadge(userData)}
                          </div>
                          <div className="text-sm text-muted-foreground space-y-1">
                            <div className="flex items-center gap-2">
                              <Mail className="w-3 h-3" />
                              <span>{userData.email}</span>
                            </div>
                            {userData.phone && (
                              <div className="flex items-center gap-2">
                                <Phone className="w-3 h-3" />
                                <span>{userData.phone}</span>
                              </div>
                            )}
                            {userData.role === 'STUDENT' && userData.universityEmail && (
                              <div className="flex items-center gap-2">
                                <GraduationCap className="w-3 h-3" />
                                <span>{userData.universityEmail}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-2">
                              <span className="text-xs">
                                {t('users.joinDate')}: {formatDate(userData.createdAt)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedUser(userData)
                            setViewUserDialog(true)
                          }}
                          style={{
                            borderColor: userData.role === 'STUDENT' ? '#00BFA6' : '#6C3FC5',
                            color: userData.role === 'STUDENT' ? '#00BFA6' : '#6C3FC5'
                          }}
                          className={userData.role === 'STUDENT' ? 'hover:bg-teal-50' : 'hover:bg-purple-50'}
                          suppressHydrationWarning={true}
                        >
                          {t('users.viewDetails')}
                        </Button>

                        {userData.role === 'STUDENT' && userData.verificationStatus === 'PENDING' && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => handleApprove(userData.id)}
                              disabled={actionLoading === userData.id}
                              style={{background: 'linear-gradient(135deg, #00BFA6, #008C7A)', boxShadow: '0 4px 14px rgba(0,191,166,0.4)'}}
                              suppressHydrationWarning={true}
                            >
                              <Check className="w-4 h-4 ml-1" />
                              {t('users.approve')}
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => setRejectDialog({ open: true, studentId: userData.id })}
                              disabled={actionLoading === userData.id}
                              suppressHydrationWarning={true}
                            >
                              <X className="w-4 h-4 ml-1" />
                              {t('users.reject')}
                            </Button>
                          </>
                        )}

                        {/* Delete Button - Available for all non-admin users */}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteClick(userData.userId)}
                          disabled={actionLoading === userData.userId}
                          style={{borderColor: '#ef4444', color: '#ef4444'}}
                          className="hover:bg-red-50"
                          suppressHydrationWarning={true}
                        >
                          <Trash2 className="w-4 h-4 ml-1" />
                          {t('users.delete')}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />

      {/* View User Dialog */}
      <Dialog open={viewUserDialog} onOpenChange={setViewUserDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2" suppressHydrationWarning={true}>
              {selectedUser?.role === 'STUDENT' ? (
                <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{background: 'linear-gradient(135deg, #00BFA6, #008C7A)'}}>
                  <GraduationCap className="w-4 h-4 text-white" />
                </div>
              ) : (
                <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{background: 'linear-gradient(135deg, #6C3FC5, #2d1b69)'}}>
                  <User className="w-4 h-4 text-white" />
                </div>
              )}
              {t('users.viewDetails')}
            </DialogTitle>
            <DialogDescription suppressHydrationWarning={true}>
              {t('users.fullInfo')} {selectedUser?.name}
            </DialogDescription>
          </DialogHeader>

          {selectedUser && (
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="space-y-3">
                <h4 className="font-semibold" suppressHydrationWarning={true}>{t('users.basicInfo')}</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-muted-foreground" suppressHydrationWarning={true}>{t('users.name')}:</span>
                    <p className="font-medium">{selectedUser.name}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground" suppressHydrationWarning={true}>{t('users.type')}:</span>
                    <p className="font-medium">
                      {selectedUser.role === 'STUDENT' ? t('users.doctorStudent') : t('users.patient')}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <span className="text-muted-foreground" suppressHydrationWarning={true}>{t('users.email')}:</span>
                    <p className="font-medium">{selectedUser.email}</p>
                  </div>
                  {selectedUser.phone && (
                    <div className="col-span-2">
                      <span className="text-muted-foreground" suppressHydrationWarning={true}>{t('users.phone')}:</span>
                      <p className="font-medium">{selectedUser.phone}</p>
                    </div>
                  )}
                  <div>
                    <span className="text-muted-foreground" suppressHydrationWarning={true}>{t('users.status')}:</span>
                    <div className="mt-1">{getStatusBadge(selectedUser)}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground" suppressHydrationWarning={true}>{t('users.joinDate')}:</span>
                    <p className="font-medium">{formatDate(selectedUser.createdAt)}</p>
                  </div>
                </div>
              </div>

              {/* Student Specific Info */}
              {selectedUser.role === 'STUDENT' && (
                <div className="space-y-3">
                  <h4 className="font-semibold" suppressHydrationWarning={true}>{t('users.studentInfo')}</h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {selectedUser.universityEmail && (
                      <div className="col-span-2">
                        <span className="text-muted-foreground" suppressHydrationWarning={true}>{t('users.universityEmail')}:</span>
                        <p className="font-medium">{selectedUser.universityEmail}</p>
                      </div>
                    )}
                    {selectedUser.academicYear && (
                      <div>
                        <span className="text-muted-foreground" suppressHydrationWarning={true}>{t('users.academicYear')}:</span>
                        <p className="font-medium">{selectedUser.academicYear}</p>
                      </div>
                    )}
                    {selectedUser.rejectionReason && selectedUser.verificationStatus === 'REJECTED' && (
                      <div className="col-span-2">
                        <span className="text-muted-foreground" suppressHydrationWarning={true}>{t('users.rejectionReason')}:</span>
                        <p className="font-medium text-red-600">{selectedUser.rejectionReason}</p>
                      </div>
                    )}
                  </div>

                  {/* ID Card Image */}
                  {selectedUser.idCardUrl && (
                    <div>
                      <span className="text-muted-foreground text-sm" suppressHydrationWarning={true}>{t('users.idCard')}:</span>
                      <div className="mt-2 border rounded-lg overflow-hidden">
                        <img
                          src={selectedUser.idCardUrl || ''}
                          alt={t('users.idCardAlt')}
                          className="w-full max-h-96 object-contain cursor-pointer hover:opacity-90 transition-opacity"
                          onClick={() => selectedUser.idCardUrl && window.open(selectedUser.idCardUrl, '_blank')}
                          suppressHydrationWarning={true}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Actions for Pending Students */}
              {selectedUser.role === 'STUDENT' && selectedUser.verificationStatus === 'PENDING' && (
                <div className="flex gap-3 pt-4 border-t">
                  <Button
                    onClick={() => handleApprove(selectedUser.id)}
                    disabled={actionLoading === selectedUser.id}
                    className="flex-1"
                    style={{background: 'linear-gradient(135deg, #00BFA6, #008C7A)', boxShadow: '0 4px 14px rgba(0,191,166,0.4)'}}
                  >
                    {actionLoading === selectedUser.id ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Check className="w-4 h-4 ml-2" />
                        {t('users.approve')}
                        <span suppressHydrationWarning={true} />
                      </>
                    )}
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => setRejectDialog({ open: true, studentId: selectedUser.id })}
                    disabled={actionLoading === selectedUser.id}
                    className="flex-1"
                  >
                    {actionLoading === selectedUser.id ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <X className="w-4 h-4 ml-2" />
                        {t('users.reject')}
                        <span suppressHydrationWarning={true} />
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialog.open} onOpenChange={(open) => setRejectDialog({ open, studentId: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2" suppressHydrationWarning={true}>
              <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{background: 'linear-gradient(135deg, #f87171, #ef4444)'}}>
                <AlertCircle className="w-4 h-4 text-white" />
              </div>
              {t('verification.reject')}
            </DialogTitle>
            <DialogDescription suppressHydrationWarning={true}>
              {t('verification.rejectReasonDesc')}
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder={t('verification.writeReason')}
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            rows={4}
            suppressHydrationWarning={true}
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRejectDialog({ open: false, studentId: null })}
              suppressHydrationWarning={true}
            >
              {t('common.cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={!rejectionReason.trim()}
              suppressHydrationWarning={true}
            >
              {t('users.confirmReject')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Confirmation Dialog */}
      <Dialog open={deleteDialog.open} onOpenChange={(open) => !open && setDeleteDialog({ open, userId: null })}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600" suppressHydrationWarning={true}>
              <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{background: 'linear-gradient(135deg, #f87171, #ef4444)'}}>
                <AlertTriangle className="w-4 h-4 text-white" />
              </div>
              {t('users.deleteAccount')}
            </DialogTitle>
            <DialogDescription suppressHydrationWarning={true}>
              {t('users.deleteAccountDesc')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Reason Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium" suppressHydrationWarning={true}>
                {t('users.deleteReasonLabel')} <span className="text-red-500">*</span>
              </label>
              <Textarea
                placeholder={t('users.deleteReasonPlaceholder')}
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                className="min-h-[100px] resize-none"
                disabled={actionLoading !== null}
                suppressHydrationWarning={true}
              />
              <p className="text-xs text-muted-foreground" suppressHydrationWarning={true}>
                {t('users.deleteReasonNote')}
              </p>
            </div>

            {/* Warning Box */}
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-red-800" suppressHydrationWarning={true}>
                    {t('users.importantWarning')}
                  </p>
                  <p className="text-sm text-red-700" suppressHydrationWarning={true}>
                    {t('users.softDeleteWarning')}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialog({ open: false, userId: null })
                setDeleteReason('')
              }}
              disabled={actionLoading !== null}
              suppressHydrationWarning={true}
            >
              {t('common.cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={actionLoading !== null || !deleteReason.trim()}
            >
              {actionLoading === deleteDialog.userId ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  {t('users.deleting')}
                  <span suppressHydrationWarning={true} />
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  {t('users.deleteAccount')}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
