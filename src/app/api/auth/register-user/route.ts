import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { UserRole } from '@prisma/client'
import { hashPassword } from '@/lib/password'

// ✅ تحديث: التسجيل مع تشفير كلمة المرور من البداية

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type')
    console.log('[REGISTRATION API] Content-Type:', contentType)

    // التحقق هل الطلب JSON أو FormData
    const isFormData = contentType?.includes('multipart/form-data')

    let name, email, password, phone, role, universityEmail, academicYear, carniehImage

    if (isFormData) {
      // للطالب: استقبال FormData
      const formData = await request.formData()

      name = formData.get('name') as string
      email = formData.get('email') as string
      password = formData.get('password') as string
      phone = formData.get('phone') as string | null
      role = formData.get('role') as string
      universityEmail = formData.get('universityEmail') as string | null
      academicYear = formData.get('academicYear') as string | null
      carniehImage = formData.get('carniehImage') as File | null
    } else {
      // للمريض: استقبال JSON
      const body = await request.json()

      name = body.name
      email = body.email
      password = body.password
      phone = body.phone || null
      role = body.role
    }

    console.log('[REGISTRATION API] Registration data:', { name, email, role, isFormData })

    if (!name || !email || !password) {
      console.error('[REGISTRATION API] Missing required fields')
      return NextResponse.json({ error: 'جميع الحقول المطلوبة يجب ملؤها' }, { status: 400 })
    }

    // التحقق من عدم وجود المستخدم مسبقاً
    const existingUser = await db.user.findUnique({
      where: { email },
      include: {
        student: true,
        patient: true,
      }
    })

    if (existingUser) {
      console.log('[REGISTRATION API] Email already registered:', email, '- Status:', existingUser.status, '- Role:', existingUser.role)

      // 🎯 تحسين رسالة الخطأ
      if (existingUser.role === 'STUDENT') {
        if (existingUser.status === 'PENDING' || (existingUser.student && existingUser.student.verificationStatus === 'PENDING')) {
          return NextResponse.json({
            error: 'هذا الإيميل مسجل بالفعل وحسابك قيد المراجعة من الإدارة. يرجى تسجيل الدخول لمعرفة حالة حسابك.'
          }, { status: 400 })
        } else if (existingUser.status === 'ACTIVE' && existingUser.student && existingUser.student.verificationStatus === 'APPROVED') {
          return NextResponse.json({
            error: 'هذا الإيميل مسجل بالفعل. يرجى تسجيل الدخول.'
          }, { status: 400 })
        }
      }

      return NextResponse.json({ error: 'البريد الإلكتروني مسجل بالفعل' }, { status: 400 })
    }

    // ✅ تشفير كلمة السر قبل الحفظ
    const hashedPassword = await hashPassword(password)
    console.log('[REGISTRATION API] Password hashed successfully')

    // تحديد حالة الحساب بناءً على النوع
    const userStatus = role === 'STUDENT' ? 'PENDING' : 'ACTIVE'

    // إنشاء المستخدم مع كلمة السر المشفرة
    const user = await db.user.create({
      data: {
        name,
        email,
        password: hashedPassword, // ✅ كلمة السر مشفرة
        phone: phone || null,
        role: role === 'STUDENT' ? UserRole.STUDENT : UserRole.PATIENT,
        status: userStatus, // 🔄 PENDING للدكاترة، ACTIVE للمرضى
        emailVerified: new Date(), // تم التحقق من الكود
      }
    })

    console.log('[REGISTRATION API] User created:', user.id, user.name, user.role)

    // إنشاء البروفايل حسب النوع
    if (role === 'STUDENT') {
      // 🔍 التحقق من وجود الإيميل الجامعي
      if (!universityEmail) {
        return NextResponse.json({ error: 'الإيميل الجامعي مطلوب للطلاب' }, { status: 400 })
      }

      // ✅ تحقق بسيط فقط: يجب أن يحتوي على @ ليكون إيميل صالح
      if (!universityEmail.includes('@')) {
        return NextResponse.json({
          error: 'الإيميل الجامعي غير صالح'
        }, { status: 400 })
      }

      // ❌ إزالة التحقق من صيغة الإيميل الجامعي المفصلة
      // التحقق الكامل سيكون من الأدمن فقط عند مراجعة الطلب

      // تحويل صورة الكارنيه إلى base64 إذا وجدت
      let idCardUrl = null
      if (carniehImage) {
        console.log('[REGISTRATION API] Converting ID card image to base64...')
        const bytes = await carniehImage.arrayBuffer()
        const buffer = Buffer.from(bytes)
        const base64 = buffer.toString('base64')
        const mimeType = carniehImage.type || 'image/jpeg'
        idCardUrl = `data:${mimeType};base64,${base64}`
        console.log('[REGISTRATION API] ID card converted, size:', idCardUrl.length)
      }

      // إنشاء بروفايل الطالب بحالة PENDING
      const student = await db.student.create({
        data: {
          userId: user.id,
          isVerified: false, // ❌ غير موافق عليه بعد
          verificationStatus: 'PENDING', // 🔄 قيد المراجعة
          universityEmail: universityEmail, // ✅ الإيميل الجامعي
          universityName: null, // يمكن استخلاصه من الإيميل لاحقاً
          academicYear: academicYear ? parseInt(academicYear) : null,
          idCardUrl: idCardUrl, // ✅ صورة الكارنيه
        }
      })
      console.log('[REGISTRATION API] Student profile created with PENDING verification')

      // 📢 إرسال إشعار لجميع الأدمن عن طلب التحقق الجديد
      const admins = await db.user.findMany({
        where: { role: 'ADMIN' }
      })

      console.log('[REGISTRATION API] Sending notifications to', admins.length, 'admins')

      for (const admin of admins) {
        await db.notification.create({
          data: {
            userId: admin.id,
            type: 'NEW_APPLICATION',
            title: '📝 طلب تحقق جديد',
            message: `قام ${user.name} بالتسجيل كطبيب/طالب وينتظر موافقتك على البيانات`,
            actionLink: '/admin/users',
            actionText: 'مراجعة الطلب',
            isRead: false
          }
        })
        console.log('[REGISTRATION API] Notification sent to admin:', admin.email)
      }
    } else {
      await db.patient.create({
        data: {
          userId: user.id,
        }
      })
      console.log('[REGISTRATION API] Patient profile created')
    }

    console.log(`[DEV][AUTH] ✅ User registered successfully: ${user.name} (${user.email}) as ${user.role}`)

    // رسالة مخصصة حسب نوع المستخدم
    const successMessage = role === 'STUDENT'
      ? '✅ تم استلام طلبك بنجاح! حسابك الآن قيد المراجعة من قبل الإدارة. سيتم تفعيل حسابك قريباً بعد الموافقة.'
      : '✅ تم إنشاء حسابك بنجاح! يمكنك الآن تسجيل الدخول.'

    return NextResponse.json({
      success: true,
      message: successMessage,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        verificationStatus: role === 'STUDENT' ? 'PENDING' : null
      }
    })
  } catch (error: any) {
    console.error('[DEV][AUTH] ❌ Registration error:', error)
    return NextResponse.json(
      { error: error.message || 'حدث خطأ أثناء إنشاء الحساب' },
      { status: 500 }
    )
  }
}
