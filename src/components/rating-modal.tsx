'use client'

import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { StarRating } from '@/components/star-rating'
import { Star, Loader2, CheckCircle2, FileText } from 'lucide-react'

interface Case {
  id: string
  postTitle: string
  treatmentType: string
  rating?: {
    overallRating: number
    reviewText: string | null
  }
}

interface RatingModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  caseData: Case | null
  studentName: string
  onSuccess?: () => void
}

export function RatingModal({ open, onOpenChange, caseData, studentName, onSuccess }: RatingModalProps) {
  const [overallRating, setOverallRating] = useState(0)
  const [qualityRating, setQualityRating] = useState(0)
  const [professionalRating, setProfessionalRating] = useState(0)
  const [reviewText, setReviewText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  // Reset form when modal opens with new case
  useEffect(() => {
    if (open && caseData) {
      setOverallRating(caseData.rating?.overallRating || 0)
      setReviewText(caseData.rating?.reviewText || '')
      setError('')
      setSuccess(false)
    }
  }, [open, caseData])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!caseData) {
      setError('الحالة غير موجودة')
      return
    }

    if (overallRating === 0) {
      setError('يجب اختيار التقييم بالنجوم')
      return
    }

    try {
      setSubmitting(true)
      setError('')

      const response = await fetch('/api/ratings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          caseId: caseData.id,
          overallRating,
          qualityRating: qualityRating || null,
          professionalRating: professionalRating || null,
          reviewText: reviewText.trim() || null
        })
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setSuccess(true)
        setTimeout(() => {
          setSuccess(false)
          onOpenChange(false)
          setOverallRating(0)
          setQualityRating(0)
          setProfessionalRating(0)
          setReviewText('')
          onSuccess?.()
        }, 2000)
      } else {
        setError(data.error || 'فشل في إرسال التقييم')
      }
    } catch (err: any) {
      setError('حدث خطأ أثناء إرسال التقييم')
      console.error('Error submitting rating:', err)
    } finally {
      setSubmitting(false)
    }
  }

  const treatmentTypeMap: { [key: string]: string } = {
    FILLING: 'حشو',
    EXTRACTION: 'خلع',
    CLEANING: 'تنظيف',
    ROOT_CANAL: 'علاج عصب',
    PROSTHETICS: 'تركيبات',
    ORTHODONTICS: 'تقويم',
    SURGERY: 'جراحة',
    PERIODONTAL: 'علاج لثة',
    WHITENING: 'تبييض',
    X_RAY: 'أشعة'
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Star className="w-6 h-6 text-amber-500" />
            قيم حالة العلاج
          </DialogTitle>
          <DialogDescription>
            شارك تجربتك مع د. {studentName}
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="text-center py-12">
            <CheckCircle2 className="w-16 h-16 mx-auto text-emerald-800 mb-4" />
            <h3 className="text-xl font-semibold text-emerald-50 mb-2">
              تم إرسال تقييمك بنجاح! ✅
            </h3>
            <p className="text-muted-foreground">
              شكراً لمشاركتك تجربتك
            </p>
          </div>
        ) : !caseData ? (
          <Alert variant="destructive">
            <AlertDescription>
              الحالة غير موجودة
            </AlertDescription>
          </Alert>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Case Info */}
            <div className="bg-muted/50 p-4 rounded-lg">
              <h4 className="font-semibold mb-2">{caseData.postTitle}</h4>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <FileText className="w-4 h-4" />
                  {treatmentTypeMap[caseData.treatmentType] || caseData.treatmentType}
                </div>
                {caseData.rating && (
                  <div className="flex items-center gap-1 text-amber-600">
                    <Star className="w-4 h-4 fill-current" />
                    تم التقييم مسبقاً: {caseData.rating.overallRating}/5
                  </div>
                )}
              </div>
            </div>

            {/* Overall Rating */}
            <div>
              <Label className="text-base font-semibold mb-3 block">
                التقييم العام <span className="text-red-500">*</span>
              </Label>
              <div className="flex items-center gap-3">
                <StarRating
                  value={overallRating}
                  onChange={setOverallRating}
                  size="lg"
                />
                <span className="text-2xl font-bold text-amber-500">
                  {overallRating}/5
                </span>
              </div>
            </div>

            {/* Detailed Ratings (Optional) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium mb-2 block">
                  جودة العمل (اختياري)
                </Label>
                <StarRating
                  value={qualityRating}
                  onChange={setQualityRating}
                  size="sm"
                />
              </div>
              <div>
                <Label className="text-sm font-medium mb-2 block">
                  المهنية (اختياري)
                </Label>
                <StarRating
                  value={professionalRating}
                  onChange={setProfessionalRating}
                  size="sm"
                />
              </div>
            </div>

            {/* Review Text */}
            <div>
              <Label htmlFor="reviewText" className="text-base font-semibold mb-2 block">
                اكتب رأيك هنا (اختياري)
              </Label>
              <Textarea
                id="reviewText"
                value={reviewText}
                onChange={(e) => {
                  if (e.target.value.length <= 500) {
                    setReviewText(e.target.value)
                  }
                }}
                placeholder="شارك تجربتك مع الدكتور... كيف كانت الخدمة؟ هل تُوصي به للآخرين؟"
                rows={4}
                className="resize-none"
                maxLength={500}
              />
              <div className="flex justify-between mt-1">
                <span className="text-xs text-muted-foreground">
                  شارك تجربتك لتساعد المرضى الآخرين
                </span>
                <span className={`text-xs ${reviewText.length >= 500 ? 'text-red-500' : 'text-muted-foreground'}`}>
                  {reviewText.length}/500
                </span>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                  جاري الإرسال...
                </>
              ) : (
                <>
                  <Star className="w-4 h-4 ml-2" />
                  إرسال التقييم
                </>
              )}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
