import { NextRequest, NextResponse } from 'next/server'
import { jobDB } from '@/lib/db'
import { sendJobCompletion } from '@/lib/twilio'
import { bookingDB } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const job = jobDB.getById(params.id)
    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      )
    }
    return NextResponse.json({ job })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch job' },
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
    const job = jobDB.update(params.id, body)

    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      )
    }

    // Send SMS if job is completed
    if (body.status === 'completed' && job.totalCost) {
      const booking = bookingDB.getById(job.bookingId)
      if (booking) {
        await sendJobCompletion(booking.customerPhone, {
          serviceType: booking.serviceType,
          totalCost: job.totalCost,
          bookingId: booking.id,
        })
      }
    }

    return NextResponse.json({ job })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update job' },
      { status: 500 }
    )
  }
}

