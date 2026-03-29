import { Suspense } from 'react'
import ChatPageClient from './chat-page-client'
import { Loader2 } from 'lucide-react'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'
export const revalidate = 0

export default function ChatPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-muted/50">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    }>
      <ChatPageClient />
    </Suspense>
  )
}
