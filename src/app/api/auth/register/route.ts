import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hashPassword } from '@/lib/password'
import { notifyAdminNewStudent } from '@/lib/notifications'

/**
 * API Route: تسجيل مستخدم جديد (مبسط)
 * Method: POST
 * Body: { email, password, name, role }
 */
export async function POST(request: NextRequest) {
  console.log('═══════════════════════════════════════')
  console.log('[REGISTER] Starting registration...')
  console.log('═══════════════════════════════════════')

  try {
    // Step 1: Parse request body
    let body
    let email, password, name, role

    try {
      body = await request.json()
      email = body.email
      password = body.password
      name = body.name
      role = body.role || 'PATIENT'
      console.log('[REGISTER] Step 1 ✅: Parsed request body')
      console.log('[REGISTER] Email:', email?.substring(0, 20) + '...')
      console.log('[REGISTER] Name:', name)
      console.log('[REGISTER] Role:', role)
    } catch (parseError: any) {
      console.error('[REGISTER] Step 1 ❌: Failed to parse request body:', parseError)
      return NextResponse.json({ error: 'فشل في قراءة البيانات' }, { status: 400 })
    }

    // Step 2: Validate required fields
    if (!email || !password || !name) {
      console.log('[REGISTER] Step 2 ❌: Missing required fields')
      return NextResponse.json({
        error: 'البريد الإلكتروني وكلمة المرور والاسم مطلوبين'
      }, { status: 400 })
    }
    console.log('[REGISTER] Step 2 ✅: Fields validated')

    // Step 3: Validate email format
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
    if (!emailRegex.test(email.trim())) {
      console.log('[REGISTER] Step 3 ❌: Invalid email format')
      return NextResponse.json({ error: 'البريد الإلكتروني غير صحيح' }, { status: 400 })
    }

    // Step 4: Validate password strength
    const passwordValidation = await import('@/lib/password').then(m => m.validatePasswordStrength(password))
    if (!passwordValidation.valid) {
      console.log('[REGISTER] Step 4 ❌: Password too weak:', passwordValidation.message)
      return NextResponse.json({ error: passwordValidation.message }, { status: 400 })
    }
    console.log('[REGISTER] Step 4 ✅: Password validated')

    // Step 5: Validate role
    const validRoles = ['PATIENT', 'STUDENT']
    if (!validRoles.includes(role)) {
      console.log('[REGISTER] Step 5 ❌: Invalid role:', role)
      return NextResponse.json({ error: 'نوع المستخدم غير صحيح' }, { status: 400 })
    }
    console.log('[REGISTER] Step 5 ✅: Role validated')

    // Step 6: Check if user already exists
    try {
      console.log('[REGISTER] Step 6: Checking if user already exists...')
      const existingUser = await db.user.findUnique({
        where: { email: email.trim().toLowerCase() }
      })

      if (existingUser) {
        console.log('[REGISTER] Step 6 ❌: Email already registered')
        return NextResponse.json({ error: 'البريد الإلكتروني مسجل مسبقاً' }, { status: 409 })
      }

      console.log('[REGISTER] Step 6 ✅: Email is available')
    } catch (dbError: any) {
      console.error('[REGISTER] Step 6 ❌: Database error:', dbError)
      return NextResponse.json(
        { error: 'خطأ في قاعدة البيانات: ' + dbError.message },
        { status: 500 }
      )
    }

    // Step 7: Hash password
    let hashedPassword
    try {
      console.log('[REGISTER] Step 7: Hashing password...')
      hashedPassword = await hashPassword(password)
      console.log('[REGISTER] Step 7 ✅: Password hashed')
    } catch (hashError: any) {
      console.error('[REGISTER] Step 7 ❌: Failed to hash password:', hashError)
      return NextResponse.json({ error: 'فشل في تشفير كلمة المرور' }, { status: 500 })
    }

    // Step 8: Create user
    let user
    try {
      console.log('[REGISTER] Step 8: Creating user...')

      const userData: any = {
        email: email.trim().toLowerCase(),
        password: hashedPassword,
        name: name.trim(),
        role,
        status: 'PENDING'
      }

      user = await db.user.create({
        data: userData,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          status: true
        }
      })

      console.log('[REGISTER] Step 8 ✅: User created')
      console.log('[REGISTER] User ID:', user.id)
      console.log('[REGISTER] User Role:', user.role)
      console.log('[REGISTER] User Status:', user.status)
    } catch (dbError: any) {
      console.error('[REGISTER] Step 8 ❌: Failed to create user:', dbError)
      console.error('[REGISTER] DB Error Details:', dbError.message)
      return NextResponse.json(
        { error: 'فشل في إنشاء المستخدم: ' + dbError.message },
        { status: 500 }
      )
    }

    // Step 9: Notify admins if it's a student registration
    if (role === 'STUDENT') {
      try {
        console.log('[REGISTER] Step 9: Notifying admins about new student...')
        await notifyAdminNewStudent(user.id, user.name, user.email)
        console.log('[REGISTER] Step 9 ✅: Admins notified')
      } catch (notifyError) {
        console.error('[REGISTER] Step 9 ⚠️: Failed to notify admins:', notifyError)
        // Don't fail the registration if notification fails
      }
    }

    // Step 10: Return success response
    console.log('[REGISTER] Step 10 ✅: Registration successful')
    console.log(`[AUTH] ✅✅✅ New user registered: ${user.name} (${user.email}) as ${user.role}`)
    console.log('═══════════════════════════════════════')

    return NextResponse.json({
      success: true,
      message: 'تم التسجيل بنجاح',
      user
    }, { status: 201 })

  } catch (error: any) {
    console.error('═══════════════════════════════════════')
    console.error('[AUTH] ❌❌❌ UNEXPECTED ERROR:')
    console.error('[AUTH] Error Message:', error.message)
    console.error('[AUTH] Error Stack:', error.stack)
    console.error('[AUTH] Error Name:', error.name)
    console.error('═══════════════════════════════════════')

    return NextResponse.json(
      {
        error: error.message || 'حدث خطأ غير متوقع أثناء التسجيل',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}
