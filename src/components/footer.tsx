import Link from 'next/link'
import { MessageCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function Footer() {
  return (
    <footer className="border-t-2 border-teal-200 bg-gradient-to-br from-teal-50 via-emerald-50 to-sky-50 mt-auto shadow-inner">
      <div className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-md hover:shadow-lg transition-all duration-300">
                <span className="text-2xl" suppressHydrationWarning>🦷</span>
              </div>
              <div className="text-xl font-bold bg-gradient-to-r from-emerald-700 to-teal-800 bg-clip-text text-transparent" suppressHydrationWarning>سمايلي</div>
            </div>
            <p className="text-sm text-teal-700 leading-relaxed">
              منصة إلكترونية تربط بين طلاب طب الأسنان والمرضى للحصول على علاج مجاني
            </p>
          </div>

          {/* Quick Links */}
          <div className="bg-gradient-to-br from-blue-50 to-sky-50 p-6 rounded-2xl border-2 border-blue-200 shadow-md hover:shadow-lg transition-all duration-300">
            <h4 className="font-semibold mb-4 text-blue-900">روابط سريعة</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/about" className="text-blue-700 hover:text-blue-900 hover:translate-x-1 inline-block transition-all duration-300">
                  عن المنصة
                </Link>
              </li>
              <li>
                <Link href="/#features" className="text-blue-700 hover:text-blue-900 hover:translate-x-1 inline-block transition-all duration-300">
                  المميزات
                </Link>
              </li>
              <li>
                <Link href="/#how-it-works" className="text-blue-700 hover:text-blue-900 hover:translate-x-1 inline-block transition-all duration-300">
                  كيف يعمل
                </Link>
              </li>
              <li>
                <Link href="/#faq" className="text-blue-700 hover:text-blue-900 hover:translate-x-1 inline-block transition-all duration-300">
                  الأسئلة الشائعة
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div className="bg-gradient-to-br from-purple-50 to-violet-50 p-6 rounded-2xl border-2 border-purple-200 shadow-md hover:shadow-lg transition-all duration-300">
            <h4 className="font-semibold mb-4 text-purple-900">الدعم</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/contact" className="text-purple-700 hover:text-purple-900 hover:translate-x-1 inline-block transition-all duration-300">
                  اتصل بنا
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-purple-700 hover:text-purple-900 hover:translate-x-1 inline-block transition-all duration-300">
                  الشروط والأحكام
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-purple-700 hover:text-purple-900 hover:translate-x-1 inline-block transition-all duration-300">
                  سياسة الخصوصية
                </Link>
              </li>
              <li>
                <Link href="/help" className="text-purple-700 hover:text-purple-900 hover:translate-x-1 inline-block transition-all duration-300">
                  مركز المساعدة
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-6 rounded-2xl border-2 border-amber-200 shadow-md hover:shadow-lg transition-all duration-300">
            <h4 className="font-semibold mb-4 text-amber-900">تواصل معنا</h4>
            <p className="text-sm text-amber-700 mb-4 leading-relaxed">
              هل لديك أي استفسار؟ تواصل معنا
            </p>
            <Button variant="outline" asChild className="w-full bg-gradient-to-r from-amber-500 to-orange-600 text-white border-0 hover:from-amber-600 hover:to-orange-700 hover:shadow-lg transition-all duration-300">
              <Link href="/contact">
                <span suppressHydrationWarning><MessageCircle className="w-4 h-4 ml-2" /></span>
                <span suppressHydrationWarning>تواصل معنا</span>
              </Link>
            </Button>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t-2 border-teal-200 mt-12 pt-8 text-center">
          <div className="bg-gradient-to-br from-indigo-100 via-purple-100 to-pink-100 inline-block px-8 py-4 rounded-2xl border-2 border-indigo-300 shadow-lg hover:shadow-2xl hover:scale-105 hover:-translate-y-1 transition-all duration-500 animate-pulse-glow cursor-default">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-md animate-spin-slow hover:animate-spin-fast">
                <span className="text-xl" suppressHydrationWarning>💻</span>
              </div>
              <p className="text-sm bg-gradient-to-r from-indigo-700 via-purple-700 to-pink-700 bg-clip-text text-transparent font-bold tracking-wide hover:animate-shimmer">
                © 2026 Team CS-22 | مشروع التخرج | العبور | جميع الحقوق محفوظة.
              </p>
              <div className="w-10 h-10 bg-gradient-to-br from-pink-500 via-purple-500 to-indigo-500 rounded-xl flex items-center justify-center shadow-md animate-spin-slow hover:animate-spin-fast">
                <span className="text-xl" suppressHydrationWarning>🎓</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
