import twilio from 'twilio'

const accountSid = process.env.TWILIO_ACCOUNT_SID
const authToken = process.env.TWILIO_AUTH_TOKEN
const phoneNumber = process.env.TWILIO_PHONE_NUMBER
const adminPhone = process.env.ADMIN_PHONE_NUMBER
const smsEnabled = process.env.ENABLE_SMS === 'true'

let client: twilio.Twilio | null = null

if (accountSid && authToken && smsEnabled) {
  client = twilio(accountSid, authToken)
}

export async function sendSMS(to: string, message: string): Promise<boolean> {
  if (!smsEnabled) {
    console.info('[SMS disabled] Would send to:', to, message)
    return false
  }

  if (!accountSid || !authToken) {
    console.warn('Twilio credentials missing. Please set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN environment variables.')
    return false
  }

  if (!client || !phoneNumber) {
    console.warn('Twilio not configured. SMS would be sent to:', to, message)
    return false
  }

  try {
    await client.messages.create({
      body: message,
      from: phoneNumber,
      to: to,
    })
    return true
  } catch (error: any) {
    // Handle Twilio authentication errors gracefully
    if (error?.code === 20003) {
      console.warn('Twilio authentication failed. Please verify TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN are correct.')
    } else if (error?.status === 401) {
      console.warn('Twilio authentication error. Please check TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN in your environment variables.')
    } else if (error?.code === 21211) {
      console.warn('Invalid phone number format. Please check the recipient phone number.')
    } else if (error?.code === 21608) {
      console.warn('Twilio phone number not verified or invalid. Please check TWILIO_PHONE_NUMBER.')
    } else {
      console.error('Error sending SMS:', error?.message || error)
      console.error('Error code:', error?.code)
    }
    return false
  }
}

export async function sendBookingConfirmation(
  phone: string,
  bookingDetails: {
    serviceType: string
    date: string
    time: string
    bookingId: string
  }
): Promise<boolean> {
  const message = `Your booking has been confirmed!\n\nService: ${bookingDetails.serviceType}\nDate: ${bookingDetails.date}\nTime: ${bookingDetails.time}\nBooking ID: ${bookingDetails.bookingId}\n\nThank you for choosing FleetPro!`
  return sendSMS(phone, message)
}

export async function sendBookingReminder(
  phone: string,
  bookingDetails: {
    serviceType: string
    date: string
    time: string
  }
): Promise<boolean> {
  const message = `Reminder: You have a service appointment tomorrow!\n\nService: ${bookingDetails.serviceType}\nDate: ${bookingDetails.date}\nTime: ${bookingDetails.time}\n\nSee you soon!`
  return sendSMS(phone, message)
}

export async function sendStatusUpdate(
  phone: string,
  status: string,
  bookingId: string
): Promise<boolean> {
  const message = `Your booking status has been updated!\n\nBooking ID: ${bookingId}\nStatus: ${status}\n\nCheck your booking for more details.`
  return sendSMS(phone, message)
}

export async function sendJobCompletion(
  phone: string,
  jobDetails: {
    serviceType: string
    totalCost: number
    bookingId: string
  }
): Promise<boolean> {
  const message = `Your service is complete!\n\nService: ${jobDetails.serviceType}\nTotal Cost: $${jobDetails.totalCost.toFixed(2)}\nBooking ID: ${jobDetails.bookingId}\n\nThank you for your business!`
  return sendSMS(phone, message)
}

export async function sendRepairSubmissionNotice(
  phone: string,
  details: {
    requestId: string
    summary: string
    language?: 'en' | 'es'
  }
): Promise<boolean> {
  const message =
    details.language === 'es'
      ? `Solicitud de reparación recibida (#${details.requestId}).\n${details.summary}\nResponder STOP para salir / HELP para ayuda.`
      : `Repair request received (#${details.requestId}).\n${details.summary}\nReply STOP to opt out / HELP for help.`
  return sendSMS(phone, message)
}

export async function notifyAdminOfRepair(details: {
  requestId: string
  driverName?: string
  driverPhone?: string
  urgency?: string
}, toPhone?: string) {
  const targetPhone = toPhone || adminPhone
  if (!targetPhone) {
    return false
  }
  const message = `New repair request #${details.requestId}\nDriver: ${details.driverName || 'Unknown'} (${details.driverPhone || 'n/a'})\nUrgency: ${details.urgency || 'unspecified'}.`
  return sendSMS(targetPhone, message)
}

export async function sendRepairBookingLink(
  phone: string,
  details: {
    requestId: string
    link: string
    issueSummary: string
    language?: 'en' | 'es'
    suggestedSlot?: string
  }
) {
  const message =
    details.language === 'es'
      ? `Agenda tu reparación (#${details.requestId}): ${details.link}\nMotivo: ${details.issueSummary}\n${details.suggestedSlot ? `Sugerencia: ${details.suggestedSlot}\n` : ''}Responder STOP para salir.`
      : `Book your repair (#${details.requestId}): ${details.link}\nIssue: ${details.issueSummary}\n${details.suggestedSlot ? `Suggested: ${details.suggestedSlot}\n` : ''}Reply STOP to opt out.`
  return sendSMS(phone, message)
}

export async function sendRepairCompletion(
  phone: string,
  details: { requestId: string; summary: string; totalCost?: number; language?: 'en' | 'es' }
) {
  const costLine = details.totalCost ? `\nTotal: $${details.totalCost.toFixed(2)}` : ''
  const message =
    details.language === 'es'
      ? `Reparación completada (#${details.requestId}). ${details.summary}${costLine}`
      : `Repair completed (#${details.requestId}). ${details.summary}${costLine}`
  return sendSMS(phone, message)
}

