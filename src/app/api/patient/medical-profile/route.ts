import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { cookies } from 'next/headers'

// GET - Fetch patient medical profile
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const userId = cookieStore.get('userId')?.value

    if (!userId) {
      return NextResponse.json(
        { error: 'يجب تسجيل الدخول' },
        { status: 401 }
      )
    }

    // Get user
    const user = await db.user.findUnique({
      where: { id: userId }
    })

    if (!user || user.role !== 'PATIENT') {
      return NextResponse.json(
        { error: 'غير مصرح' },
        { status: 403 }
      )
    }

    // Get patient
    const patient = await db.patient.findUnique({
      where: { userId }
    })

    if (!patient) {
      return NextResponse.json(
        { error: 'الملف غير موجود' },
        { status: 404 }
      )
    }

    // Get medical profile
    const medicalProfile = await db.patientMedicalProfile.findUnique({
      where: { patientId: patient.id }
    })

    return NextResponse.json({
      success: true,
      profile: medicalProfile
    })
  } catch (error: any) {
    console.error('[MEDICAL PROFILE] Error:', error)
    return NextResponse.json(
      { error: error.message || 'حدث خطأ أثناء جلب الملف الطبي' },
      { status: 500 }
    )
  }
}

// POST - Save patient medical profile
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const userId = cookieStore.get('userId')?.value

    if (!userId) {
      return NextResponse.json(
        { error: 'يجب تسجيل الدخول' },
        { status: 401 }
      )
    }

    // Get user
    const user = await db.user.findUnique({
      where: { id: userId }
    })

    if (!user || user.role !== 'PATIENT') {
      return NextResponse.json(
        { error: 'غير مصرح' },
        { status: 403 }
      )
    }

    // Get patient
    const patient = await db.patient.findUnique({
      where: { userId }
    })

    if (!patient) {
      return NextResponse.json(
        { error: 'الملف غير موجود' },
        { status: 404 }
      )
    }

    const body = await request.json()

    // Validate required fields
    if (!body.fullName || !body.age || !body.gender || !body.bloodType || !body.phone || !body.address) {
      return NextResponse.json(
        { error: 'جميع الحقول المطلوبة يجب ملؤها' },
        { status: 400 }
      )
    }

    // Check if medical profile exists
    const existingProfile = await db.patientMedicalProfile.findUnique({
      where: { patientId: patient.id }
    })

    let medicalProfile

    if (existingProfile) {
      // Update existing profile
      medicalProfile = await db.patientMedicalProfile.update({
        where: { patientId: patient.id },
        data: {
          fullName: body.fullName,
          age: body.age,
          gender: body.gender,
          phone: body.phone,
          address: body.address,
          bloodType: body.bloodType,
          chronicDiseases: body.chronicDiseases || '',
          currentMedications: body.currentMedications || '',
          allergies: body.allergies || '',
          dentalHistory: body.dentalHistory || '',
          additionalNotes: body.additionalNotes || ''
        }
      })
    } else {
      // Create new profile
      medicalProfile = await db.patientMedicalProfile.create({
        data: {
          patientId: patient.id,
          fullName: body.fullName,
          age: body.age,
          gender: body.gender,
          phone: body.phone,
          address: body.address,
          bloodType: body.bloodType,
          chronicDiseases: body.chronicDiseases || '',
          currentMedications: body.currentMedications || '',
          allergies: body.allergies || '',
          dentalHistory: body.dentalHistory || '',
          additionalNotes: body.additionalNotes || ''
        }
      })
    }

    console.log(`[MEDICAL PROFILE] ✅ Patient ${userId} saved medical profile`)

    return NextResponse.json({
      success: true,
      profile: medicalProfile,
      message: 'تم حفظ الملف الطبي بنجاح'
    })
  } catch (error: any) {
    console.error('[MEDICAL PROFILE] Error:', error)
    return NextResponse.json(
      { error: error.message || 'حدث خطأ أثناء حفظ الملف الطبي' },
      { status: 500 }
    )
  }
}
