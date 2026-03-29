import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserIdFromRequest } from '@/lib/auth-helper'

export async function GET(request: NextRequest) {
  try {
    console.log('[AUTH ME] ===== AUTH CHECK START =====')

    // ✅ Get userId from multiple sources (cookies, headers, query params)
    const userId = await getUserIdFromRequest(request)

    if (!userId) {
      console.log('[AUTH ME] ❌ No user ID found')
      return NextResponse.json(
        { error: 'غير مصرح' },
        { status: 401 }
      )
    }

    console.log('[AUTH ME] ✅ Found userId:', userId)

    // Step 2: Query user - try minimal select first
    try {
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

      console.log('[AUTH ME] DB query result:', {
        found: !!user,
        id: user?.id,
        email: user?.email,
        name: user?.name,
        avatarUrl: user?.avatarUrl,
        role: user?.role,
        status: user?.status
      })

      if (!user) {
        console.log('[AUTH ME] ❌ User not found in DB')
        return NextResponse.json(
          { error: 'المستخدم غير موجود' },
          { status: 404 }
        )
      }

      // Get additional IDs based on role
      let patientId: string | null = null
      let studentId: string | null = null

      if (user.role === 'PATIENT') {
        const patient = await db.patient.findUnique({
          where: { userId: user.id },
          select: { id: true }
        })
        patientId = patient?.id ?? null
      } else if (user.role === 'STUDENT') {
        const student = await db.student.findUnique({
          where: { userId: user.id },
          select: { id: true }
        })
        studentId = student?.id ?? null
      }

      console.log('[AUTH ME] ✅ User authenticated:', user.name, `(${user.role}, ${user.status})`)
      console.log('[AUTH ME] Extra IDs:', { patientId, studentId })

      return NextResponse.json({
        success: true,
        user: {
          ...user,
          patientId,
          studentId
        }
      })

    } catch (dbError) {
      console.error('[AUTH ME] ❌ Database error:', dbError)
      throw dbError // Re-throw to outer catch
    }

  } catch (error: any) {
    console.error('[AUTH ME] ❌ FATAL ERROR:', error)
    console.error('[AUTH ME] Error name:', error.name)
    console.error('[AUTH ME] Error message:', error.message)
    console.error('[AUTH ME] Error stack:', error.stack)

    return NextResponse.json(
      { error: error.message || 'حدث خطأ' },
      { status: 500 }
    )
  }
}
