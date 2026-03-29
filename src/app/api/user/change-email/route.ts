import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { createHash } from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, newEmail, currentPassword } = body

    console.log('[EMAIL CHANGE] 📧 Change request:', { userId, newEmail, hasPassword: !!currentPassword })

    // التحقق من وجود البيانات
    if (!userId || !newEmail || !currentPassword) {
      console.error('[EMAIL CHANGE] ❌ Missing required fields')
      return NextResponse.json({ error: 'جميع الحقول مطلوبة' }, { status: 400 })
    }

    // التحقق من صيغة الإيميل
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(newEmail)) {
      console.error('[EMAIL CHANGE] ❌ Invalid email format')
      return NextResponse.json({ error: 'صيغة البريد الإلكتروني غير صحيحة' }, { status: 400 })
    }

    // البحث عن المستخدم
    const user = await db.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      console.error('[EMAIL CHANGE] ❌ User not found:', userId)
      return NextResponse.json({ error: 'المستخدم غير موجود' }, { status: 404 })
    }

    // التحقق من كلمة المرور الحالية
    const currentPasswordHash = createHash('sha256').update(currentPassword).digest('hex')
    if (user.password !== currentPasswordHash && user.password !== currentPassword) {
      console.error('[EMAIL CHANGE] ❌ Current password incorrect')
      return NextResponse.json({ error: 'كلمة المرور الحالية غير صحيحة' }, { status: 401 })
    }

    // التحقق من أن الإيميل الجديد غير مستخدم
    const existingUser = await db.user.findUnique({
      where: { email: newEmail }
    })

    if (existingUser && existingUser.id !== user.id) {
      console.error('[EMAIL CHANGE] ❌ Email already in use')
      return NextResponse.json({ error: 'البريد الإلكتروني مستخدم بالفعل' }, { status: 400 })
    }

    // تحديث الإيميل في قاعدة البيانات
    const updatedUser = await db.user.update({
      where: { id: userId },
      data: { email: newEmail }
    })

    console.log('[EMAIL CHANGE] ✅ Email updated successfully:', user.email, '→', newEmail)

    return NextResponse.json({
      success: true,
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        role: updatedUser.role,
        avatarUrl: (updatedUser as any).avatarUrl,
        createdAt: updatedUser.createdAt
      },
      message: 'تم تغيير البريد الإلكتروني بنجاح - يرجى تسجيل الدخول مرة أخرى'
    })
  } catch (error: any) {
    console.error('[EMAIL CHANGE] ❌ Error:', error)
    return NextResponse.json(
      { error: error.message || 'حدث خطأ أثناء تغيير البريد الإلكتروني' },
      { status: 500 }
    )
  }
}
