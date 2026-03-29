import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { db } from '@/lib/db'

// POST /api/cases/[id]/certificate - رفع شهادة
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const caseId = resolvedParams.id

    const cookieStore = await cookies()
    const userId = cookieStore.get('userId')?.value

    if (!userId) {
      return NextResponse.json({ success: false, error: 'غير مصرح' }, { status: 401 })
    }

    const user = await db.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      return NextResponse.json({ success: false, error: 'المستخدم غير موجود' }, { status: 404 })
    }

    // Get the case
    const case_ = await db.case.findUnique({
      where: { id: caseId },
      include: {
        application: true
      }
    })

    if (!case_) {
      return NextResponse.json({ success: false, error: 'الحالة غير موجودة' }, { status: 404 })
    }

    // Only patient or student can create certificate
    const isPatient = user.role === 'PATIENT' && case_.application.patientId === (user as any).patient?.id
    const isStudent = user.role === 'STUDENT' && case_.application.studentId === (user as any).student?.id

    if (!isPatient && !isStudent) {
      return NextResponse.json({ success: false, error: 'غير مصرح' }, { status: 403 })
    }

    const body = await request.json()
    const { certificateUrl, content, rating, reviewText, isPublic } = body

    if (!certificateUrl && !content) {
      return NextResponse.json({ success: false, error: 'يجب إرفع شهادة أو كتابة نص' }, { status: 400 })
    }

    // Create certificate
    const certificate = await db.patientCertificate.create({
      data: {
        caseId,
        patientId: case_.application.patientId,
        studentId: case_.application.studentId,
        certificateUrl: certificateUrl || null,
        content: content || null,
        rating: rating || null,
        reviewText: reviewText || null,
        isPublic: isPublic || false
      }
    })

    return NextResponse.json({
      success: true,
      certificate,
      message: 'تم إنشاء الشهادة بنجاح'
    })
  } catch (error: any) {
    console.error('[Certificate API] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'حدث خطأ أثناء إنشاء الشهادة' },
      { status: 500 }
    )
  }
}

// PUT /api/cases/[id]/certificate - تعديل شهادة
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const caseId = resolvedParams.id

    const cookieStore = await cookies()
    const userId = cookieStore.get('userId')?.value

    if (!userId) {
      return NextResponse.json({ success: false, error: 'غير مصرح' }, { status: 401 })
    }

    const user = await db.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      return NextResponse.json({ success: false, error: 'المستخدم غير موجود' }, { status: 404 })
    }

    // Get existing certificate
    const certificate = await db.patientCertificate.findUnique({
      where: { caseId },
      include: {
        case_: {
          include: {
            application: true
          }
        }
      }
    })

    if (!certificate) {
      return NextResponse.json({ success: false, error: 'الشهادة غير موجودة' }, { status: 404 })
    }

    // Check permissions
    const isPatient = user.role === 'PATIENT' && certificate.patientId === (user as any).patient?.id
    const isStudent = user.role === 'STUDENT' && certificate.studentId === (user as any).student?.id

    if (!isPatient && !isStudent) {
      return NextResponse.json({ success: false, error: 'غير مصرح' }, { status: 403 })
    }

    const body = await request.json()
    const { certificateUrl, content, rating, reviewText, isPublic } = body

    // Update certificate
    const updatedCertificate = await db.patientCertificate.update({
      where: { caseId },
      data: {
        ...(certificateUrl !== undefined && { certificateUrl }),
        ...(content !== undefined && { content }),
        ...(rating !== undefined && { rating }),
        ...(reviewText !== undefined && { reviewText }),
        ...(isPublic !== undefined && { isPublic })
      }
    })

    return NextResponse.json({
      success: true,
      certificate: updatedCertificate,
      message: 'تم تحديث الشهادة بنجاح'
    })
  } catch (error: any) {
    console.error('[Certificate API] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'حدث خطأ أثناء تحديث الشهادة' },
      { status: 500 }
    )
  }
}

// DELETE /api/cases/[id]/certificate - حذف شهادة
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const caseId = resolvedParams.id

    const cookieStore = await cookies()
    const userId = cookieStore.get('userId')?.value

    if (!userId) {
      return NextResponse.json({ success: false, error: 'غير مصرح' }, { status: 401 })
    }

    const user = await db.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      return NextResponse.json({ success: false, error: 'المستخدم غير موجود' }, { status: 404 })
    }

    // Get existing certificate
    const certificate = await db.patientCertificate.findUnique({
      where: { caseId }
    })

    if (!certificate) {
      return NextResponse.json({ success: false, error: 'الشهادة غير موجودة' }, { status: 404 })
    }

    // Only the patient who created it can delete
    if (user.role !== 'PATIENT' || certificate.patientId !== (user as any).patient?.id) {
      return NextResponse.json({ success: false, error: 'غير مصرح' }, { status: 403 })
    }

    // Delete certificate
    await db.patientCertificate.delete({
      where: { caseId }
    })

    return NextResponse.json({
      success: true,
      message: 'تم حذف الشهادة بنجاح'
    })
  } catch (error: any) {
    console.error('[Certificate API] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'حدث خطأ أثناء حذف الشهادة' },
      { status: 500 }
    )
  }
}
