import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { cookies } from 'next/headers'

/**
 * API Route: الحصول على بيانات الجلسة الحالية
 * Method: GET
 * Returns: بيانات المستخدم الحالي أو error 401
 */
export async function GET(request: NextRequest) {
  console.log('═══════════════════════════════════════')
  console.log('[SESSION] Fetching current session...')
  console.log('═══════════════════════════════════════')

  try {
    // Get userId from cookies
    const cookieStore = await cookies()
    const userId = cookieStore.get('userId')?.value

    if (!userId) {
      console.log('[SESSION] ❌: No userId cookie found')
      return NextResponse.json({
        error: 'غير مصرح',
        authenticated: false
      }, { status: 401 })
    }

    console.log('[SESSION] ✅: Found userId:', userId.substring(0, 10) + '...')

    // Fetch user from database
    try {
      console.log('[SESSION] Fetching user from database...')
      const user = await db.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          status: true,
          phone: true,
          avatarUrl: true,
          createdAt: true,
          student: {
            select: {
              id: true,
              verificationStatus: true,
              isVerified: true
            }
          },
          patient: {
            select: {
              id: true
            }
          }
        }
      })

      if (!user) {
        console.log('[SESSION] ❌: User not found in database')
        // Clear invalid cookie
        cookieStore.delete('userId')
        return NextResponse.json({
          error: 'المستخدم غير موجود',
          authenticated: false
        }, { status: 404 })
      }

      console.log('[SESSION] ✅: User found')
      console.log('[SESSION] User ID:', user.id)
      console.log('[SESSION] User Name:', user.name)
      console.log('[SESSION] User Role:', user.role)
      console.log('[SESSION] User Status:', user.status)

      // Check account status
      if (user.status === 'DELETED') {
        console.log('[SESSION] ❌: Account deleted')
        return NextResponse.json({
          error: 'تم حذف الحساب',
          authenticated: false,
          reason: 'ACCOUNT_DELETED'
        }, { status: 403 })
      }

      if (user.status === 'BANNED') {
        console.log('[SESSION] ❌: Account banned')
        return NextResponse.json({
          error: 'تم حظر حسابك',
          authenticated: false,
          reason: 'ACCOUNT_BANNED'
        }, { status: 403 })
      }

      if (user.status === 'SUSPENDED') {
        console.log('[SESSION] ❌: Account suspended')
        return NextResponse.json({
          error: 'تم إيقاف حسابك مؤقتاً',
          authenticated: false,
          reason: 'ACCOUNT_SUSPENDED'
        }, { status: 403 })
      }

      // Check student verification status
      if (user.role === 'STUDENT' && user.student) {
        if (user.student.verificationStatus === 'REJECTED') {
          console.log('[SESSION] ❌: Student account rejected')
          return NextResponse.json({
            error: 'تم رفض حسابك',
            authenticated: false,
            reason: 'ACCOUNT_REJECTED'
          }, { status: 403 })
        }

        if (user.student.verificationStatus === 'PENDING') {
          console.log('[SESSION] ⚠️: Student account pending')
          return NextResponse.json({
            user,
            authenticated: true,
            verificationStatus: 'PENDING',
            message: 'حسابك قيد المراجعة'
          }, { status: 200 })
        }
      }

      console.log('[SESSION] ✅: Session valid')
      console.log('═══════════════════════════════════════')

      return NextResponse.json({
        user,
        authenticated: true
      }, { status: 200 })

    } catch (dbError: any) {
      console.error('[SESSION] ❌: Database error:', dbError)
      console.error('[SESSION] DB Error Details:', dbError.message)
      return NextResponse.json(
        { error: 'خطأ في قاعدة البيانات: ' + dbError.message },
        { status: 500 }
      )
    }

  } catch (error: any) {
    console.error('═══════════════════════════════════════')
    console.error('[SESSION] ❌❌❌ UNEXPECTED ERROR:')
    console.error('[SESSION] Error Message:', error.message)
    console.error('[SESSION] Error Stack:', error.stack)
    console.error('[SESSION] Error Name:', error.name)
    console.error('═══════════════════════════════════════')

    return NextResponse.json(
      {
        error: error.message || 'حدث خطأ غير متوقع',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}
