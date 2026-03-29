import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { db } from '@/lib/db'

// POST /api/cases/[id]/photos - رفع صور قبل/بعد
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

    // Get the user and student
    const user = await db.user.findUnique({
      where: { id: userId }
    })

    if (!user || user.role !== 'STUDENT') {
      return NextResponse.json({ success: false, error: 'غير مصرح' }, { status: 403 })
    }

    const student = await db.student.findFirst({
      where: { userId }
    })

    if (!student) {
      return NextResponse.json({ success: false, error: 'السجل الطالب غير موجود' }, { status: 404 })
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

    // Verify the case belongs to this student
    if (case_.application.studentId !== student.id) {
      return NextResponse.json({ success: false, error: 'غير مصرح' }, { status: 403 })
    }

    // Parse multipart form data
    const formData = await request.formData()

    console.log('[Case Photos API] FormData entries:')
    for (const [key, value] of formData.entries()) {
      console.log(`  ${key}:`, {
        type: typeof value,
        isFile: value instanceof File,
        isBlob: value instanceof Blob,
        name: value instanceof File ? value.name : 'N/A',
        size: value instanceof File ? value.size : 'N/A',
        type: value instanceof File ? value.type : 'N/A'
      })
    }

    const beforePhoto = formData.get('beforePhoto')
    const afterPhoto = formData.get('afterPhoto')
    const description = formData.get('description') as string
    const isPublic = formData.get('isPublic') === 'true' || formData.get('isPublic') === true

    console.log('[Case Photos API] Parsed data:', {
      beforePhoto: beforePhoto ? 'exists' : 'missing',
      afterPhoto: afterPhoto ? 'exists' : 'missing',
      description,
      isPublic
    })

    // Validate files
    if (!beforePhoto || !afterPhoto) {
      return NextResponse.json({ success: false, error: 'يجب رفع صورة قبل وبعد' }, { status: 400 })
    }

    // Check if files are actual File/Blob objects (not just strings)
    console.log('[Case Photos API] Checking file types:', {
      beforePhotoType: typeof beforePhoto,
      afterPhotoType: typeof afterPhoto,
      beforePhotoConstructor: beforePhoto?.constructor?.name,
      afterPhotoConstructor: afterPhoto?.constructor?.name,
      beforePhotoInstanceOfFile: beforePhoto instanceof File,
      afterPhotoInstanceOfFile: afterPhoto instanceof File,
      beforePhotoInstanceOfBlob: beforePhoto instanceof Blob,
      afterPhotoInstanceOfBlob: afterPhoto instanceof Blob
    })

    const beforePhotoFile = beforePhoto instanceof Blob ? beforePhoto : null
    const afterPhotoFile = afterPhoto instanceof Blob ? afterPhoto : null

    if (!beforePhotoFile || !afterPhotoFile) {
      console.error('[Case Photos API] Invalid file objects:', {
        beforePhoto,
        afterPhoto
      })
      return NextResponse.json({ success: false, error: 'الملفات المرفقة غير صالحة' }, { status: 400 })
    }

    // Check if arrayBuffer is available
    console.log('[Case Photos API] Checking arrayBuffer availability:', {
      beforePhotoHasArrayBuffer: typeof (beforePhotoFile as any).arrayBuffer === 'function',
      afterPhotoHasArrayBuffer: typeof (afterPhotoFile as any).arrayBuffer === 'function'
    })

    // Convert files to base64 (simplified - in production, use cloud storage)
    console.log('[Case Photos API] Starting file conversion...')
    const beforePhotoBase64 = await fileToBase64(beforePhotoFile)
    console.log('[Case Photos API] Before photo converted successfully, length:', beforePhotoBase64.length)
    const afterPhotoBase64 = await fileToBase64(afterPhotoFile)
    console.log('[Case Photos API] After photo converted successfully, length:', afterPhotoBase64.length)

    // Create before photo
    const beforePhotoRecord = await db.casePhoto.create({
      data: {
        caseId,
        studentId: student.id,
        patientId: case_.application.patientId,
        photoType: 'BEFORE',
        photoCategory: 'PORTFOLIO',
        fileUrl: beforePhotoBase64,
        description,
        isPublic,
        consentRequired: false,
        consentGiven: true
      }
    })

    // Create after photo
    const afterPhotoRecord = await db.casePhoto.create({
      data: {
        caseId,
        studentId: student.id,
        patientId: case_.application.patientId,
        photoType: 'AFTER',
        photoCategory: 'PORTFOLIO',
        fileUrl: afterPhotoBase64,
        description,
        isPublic,
        consentRequired: false,
        consentGiven: true
      }
    })

    // Mark the case as completed after uploading photos
    await db.case.update({
      where: { id: caseId },
      data: {
        isCompleted: true,
        endDate: new Date()
      }
    })

    // Update student stats - increment completed cases
    await db.student.update({
      where: { id: student.id },
      data: {
        completedCases: {
          increment: 1
        }
      }
    })

    console.log(`[Case Photos] ✅ Case ${caseId} marked as completed`)

    return NextResponse.json({
      success: true,
      photos: [beforePhotoRecord, afterPhotoRecord],
      message: 'تم رفع الصور بنجاح واكتمال الحالة'
    })
  } catch (error: any) {
    console.error('[Case Photos API] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'حدث خطأ أثناء رفع الصور' },
      { status: 500 }
    )
  }
}

// GET /api/cases/[id]/photos - جلب صور الحالة
export async function GET(
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

    // Get the user
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

    // Check access
    const isOwner = user.role === 'STUDENT' && case_.application.studentId === (user as any).student?.id
    const isPatient = user.role === 'PATIENT' && case_.application.patientId === (user as any).patient?.id

    if (!isOwner && !isPatient) {
      // If not owner/patient, only show public photos
      const photos = await db.casePhoto.findMany({
        where: {
          caseId,
          isPublic: true
        },
        orderBy: {
          createdAt: 'asc'
        }
      })

      return NextResponse.json({
        success: true,
        photos
      })
    }

    // Owner/patient can see all photos
    const photos = await db.casePhoto.findMany({
      where: {
        caseId
      },
      orderBy: {
        createdAt: 'asc'
      }
    })

    return NextResponse.json({
      success: true,
      photos
    })
  } catch (error: any) {
    console.error('[Case Photos API] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'حدث خطأ أثناء جلب الصور' },
      { status: 500 }
    )
  }
}

// Helper function to convert file to base64
async function fileToBase64(file: File | unknown): Promise<string> {
  console.log('[fileToBase64] Starting conversion, file:', {
    type: typeof file,
    constructor: (file as any)?.constructor?.name,
    isFile: file instanceof File,
    isBlob: file instanceof Blob
  })

  // Handle File/Blob objects - try arrayBuffer first (works in Node.js)
  if (file instanceof File || file instanceof Blob) {
    const fileObj = file as any
    console.log('[fileToBase64] File/Blob detected, size:', fileObj.size, 'type:', fileObj.type)

    // First try arrayBuffer() - works in Node.js runtime
    if (typeof fileObj.arrayBuffer === 'function') {
      console.log('[fileToBase64] arrayBuffer function found, attempting to use it...')
      try {
        const bytes = await fileObj.arrayBuffer()
        console.log('[fileToBase64] arrayBuffer succeeded, bytes length:', bytes.byteLength)
        const buffer = Buffer.from(bytes)
        const base64 = buffer.toString('base64')
        console.log('[fileToBase64] Conversion successful, base64 length:', base64.length)
        return base64
      } catch (error) {
        console.error('[fileToBase64] arrayBuffer failed with error:', error)
        console.log('[fileToBase64] Trying alternative method...')
      }
    } else {
      console.log('[fileToBase64] arrayBuffer function NOT found on file object')
    }

    // If arrayBuffer failed, check if it has a filepath (from multipart form)
    if (fileObj.filepath) {
      console.log('[fileToBase64] File has filepath:', fileObj.filepath)
      try {
        const fs = await import('fs/promises')
        const buffer = await fs.readFile(fileObj.filepath)
        console.log('[fileToBase64] Successfully read file from filepath, buffer length:', buffer.length)
        const base64 = buffer.toString('base64')
        console.log('[fileToBase64] Conversion from filepath successful')
        return base64
      } catch (error) {
        console.error('[fileToBase64] Failed to read file from filepath:', error)
      }
    }

    // Fallback: Try to convert to buffer directly
    if (fileObj.size !== undefined && fileObj.type !== undefined) {
      console.log('[fileToBase64] File has size and type, trying direct conversion...')
      try {
        // For Web Standard File objects in Node.js, we need a different approach
        // Convert the File to ArrayBuffer using a workaround
        const arrayBuffer = await file.arrayBuffer()
        const base64 = Buffer.from(arrayBuffer).toString('base64')
        console.log('[fileToBase64] Direct conversion successful')
        return base64
      } catch (error) {
        console.error('[fileToBase64] Direct conversion failed:', error)
        throw new Error('Unable to convert file to base64. Please try a different image format.')
      }
    }
  }

  // Fallback for other file object types
  if (file && typeof file === 'object') {
    console.log('[fileToBase64] Generic object detected')
    const fileObj = file as any
    if (typeof fileObj.arrayBuffer === 'function') {
      try {
        const bytes = await fileObj.arrayBuffer()
        const base64 = Buffer.from(bytes).toString('base64')
        console.log('[fileToBase64] Generic object conversion successful')
        return base64
      } catch (error) {
        console.error('[fileToBase64] arrayBuffer failed for generic object:', error)
      }
    }

    if (fileObj.filepath) {
      try {
        const fs = await import('fs/promises')
        const buffer = await fs.readFile(fileObj.filepath)
        const base64 = buffer.toString('base64')
        console.log('[fileToBase64] Generic filepath conversion successful')
        return base64
      } catch (error) {
        console.error('[fileToBase64] Failed to read file from filepath:', error)
      }
    }
  }

  console.error('[fileToBase64] Invalid file object, throwing error')
  throw new Error('Invalid file object')
}
