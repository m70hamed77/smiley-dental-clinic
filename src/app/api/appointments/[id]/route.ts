import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// PUT /api/appointments/[id] - Update appointment (reschedule, cancel, attend)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { status, scheduledAt, location, notes, cancelReason } = body

    // Check if appointment exists
    const appointment = await db.appointment.findUnique({
      where: { id },
      include: { case_: true }
    })

    if (!appointment) {
      return NextResponse.json(
        { error: 'الموعد غير موجود' },
        { status: 404 }
      )
    }

    // Build update data
    const updateData: any = {
      updatedAt: new Date()
    }

    if (status) updateData.status = status
    if (scheduledAt) updateData.scheduledAt = new Date(scheduledAt)
    if (location !== undefined) updateData.location = location
    if (notes !== undefined) updateData.notes = notes

    // If cancelling, add cancel reason to notes
    if (status === 'CANCELLED' && cancelReason) {
      updateData.notes = appointment.notes
        ? `${appointment.notes}\n\nسبب الإلغاء: ${cancelReason}`
        : `سبب الإلغاء: ${cancelReason}`
    }

    // Update appointment
    const updatedAppointment = await db.appointment.update({
      where: { id },
      data: updateData,
      include: { case_: true }
    })

    // If appointment is completed or cancelled, update related case
    if (status === 'COMPLETED' || status === 'CANCELLED' || status === 'NO_SHOW') {
      await db.case.update({
        where: { id: appointment.caseId },
        data: {
          endDate: new Date(),
          isCompleted: status === 'COMPLETED',
          updatedAt: new Date()
        }
      })
    }

    return NextResponse.json({
      success: true,
      data: updatedAppointment,
      message: getStatusMessage(status)
    })
  } catch (error) {
    console.error('[API] Error updating appointment:', error)
    return NextResponse.json(
      { error: 'حدث خطأ أثناء تحديث الموعد' },
      { status: 500 }
    )
  }
}

// DELETE /api/appointments/[id] - Delete appointment
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Check if appointment exists
    const appointment = await db.appointment.findUnique({
      where: { id }
    })

    if (!appointment) {
      return NextResponse.json(
        { error: 'الموعد غير موجود' },
        { status: 404 }
      )
    }

    // Delete appointment
    await db.appointment.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: 'تم حذف الموعد بنجاح'
    })
  } catch (error) {
    console.error('[API] Error deleting appointment:', error)
    return NextResponse.json(
      { error: 'حدث خطأ أثناء حذف الموعد' },
      { status: 500 }
    )
  }
}

function getStatusMessage(status?: string): string {
  switch (status) {
    case 'CONFIRMED':
      return 'تم تأكيد الموعد بنجاح'
    case 'CANCELLED':
      return 'تم إلغاء الموعد بنجاح'
    case 'COMPLETED':
      return 'تم إكمال الموعد بنجاح'
    case 'NO_SHOW':
      return 'تم تسجيل عدم الحضور'
    case 'SCHEDULED':
      return 'تم جدولة الموعد بنجاح'
    default:
      return 'تم تحديث الموعد بنجاح'
  }
}
