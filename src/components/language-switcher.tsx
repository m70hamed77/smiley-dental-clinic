'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Globe, Check } from 'lucide-react'
import { locales, type Locale } from '@/i18n'

/* eslint-disable react-hooks/immutability */

export function LanguageSwitcher() {
  const [locale, setLocale] = useState<Locale>('ar')

  useEffect(() => {
    // Read locale from cookie or localStorage
    const cookieLocale = document.cookie
      .split(';')
      .find((c) => c.trim().startsWith('locale='))
      ?.split('=')[1] as Locale

    const storageLocale = localStorage.getItem('locale') as Locale

    const currentLocale = (cookieLocale || storageLocale || 'ar') as Locale
    setLocale(currentLocale)
  }, [])

  const changeLanguage = (newLocale: Locale) => {
    // Save to localStorage
    try {
      localStorage.setItem('locale', newLocale)
    } catch (e) {
      // Ignore
    }

    // Update state
    setLocale(newLocale)

    // Save to cookie and refresh using an event
    try {
      document.cookie = `locale=${newLocale}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=lax`
      // Refresh the page to apply changes
      window.location.reload()
    } catch (e) {
      // Ignore
    }
  }

  return (
    <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-1">
      <Globe className="w-4 h-4 text-muted-foreground ml-1" />
      {locales.map((loc) => {
        const isSelected = locale === loc
        const label = loc === 'ar' ? 'العربية' : 'English'

        return (
          <Button
            key={loc}
            variant={isSelected ? 'default' : 'ghost'}
            size="sm"
            onClick={() => changeLanguage(loc)}
            className={`h-7 px-3 text-xs font-medium transition-all ${
              isSelected
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm'
                : 'hover:bg-accent text-muted-foreground'
            }`}
          >
            <span className="flex items-center gap-1.5">
              {label}
              {isSelected && <Check className="w-3 h-3" />}
            </span>
          </Button>
        )
      })}
    </div>
  )
}
