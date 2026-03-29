import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/appointments/stats - Get appointment statistics for a user
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'معرف المستخدم مطلوب' },
        { status: 400 }
      )
    }

    // Get the user's patient ID
    const user = await db.user.findUnique({
      where: { id: userId },
      include: { patient: true }
    })

    if (!user || !user.patient) {
      return NextResponse.json(
        { error: 'المستخدم غير موجود أو ليس مريضاً' },
        { status: 404 }
      )
    }

    // Get all applications for this patient
    const applications = await db.application.findMany({
      where: { patientId: user.patient.id },
      include: {
        case_: {
          include: { appointment: true }
        }
      }
    })

    // Get today's date
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1)
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1)

    // Initialize counters
    let totalUpcoming = 0
    let todayCount = 0
    let completedThisMonth = 0

    // Calculate statistics
    for (const app of applications) {
      const appointment = app.case_?.appointment
      if (!appointment) continue

      const appointmentDate = new Date(appointment.scheduledAt)
      appointmentDate.setHours(0, 0, 0, 0)

      // Count upcoming appointments (excluding cancelled and no-show)
      if (
        appointment.status !== 'CANCELLED' &&
        appointment.status !== 'NO_SHOW' &&
        appointment.status !== 'COMPLETED' &&
        appointmentDate >= today
      ) {
        totalUpcoming++
      }

      // Count today's appointments
      if (
        appointmentDate.getTime() === today.getTime() &&
        appointment.status !== 'CANCELLED' &&
        appointment.status !== 'NO_SHOW' &&
        appointment.status !== 'COMPLETED'
      ) {
        todayCount++
      }

      // Count completed this month
      if (
        appointment.status === 'COMPLETED' &&
        appointmentDate >= thisMonth &&
        appointmentDate < nextMonth
      ) {
        completedThisMonth++
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        totalUpcoming,
        todayCount,
        completedThisMonth
      }
    })
  } catch (error) {
    console.error('[API] Error fetching appointment stats:', error)
    return NextResponse.json(
      { error: 'حدث خطأ أثناء جلب الإحصائيات' },
      { status: 500 }
    )
  }
}
