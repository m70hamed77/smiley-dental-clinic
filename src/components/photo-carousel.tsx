'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight, ZoomIn } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from '@/components/ui/dialog'

interface Photo {
  id: string
  fileUrl: string
  photoType: 'BEFORE' | 'AFTER'
  description?: string | null
}

interface PhotoCarouselProps {
  photos: Photo[]
}

export function PhotoCarousel({ photos }: PhotoCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)

  if (!photos || photos.length === 0) {
    return (
      <div className="text-center py-8 bg-muted/50 rounded-lg border-2 border-dashed">
        <p className="text-sm text-muted-foreground">لم يتم رفع صور بعد</p>
      </div>
    )
  }

  const currentPhoto = photos[currentIndex]
  const isBefore = currentPhoto.photoType === 'BEFORE'

  // Check if fileUrl is base64 without prefix and add it
  const getImageSrc = (fileUrl: string) => {
    if (!fileUrl) return ''

    // Log for debugging
    console.log('[PhotoCarousel] Processing image:', {
      fileUrlPrefix: fileUrl.substring(0, 50),
      isDataUrl: fileUrl.startsWith('data:'),
      isHttp: fileUrl.startsWith('http'),
      length: fileUrl.length
    })

    // If it's already a data URL, return as is
    if (fileUrl.startsWith('data:')) {
      return fileUrl
    }

    // If it's a URL (http/https), return as is
    if (fileUrl.startsWith('http')) {
      return fileUrl
    }

    // If it looks like base64 (doesn't contain spaces or newlines), add prefix
    const looksLikeBase64 = !fileUrl.includes(' ') && !fileUrl.includes('\n') && fileUrl.length > 100
    if (looksLikeBase64) {
      // Default to image/jpeg, could be enhanced to detect actual type
      return `data:image/jpeg;base64,${fileUrl}`
    }

    // Otherwise, assume it's a relative path
    return fileUrl
  }

  const imageSrc = getImageSrc(currentPhoto.fileUrl)

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? photos.length - 1 : prev - 1))
  }

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === photos.length - 1 ? 0 : prev + 1))
  }

  return (
    <div className="space-y-3">
      <div className="relative group">
        {/* Image Container */}
        <div className="aspect-video bg-muted rounded-lg overflow-hidden border-2 relative">
          <img
            src={imageSrc}
            alt={isBefore ? 'صورة قبل العلاج' : 'صورة بعد العلاج'}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />

          {/* Badge */}
          <div className="absolute top-3 right-3">
            <Badge
              variant={isBefore ? 'secondary' : 'default'}
              className={`${
                isBefore
                  ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                  : 'bg-emerald-800 text-emerald-50 hover:bg-emerald-700'
              }`}
            >
              {isBefore ? 'قبل' : 'بعد'}
            </Badge>
          </div>

          {/* Zoom Button */}
          <div className="absolute bottom-3 left-3">
            <Dialog>
              <DialogTrigger asChild>
                <Button size="sm" variant="secondary" className="gap-2">
                  <ZoomIn className="w-4 h-4" />
                  تكبير
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl">
                <img
                  src={imageSrc}
                  alt={isBefore ? 'صورة قبل العلاج' : 'صورة بعد العلاج'}
                  className="w-full h-auto rounded-lg"
                />
              </DialogContent>
            </Dialog>
          </div>

          {/* Navigation Arrows */}
          {photos.length > 1 && (
            <>
              <Button
                size="icon"
                variant="secondary"
                className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={goToPrevious}
              >
                <ChevronRight className="w-5 h-5" />
              </Button>
              <Button
                size="icon"
                variant="secondary"
                className="absolute left-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={goToNext}
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
            </>
          )}
        </div>

        {/* Description */}
        {currentPhoto.description && (
          <p className="text-sm text-muted-foreground mt-2">{currentPhoto.description}</p>
        )}
      </div>

      {/* Dots Indicator */}
      {photos.length > 1 && (
        <div className="flex justify-center gap-2">
          {photos.map((_, index) => (
            <button
              key={index}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentIndex
                  ? 'w-8 bg-primary'
                  : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
              }`}
              onClick={() => setCurrentIndex(index)}
              aria-label={`عرض الصورة ${index + 1}`}
            />
          ))}
        </div>
      )}

      {/* Photo Counter */}
      <p className="text-center text-sm text-muted-foreground">
        صورة {currentIndex + 1} من {photos.length}
      </p>
    </div>
  )
}
