'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import ChatView from '@/components/chat-view'

function ChatPageContent() {
  const searchParams = useSearchParams()
  const conversationId = searchParams.get('conversation')

  console.log('[Chat Page Client] conversationId:', conversationId)

  return <ChatView conversationId={conversationId} />
}

export default function ChatPageClient() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-muted/50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    }>
      <ChatPageContent />
    </Suspense>
  )
}
