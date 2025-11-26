import { NextRequest, NextResponse } from 'next/server'
import { bookingDB } from '@/lib/db'
import { sendBookingConfirmation } from '@/lib/twilio'

export async function GET() {
  try {
    const bookings = bookingDB.getAll()
    return NextResponse.json({ bookings })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch bookings' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { customerName, customerEmail, customerPhone, serviceType, scheduledDate, scheduledTime, notes } = body

    if (!customerName || !customerEmail || !customerPhone || !serviceType || !scheduledDate || !scheduledTime) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const booking = bookingDB.create({
      customerName,
      customerEmail,
      customerPhone,
      serviceType,
      scheduledDate,
      scheduledTime,
      status: 'pending',
      notes: notes || '',
    })

    // Send SMS confirmation
    await sendBookingConfirmation(customerPhone, {
      serviceType,
      date: scheduledDate,
      time: scheduledTime,
      bookingId: booking.id,
    })

    return NextResponse.json({ booking }, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create booking' },
      { status: 500 }
    )
  }
}

