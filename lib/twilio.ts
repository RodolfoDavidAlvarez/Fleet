import twilio from 'twilio'

const accountSid = process.env.TWILIO_ACCOUNT_SID
const authToken = process.env.TWILIO_AUTH_TOKEN
const phoneNumber = process.env.TWILIO_PHONE_NUMBER

let client: twilio.Twilio | null = null

if (accountSid && authToken) {
  client = twilio(accountSid, authToken)
}

export async function sendSMS(to: string, message: string): Promise<boolean> {
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
  } catch (error) {
    console.error('Error sending SMS:', error)
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

