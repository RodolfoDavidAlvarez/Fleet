import { NextRequest, NextResponse } from 'next/server'
import { bookingDB } from '@/lib/db'
import { sendStatusUpdate } from '@/lib/twilio'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const booking = bookingDB.getById(params.id)
    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      )
    }
    return NextResponse.json({ booking })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch booking' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const booking = bookingDB.update(params.id, body)

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      )
    }

    // Send SMS if status changed
    if (body.status && body.status !== booking.status) {
      await sendStatusUpdate(booking.customerPhone, body.status, booking.id)
    }

    return NextResponse.json({ booking })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update booking' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const success = bookingDB.delete(params.id)
    if (!success) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      )
    }
    return NextResponse.json({ message: 'Booking deleted' })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete booking' },
      { status: 500 }
    )
  }
}

