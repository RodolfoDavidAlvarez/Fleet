import { NextRequest, NextResponse } from 'next/server'
import { sendSMS } from '@/lib/twilio'
import { requireStaff, checkRateLimit } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    // Require staff (admin or mechanic) authentication
    const authResult = await requireStaff();
    if (authResult.error) {
      return authResult.error;
    }

    // Rate limit SMS sending: 10 per minute per user
    const rateLimitResult = checkRateLimit(`sms:${authResult.user.id}`, 10, 60000);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Too many SMS requests. Please wait before sending more.' },
        { status: 429 }
      );
    }

    const body = await request.json()
    const { to, message } = body

    if (!to || !message) {
      return NextResponse.json(
        { error: 'Missing required fields: to and message' },
        { status: 400 }
      )
    }

    // Validate phone number format (basic E.164 check)
    const phoneRegex = /^\+?[1-9]\d{6,14}$/;
    const cleanPhone = to.replace(/[\s\-\(\)]/g, '');
    if (!phoneRegex.test(cleanPhone)) {
      return NextResponse.json(
        { error: 'Invalid phone number format' },
        { status: 400 }
      )
    }

    const success = await sendSMS(to, message)

    if (success) {
      return NextResponse.json({ message: 'SMS sent successfully' })
    } else {
      return NextResponse.json(
        { error: 'Failed to send SMS' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('SMS send error:', error);
    return NextResponse.json(
      { error: 'Failed to send SMS' },
      { status: 500 }
    )
  }
}







