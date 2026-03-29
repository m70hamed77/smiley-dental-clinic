import { Check, CheckCheck } from 'lucide-react'

interface MessageBubbleProps {
  message: {
    id: number
    sender: 'me' | 'other'
    text: string
    time: string
    isRead?: boolean
  }
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isMe = message.sender === 'me'

  return (
    <div className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[70%] ${isMe ? 'order-2' : 'order-1'}`}>
        <div
          className={`rounded-2xl px-4 py-2 ${
            isMe
              ? 'bg-gradient-to-br from-emerald-500 to-teal-500 text-white'
              : 'bg-white border'
          }`}
        >
          <p className="text-sm leading-relaxed">{message.text}</p>
        </div>

        <div className={`flex items-center gap-1 mt-1 text-xs text-muted-foreground ${
          isMe ? 'justify-end' : 'justify-start'
        }`}>
          <span>{message.time}</span>
          {isMe && (
            <span className="text-emerald-600">
              {message.isRead ? (
                <CheckCheck className="w-3 h-3" />
              ) : (
                <Check className="w-3 h-3" />
              )}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
