import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { User } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    // في الإنتاج، سنستخدم JWT أو session للتعرف على المستخدم
    // حالياً سنأخذ الإيميل من headers أو query params للتجربة
    const email = request.headers.get('x-user-email') || request.nextUrl.searchParams.get('email')

    if (!email) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    }

    const user = await db.user.findUnique({
      where: { email }
    })

    if (!user) {
      return NextResponse.json({ error: 'المستخدم غير موجود' }, { status: 404 })
    }

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        status: user.status,
      }
    })
  } catch (error: any) {
    console.error('[DEV][USER] ❌ Error fetching user:', error)
    return NextResponse.json(
      { error: error.message || 'حدث خطأ أثناء جلب بيانات المستخدم' },
      { status: 500 }
    )
  }
}
