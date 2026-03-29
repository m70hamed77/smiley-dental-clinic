'use client'

import { useState, useEffect } from 'react'
import { Navigation } from '@/components/navigation'
import { Footer } from '@/components/footer'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import {
  Check,
  X,
  User,
  Users,
  Mail,
  Phone,
  GraduationCap,
  Shield,
  AlertCircle,
  Image as ImageIcon,
  Clock,
} from 'lucide-react'

interface Student {
  id: string
  userId: string
  name: string
  email: string
  phone: string | null
  universityEmail: string | null
  universityName: string | null
  studentIdNumber: string | null
  idCardUrl: string | null
  academicYear: number | null
  createdAt: Date
  userCreatedAt: Date
}

export default function AdminVerificationPage() {
  const { user } = useCurrentUser()
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [rejectDialog, setRejectDialog] = useState<{ open: boolean; studentId: string | null }>({
    open: false,
    studentId: null
  })
  const [rejectionReason, setRejectionReason] = useState('')
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // Fetch pending verification requests
  const fetchPendingRequests = async () => {
    if (!user || user.role !== 'ADMIN') return

    try {
      setLoading(true)
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      }

      if (user?.id) {
        headers['X-User-Id'] = user.id
      }

      const response = await fetch('/api/admin/verification', {
        credentials: 'include',
        headers
      })

      if (response.ok) {
        const data = await response.json()
        setStudents(data.students || [])
      }
    } catch (error) {
      console.error('Error fetching pending requests:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPendingRequests()
  }, [user])

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
        // Remove from list
        setStudents(prev => prev.filter(s => s.id !== studentId))
        alert('تمت الموافقة على الطالب بنجاح! 🎉')
      } else {
        const data = await response.json()
        alert(data.error || 'حدث خطأ أثناء الموافقة')
      }
    } catch (error) {
      console.error('Error approving student:', error)
      alert('حدث خطأ أثناء الموافقة')
    } finally {
      setActionLoading(null)
    }
  }

  // Handle reject
  const handleReject = async () => {
    if (!rejectDialog.studentId || !rejectionReason.trim()) {
      alert('يجب كتابة سبب الرفض')
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
        // Remove from list
        setStudents(prev => prev.filter(s => s.id !== rejectDialog.studentId))
        setRejectDialog({ open: false, studentId: null })
        setRejectionReason('')
        alert('تم رفض الطالب بنجاح')
      } else {
        const data = await response.json()
        alert(data.error || 'حدث خطأ أثناء الرفض')
      }
    } catch (error) {
      console.error('Error rejecting student:', error)
      alert('حدث خطأ أثناء الرفض')
    } finally {
      setActionLoading(null)
    }
  }

  // Format date
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
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
              <h3 className="text-lg font-semibold mb-2" suppressHydrationWarning={true}>غير مصرح بالوصول</h3>
              <p className="text-muted-foreground" suppressHydrationWarning={true}>هذه الصفحة متاحة فقط للأدمن</p>
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
            <p className="text-muted-foreground" suppressHydrationWarning={true}>جاري تحميل الطلبات...</p>
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
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{background: 'linear-gradient(135deg, #00BFA6, #008C7A)'}}>
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-3xl font-bold" style={{color: '#0D1B40'}} suppressHydrationWarning={true}>مراجعة طلبات التحقق</h1>
              </div>
              <Button
                variant="outline"
                onClick={() => {
                  let userId = user?.id

                  // إذا لم يكن user.id متاحاً، حاول من localStorage
                  if (!userId) {
                    try {
                      userId = localStorage.getItem('userId')
                    } catch (e) {
                      // ignore
                    }
                  }

                  // إذا لم يكن متاحاً، حاول من sessionStorage
                  if (!userId) {
                    try {
                      userId = sessionStorage.getItem('userId')
                    } catch (e) {
                      // ignore
                    }
                  }

                  if (userId) {
                    window.location.href = `/admin/users?userId=${encodeURIComponent(userId)}`
                  }
                }}
              >
                <Users className="w-4 h-4 ml-2" />
                عرض كل المستخدمين
              </Button>
            </div>
            <p className="text-muted-foreground" suppressHydrationWarning={true}>
              مراجعة وموافقة/رفض طلبات تسجيل الدكاترة والطلاب الجدد
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Card style={{background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(10px)', border: '1px solid rgba(245, 158, 11, 0.3)'}}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground" suppressHydrationWarning={true}>الطلبات المعلقة</p>
                    <p className="text-3xl font-bold" style={{color: '#f59e0b'}}>{students.length}</p>
                  </div>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{background: 'rgba(245, 158, 11, 0.15)'}}>
                    <Clock className="w-5 h-5" style={{color: '#f59e0b'}} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Students List */}
          {students.length === 0 ? (
            <Card style={{background: 'linear-gradient(135deg, #E8F8F5 0%, #F0FDF4 100%)', border: '2px solid rgba(0,191,166,0.2)'}}>
              <CardContent className="py-16 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{background: 'linear-gradient(135deg, #E8F8F5, #D1F2EB)'}}>
                  <Check className="w-8 h-8" style={{color: '#00BFA6'}} />
                </div>
                <h3 className="text-xl font-semibold mb-2" style={{color: '#0D1B40'}} suppressHydrationWarning={true}>لا توجد طلبات معلقة</h3>
                <p className="text-muted-foreground" suppressHydrationWarning={true}>جميع الطلبات تم مراجعتها</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6">
              {students.map((student) => (
                <Card 
                  key={student.id}
                  style={{background: 'linear-gradient(135deg, #FFF8E1 0%, #FFEDD5 100%)', border: '2px solid rgba(245, 158, 11, 0.3)'}}
                  className="hover:shadow-lg transition-all"
                >
                  <CardContent className="p-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      {/* Student Info */}
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{background: 'linear-gradient(135deg, #00BFA6, #008C7A)'}}>
                            <User className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-lg">{student.name}</h3>
                            <p className="text-sm text-muted-foreground" suppressHydrationWarning={true}>تم التسجيل: {formatDate(student.userCreatedAt)}</p>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm">
                            <Mail className="w-4 h-4 text-muted-foreground" />
                            <span className="text-muted-foreground" suppressHydrationWarning={true}>الإيميل:</span>
                            <span className="font-medium">{student.email}</span>
                          </div>

                          {student.phone && (
                            <div className="flex items-center gap-2 text-sm">
                              <Phone className="w-4 h-4 text-muted-foreground" />
                              <span className="text-muted-foreground" suppressHydrationWarning={true}>الهاتف:</span>
                              <span className="font-medium">{student.phone}</span>
                            </div>
                          )}

                          <div className="flex items-center gap-2 text-sm">
                            <GraduationCap className="w-4 h-4 text-muted-foreground" />
                            <span className="text-muted-foreground" suppressHydrationWarning={true}>الإيميل الجامعي:</span>
                            <span className="font-medium">{student.universityEmail || 'غير محدد'}</span>
                          </div>

                          {student.studentIdNumber && (
                            <div className="flex items-center gap-2 text-sm">
                              <Badge variant="outline" className="font-medium">
                                رقم الطالب: {student.studentIdNumber}
                              </Badge>
                            </div>
                          )}

                          {student.academicYear && (
                            <div className="flex items-center gap-2 text-sm">
                              <Badge variant="secondary" className="font-medium">
                                السنة الدراسية: {student.academicYear}
                              </Badge>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* ID Card & Actions */}
                      <div className="space-y-4">
                        {student.idCardUrl && (
                          <div>
                            <p className="text-sm font-medium mb-2 flex items-center gap-2">
                              <ImageIcon className="w-4 h-4" />
                              صورة الكارنيه:
                            </p>
                            <div className="rounded-lg overflow-hidden" style={{border: '2px solid rgba(0,0,0,0.1)'}}>
                              <img
                                src={student.idCardUrl || ''}
                                alt="صورة الكارنيه"
                                suppressHydrationWarning={true}
                                className="w-full max-h-64 object-contain cursor-pointer hover:opacity-90 transition-opacity"
                                onClick={() => student.idCardUrl && window.open(student.idCardUrl, '_blank')}
                              />
                            </div>
                          </div>
                        )}

                        <div className="flex gap-3 pt-4">
                          <Button
                            onClick={() => handleApprove(student.id)}
                            disabled={actionLoading === student.id}
                            className="flex-1"
                            style={{background: 'linear-gradient(135deg, #00BFA6, #008C7A)', boxShadow: '0 4px 14px rgba(0,191,166,0.4)'}}
                          >
                            {actionLoading === student.id ? (
                              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <>
                                <Check className="w-4 h-4 ml-2" />
                                موافقة
                              </>
                            )}
                          </Button>
                          <Button
                            onClick={() => setRejectDialog({ open: true, studentId: student.id })}
                            disabled={actionLoading === student.id}
                            variant="destructive"
                            className="flex-1"
                            style={{background: 'linear-gradient(135deg, #f87171, #ef4444)'}}
                          >
                            {actionLoading === student.id ? (
                              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <>
                                <X className="w-4 h-4 ml-2" />
                                رفض
                              </>
                            )}
                          </Button>
                        </div>
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

      {/* Reject Dialog */}
      <Dialog open={rejectDialog.open} onOpenChange={(open) => setRejectDialog({ open, studentId: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2" suppressHydrationWarning={true}>
              <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{background: 'linear-gradient(135deg, #f87171, #ef4444)'}}>
                <AlertCircle className="w-4 h-4 text-white" />
              </div>
              رفض طلب التحقق
            </DialogTitle>
            <DialogDescription suppressHydrationWarning={true}>
              يرجى كتابة سبب الرفض ليتم إرساله للطالب
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="اكتب سبب الرفض هنا..."
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
              إلغاء
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={!rejectionReason.trim()}
              suppressHydrationWarning={true}
            >
              تأكيد الرفض
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
