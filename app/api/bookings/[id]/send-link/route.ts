import { NextRequest, NextResponse } from 'next/server'
import { bookingDB } from '@/lib/db'
import { sendSMS } from '@/lib/twilio'

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
    const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const bookingLink = `${baseUrl}/booking-link/${booking.id}?name=${encodeURIComponent(booking.customerName)}&phone=${encodeURIComponent(booking.customerPhone)}`

    // Send SMS with booking link
    const message = `Hi ${booking.customerName}! Please schedule your ${booking.serviceType} appointment: ${bookingLink}\n\nClick the link to choose your preferred time slot.`
    
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





