'use client'

import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Menu, Bell, Settings, LogOut, User, LayoutDashboard, MessageCircle, Calendar, FileText } from 'lucide-react'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import { MotivationalMessage } from '@/components/MotivationalMessage'
import { LanguageSwitcher } from '@/components/language-switcher'
import { useTranslations } from '@/hooks/useTranslations'

interface NavigationProps {
  user?: {
    id: string
    name: string
    email: string
    role: 'PATIENT' | 'STUDENT' | 'ADMIN'
    avatar?: string
  }
}

export function Navigation({ user }: NavigationProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { showMessage, MessageComponent } = MotivationalMessage()
  const [unreadCount, setUnreadCount] = useState(0)
  const { t, locale } = useTranslations()

  // Get userId from URL for admin users
  const userIdParam = searchParams.get('userId') || user?.id || ''

  // دالة مساعدة لإضافة userId للروابط
  const withUserId = (path: string) => {
    if (userIdParam) {
      const separator = path.includes('?') ? '&' : '?'
      return `${path}${separator}userId=${encodeURIComponent(userIdParam)}`
    }
    return path
  }

  // Fetch unread notification count
  useEffect(() => {
    if (!user?.id) return

    const fetchUnreadCount = async () => {
      try {
        // ✅ إرسال userId في الهيدر للمسارات التي لا تستخدم cookies
        const headers: HeadersInit = {
          'Content-Type': 'application/json',
        }

        // ✅ إضافة userId في الهيدر
        if (user?.id) {
          headers['X-User-Id'] = user.id
        }

        const response = await fetch('/api/notifications/new', {
          credentials: 'include',
          headers
        })

        if (response.ok) {
          const data = await response.json()
          setUnreadCount(data.unreadCount || 0)
        }
      } catch (error) {
        console.error('[Navigation] Error fetching unread count:', error)
      }
    }

    fetchUnreadCount()

    // Poll every 30 seconds for updates
    const interval = setInterval(fetchUnreadCount, 30000)
    return () => clearInterval(interval)
  }, [user?.id])

  const handleLogoClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    showMessage()
  }

  // Define nav links with userId for authenticated users
  const navLinks = user && user.id
    ? user.role === 'PATIENT'
      ? [
          { href: withUserId('/dashboard/patient'), label: t('navbar.patientDashboard'), icon: LayoutDashboard },
          { href: withUserId('/search'), label: t('navbar.search'), icon: FileText },
          { href: withUserId('/chat'), label: t('navbar.chat'), icon: MessageCircle },
          { href: withUserId('/notifications'), label: t('navbar.notifications'), icon: Bell },
        ]
      : user.role === 'STUDENT'
      ? [
          { href: withUserId('/dashboard/student'), label: t('navbar.studentDashboard'), icon: LayoutDashboard },
          { href: withUserId('/posts/create'), label: t('navbar.createPost'), icon: FileText },
          { href: withUserId('/chat'), label: t('navbar.chat'), icon: MessageCircle },
          { href: withUserId('/notifications'), label: t('navbar.notifications'), icon: Bell },
        ]
      : user.role === 'ADMIN'
      ? [
          { href: withUserId('/admin'), label: t('navbar.admin'), icon: LayoutDashboard },
          { href: withUserId('/admin/users'), label: t('navbar.users'), icon: User },
          { href: withUserId('/admin/reports'), label: t('navbar.reports'), icon: FileText },
          { href: withUserId('/notifications'), label: t('navbar.notifications'), icon: Bell },
        ]
      : [] // Fallback for unknown roles
    : [
        { href: '/', label: t('navbar.home') },
        { href: '/#features', label: t('navbar.features') },
        { href: '/#how-it-works', label: t('navbar.howItWorks') },
        { href: '/#faq', label: t('navbar.faq') },
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
              className={`text-sm font-medium transition-colors flex items-center gap-2 ${
                pathname === link.href ? 'text-primary' : 'hover:text-primary'
              }`}
            >
              {link.icon && <span suppressHydrationWarning><link.icon className="w-4 h-4" /></span>}
              <span suppressHydrationWarning={true}>{link.label}</span>
            </Link>
          ))}
        </nav>

        {/* Right Side Actions */}
        <div className="flex items-center gap-3">
          {user && user.id ? (
            <>
              {/* Language Switcher */}
              <LanguageSwitcher />

              {/* Notifications Bell */}
              <Link href={withUserId('/notifications')}>
                <Button variant="ghost" size="icon" className="relative">
                  <span suppressHydrationWarning><Bell className="w-5 h-5" /></span>
                  {unreadCount > 0 && (
                    <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-red-500 hover:bg-red-600">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </Badge>
                  )}
                </Button>
              </Link>

              {/* User Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="gap-2">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={user.avatar} />
                      <AvatarFallback><span suppressHydrationWarning={true}>{user.name?.charAt(0) || 'م'}</span></AvatarFallback>
                    </Avatar>
                    <span className="hidden sm:inline"><span suppressHydrationWarning={true}>{user.name || 'مستخدم'}</span></span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium" suppressHydrationWarning={true}>{user.name || 'مستخدم'}</p>
                      <p className="text-xs text-muted-foreground">{user.email || ''}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />

                  {/* Show Profile & Settings only for STUDENT and PATIENT */}
                  {user.role !== 'ADMIN' && (
                    <>
                      <DropdownMenuItem asChild>
                        <Link href={withUserId('/profile')} className="cursor-pointer">
                          <span suppressHydrationWarning><User className="w-4 h-4 ml-2" /></span>
                          <span suppressHydrationWarning={true}>{t('navbar.profile')}</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={withUserId('/settings')} className="cursor-pointer">
                          <span suppressHydrationWarning><Settings className="w-4 h-4 ml-2" /></span>
                          <span suppressHydrationWarning={true}>{t('navbar.settings')}</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}

                  <DropdownMenuItem asChild className="cursor-pointer text-red-600">
                    <Link href={withUserId('/auth/login')}>
                      <span suppressHydrationWarning><LogOut className="w-4 h-4 ml-2" /></span>
                      <span suppressHydrationWarning={true}>{t('navbar.logout')}</span>
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <LanguageSwitcher />
              <Button variant="ghost" asChild>
                <Link href={withUserId('/auth/login')}><span suppressHydrationWarning={true}>{t('navbar.login')}</span></Link>
              </Button>
              <Button asChild className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700">
                <Link href={withUserId('/auth/register')}><span suppressHydrationWarning={true}>{t('navbar.register')}</span></Link>
              </Button>
            </>
          )}

          {/* Mobile Menu */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <span suppressHydrationWarning><Menu className="w-5 h-5" /></span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72">
              <nav className="flex flex-col space-y-4 mt-8">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`text-sm font-medium transition-colors flex items-center gap-2 p-2 rounded-lg hover:bg-muted ${
                      pathname === link.href ? 'bg-muted text-primary' : ''
                    }`}
                  >
                    {link.icon && <span suppressHydrationWarning><link.icon className="w-4 h-4" /></span>}
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
