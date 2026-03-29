'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const motivationalMessages = [
  "ابتسامتك تهمنا 🦷✨",
  "صحتك تهمنا ❤️",
  "أنت بطل، وشيك على ابتسامتك 💪",
  "نفسك بتبقا أحلى لما تهتم بأسنانك 😁",
  "خطوة بخطوة، هنوصل لابتسامة أحلامك 🌟",
  "العناية بأسنانك = العناية بصحتك 🌱",
  "احنا معاك في رحلة ابتسامتك الجديدة 🚀",
  "استثمر في ابتسامتك، هترجعلك فرحة 🎯",
  "ضحكتك أجمل حاجة فيك 😊",
  "صحتك تاج على راسك 🫶",
  "حافظ على ابتسامتك، حفظ على صحتك 💖",
]

export function MotivationalMessage() {
  const [isVisible, setIsVisible] = useState(false)
  const [currentMessage, setCurrentMessage] = useState('')

  const showMessage = () => {
    // اختيار رسالة عشوائية
    const randomIndex = Math.floor(Math.random() * motivationalMessages.length)
    const message = motivationalMessages[randomIndex]
    
    console.log('✨ تشغيل الرسالة:', message)
    
    setCurrentMessage(message)
    setIsVisible(true)

    // إخفاء الرسالة بعد 3 ثواني
    setTimeout(() => {
      console.log('👋 إخفاء الرسالة')
      setIsVisible(false)
    }, 3000)
  }

  return {
    showMessage,
    MessageComponent: function MessageDisplay() {
      console.log('🎨 محاولة عرض الرسالة:', { isVisible, currentMessage })

      if (!isVisible) return null

      return (
        <AnimatePresence>
          {isVisible && (
            <motion.div
              initial={{ opacity: 0, x: -10, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: -10, scale: 0.95 }}
              transition={{ type: "spring", duration: 0.3 }}
              className="relative inline-flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-4 py-2 rounded-full shadow-lg"
            >
              <span className="text-lg">✨</span>
              <span className="text-sm font-medium whitespace-nowrap" suppressHydrationWarning={true}>
                {currentMessage}
              </span>
              <motion.div
                initial={{ width: "100%" }}
                animate={{ width: "0%" }}
                transition={{ duration: 3, ease: "linear" }}
                className="absolute bottom-0 left-0 h-0.5 bg-white/50 rounded-full"
                style={{ width: '100%' }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      )
    }
  }
}