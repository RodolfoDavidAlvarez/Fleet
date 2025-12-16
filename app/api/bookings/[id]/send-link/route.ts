import { NextRequest, NextResponse } from 'next/server'
import { bookingDB } from '@/lib/db'
import { sendSMS } from '@/lib/twilio'
import { getBaseUrl } from '@/lib/url'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const booking = await bookingDB.getById(params.id)
    
    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      )
    }

    if (!booking.customerPhone) {
      return NextResponse.json(
        { error: 'Customer phone number not available' },
        { status: 400 }
      )
    }

    // Generate booking link with pre-filled data
    // NOTE: Do NOT include phone number in URL - iOS detects phone numbers and breaks the link
    const baseUrl = getBaseUrl(request)

    const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL_ENV === 'production'
    if (isProduction && baseUrl.includes('localhost')) {
      console.error('CRITICAL: No production base URL configured. Set NEXT_PUBLIC_APP_URL environment variable.')
      return NextResponse.json(
        { error: 'Booking link cannot be generated. Please contact support.' },
        { status: 500 }
      )
    } else if (!isProduction && baseUrl.includes('localhost')) {
      console.warn('Using localhost for booking link - this is only acceptable in development')
    }

    const bookingLink = `${baseUrl}/booking-link/${booking.id}?name=${encodeURIComponent(booking.customerName)}`

    // Send SMS with booking link - put URL on its own line for maximum compatibility
    const message = `Hi ${booking.customerName}! Please schedule your ${booking.serviceType} appointment:\n<${bookingLink}>\n\nClick the link to choose your preferred time slot.`
    
    try {
      const sent = await sendSMS(booking.customerPhone, message)

      if (!sent) {
        console.warn('SMS sending returned false - Twilio may be misconfigured')
        // Still return success with the link so user can manually share it
        return NextResponse.json({ 
          success: true,
          message: 'Booking link generated (SMS may not have been sent - check Twilio configuration)',
          bookingLink 
        })
      }
    } catch (smsError: any) {
      console.error('Error sending SMS (non-critical):', smsError?.message || smsError)
      // Still return success with the link so user can manually share it
      return NextResponse.json({ 
        success: true,
        message: 'Booking link generated (SMS failed - check Twilio configuration)',
        bookingLink,
        warning: 'SMS notification failed but link is available'
      })
    }

    return NextResponse.json({ 
      success: true,
      message: 'Booking link sent successfully',
      bookingLink 
    })
  } catch (error) {
    console.error('Error sending booking link:', error)
    return NextResponse.json(
      { error: 'Failed to send booking link' },
      { status: 500 }
    )
  }
}




