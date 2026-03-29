import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

/**
 * API Route: تسجيل الخروج
 * Method: POST
 * Clears: userId cookie
 */
export async function POST(request: NextRequest) {
  console.log('═══════════════════════════════════════')
  console.log('[LOGOUT] Starting logout...')
  console.log('═══════════════════════════════════════')

  try {
    // Clear cookies
    const cookieStore = await cookies()
    
    // Clear userId cookie
    cookieStore.delete('userId')
    
    console.log('[LOGOUT] ✅: Cookies cleared')
    console.log(`[AUTH] ✅✅✅ User logged out`)
    console.log('═══════════════════════════════════════')

    return NextResponse.json({
      success: true,
      message: 'تم تسجيل الخروج بنجاح'
    })

  } catch (error: any) {
    console.error('═══════════════════════════════════════')
    console.error('[AUTH] ❌❌❌ LOGOUT ERROR:')
    console.error('[AUTH] Error Message:', error.message)
    console.error('[AUTH] Error Stack:', error.stack)
    console.error('═══════════════════════════════════════')

    return NextResponse.json(
      {
        error: error.message || 'حدث خطأ أثناء تسجيل الخروج',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}
