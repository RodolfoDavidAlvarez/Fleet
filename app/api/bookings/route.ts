import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { bookingDB } from '@/lib/db'
import { sendBookingConfirmation } from '@/lib/twilio'

const bookingSchema = z.object({
  customerName: z.string().min(1, 'customerName is required'),
  customerEmail: z.string().email('customerEmail must be a valid email'),
  customerPhone: z.string().min(6, 'customerPhone is required'),
  serviceType: z.string().min(1, 'serviceType is required'),
  scheduledDate: z.string().min(1, 'scheduledDate is required'),
  scheduledTime: z.string().min(1, 'scheduledTime is required'),
  notes: z.string().optional(),
  vehicleId: z.string().optional(),
})

export async function GET() {
  try {
    const bookings = await bookingDB.getAll()
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
    const json = await request.json()
    const parsed = bookingSchema.safeParse(json)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const booking = await bookingDB.create({
      ...parsed.data,
      status: 'pending',
    })

    // Send SMS confirmation
    await sendBookingConfirmation(parsed.data.customerPhone, {
      serviceType: parsed.data.serviceType,
      date: parsed.data.scheduledDate,
      time: parsed.data.scheduledTime,
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
