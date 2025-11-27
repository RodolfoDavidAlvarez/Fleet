import { NextRequest, NextResponse } from 'next/server'
import { bookingDB } from '@/lib/db'
import { sendSMS } from '@/lib/twilio'
import { createServerClient } from '@/lib/supabase'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const json = await request.json()
    let booking = await bookingDB.getById(params.id)

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      )
    }

    // Mark booking as confirmed when this endpoint is hit from the self-scheduling flow
    if (booking.status !== 'confirmed') {
      const updated = await bookingDB.update(params.id, {
        status: 'confirmed',
        scheduledDate: json.scheduledDate || booking.scheduledDate,
        scheduledTime: json.scheduledTime || booking.scheduledTime,
      })
      if (updated) {
        booking = updated
      }
    }

    // Send confirmation SMS to driver
    if (booking.customerPhone) {
      const confirmationMessage = `Your appointment has been confirmed!\n\nService: ${booking.serviceType}\nDate: ${json.scheduledDate}\nTime: ${json.scheduledTime}\n\nWe'll see you then!`
      await sendSMS(booking.customerPhone, confirmationMessage)
    }

    // Notify mechanic if assigned
    if (booking.mechanicId) {
      const supabase = createServerClient()
      const { data: mechanic } = await supabase
        .from('users')
        .select('phone, name')
        .eq('id', booking.mechanicId)
        .single()

      if (mechanic?.phone) {
        const mechanicMessage = `New appointment scheduled:\n\nCustomer: ${booking.customerName}\nService: ${booking.serviceType}\nDate: ${json.scheduledDate}\nTime: ${json.scheduledTime}\n\nBooking ID: ${booking.id}`
        await sendSMS(mechanic.phone, mechanicMessage)
      }
    }

    return NextResponse.json({ 
      success: true,
      message: 'Notifications sent successfully'
    })
  } catch (error) {
    console.error('Error sending confirmations:', error)
    return NextResponse.json(
      { error: 'Failed to send notifications' },
      { status: 500 }
    )
  }
}


