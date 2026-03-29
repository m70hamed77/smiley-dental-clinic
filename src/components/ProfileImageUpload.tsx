"use client";

import { useState } from "react";
import { Camera, Upload, X, CheckCircle2, AlertCircle } from "lucide-react";

interface ProfileImageUploadProps {
  userId?: string;
  currentImage?: string | null;
  onUploadSuccess?: (imageUrl: string) => void;
}

export default function ProfileImageUpload({
  userId,
  currentImage,
  onUploadSuccess,
}: ProfileImageUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // ✅ Validation: نوع الملف
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(selectedFile.type)) {
      setMessage({
        type: 'error',
        text: 'نوع الملف غير مدعوم. الرجاء استخدام JPG, PNG, WebP, أو GIF'
      });
      return;
    }

    // ✅ Validation: حجم الملف (5MB)
    if (selectedFile.size > 5 * 1024 * 1024) {
      setMessage({
        type: 'error',
        text: 'حجم الصورة يجب أن يكون أقل من 5MB'
      });
      return;
    }

    setFile(selectedFile);
    setMessage(null);

    // إنشاء معاينة للصورة
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(selectedFile);
  };

  const handleUpload = async () => {
    if (!file) {
      setMessage({
        type: 'error',
        text: 'يرجى اختيار صورة أولاً'
      });
      return;
    }

    if (!userId) {
      setMessage({
        type: 'error',
        text: 'يرجى تسجيل الدخول أولاً'
      });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append("avatar", file); // ✅ تم التصحيح: avatar بدلاً من image
      formData.append("userId", userId);

      console.log('[ProfileImageUpload] Uploading for user:', userId);

      const res = await fetch("/api/user/profile-avatar", { // ✅ تم التصحيح: المسار الصحيح
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      console.log('[ProfileImageUpload] Response:', res.status, data);

      if (!res.ok) {
        throw new Error(data.error || data.message || 'فشل رفع الصورة');
      }

      // ✅ نجاح
      setMessage({
        type: 'success',
        text: 'تم تحديث صورة البروفايل بنجاح'
      });

      // تحديث localStorage
      try {
        const currentUser = localStorage.getItem('currentUser');
        if (currentUser) {
          const parsedUser = JSON.parse(currentUser);
          parsedUser.avatarUrl = data.avatarUrl;
          localStorage.setItem('currentUser', JSON.stringify(parsedUser));
        }
      } catch (e) {
        console.error('[ProfileImageUpload] Error updating localStorage:', e);
      }

      // استدعاء callback
      if (onUploadSuccess && data.avatarUrl) {
        onUploadSuccess(data.avatarUrl);
      }

      // إعادة تحميل الصفحة بعد ثانية
      setTimeout(() => {
        window.location.reload();
      }, 1000);

    } catch (error: any) {
      console.error('[ProfileImageUpload] Error:', error);
      setMessage({
        type: 'error',
        text: error.message || 'حدث خطأ أثناء رفع الصورة'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setFile(null);
    setPreview(null);
    setMessage(null);
  };

  return (
    <div className="space-y-4">
      {/* رسالة النجاح/الخطأ */}
      {message && (
        <div
          className={`p-3 rounded-lg flex items-center gap-2 ${
            message.type === 'success'
              ? 'bg-slate-100 text-emerald-50 border border-emerald-700'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* معاينة الصورة */}
      <div className="flex items-center gap-4">
        {/* الصورة الحالية أو المعاينة */}
        <div className="relative w-24 h-24 rounded-full overflow-hidden border-4 border-background shadow-lg bg-muted">
          {preview ? (
            <img
              src={preview}
              alt="Preview"
              className="w-full h-full object-cover"
            />
          ) : currentImage ? (
            <img
              src={currentImage}
              alt="Current profile"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Camera className="w-8 h-8 text-muted-foreground" />
            </div>
          )}
        </div>

        {/* أزرار التحكم */}
        <div className="flex-1 space-y-2">
          <div className="flex gap-2">
            <label className="flex-1">
              <input
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                onChange={handleFileSelect}
                disabled={loading}
                className="hidden"
              />
              <div
                className={`cursor-pointer flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  loading
                    ? 'bg-muted text-muted-foreground cursor-not-allowed'
                    : 'bg-primary text-primary-foreground hover:bg-primary/90'
                }`}
              >
                <Upload className="w-4 h-4" />
                {loading ? 'جاري الرفع...' : 'اختر صورة'}
              </div>
            </label>

            {preview && !loading && (
              <button
                onClick={handleClear}
                className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-all"
              >
                <X className="w-4 h-4" />
                مسح
              </button>
            )}
          </div>

          {file && !loading && (
            <button
              onClick={handleUpload}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-emerald-800 text-white hover:bg-emerald-700 transition-all"
            >
              <Camera className="w-4 h-4" />
              حفظ الصورة
            </button>
          )}

          <p className="text-xs text-muted-foreground">
            PNG, JPG, WebP (حد أقصى 5MB)
          </p>
        </div>
      </div>
    </div>
  );
}
