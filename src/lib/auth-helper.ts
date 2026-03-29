import { NextRequest } from 'next/server'

/**
 * دالة مساعدة للحصول على userId من عدة مصادر
 * يدعم: cookies, headers, query parameters
 */
export async function getUserIdFromRequest(request: NextRequest): Promise<string | null> {
  // Method 1: Cookies
  const cookieStore = request.cookies
  let userId = cookieStore.get('userId')?.value

  if (userId) {
    console.log('[AUTH] ✅ Got userId from cookies')
    return userId
  }

  // Method 2: Headers
  userId = request.headers.get('X-User-Id')
  if (userId) {
    console.log('[AUTH] ✅ Got userId from headers')
    return userId
  }

  // Method 3: Query Parameters
  const { searchParams } = new URL(request.url, request.url.startsWith('http') ? request.url : `http://localhost${request.url}`)
  userId = searchParams.get('userId')
  if (userId) {
    console.log('[AUTH] ✅ Got userId from query parameter')
    return userId
  }

  console.log('[AUTH] ❌ No userId found')
  return null
}

/**
 * دالة مساعدة للحصول على user من قاعدة البيانات
 */
export async function getAuthUser(request: NextRequest) {
  const userId = await getUserIdFromRequest(request)

  if (!userId) {
    return null
  }

  // Import db here to avoid circular dependency
  const { db } = await import('@/lib/db')

  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      status: true,
      avatarUrl: true
    }
  })

  return user
}
