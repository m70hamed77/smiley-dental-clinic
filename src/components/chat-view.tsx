'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Navigation } from '@/components/navigation'
import { Footer } from '@/components/footer'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { useTranslations } from '@/hooks/useTranslations'
import {
  ArrowRight,
  Send,
  Paperclip,
  Phone,
  MoreVertical,
  Check,
  CheckCheck,
  User,
  UserCircle,
  MessageCircle,
  Image as ImageIcon,
  X,
  FileText,
} from 'lucide-react'
import Link from 'next/link'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface Message {
  id: string
  conversationId: string
  senderId: string
  content: string | null
  messageType: 'TEXT' | 'IMAGE' | 'FILE'
  fileUrl: string | null
  timestamp: Date
  isRead: boolean
  sender: {
    name: string
    role: string
  }
}

interface Conversation {
  id: string
  caseId: string
  studentId: string
  patientId: string
  student?: {
    id: string
    user: {
      id: string
      name: string
      email: string
      role: string
    }
  }
  patient?: {
    id: string
    user: {
      id: string
      name: string
      email: string
      role: string
    }
  }
  case_: {
    id: string
    application: {
      id: string
      post: {
        id: string
        title: string
        description: string
      }
    }
  }
}

interface ChatViewProps {
  conversationId: string | null
}

export default function ChatView({ conversationId }: ChatViewProps) {
  const { user } = useCurrentUser()
  const { t, locale } = useTranslations()
  const isRTL = locale === 'ar'
  
  const [conversation, setConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [uploadingFile, setUploadingFile] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Fetch conversation and messages
  useEffect(() => {
    const fetchConversationData = async () => {
      if (!user) {
        setLoading(false)
        return
      }

      console.log('[Chat View] conversationId:', conversationId)

      if (!conversationId) {
        console.log('[Chat View] No conversationId available')
        setLoading(false)
        return
      }

      try {
        // Fetch conversation details
        console.log('[Chat View] Fetching conversation:', conversationId)
        const convResponse = await fetch(`/api/chat/conversations/${conversationId}`, {
          credentials: 'include'
        })

        console.log('[Chat View] Conversation response status:', convResponse.status)

        if (convResponse.ok) {
          const convData = await convResponse.json()
          console.log('[Chat View] Conversation data:', convData)
          if (convData.success) {
            setConversation(convData.conversation)
          } else {
            console.error('[Chat View] API returned error:', convData.error)
          }
        } else {
          const errorData = await convResponse.json()
          console.error('[Chat View] API error:', errorData)
        }

        // Fetch messages
        const msgsResponse = await fetch(`/api/chat/conversations/${conversationId}/messages`, {
          credentials: 'include'
        })

        console.log('[Chat View] Messages response status:', msgsResponse.status)

        if (msgsResponse.ok) {
          const msgsData = await msgsResponse.json()
          console.log('[Chat View] Messages data:', msgsData)
          if (msgsData.success) {
            setMessages(msgsData.messages || [])
          }
        }
      } catch (error) {
        console.error('[Chat View] Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchConversationData()
  }, [user, conversationId])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault()

    console.log('[Chat View] 📝 Send message triggered')
    console.log('[Chat View] Message content:', message)
    console.log('[Chat View] Has selected file:', !!selectedFile)

    if (!message.trim() && !selectedFile) {
      console.log('[Chat View] ❌ No content to send')
      return
    }

    if (!conversation || !user) {
      console.log('[Chat View] ❌ Missing conversation or user')
      return
    }

    // If there's a selected file, upload it first
    if (selectedFile) {
      console.log('[Chat View] 📤 Has selected file, uploading first')
      await handleFileUpload()
      return
    }

    console.log('[Chat View] 📤 Sending text message...')
    setSending(true)
    try {
      const response = await fetch(`/api/chat/conversations/${conversationId}/messages`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: message.trim(),
          messageType: 'TEXT',
          fileUrl: null
        })
      })

      console.log('[Chat View] Response status:', response.status)

      if (response.ok) {
        const data = await response.json()
        console.log('[Chat View] ✅ Text message sent:', data)
        if (data.success) {
          setMessages(prev => [...prev, data.message])
          setMessage('')
          console.log('[Chat View] ✅ Message cleared and added to list')
        } else {
          throw new Error(data.error || t('chat.errors.sendFailed'))
        }
      } else {
        const errorData = await response.json()
        console.error('[Chat View] ❌ Send failed:', errorData)
        throw new Error(errorData.error || t('chat.errors.sendError'))
      }
    } catch (error) {
      console.error('[Chat View] ❌ Error in handleSendMessage:', error)
      alert(t('chat.errors.sendError'))
    } finally {
      setSending(false)
      console.log('[Chat View] Send message process completed')
    }
  }

  // Check if user can send messages
  const canSendMessage = () => {
    if (!user || !conversation) return false

    // Student can always send
    if (user.role === 'STUDENT') return true

    // Patient can only send if there's at least one message from student
    if (user.role === 'PATIENT') {
      const hasStudentMessage = messages.some(msg => msg.sender.role === 'STUDENT')
      return hasStudentMessage
    }

    return false
  }

  // Check if conversation has started (has messages)
  const hasConversationStarted = messages.length > 0

  // Get the other user's name
  const getOtherUserName = () => {
    if (!conversation || !user) return t('chat.unknown')
    
    if (user.role === 'STUDENT') {
      return conversation.patient?.user.name || t('chat.patient')
    } else if (user.role === 'PATIENT') {
      return conversation.student?.user.name || t('chat.doctor')
    }
    
    return t('chat.unknown')
  }

  const formatTime = (date: Date) => {
    const localeDate = locale === 'ar' ? 'ar-EG' : 'en-US'
    return new Date(date).toLocaleTimeString(localeDate, {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('[Chat View] 📁 File selection triggered')
    console.log('[Chat View] Files:', e.target.files)

    const file = e.target.files?.[0]
    console.log('[Chat View] Selected file:', file ? {
      name: file.name,
      size: file.size,
      type: file.type
    } : 'No file')

    if (!file) {
      console.log('[Chat View] ❌ No file selected')
      return
    }

    // Check file size (max 10MB)
    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      alert(t('chat.errors.fileTooLarge'))
      console.log('[Chat View] ❌ File too large')
      return
    }

    console.log('[Chat View] ✅ File validated, setting state')
    setSelectedFile(file)

    // Create preview for images
    if (file.type.startsWith('image/')) {
      console.log('[Chat View] Creating image preview...')
      const reader = new FileReader()
      reader.onloadend = () => {
        console.log('[Chat View] ✅ Image preview created')
        setPreviewUrl(reader.result as string)
      }
      reader.onerror = (error) => {
        console.error('[Chat View] ❌ Error reading file:', error)
      }
      reader.readAsDataURL(file)
    } else {
      console.log('[Chat View] File is not an image, no preview')
      setPreviewUrl(null)
    }
  }

  // Clear selected file
  const clearSelectedFile = () => {
    console.log('[Chat View] 🗑️ Clearing selected file')
    setSelectedFile(null)
    setPreviewUrl(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
      console.log('[Chat View] ✅ fileInputRef cleared')
    } else {
      console.log('[Chat View] ⚠️ fileInputRef.current is null')
    }
  }

  // Upload file and send as message
  const handleFileUpload = async () => {
    if (!selectedFile || !conversation || !user) {
      console.log('[Chat View] ❌ Cannot upload: missing data')
      return
    }

    console.log('[Chat View] 📤 Starting file upload process...')

    setUploadingFile(true)
    try {
      const formData = new FormData()
      formData.append('file', selectedFile)

      console.log('[Chat View] Sending upload request to /api/chat/upload...')

      // Upload file
      const uploadResponse = await fetch('/api/chat/upload', {
        method: 'POST',
        credentials: 'include',
        body: formData
      })

      console.log('[Chat View] Upload response status:', uploadResponse.status)

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json()
        console.error('[Chat View] ❌ Upload failed:', errorData)
        throw new Error(errorData.error || t('chat.errors.uploadFailed'))
      }

      const uploadData = await uploadResponse.json()
      console.log('[Chat View] ✅ Upload response:', uploadData)

      // Determine message type
      const messageType = selectedFile.type.startsWith('image/') ? 'IMAGE' : 'FILE'

      console.log('[Chat View] Sending message with file...')

      // Send message with file
      const messageResponse = await fetch(`/api/chat/conversations/${conversationId}/messages`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: null,
          messageType,
          fileUrl: uploadData.fileUrl
        })
      })

      console.log('[Chat View] Message response status:', messageResponse.status)

      if (messageResponse.ok) {
        const data = await messageResponse.json()
        console.log('[Chat View] ✅ Message sent successfully:', data)
        if (data.success) {
          setMessages(prev => [...prev, data.message])
          clearSelectedFile()
          console.log('[Chat View] ✅ File and message sent successfully')
        } else {
          throw new Error(data.error || t('chat.errors.sendFailed'))
        }
      } else {
        const errorData = await messageResponse.json()
        console.error('[Chat View] ❌ Message failed:', errorData)
        throw new Error(errorData.error || t('chat.errors.sendFailed'))
      }
    } catch (error: any) {
      console.error('[Chat View] ❌ Error in handleFileUpload:', error)
      alert(error.message || t('chat.errors.uploadError'))
    } finally {
      setUploadingFile(false)
      console.log('[Chat View] Upload process completed')
    }
  }

  // Get file icon based on type
  const getFileIcon = (fileUrl: string, messageType: string) => {
    if (messageType === 'IMAGE') {
      return <ImageIcon className="w-6 h-6" />
    }

    const ext = fileUrl.split('.').pop()?.toLowerCase()
    switch (ext) {
      case 'pdf':
        return <FileText className="w-6 h-6 text-red-500" />
      case 'doc':
      case 'docx':
        return <FileText className="w-6 h-6 text-blue-500" />
      case 'xls':
      case 'xlsx':
        return <FileText className="w-6 h-6 text-green-500" />
      default:
        return <FileText className="w-6 h-6 text-gray-500" />
    }
  }

  const getMessageStatusIcon = (msg: Message) => {
    if (msg.senderId !== user?.id) return null

    if (msg.isRead) {
      return <CheckCheck className="w-4 h-4 text-blue-500" />
    }
    return <Check className="w-4 h-4" />
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navigation user={user ? { id: user.id, name: user.name || 'مستخدم', email: user.email || '', role: user.role as 'PATIENT' | 'STUDENT' } : undefined} />
        <main className="flex-1 flex items-center justify-center bg-gradient-to-br from-teal-50 to-emerald-100">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-teal-700 font-medium">{t('chat.loading')}</p>
          </div>
        </main>
      </div>
    )
  }

  if (!conversation) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navigation user={user ? { id: user.id, name: user.name || 'مستخدم', email: user.email || '', role: user.role as 'PATIENT' | 'STUDENT' } : undefined} />
        <main className="flex-1 flex items-center justify-center bg-gradient-to-br from-rose-50 to-pink-100">
          <Card className="max-w-md mx-4 bg-gradient-to-br from-rose-100 to-pink-100 border-2 border-rose-300 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="py-12 text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-rose-200 to-pink-200 rounded-full flex items-center justify-center mx-auto mb-4 shadow-md">
                <MessageCircle className="w-10 h-10 text-rose-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2 text-rose-900">{t('chat.conversationNotFound')}</h3>
              <p className="text-rose-700 mb-6">
                {t('chat.conversationNotFoundDesc')}
              </p>
              <Button asChild className="bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 text-white">
                <Link href="/chat/list">{t('chat.backToChats')}</Link>
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation user={user ? { id: user.id, name: user.name || 'مستخدم', email: user.email || '', role: user.role as 'PATIENT' | 'STUDENT' } : undefined} />

      <main className="flex-1 flex flex-col bg-gradient-to-br from-blue-50 to-sky-50">
        {/* Chat Header */}
        <div className="border-b-2 border-blue-200 bg-gradient-to-br from-blue-50 to-sky-100 shadow-md">
          <div className="container mx-auto max-w-4xl px-4">
            <div className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" asChild className="hover:bg-blue-100 hover:text-blue-700 transition-colors">
                  <Link href="/chat/list">
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                </Button>
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-sky-600 rounded-full flex items-center justify-center shadow-md">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="font-semibold text-blue-900">{getOtherUserName()}</h2>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white border-0 shadow-sm hover:from-emerald-700 hover:to-teal-800">
                      {hasConversationStarted ? t('chat.active') : t('chat.notStarted')}
                    </Badge>
                    {conversation.case_?.application?.post && (
                      <span className="text-xs text-blue-700 font-medium">
                        {conversation.case_.application.post.title}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon">
                  <Phone className="w-5 h-5" />
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="w-5 h-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href={`/profile`} className="cursor-pointer">
                        <UserCircle className={`w-4 h-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                        {t('chat.viewProfile')}
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto px-4 py-6">
          <div className="container mx-auto max-w-4xl">
            {!hasConversationStarted ? (
              <Card className="max-w-2xl mx-auto bg-gradient-to-br from-teal-50 to-emerald-100 border-2 border-teal-200 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardContent className="py-12 text-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-teal-100 to-emerald-200 rounded-full flex items-center justify-center mx-auto mb-4 shadow-md">
                    <MessageCircle className="w-10 h-10 text-teal-600" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2 text-teal-900">
                    {user?.role === 'STUDENT' ? t('chat.conversationNotStarted.studentTitle') : t('chat.conversationNotStarted.patientTitle')}
                  </h3>
                  <p className="text-teal-700">
                    {user?.role === 'STUDENT' 
                      ? t('chat.conversationNotStarted.studentDesc')
                      : t('chat.conversationNotStarted.patientDesc')
                    }
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.senderId === user?.id ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`flex max-w-[70%] gap-2 ${
                      msg.senderId === user?.id ? 'flex-row-reverse' : 'flex-row'
                    }`}>
                      {/* Avatar */}
                      {msg.senderId !== user?.id && (
                        <div className="w-8 h-8 bg-gradient-to-br from-emerald-800 to-teal-800 rounded-full flex items-center justify-center flex-shrink-0 mt-auto">
                          <User className="w-4 h-4 text-emerald-800" />
                        </div>
                      )}

                      {/* Message Bubble */}
                      <div className={`${
                        msg.senderId === user?.id 
                          ? 'bg-gradient-to-br from-emerald-600 to-teal-700 text-white border-2 border-emerald-300' 
                          : 'bg-gradient-to-br from-blue-50 to-sky-100 text-blue-900 border-2 border-blue-200'
                      } rounded-2xl px-4 py-3 shadow-md hover:shadow-lg transition-all duration-300 max-w-full`}>
                        {msg.senderId !== user?.id && (
                          <p className={`text-xs font-semibold mb-1 ${
                            msg.senderId === user?.id ? 'text-emerald-50' : 'text-blue-800'
                          }`}>
                            {msg.sender.name}
                          </p>
                        )}

                        {/* Image Message */}
                        {msg.messageType === 'IMAGE' && msg.fileUrl && (
                          <div className="mb-2">
                            <img
                              src={msg.fileUrl}
                              alt={t('chat.imageAlt')}
                              className="max-w-full h-auto rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                              onClick={() => window.open(msg.fileUrl, '_blank')}
                            />
                          </div>
                        )}

                        {/* File Message */}
                        {msg.messageType === 'FILE' && msg.fileUrl && (
                          <div className="mb-2">
                            <a
                              href={msg.fileUrl}
                              download
                              className={`flex items-center gap-3 p-3 rounded-lg hover:shadow-md transition-all duration-300 ${
                                msg.senderId === user?.id
                                  ? 'bg-white/20 hover:bg-white/30'
                                  : 'bg-white/50 hover:bg-white/70'
                              }`}
                            >
                              {getFileIcon(msg.fileUrl, msg.messageType)}
                              <div className="flex-1 min-w-0">
                                <p className={`text-sm font-medium truncate ${
                                  msg.senderId === user?.id ? 'text-white' : 'text-blue-900'
                                }`}>{t('chat.attachedFile')}</p>
                                <p className={`text-xs ${
                                  msg.senderId === user?.id ? 'text-emerald-100' : 'text-blue-700'
                                }`}>{t('chat.clickToDownload')}</p>
                              </div>
                            </a>
                          </div>
                        )}

                        {/* Text Message */}
                        {msg.content && (
                          <p className="text-sm">{msg.content}</p>
                        )}

                        <div className={`flex items-center justify-end gap-1 mt-1 ${
                          msg.senderId === user?.id ? 'text-emerald-100' : 'text-blue-700'
                        }`}>
                          <span className="text-xs">{formatTime(msg.timestamp)}</span>
                          {getMessageStatusIcon(msg)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <div className="border-t-2 border-blue-200 bg-gradient-to-br from-blue-50 to-sky-100 shadow-md">
          <div className="container mx-auto max-w-4xl px-4">
            <div className="py-4">
              {canSendMessage() ? (
                <>
                  {/* File Preview */}
                  {selectedFile && previewUrl && (
                    <div className="mb-3 p-3 bg-gradient-to-br from-purple-50 to-violet-100 border-2 border-purple-200 rounded-lg hover:shadow-md transition-all duration-300">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2 text-sm">
                          <ImageIcon className="w-4 h-4" />
                          <span className="font-medium">{selectedFile.name}</span>
                          <span className="text-muted-foreground">
                            ({(selectedFile.size / 1024).toFixed(1)} KB)
                          </span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={clearSelectedFile}
                          disabled={uploadingFile}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                      <img
                        src={previewUrl}
                        alt={t('chat.preview')}
                        className="max-h-32 rounded-lg"
                      />
                    </div>
                  )}

                  {selectedFile && !previewUrl && (
                    <div className="mb-3 p-3 bg-gradient-to-br from-amber-50 to-orange-100 border-2 border-amber-200 rounded-lg hover:shadow-md transition-all duration-300">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4" />
                          <span className="text-sm font-medium">{selectedFile.name}</span>
                          <span className="text-xs text-muted-foreground">
                            ({(selectedFile.size / 1024).toFixed(1)} KB)
                          </span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={clearSelectedFile}
                          disabled={uploadingFile}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )}

                  <form onSubmit={handleSendMessage} className="flex gap-2">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileSelect}
                      accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="shrink-0"
                      onClick={() => {
                        console.log('[Chat View] 📎 Paperclip button clicked')
                        console.log('[Chat View] fileInputRef.current:', fileInputRef.current)

                        if (!fileInputRef.current) {
                          console.error('[Chat View] ❌ fileInputRef.current is null!')
                          alert(t('chat.errors.fileUploadError'))
                          return
                        }

                        console.log('[Chat View] ✅ fileInputRef found, triggering click')
                        try {
                          fileInputRef.current.click()
                          console.log('[Chat View] ✅ Click triggered successfully')
                        } catch (error) {
                          console.error('[Chat View] ❌ Error clicking file input:', error)
                          alert(t('chat.errors.fileUploadError'))
                        }
                      }}
                      disabled={uploadingFile}
                    >
                      <Paperclip className="w-5 h-5" />
                    </Button>
                    <div className="flex-1 relative">
                      <Input
                        placeholder={user?.role === 'STUDENT' ? t('chat.placeholders.messageToPatient') : t('chat.placeholders.messageToDoctor')}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        disabled={sending || uploadingFile}
                        className="bg-white/70 border-blue-300 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                    <Button
                      type="submit"
                      size="icon"
                      className="shrink-0 bg-gradient-to-r from-emerald-800 to-teal-800 hover:from-emerald-900 hover:to-teal-900"
                      disabled={(!message.trim() && !selectedFile) || sending || uploadingFile}
                    >
                      {uploadingFile ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Send className="w-5 h-5" />
                      )}
                    </Button>
                  </form>
                </>
              ) : (
                <div className="text-center py-2">
                  <p className="text-sm text-blue-700 font-medium">
                    {user?.role === 'PATIENT'
                      ? t('chat.waitingForDoctor')
                      : t('chat.startConversation')
                    }
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
