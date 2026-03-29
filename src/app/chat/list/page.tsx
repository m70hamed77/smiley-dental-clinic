'use client'

import { useState, useEffect } from 'react'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { useTranslations } from '@/hooks/useTranslations'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Navigation } from '@/components/navigation'
import { Footer } from '@/components/footer'
import {
  Search,
  MessageCircle,
  Clock,
  FileText,
  User,
  UserCircle,
} from 'lucide-react'
import Link from 'next/link'

interface Conversation {
  id: string
  applicationId: string
  postId: string
  patientName: string
  patientAvatar: string | null
  patientId: string
  caseTitle: string
  caseStatus: string
  lastMessage: string
  lastMessageTime: string
  unreadCount: number
  status: string
  applicationStatus: string
  applicationDate: string
  conversationId?: string | null
}

interface ConversationsResponse {
  success: boolean
  conversations: Conversation[]
  total: number
}

const getStatusBadge = (status: string, t: any) => {
  switch (status) {
    case 'ACTIVE':
      return <Badge className="bg-emerald-800 text-emerald-50 hover:bg-emerald-700" suppressHydrationWarning={true}>{t('chatList.status.active')}</Badge>
    case 'COMPLETED':
      return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200" suppressHydrationWarning={true}>{t('chatList.status.completed')}</Badge>
    case 'CANCELLED':
      return <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-200" suppressHydrationWarning={true}>{t('chatList.status.cancelled')}</Badge>
    default:
      return <Badge variant="secondary">{status}</Badge>
  }
}

export default function ChatListPage() {
  const { user } = useCurrentUser()
  const { t, locale } = useTranslations()
  const isRTL = locale === 'ar'
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  // Fetch conversations
  useEffect(() => {
    const fetchConversations = async () => {
      if (!user) {
        console.log('[Chat List] No user, skipping fetch')
        setLoading(false)
        return
      }

      console.log('[Chat List] Fetching conversations for user:', user.id, 'role:', user.role)

      try {
        const response = await fetch('/api/chat/conversations', {
          credentials: 'include'
        })

        console.log('[Chat List] Response status:', response.status)

        const data: ConversationsResponse = await response.json()

        console.log('[Chat List] Response data:', data)

        if (data.success) {
          console.log('[Chat List] ✅ Conversations loaded:', data.conversations.length)
          data.conversations.forEach((conv, i) => {
            console.log(`[Chat List] Conversation ${i}:`, {
              id: conv.id,
              conversationId: conv.conversationId,
              patientName: conv.patientName,
              caseTitle: conv.caseTitle
            })
          })
          setConversations(data.conversations)
        } else {
          console.error('[Chat List] ❌ API returned error:', data.error)
        }
      } catch (error) {
        console.error('[Chat List] ❌ Fetch error:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchConversations()
  }, [user])

  const filteredConversations = conversations.filter(conv =>
    conv.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.caseTitle.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation user={user ? { id: user.id, name: user.name || 'مستخدم', email: user.email || '', role: user.role as 'PATIENT' | 'STUDENT' | 'ADMIN', avatar: user.avatarUrl } : undefined} />

      <main className="flex-1 py-8 px-4 bg-muted/30">
        <div className="container mx-auto max-w-4xl">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2" suppressHydrationWarning={true}>{t('chatList.title')}</h1>
            <p className="text-muted-foreground" suppressHydrationWarning={true}>
              {user?.role === 'STUDENT' ? t('chatList.subtitle.student') : t('chatList.subtitle.patient')}
            </p>
          </div>

          {/* Search Bar */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="relative">
                <Search className={`absolute ${isRTL ? 'left-3' : 'right-3'} top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground`} />
                <Input
                  placeholder={t('chatList.searchPlaceholder')} suppressHydrationWarning={true}
                  className={isRTL ? 'pl-10' : 'pr-10'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  disabled={loading}
                />
              </div>
            </CardContent>
          </Card>

          {/* Loading State */}
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="border-2">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <Skeleton className="w-12 h-12 rounded-full flex-shrink-0" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-5 w-1/3" />
                        <Skeleton className="h-4 w-1/4" />
                        <Skeleton className="h-4 w-2/3" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : user?.role === 'STUDENT' || user?.role === 'PATIENT' ? (
            /* Student and Patient View - Real conversations */
            <>
              <div className="space-y-3">
                {filteredConversations.map((conv) => (
                  <Link 
                    key={conv.id} 
                    href={`/chat?conversation=${conv.conversationId || conv.id}`}
                  >
                    <Card className="border-2 hover:border-emerald-700 hover:shadow-md transition-all cursor-pointer">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          {/* Avatar */}
                          <div className="relative flex-shrink-0">
                            <div className="w-12 h-12 bg-gradient-to-br from-emerald-800 to-teal-800 rounded-full flex items-center justify-center overflow-hidden">
                              {conv.patientAvatar ? (
                                <img
                                  src={conv.patientAvatar}
                                  alt={conv.patientName}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <User className="w-6 h-6 text-emerald-800" />
                              )}
                            </div>
                            {conv.status === 'ACTIVE' && (
                              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-slate-1000 rounded-full border-2 border-background" />
                            )}
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <div className="flex-1 min-w-0">
                                <h3 className="font-semibold truncate">{conv.patientName}</h3>
                                <p className="text-sm text-muted-foreground truncate">
                                  {user?.role === 'STUDENT' ? t('chatList.patient') : t('chatList.doctor')}
                                </p>
                              </div>
                              <div className="flex flex-col items-end gap-1">
                                <span className="text-xs text-muted-foreground">
                                  {conv.lastMessageTime}
                                </span>
                                {conv.unreadCount > 0 && (
                                  <Badge className="bg-emerald-600 hover:bg-emerald-700">
                                    {conv.unreadCount}
                                  </Badge>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-2 mb-2">
                              <FileText className="w-3 h-3 text-muted-foreground" />
                              <span className="text-sm text-muted-foreground truncate">
                                {conv.caseTitle}
                              </span>
                              {getStatusBadge(conv.status, t)}
                            </div>

                            <p className="text-sm text-muted-foreground truncate">
                              {conv.lastMessage}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}

                {filteredConversations.length === 0 && (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <MessageCircle className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold mb-2" suppressHydrationWarning={true}>{t('chatList.noConversations')}</h3>
                      <p className="text-muted-foreground" suppressHydrationWarning={true}>
                        {searchQuery ? t('chatList.noMatchingConversations') : t('chatList.noConversationsDesc')}
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </>
          ) : (
            /* Other roles */
            <Card>
              <CardContent className="py-12 text-center">
                <MessageCircle className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2" suppressHydrationWarning={true}>{t('chatList.notAvailable.title')}</h3>
                <p className="text-muted-foreground" suppressHydrationWarning={true}>
                  {t('chatList.notAvailable.description')}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
