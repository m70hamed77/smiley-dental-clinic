'use client'

import { useState, useEffect } from 'react'
import arData from '@/lib/translations/ar.json'
import enData from '@/lib/translations/en.json'

type TranslationKey = string

// Cache for loaded translations
let cachedAr: any = null;
let cachedEn: any = null;

export function useTranslations() {
  const [locale, setLocale] = useState<string>('ar')
  const [translations, setTranslations] = useState<Record<string, any>>(arData || {})
  const [loading, setLoading] = useState<boolean>(false)

  useEffect(() => {
    // Load translations only once
    if (!cachedAr) {
      try {
        cachedAr = arData
        cachedEn = enData
        console.log('[i18n] Translations cached successfully')
      } catch (error) {
        console.error('[i18n] Error caching translations:', error)
      }
    }

    let mounted = true

    const initTranslations = () => {
      try {
        // Get locale from cookie or localStorage
        const cookieLocale = document.cookie
          .split(';')
          .find((c) => c.trim().startsWith('locale='))
          ?.split('=')[1] || 'ar'

        const storageLocale = localStorage.getItem('locale') || 'ar'
        const currentLocale = cookieLocale || storageLocale || 'ar'

        console.log(`[i18n] Setting locale to: ${currentLocale}`)

        if (mounted) {
          setLocale(currentLocale)
          const translationData = currentLocale === 'ar' ? cachedAr : cachedEn
          setTranslations(translationData || {})
          setLoading(false)
          console.log(`[i18n] Translations loaded for: ${currentLocale}`)
        }
      } catch (error) {
        console.error('[i18n] Error initializing translations:', error)
        if (mounted) {
          // Fallback to Arabic
          setTranslations(cachedAr || arData || {})
          setLocale('ar')
          setLoading(false)
        }
      }
    }

    initTranslations()

    return () => {
      mounted = false
    }
  }, [])

  const t = (key: string): string => {
    if (loading) return key

    const keys = key.split('.')
    let value = translations

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k]
      } else {
        return key
      }
    }

    return typeof value === 'string' ? value : key
  }

  const getData = (key: string): any => {
    if (loading) return []

    const keys = key.split('.')
    let value = translations

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k]
      } else {
        console.warn(`[i18n] Data not found: ${key}`)
        return []
      }
    }

    return value
  }

  return { t, getData, locale, loading }
}
