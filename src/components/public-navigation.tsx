'use client'

import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Menu } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { MotivationalMessage } from '@/components/MotivationalMessage'
import { LanguageSwitcher } from '@/components/language-switcher'

export function PublicNavigation() {
  const pathname = usePathname()
  const { showMessage, MessageComponent } = MotivationalMessage()

  const handleLogoClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    console.log('🖱️ تم الضغط على اللوجو')
    showMessage()
  }

  const navLinks = [
    { href: '/', label: 'الرئيسية' },
    { href: '/#features', label: 'المميزات' },
    { href: '/#how-it-works', label: 'كيف يعمل؟' },
    { href: '/#faq', label: 'الأسئلة الشائعة' },
    { href: '/search', label: 'بحث عن حالات' },
  ]

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        {/* Logo with Motivational Message */}
        <div className="flex items-center gap-4">
          <div
            className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={handleLogoClick}
          >
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
              <span className="text-2xl" suppressHydrationWarning={true}>🦷</span>
            </div>
            <div className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent hidden sm:block">
              <span suppressHydrationWarning={true}>سمايلي</span>
            </div>
          </div>

          {/* Motivational Message Badge */}
          <MessageComponent />
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm font-medium transition-colors ${
                pathname === link.href ? 'text-primary' : 'hover:text-primary'
              }`}
            >
              <span suppressHydrationWarning={true}>{link.label}</span>
            </Link>
          ))}
        </nav>

        {/* Right Side Actions */}
        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          <Button variant="ghost" asChild>
            <Link href="/auth/login"><span suppressHydrationWarning={true}>تسجيل دخول</span></Link>
          </Button>
          <Button asChild className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700">
            <Link href="/auth/register"><span suppressHydrationWarning={true}>ابدأ الآن</span></Link>
          </Button>

          {/* Mobile Menu */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72">
              <nav className="flex flex-col space-y-4 mt-8">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`text-sm font-medium transition-colors p-2 rounded-lg hover:bg-muted ${
                      pathname === link.href ? 'bg-muted text-primary' : ''
                    }`}
                  >
                    <span suppressHydrationWarning={true}>{link.label}</span>
                  </Link>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
