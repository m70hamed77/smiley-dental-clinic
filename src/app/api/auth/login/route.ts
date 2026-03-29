import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { comparePassword } from '@/lib/password'
import { cookies } from 'next/headers'

// ✅ تم التحديث: يدعم bcrypt والمقارنة المباشرة مع logs تفصيلية

export async function POST(request: NextRequest) {
  console.log('═══════════════════════════════════════')
  console.log('[LOGIN] Starting login request...')
  console.log('[LOGIN] DATABASE_URL type:', process.env.DATABASE_URL?.startsWith('postgresql://') ? 'PostgreSQL' : 'Other: ' + process.env.DATABASE_URL?.substring(0, 50))
  console.log('═══════════════════════════════════════')

  try {
    // Step 1: Parse request body
    let body
    let email, password

    try {
      body = await request.json()
      email = body.email?.trim().toLowerCase()  // ✅ trim وتحويل لصغير
      password = body.password?.trim()  // ✅ trim فقط (بدون تحويل)
      console.log('[LOGIN] Step 1 ✅: Parsed request body')
      console.log('[LOGIN] Email:', email?.substring(0, 20) + '...')
      console.log('[LOGIN] Password length:', password?.length || 0)
      console.log('[LOGIN] Password preview:', password ? password.substring(0, 3) + '***' : 'empty')
    } catch (parseError: any) {
      console.error('[LOGIN] Step 1 ❌: Failed to parse request body:', parseError)
      return NextResponse.json({ error: 'فشل في قراءة البيانات' }, { status: 400 })
    }

    // Step 2: Validate credentials
    if (!email || !password) {
      console.log('[LOGIN] Step 2 ❌: Missing credentials')
      return NextResponse.json({ error: 'البريد الإلكتروني وكلمة المرور مطلوبان' }, { status: 400 })
    }
    console.log('[LOGIN] Step 2 ✅: Credentials validated')

    // Step 3: Find user in database
    let user
    try {
      console.log('[LOGIN] Step 3: Searching for user in database...')
      user = await db.user.findUnique({
        where: { email },
        include: {
          student: true,
          patient: true,
        }
      })

      if (!user) {
        console.log('[LOGIN] Step 3 ❌: User not found')
        return NextResponse.json({ error: 'البريد الإلكتروني أو كلمة المرور غير صحيح' }, { status: 401 })
      }

      console.log('[LOGIN] Step 3 ✅: User found')
      console.log('[LOGIN] User ID:', user.id)
      console.log('[LOGIN] User Name:', user.name)
      console.log('[LOGIN] User Role:', user.role)
      console.log('[LOGIN] User Status:', user.status)
    } catch (dbError: any) {
      console.error('[LOGIN] Step 3 ❌: Database error:', dbError)
      console.error('[LOGIN] DB Error Details:', dbError.message)
      return NextResponse.json(
        { error: 'خطأ في قاعدة البيانات: ' + dbError.message },
        { status: 500 }
      )
    }

    // Step 4: Verify password
    let isPasswordValid = false
    try {
      console.log('[LOGIN] Step 4: Verifying password...')
      console.log('[LOGIN] Input password length:', password.length)
      console.log('[LOGIN] Input password preview:', password ? password.substring(0, 3) + '***' : 'empty')
      console.log('[LOGIN] Stored password (first 50):', user.password.substring(0, 50))
      
      isPasswordValid = await comparePassword(password, user.password)
      console.log('[LOGIN] Step 4 ✅: Password verified')
      console.log('[LOGIN] Password is valid:', isPasswordValid)
    } catch (bcryptError: any) {
      console.log('[LOGIN] Step 4 ⚠️: Bcrypt failed, trying direct comparison')
      console.log('[LOGIN] Bcrypt Error:', bcryptError.message)
      isPasswordValid = user.password === password
      console.log('[LOGIN] Direct comparison result:', isPasswordValid)
    }

    if (!isPasswordValid) {
      console.log('[LOGIN] Step 4 ❌: Invalid password')
      console.log('[LOGIN] Password comparison failed')
      return NextResponse.json({ error: 'البريد الإلكتروني أو كلمة المرور غير صحيح' }, { status: 401 })
    }
    console.log('[LOGIN] Step 4 ✅: Password is valid')

    // Step 5: Check account status
    console.log('[LOGIN] Step 5: Checking account status...')

    if (user.status === 'DELETED') {
      console.log('[LOGIN] Step 5 ❌: Account deleted')
      return NextResponse.json({
        success: false,
        reason: 'ACCOUNT_DELETED',
        message: `تم حذف حسابك. السبب: ${user.deleteReason || 'لم يتم تحديد سبب الحذف'}`
      }, { status: 200 })
    }

    if (user.status === 'BANNED') {
      console.log('[LOGIN] Step 5 ❌: Account banned')
      return NextResponse.json({
        success: false,
        reason: 'ACCOUNT_BANNED',
        message: 'تم حظر حسابك نهائياً. يرجى التواصل مع الدعم'
      }, { status: 200 })
    }

    if (user.status === 'SUSPENDED') {
      console.log('[LOGIN] Step 5 ❌: Account suspended')
      return NextResponse.json({
        success: false,
        reason: 'ACCOUNT_SUSPENDED',
        message: 'تم إيقاف حسابك مؤقتاً. يرجى التواصل مع الدعم'
      }, { status: 200 })
    }

    // Step 6: Check role-specific requirements
    console.log('[LOGIN] Step 6: Checking role requirements...')

    if (user.role === 'STUDENT') {
      console.log('[LOGIN] User is a STUDENT, checking profile...')
      if (!user.student) {
        console.log('[LOGIN] Step 6 ❌: Student profile not found')
        return NextResponse.json({
          success: false,
          reason: 'PROFILE_NOT_FOUND',
          message: 'لم يتم العثور على ملف الطالب. يرجى التواصل مع الدعم'
        }, { status: 200 })
      }

      console.log('[LOGIN] Student verification status:', user.student.verificationStatus)

      if (user.student.verificationStatus === 'REJECTED') {
        console.log('[LOGIN] Step 6 ❌: Student account rejected')
        return NextResponse.json({
          success: false,
          reason: 'ACCOUNT_REJECTED',
          message: `تم رفض حسابك. السبب: ${user.student.rejectionReason || 'لم يتم تحديد سبب الرفض'}`
        }, { status: 200 })
      }

      if (user.student.verificationStatus === 'PENDING' || user.status !== 'ACTIVE') {
        console.log('[LOGIN] Step 6 ❌: Student account pending')
        return NextResponse.json({
          success: false,
          reason: 'PENDING_VERIFICATION',
          message: 'حسابك قيد المراجعة. سيتم تفعيل حسابك قريباً بعد موافقة الإدارة.'
        }, { status: 200 })
      }

      if (user.student.verificationStatus !== 'APPROVED') {
        console.log('[LOGIN] Step 6 ❌: Student not approved')
        return NextResponse.json({
          success: false,
          reason: 'VERIFICATION_PENDING',
          message: 'حسابك قيد المراجعة. سيتم تفعيل حسابك قريباً بعد موافقة الإدارة.'
        }, { status: 200 })
      }
      console.log('[LOGIN] Step 6 ✅: Student is approved')
    } else {
      console.log('[LOGIN] User is NOT a STUDENT, checking status...')
      if (user.status !== 'ACTIVE') {
        console.log('[LOGIN] Step 6 ❌: Account is not active')
        return NextResponse.json({
          success: false,
          reason: 'ACCOUNT_INACTIVE',
          message: 'حسابك غير نشط. يرجى التواصل مع الدعم'
        }, { status: 200 })
      }
      console.log('[LOGIN] Step 6 ✅: Account is active')
    }

    // Step 7: Set cookies
    try {
      console.log('[LOGIN] Step 7: Setting cookies...')
      const cookieStore = await cookies()

      // تعيين الكوكيز بشكل صحيح
      cookieStore.set('userId', user.id, {
        httpOnly: false, // ✅ السماح بالقراءة من client-side
        secure: false, // ✅ تعطيل في التطوير المحلي
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // أسبوع واحد
        path: '/', // ✅ مسار الجذر
        // domain: undefined // ✅ السماح بالدليل الافتراضي
      })

      console.log('[LOGIN] Step 7 ✅: Cookies set successfully, userId:', user.id)
    } catch (cookieError: any) {
      console.error('[LOGIN] Step 7 ❌: Failed to set cookies:', cookieError)
      return NextResponse.json(
        { error: 'فشل في تعيين الكوكيز: ' + cookieError.message },
        { status: 500 }
      )
    }

    // Step 8: Create token
    try {
      console.log('[LOGIN] Step 8: Creating token...')
      const token = Buffer.from(JSON.stringify({
        userId: user.id,
        email: user.email,
        role: user.role
      })).toString('base64')
      console.log('[LOGIN] Step 8 ✅: Token created successfully')
    } catch (tokenError: any) {
      console.error('[LOGIN] Step 8 ❌: Failed to create token:', tokenError)
      return NextResponse.json(
        { error: 'فشل في إنشاء التوكن: ' + tokenError.message },
        { status: 500 }
      )
    }

    // Step 9: Return success response
    console.log('[LOGIN] Step 9 ✅: Preparing success response...')
    console.log(`[AUTH] ✅✅✅ User logged in: ${user.name} (${user.email}) as ${user.role}`)
    console.log('═══════════════════════════════════════')

    const token = Buffer.from(JSON.stringify({
      userId: user.id,
      email: user.email,
      role: user.role
    })).toString('base64')

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        phone: user.phone,
        avatarUrl: user.avatarUrl,
        createdAt: user.createdAt,
      },
      token: token,
    })

  } catch (error: any) {
    console.error('═══════════════════════════════════════')
    console.error('[AUTH] ❌❌❌ UNEXPECTED ERROR:')
    console.error('[AUTH] Error Message:', error.message)
    console.error('[AUTH] Error Stack:', error.stack)
    console.error('[AUTH] Error Name:', error.name)
    console.error('═══════════════════════════════════════')

    return NextResponse.json(
      { 
        error: error.message || 'حدث خطأ غير متوقع أثناء تسجيل الدخول',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}
