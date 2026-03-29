import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const avatarFile = formData.get('avatar') as File | null
    const userId = formData.get('userId') as string

    if (!userId) {
      return NextResponse.json({ error: 'معرف المستخدم مطلوب' }, { status: 400 })
    }

    if (!avatarFile) {
      return NextResponse.json({ error: 'يجب اختيار صورة' }, { status: 400 })
    }

    // التحقق من نوع الملف
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(avatarFile.type)) {
      return NextResponse.json({ error: 'نوع الملف غير مدعوم. الرجاء استخدام JPG, PNG, WebP, أو GIF' }, { status: 400 })
    }

    // التحقق من حجم الملف (5MB)
    const maxSize = 5 * 1024 * 1024
    if (avatarFile.size > maxSize) {
      return NextResponse.json({ error: 'حجم الصورة يجب أن يكون أقل من 5MB' }, { status: 400 })
    }

    // التحقق من المستخدم
    const user = await db.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      return NextResponse.json({ error: 'المستخدم غير موجود' }, { status: 404 })
    }

    // إنشاء مجلد الصور إذا لم يكن موجوداً
    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'avatars')
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true })
    }

    // إنشاء اسم فريد للصورة
    const timestamp = Date.now()
    const extension = avatarFile.type.split('/')[1] === 'jpeg' ? 'jpg' : avatarFile.type.split('/')[1]
    const fileName = `${userId}_${timestamp}.${extension}`
    const filePath = join(uploadsDir, fileName)

    // تحويل الصورة إلى Buffer باستخدام FileReader لضمان التوافق
    const buffer = await fileToBuffer(avatarFile)

    // حفظ الصورة
    await writeFile(filePath, buffer)

    // حفظ رابط الصورة في قاعدة البيانات
    const avatarUrl = `/uploads/avatars/${fileName}`

    await db.user.update({
      where: { id: userId },
      data: { avatarUrl }
    })

    console.log(`[AVATAR] ✅ User ${user.email} updated avatar: ${avatarUrl}`)

    return NextResponse.json({
      success: true,
      avatarUrl,
      message: 'تم تحديث صورة البروفايل بنجاح'
    })
  } catch (error: any) {
    console.error('[AVATAR] ❌ Error updating avatar:', error)
    return NextResponse.json(
      { error: error.message || 'حدث خطأ أثناء تحديث الصورة' },
      { status: 500 }
    )
  }
}

// للحصول على بيانات المستخدم الحالية
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const email = searchParams.get('email')

    if (!email) {
      return NextResponse.json({ error: 'البريد الإلكتروني مطلوب' }, { status: 400 })
    }

    const user = await db.user.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
        role: true,
        phone: true,
        createdAt: true
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'المستخدم غير موجود' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      user
    })
  } catch (error: any) {
    console.error('[AVATAR] ❌ Error fetching user:', error)
    return NextResponse.json(
      { error: error.message || 'حدث خطأ أثناء جلب البيانات' },
      { status: 500 }
    )
  }
}

// Helper function to convert file to buffer with better compatibility
async function fileToBuffer(file: File | Blob): Promise<Buffer> {
  const fileObj = file as any

  // Try arrayBuffer first - works in Node.js runtime
  if (typeof fileObj.arrayBuffer === 'function') {
    try {
      const arrayBuffer = await fileObj.arrayBuffer()
      return Buffer.from(arrayBuffer)
    } catch (error) {
      console.error('[fileToBuffer] arrayBuffer failed:', error)
    }
  }

  // Fallback: if it has a filepath, read it directly
  if (fileObj.filepath) {
    try {
      const fs = await import('fs/promises')
      return await fs.readFile(fileObj.filepath)
    } catch (error) {
      console.error('[fileToBuffer] Failed to read from filepath:', error)
    }
  }

  // Last resort: try the standard File method
  try {
    const arrayBuffer = await file.arrayBuffer()
    return Buffer.from(arrayBuffer)
  } catch (error) {
    console.error('[fileToBuffer] All methods failed:', error)
    throw new Error('Unable to convert file to buffer')
  }
}
