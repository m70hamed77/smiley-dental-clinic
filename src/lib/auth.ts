import { cookies } from 'next/headers'
import { db } from '@/lib/db'

export interface CurrentUser {
  id: string
  name: string
  email: string
  role: 'PATIENT' | 'STUDENT' | 'ADMIN'
  avatarUrl?: string
  status?: string
}

/**
 * Get the current authenticated user from userId cookie
 * This is a server-side function that should be called in Server Components
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  try {
    const cookieStore = await cookies()
    const userId = cookieStore.get('userId')?.value

    if (!userId) {
      return null
    }

    // Find user by userId from cookie
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatarUrl: true,
        status: true,
      },
    })

    if (!user) {
      return null
    }

    return {
      id: user.id,
      name: user.name || '',
      email: user.email,
      role: user.role as 'PATIENT' | 'STUDENT' | 'ADMIN',
      avatarUrl: user.avatarUrl || undefined,
      status: user.status || undefined,
    }
  } catch (error) {
    console.error('Error getting current user:', error)
    return null
  }
}

/**
 * Check if the current user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const user = await getCurrentUser()
  return user !== null
}

/**
 * Require authentication - returns user or throws error
 */
export async function requireAuth(): Promise<CurrentUser> {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error('Unauthorized')
  }
  return user
}
