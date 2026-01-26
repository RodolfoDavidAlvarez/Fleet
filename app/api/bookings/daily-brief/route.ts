import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { sendDailyBriefEmail } from '@/lib/email'
import { sendDailyBriefSMS } from '@/lib/twilio'
import { format } from 'date-fns'

/**
 * Daily Brief Cron Endpoint
 * Runs at 6 AM MST (13:00 UTC) daily
 * Sends email + SMS to admins/mechanics with today's bookings
 */
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

    // Check for test mode (for testing with Rodo's phone)
    const { searchParams } = new URL(request.url)
    const testPhone = searchParams.get('testPhone')
    const testEmail = searchParams.get('testEmail')
    const testUrl = searchParams.get('testUrl') // Local IP for testing

    const supabase = createServerClient()

    // Get today's date in MST (Arizona time - no DST)
    const now = new Date()
    // Arizona is UTC-7 year-round
    const mstOffset = -7 * 60 * 60 * 1000
    const mstNow = new Date(now.getTime() + mstOffset + now.getTimezoneOffset() * 60 * 1000)
    const todayStr = mstNow.toISOString().split('T')[0]
    const formattedDate = format(mstNow, 'EEEE, MMMM d, yyyy')

    // Skip weekends (Saturday = 6, Sunday = 0)
    const dayOfWeek = mstNow.getDay()
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return NextResponse.json({
        message: 'Skipping daily brief on weekend',
        date: todayStr,
        dayOfWeek: dayOfWeek === 0 ? 'Sunday' : 'Saturday',
        briefsSent: 0
      })
    }

    // Get bookings scheduled for today
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('id, customer_name, customer_email, customer_phone, service_type, scheduled_date, scheduled_time, vehicle_info, notes, status')
      .eq('scheduled_date', todayStr)
      .in('status', ['confirmed', 'pending'])
      .order('scheduled_time', { ascending: true })

    if (bookingsError) {
      console.error('Error fetching bookings:', bookingsError)
      return NextResponse.json(
        { error: 'Failed to fetch bookings' },
        { status: 500 }
      )
    }

    // If no bookings today, still log but don't send notifications
    if (!bookings || bookings.length === 0) {
      return NextResponse.json({
        message: 'No bookings scheduled for today',
        date: todayStr,
        briefsSent: 0
      })
    }

    // Get admins and users who should receive daily briefs
    // For now, get all admins with phone numbers
    const { data: recipients, error: recipientsError } = await supabase
      .from('users')
      .select('id, name, email, phone, role')
      .in('role', ['admin', 'mechanic'])
      .eq('approval_status', 'approved')

    if (recipientsError) {
      console.error('Error fetching recipients:', recipientsError)
      return NextResponse.json(
        { error: 'Failed to fetch recipients' },
        { status: 500 }
      )
    }

    // Format bookings for email
    const formattedBookings = bookings.map((b) => ({
      time: b.scheduled_time || 'TBD',
      vehicleInfo: b.vehicle_info || 'Vehicle TBD',
      serviceType: b.service_type || 'Service',
      customerName: b.customer_name || 'Customer',
      customerPhone: b.customer_phone || '',
      notes: b.notes || undefined,
    }))

    let briefsSent = 0
    const errors: string[] = []
    const results: Array<{ recipient: string; emailSent: boolean; smsSent: boolean }> = []

    // If in test mode, only send to test phone/email
    if (testPhone || testEmail) {
      const testName = 'Test User'

      let emailSent = false
      let smsSent = false

      if (testEmail) {
        try {
          emailSent = await sendDailyBriefEmail(testEmail, {
            recipientName: testName,
            date: formattedDate,
            bookings: formattedBookings,
          })
        } catch (err) {
          errors.push(`Email error: ${err instanceof Error ? err.message : 'Unknown'}`)
        }
      }

      if (testPhone) {
        try {
          smsSent = await sendDailyBriefSMS(testPhone, {
            name: testName,
            bookingCount: bookings.length,
            date: formattedDate,
            testUrl: testUrl || undefined,
          })
        } catch (err) {
          errors.push(`SMS error: ${err instanceof Error ? err.message : 'Unknown'}`)
        }
      }

      results.push({ recipient: testEmail || testPhone || 'Test', emailSent, smsSent })
      if (emailSent || smsSent) briefsSent++

      return NextResponse.json({
        message: 'Test daily brief sent',
        date: todayStr,
        formattedDate,
        bookingCount: bookings.length,
        briefsSent,
        results,
        errors: errors.length > 0 ? errors : undefined,
        testMode: true,
      })
    }

    // Send to all recipients
    for (const recipient of recipients || []) {
      let emailSent = false
      let smsSent = false

      // Send email
      if (recipient.email) {
        try {
          emailSent = await sendDailyBriefEmail(recipient.email, {
            recipientName: recipient.name || 'Team Member',
            date: formattedDate,
            bookings: formattedBookings,
          })
        } catch (err) {
          const errorMsg = `Email failed for ${recipient.email}: ${err instanceof Error ? err.message : 'Unknown'}`
          console.error(errorMsg)
          errors.push(errorMsg)
        }
      }

      // Send SMS
      if (recipient.phone) {
        try {
          smsSent = await sendDailyBriefSMS(recipient.phone, {
            name: recipient.name || 'Team Member',
            bookingCount: bookings.length,
            date: formattedDate,
          })
        } catch (err) {
          const errorMsg = `SMS failed for ${recipient.phone}: ${err instanceof Error ? err.message : 'Unknown'}`
          console.error(errorMsg)
          errors.push(errorMsg)
        }
      }

      results.push({
        recipient: recipient.email || recipient.phone || recipient.id,
        emailSent,
        smsSent,
      })

      if (emailSent || smsSent) briefsSent++
    }

    return NextResponse.json({
      message: 'Daily brief processing completed',
      date: todayStr,
      formattedDate,
      bookingCount: bookings.length,
      recipientCount: recipients?.length || 0,
      briefsSent,
      results,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (error) {
    console.error('Error in GET /api/bookings/daily-brief:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * Manual trigger endpoint (for testing)
 * POST /api/bookings/daily-brief
 * Body: { testPhone?: string, testEmail?: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { testPhone, testEmail, testUrl } = body

    // Redirect to GET with query params
    const url = new URL(request.url)
    if (testPhone) url.searchParams.set('testPhone', testPhone)
    if (testEmail) url.searchParams.set('testEmail', testEmail)
    if (testUrl) url.searchParams.set('testUrl', testUrl)

    // Create a new request with the modified URL
    const newRequest = new NextRequest(url, {
      method: 'GET',
      headers: request.headers,
    })

    return GET(newRequest)
  } catch (error) {
    console.error('Error in POST /api/bookings/daily-brief:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
