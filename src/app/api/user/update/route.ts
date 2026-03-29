import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, name, phone, bio } = body

    console.log('[USER UPDATE] 📝 Update request:', { userId, name, phone, bio })

    // التحقق من وجود userId
    if (!userId) {
      console.error('[USER UPDATE] ❌ Missing userId')
      return NextResponse.json({ error: 'معرف المستخدم مطلوب' }, { status: 400 })
    }

    // التحقق من وجود المستخدم
    const user = await db.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      console.error('[USER UPDATE] ❌ User not found:', userId)
      return NextResponse.json({ error: 'المستخدم غير موجود' }, { status: 404 })
    }

    // تحديث البيانات
    const updatedUser = await db.user.update({
      where: { id: userId },
      data: {
        ...(name !== undefined && { name }),
        ...(phone !== undefined && { phone }),
      }
    })

    console.log('[USER UPDATE] ✅ User updated successfully:', {
      id: updatedUser.id,
      name: updatedUser.name,
      phone: updatedUser.phone
    })

    return NextResponse.json({
      success: true,
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        avatarUrl: (updatedUser as any).avatarUrl,
        role: updatedUser.role,
        createdAt: updatedUser.createdAt
      },
      message: 'تم تحديث البيانات بنجاح'
    })
  } catch (error: any) {
    console.error('[USER UPDATE] ❌ Error:', error)
    return NextResponse.json(
      { error: error.message || 'حدث خطأ أثناء تحديث البيانات' },
      { status: 500 }
    )
  }
}
