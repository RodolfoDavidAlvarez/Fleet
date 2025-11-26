import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { sendBookingReminderEmail } from '@/lib/email'
import { sendBookingReminder } from '@/lib/twilio'
import { format } from 'date-fns'

// This endpoint should be called by a cron job (e.g., Vercel Cron, GitHub Actions, etc.)
// to send reminders 24 hours before appointments
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    // Optional: Protect this endpoint with a secret
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const supabase = createServerClient()

    // Get bookings scheduled for tomorrow (24 hours from now)
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const tomorrowStart = new Date(tomorrow.setHours(0, 0, 0, 0))
    const tomorrowEnd = new Date(tomorrow.setHours(23, 59, 59, 999))

    const { data: bookings, error } = await supabase
      .from('bookings')
      .select('id, customer_name, customer_email, customer_phone, service_type, scheduled_date, scheduled_time, sms_consent, status')
      .eq('status', 'confirmed')
      .gte('scheduled_date', tomorrowStart.toISOString().split('T')[0])
      .lte('scheduled_date', tomorrowEnd.toISOString().split('T')[0])

    if (error) {
      console.error('Error fetching bookings:', error)
      return NextResponse.json(
        { error: 'Failed to fetch bookings' },
        { status: 500 }
      )
    }

    if (!bookings || bookings.length === 0) {
      return NextResponse.json({
        message: 'No bookings found for tomorrow',
        remindersSent: 0
      })
    }

    let remindersSent = 0
    const errors: string[] = []

    for (const booking of bookings) {
      try {
        // Send email reminder
        if (booking.customer_email) {
          await sendBookingReminderEmail(booking.customer_email, {
            customerName: booking.customer_name,
            serviceType: booking.service_type,
            date: booking.scheduled_date,
            time: booking.scheduled_time,
            bookingId: booking.id
          })
        }

        // Send SMS reminder if consent given
        if (booking.customer_phone && booking.sms_consent) {
          await sendBookingReminder(booking.customer_phone, {
            serviceType: booking.service_type,
            date: booking.scheduled_date,
            time: booking.scheduled_time
          })
        }

        remindersSent++
      } catch (err) {
        const errorMsg = `Failed to send reminder for booking ${booking.id}: ${err instanceof Error ? err.message : 'Unknown error'}`
        console.error(errorMsg)
        errors.push(errorMsg)
      }
    }

    return NextResponse.json({
      message: 'Reminder processing completed',
      remindersSent,
      totalBookings: bookings.length,
      errors: errors.length > 0 ? errors : undefined
    })
  } catch (error) {
    console.error('Error in GET /api/bookings/reminders:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Manual trigger endpoint (for testing)
export async function POST(request: NextRequest) {
  try {
    const { bookingId } = await request.json()

    if (!bookingId) {
      return NextResponse.json(
        { error: 'Booking ID is required' },
        { status: 400 }
      )
    }

    const supabase = createServerClient()

    const { data: booking, error } = await supabase
      .from('bookings')
      .select('id, customer_name, customer_email, customer_phone, service_type, scheduled_date, scheduled_time, sms_consent, status')
      .eq('id', bookingId)
      .single()

    if (error || !booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      )
    }

    if (booking.status !== 'confirmed') {
      return NextResponse.json(
        { error: 'Booking is not confirmed' },
        { status: 400 }
      )
    }

    // Send email reminder
    let emailSent = false
    if (booking.customer_email) {
      emailSent = await sendBookingReminderEmail(booking.customer_email, {
        customerName: booking.customer_name,
        serviceType: booking.service_type,
        date: booking.scheduled_date,
        time: booking.scheduled_time,
        bookingId: booking.id
      })
    }

    // Send SMS reminder if consent given
    let smsSent = false
    if (booking.customer_phone && booking.sms_consent) {
      smsSent = await sendBookingReminder(booking.customer_phone, {
        serviceType: booking.service_type,
        date: booking.scheduled_date,
        time: booking.scheduled_time
      })
    }

    return NextResponse.json({
      message: 'Reminder sent successfully',
      emailSent,
      smsSent
    })
  } catch (error) {
    console.error('Error in POST /api/bookings/reminders:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

