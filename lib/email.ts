import { Resend } from 'resend'

const resendApiKey = process.env.RESEND_API_KEY
const fromEmail = process.env.RESEND_FROM_EMAIL || 'ralvarez@bettersystems.ai'
const emailEnabled = process.env.ENABLE_EMAIL !== 'false' // Enabled by default if API key exists

let resend: Resend | null = null

if (resendApiKey) {
  resend = new Resend(resendApiKey)
}

export async function sendEmail(
  to: string | string[],
  subject: string,
  html: string,
  text?: string
): Promise<boolean> {
  if (!emailEnabled || !resend) {
    console.info('[Email disabled] Would send to:', to, subject)
    return false
  }

  try {
    const recipients = Array.isArray(to) ? to : [to]
    
    await resend.emails.send({
      from: fromEmail,
      to: recipients,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, ''), // Strip HTML tags for text version
    })
    
    return true
  } catch (error) {
    console.error('Error sending email:', error)
    return false
  }
}

// Booking Confirmation Email
export async function sendBookingConfirmationEmail(
  email: string,
  bookingDetails: {
    customerName: string
    serviceType: string
    date: string
    time: string
    bookingId: string
    vehicleInfo?: string
    notes?: string
  }
): Promise<boolean> {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
        .content { background-color: #f9fafb; padding: 30px; border-radius: 0 0 5px 5px; }
        .info-box { background-color: white; padding: 15px; margin: 10px 0; border-left: 4px solid #2563eb; }
        .booking-id { font-size: 18px; font-weight: bold; color: #2563eb; }
        .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Booking Confirmed!</h1>
        </div>
        <div class="content">
          <p>Hello ${bookingDetails.customerName},</p>
          <p>Your service booking has been confirmed. Here are the details:</p>
          
          <div class="info-box">
            <div class="booking-id">Booking ID: ${bookingDetails.bookingId}</div>
            <p><strong>Service:</strong> ${bookingDetails.serviceType}</p>
            <p><strong>Date:</strong> ${bookingDetails.date}</p>
            <p><strong>Time:</strong> ${bookingDetails.time}</p>
            ${bookingDetails.vehicleInfo ? `<p><strong>Vehicle:</strong> ${bookingDetails.vehicleInfo}</p>` : ''}
            ${bookingDetails.notes ? `<p><strong>Notes:</strong> ${bookingDetails.notes}</p>` : ''}
          </div>
          
          <p>We look forward to serving you!</p>
          <p>If you have any questions or need to make changes, please contact us.</p>
        </div>
        <div class="footer">
          <p>Thank you for choosing FleetPro!</p>
        </div>
      </div>
    </body>
    </html>
  `

  return sendEmail(email, `Booking Confirmed - ${bookingDetails.bookingId}`, html)
}

// Booking Reminder Email
export async function sendBookingReminderEmail(
  email: string,
  bookingDetails: {
    customerName: string
    serviceType: string
    date: string
    time: string
    bookingId: string
  }
): Promise<boolean> {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #f59e0b; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
        .content { background-color: #f9fafb; padding: 30px; border-radius: 0 0 5px 5px; }
        .info-box { background-color: white; padding: 15px; margin: 10px 0; border-left: 4px solid #f59e0b; }
        .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Reminder: Upcoming Service Appointment</h1>
        </div>
        <div class="content">
          <p>Hello ${bookingDetails.customerName},</p>
          <p>This is a reminder that you have a service appointment tomorrow:</p>
          
          <div class="info-box">
            <p><strong>Service:</strong> ${bookingDetails.serviceType}</p>
            <p><strong>Date:</strong> ${bookingDetails.date}</p>
            <p><strong>Time:</strong> ${bookingDetails.time}</p>
            <p><strong>Booking ID:</strong> ${bookingDetails.bookingId}</p>
          </div>
          
          <p>We look forward to seeing you!</p>
        </div>
        <div class="footer">
          <p>Thank you for choosing FleetPro!</p>
        </div>
      </div>
    </body>
    </html>
  `

  return sendEmail(email, `Reminder: Service Appointment Tomorrow - ${bookingDetails.date}`, html)
}

// Status Update Email
export async function sendStatusUpdateEmail(
  email: string,
  details: {
    customerName: string
    bookingId: string
    status: string
    serviceType?: string
  }
): Promise<boolean> {
  const statusLabels: Record<string, string> = {
    pending: 'Pending',
    confirmed: 'Confirmed',
    in_progress: 'In Progress',
    completed: 'Completed',
    cancelled: 'Cancelled',
  }

  const statusColor: Record<string, string> = {
    pending: '#6b7280',
    confirmed: '#2563eb',
    in_progress: '#f59e0b',
    completed: '#10b981',
    cancelled: '#ef4444',
  }

  const statusLabel = statusLabels[details.status] || details.status
  const color = statusColor[details.status] || '#6b7280'

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: ${color}; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
        .content { background-color: #f9fafb; padding: 30px; border-radius: 0 0 5px 5px; }
        .info-box { background-color: white; padding: 15px; margin: 10px 0; border-left: 4px solid ${color}; }
        .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Booking Status Updated</h1>
        </div>
        <div class="content">
          <p>Hello ${details.customerName},</p>
          <p>Your booking status has been updated:</p>
          
          <div class="info-box">
            <p><strong>Booking ID:</strong> ${details.bookingId}</p>
            ${details.serviceType ? `<p><strong>Service:</strong> ${details.serviceType}</p>` : ''}
            <p><strong>New Status:</strong> ${statusLabel}</p>
          </div>
          
          <p>Check your booking for more details.</p>
        </div>
        <div class="footer">
          <p>Thank you for choosing FleetPro!</p>
        </div>
      </div>
    </body>
    </html>
  `

  return sendEmail(email, `Booking Status Updated - ${statusLabel}`, html)
}

// Job Completion Email
export async function sendJobCompletionEmail(
  email: string,
  details: {
    customerName: string
    serviceType: string
    totalCost: number
    bookingId: string
  }
): Promise<boolean> {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #10b981; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
        .content { background-color: #f9fafb; padding: 30px; border-radius: 0 0 5px 5px; }
        .info-box { background-color: white; padding: 15px; margin: 10px 0; border-left: 4px solid #10b981; }
        .cost { font-size: 24px; font-weight: bold; color: #10b981; }
        .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Service Completed!</h1>
        </div>
        <div class="content">
          <p>Hello ${details.customerName},</p>
          <p>Your service has been completed successfully. Here are the details:</p>
          
          <div class="info-box">
            <p><strong>Service:</strong> ${details.serviceType}</p>
            <p><strong>Booking ID:</strong> ${details.bookingId}</p>
            <p class="cost">Total Cost: $${details.totalCost.toFixed(2)}</p>
          </div>
          
          <p>Thank you for your business!</p>
        </div>
        <div class="footer">
          <p>Thank you for choosing FleetPro!</p>
        </div>
      </div>
    </body>
    </html>
  `

  return sendEmail(email, `Service Completed - ${details.bookingId}`, html)
}

// Repair Request Submission Email
export async function sendRepairSubmissionEmail(
  email: string,
  details: {
    driverName: string
    requestId: string
    summary: string
    urgency: string
    language?: 'en' | 'es'
  }
): Promise<boolean> {
  const isSpanish = details.language === 'es'
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
        .content { background-color: #f9fafb; padding: 30px; border-radius: 0 0 5px 5px; }
        .info-box { background-color: white; padding: 15px; margin: 10px 0; border-left: 4px solid #2563eb; }
        .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${isSpanish ? 'Solicitud de Reparación Recibida' : 'Repair Request Received'}</h1>
        </div>
        <div class="content">
          <p>${isSpanish ? `Hola ${details.driverName},` : `Hello ${details.driverName},`}</p>
          <p>${isSpanish ? 'Hemos recibido su solicitud de reparación:' : 'We have received your repair request:'}</p>
          
          <div class="info-box">
            <p><strong>${isSpanish ? 'ID de Solicitud' : 'Request ID'}:</strong> ${details.requestId}</p>
            <p><strong>${isSpanish ? 'Resumen' : 'Summary'}:</strong> ${details.summary}</p>
            <p><strong>${isSpanish ? 'Urgencia' : 'Urgency'}:</strong> ${details.urgency}</p>
          </div>
          
          <p>${isSpanish ? 'Nos pondremos en contacto con usted pronto.' : 'We will contact you soon.'}</p>
        </div>
        <div class="footer">
          <p>${isSpanish ? 'Gracias por usar FleetPro!' : 'Thank you for using FleetPro!'}</p>
        </div>
      </div>
    </body>
    </html>
  `

  const subject = isSpanish 
    ? `Solicitud de Reparación Recibida - #${details.requestId}`
    : `Repair Request Received - #${details.requestId}`

  return sendEmail(email, subject, html)
}

// Admin Notification - New Booking
export async function notifyAdminNewBooking(
  adminEmail: string,
  details: {
    bookingId: string
    customerName: string
    customerEmail?: string
    customerPhone: string
    serviceType: string
    date: string
    time: string
    vehicleInfo?: string
  }
): Promise<boolean> {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
        .content { background-color: #f9fafb; padding: 30px; border-radius: 0 0 5px 5px; }
        .info-box { background-color: white; padding: 15px; margin: 10px 0; border-left: 4px solid #2563eb; }
        .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>New Booking Received</h1>
        </div>
        <div class="content">
          <p>A new booking has been created:</p>
          
          <div class="info-box">
            <p><strong>Booking ID:</strong> ${details.bookingId}</p>
            <p><strong>Customer:</strong> ${details.customerName}</p>
            <p><strong>Email:</strong> ${details.customerEmail || 'Not provided'}</p>
            <p><strong>Phone:</strong> ${details.customerPhone}</p>
            <p><strong>Service:</strong> ${details.serviceType}</p>
            <p><strong>Date:</strong> ${details.date}</p>
            <p><strong>Time:</strong> ${details.time}</p>
            ${details.vehicleInfo ? `<p><strong>Vehicle:</strong> ${details.vehicleInfo}</p>` : ''}
          </div>
          
          <p>Please review and assign a mechanic if needed.</p>
        </div>
        <div class="footer">
          <p>FleetPro Management System</p>
        </div>
      </div>
    </body>
    </html>
  `

  return sendEmail(adminEmail, `New Booking: ${details.bookingId}`, html)
}

// Admin Notification - New Repair Request
export async function notifyAdminNewRepairRequest(
  adminEmail: string,
  details: {
    requestId: string
    driverName: string
    driverPhone?: string
    driverEmail?: string
    urgency: string
    summary: string
    vehicleIdentifier?: string
  }
): Promise<boolean> {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: ${details.urgency === 'critical' || details.urgency === 'high' ? '#ef4444' : '#f59e0b'}; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
        .content { background-color: #f9fafb; padding: 30px; border-radius: 0 0 5px 5px; }
        .info-box { background-color: white; padding: 15px; margin: 10px 0; border-left: 4px solid ${details.urgency === 'critical' || details.urgency === 'high' ? '#ef4444' : '#f59e0b'}; }
        .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>New Repair Request</h1>
        </div>
        <div class="content">
          <p>A new repair request has been submitted:</p>
          
          <div class="info-box">
            <p><strong>Request ID:</strong> ${details.requestId}</p>
            <p><strong>Driver:</strong> ${details.driverName}</p>
            ${details.driverPhone ? `<p><strong>Phone:</strong> ${details.driverPhone}</p>` : ''}
            ${details.driverEmail ? `<p><strong>Email:</strong> ${details.driverEmail}</p>` : ''}
            <p><strong>Urgency:</strong> ${details.urgency}</p>
            ${details.vehicleIdentifier ? `<p><strong>Vehicle:</strong> ${details.vehicleIdentifier}</p>` : ''}
            <p><strong>Summary:</strong> ${details.summary}</p>
          </div>
          
          <p>Please review and schedule as needed.</p>
        </div>
        <div class="footer">
          <p>FleetPro Management System</p>
        </div>
      </div>
    </body>
    </html>
  `

  const urgencyLabel = details.urgency.charAt(0).toUpperCase() + details.urgency.slice(1)
  return sendEmail(adminEmail, `[${urgencyLabel}] New Repair Request: ${details.requestId}`, html)
}

// Mechanic Assignment Email
export async function notifyMechanicAssignment(
  mechanicEmail: string,
  details: {
    mechanicName: string
    jobId: string
    bookingId: string
    customerName: string
    serviceType: string
    date: string
    time: string
    priority: string
    vehicleInfo?: string
  }
): Promise<boolean> {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
        .content { background-color: #f9fafb; padding: 30px; border-radius: 0 0 5px 5px; }
        .info-box { background-color: white; padding: 15px; margin: 10px 0; border-left: 4px solid #2563eb; }
        .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>New Job Assignment</h1>
        </div>
        <div class="content">
          <p>Hello ${details.mechanicName},</p>
          <p>You have been assigned a new job:</p>
          
          <div class="info-box">
            <p><strong>Job ID:</strong> ${details.jobId}</p>
            <p><strong>Booking ID:</strong> ${details.bookingId}</p>
            <p><strong>Customer:</strong> ${details.customerName}</p>
            <p><strong>Service:</strong> ${details.serviceType}</p>
            <p><strong>Date:</strong> ${details.date}</p>
            <p><strong>Time:</strong> ${details.time}</p>
            <p><strong>Priority:</strong> ${details.priority}</p>
            ${details.vehicleInfo ? `<p><strong>Vehicle:</strong> ${details.vehicleInfo}</p>` : ''}
          </div>
          
          <p>Please log in to your dashboard to view full details and update the job status.</p>
        </div>
        <div class="footer">
          <p>FleetPro Management System</p>
        </div>
      </div>
    </body>
    </html>
  `

  return sendEmail(mechanicEmail, `New Job Assignment - ${details.jobId}`, html)
}

// Repair Booking Link Email
export async function sendRepairBookingLinkEmail(
  email: string,
  details: {
    driverName: string
    requestId: string
    link: string
    issueSummary: string
    language?: 'en' | 'es'
    suggestedSlot?: string
  }
): Promise<boolean> {
  const isSpanish = details.language === 'es'
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
        .content { background-color: #f9fafb; padding: 30px; border-radius: 0 0 5px 5px; }
        .info-box { background-color: white; padding: 15px; margin: 10px 0; border-left: 4px solid #2563eb; }
        .button { display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 5px; margin: 10px 0; }
        .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${isSpanish ? 'Agendar Reparación' : 'Schedule Your Repair'}</h1>
        </div>
        <div class="content">
          <p>${isSpanish ? `Hola ${details.driverName},` : `Hello ${details.driverName},`}</p>
          <p>${isSpanish ? 'Por favor, agende su reparación usando el siguiente enlace:' : 'Please schedule your repair using the following link:'}</p>
          
          <div class="info-box">
            <p><strong>${isSpanish ? 'ID de Solicitud' : 'Request ID'}:</strong> ${details.requestId}</p>
            <p><strong>${isSpanish ? 'Motivo' : 'Issue'}:</strong> ${details.issueSummary}</p>
            ${details.suggestedSlot ? `<p><strong>${isSpanish ? 'Sugerencia' : 'Suggested Time'}:</strong> ${details.suggestedSlot}</p>` : ''}
          </div>
          
          <p style="text-align: center;">
            <a href="${details.link}" class="button">${isSpanish ? 'Agendar Ahora' : 'Schedule Now'}</a>
          </p>
          
          <p>${isSpanish ? 'O copie y pegue este enlace en su navegador:' : 'Or copy and paste this link into your browser:'}</p>
          <p style="word-break: break-all; color: #2563eb;">${details.link}</p>
        </div>
        <div class="footer">
          <p>${isSpanish ? 'Gracias por usar FleetPro!' : 'Thank you for using FleetPro!'}</p>
        </div>
      </div>
    </body>
    </html>
  `

  const subject = isSpanish
    ? `Agendar Reparación - #${details.requestId}`
    : `Schedule Your Repair - #${details.requestId}`

  return sendEmail(email, subject, html)
}

// Repair Completion Email
export async function sendRepairCompletionEmail(
  email: string,
  details: {
    driverName: string
    requestId: string
    summary: string
    totalCost?: number
    language?: 'en' | 'es'
  }
): Promise<boolean> {
  const isSpanish = details.language === 'es'
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #10b981; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
        .content { background-color: #f9fafb; padding: 30px; border-radius: 0 0 5px 5px; }
        .info-box { background-color: white; padding: 15px; margin: 10px 0; border-left: 4px solid #10b981; }
        .cost { font-size: 24px; font-weight: bold; color: #10b981; }
        .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${isSpanish ? 'Reparación Completada' : 'Repair Completed'}</h1>
        </div>
        <div class="content">
          <p>${isSpanish ? `Hola ${details.driverName},` : `Hello ${details.driverName},`}</p>
          <p>${isSpanish ? 'Su reparación ha sido completada:' : 'Your repair has been completed:'}</p>
          
          <div class="info-box">
            <p><strong>${isSpanish ? 'ID de Solicitud' : 'Request ID'}:</strong> ${details.requestId}</p>
            <p><strong>${isSpanish ? 'Resumen' : 'Summary'}:</strong> ${details.summary}</p>
            ${details.totalCost ? `<p class="cost">${isSpanish ? 'Total' : 'Total Cost'}: $${details.totalCost.toFixed(2)}</p>` : ''}
          </div>
          
          <p>${isSpanish ? 'Gracias por usar FleetPro!' : 'Thank you for using FleetPro!'}</p>
        </div>
        <div class="footer">
          <p>FleetPro Management System</p>
        </div>
      </div>
    </body>
    </html>
  `

  const subject = isSpanish
    ? `Reparación Completada - #${details.requestId}`
    : `Repair Completed - #${details.requestId}`

  return sendEmail(email, subject, html)
}

// Password Reset Email
export async function sendPasswordResetEmail(
  email: string,
  details: {
    userName: string
    resetLink: string
    resetToken: string
  }
): Promise<boolean> {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
        .content { background-color: #f9fafb; padding: 30px; border-radius: 0 0 5px 5px; }
        .info-box { background-color: white; padding: 15px; margin: 10px 0; border-left: 4px solid #2563eb; }
        .button { display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 5px; margin: 10px 0; }
        .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px; }
        .warning { color: #ef4444; font-size: 12px; margin-top: 10px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Password Reset Request</h1>
        </div>
        <div class="content">
          <p>Hello ${details.userName},</p>
          <p>We received a request to reset your password. Click the button below to reset it:</p>
          
          <div class="info-box">
            <p style="text-align: center;">
              <a href="${details.resetLink}" class="button">Reset Password</a>
            </p>
            <p style="text-align: center; margin-top: 15px;">
              Or copy and paste this link into your browser:<br>
              <span style="word-break: break-all; color: #2563eb; font-size: 12px;">${details.resetLink}</span>
            </p>
          </div>
          
          <p class="warning">⚠️ This link will expire in 1 hour. If you didn't request this, please ignore this email.</p>
          
          <p>If the button doesn't work, copy and paste the link above into your browser.</p>
        </div>
        <div class="footer">
          <p>FleetPro Management System</p>
          <p>If you didn't request this, you can safely ignore this email.</p>
        </div>
      </div>
    </body>
    </html>
  `

  return sendEmail(email, 'Password Reset Request - FleetPro', html)
}

// Invitation Email
export async function sendInvitationEmail(
  email: string,
  role: string
): Promise<boolean> {
  const registerLink = `${
    process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  }/register?email=${encodeURIComponent(email)}&role=${encodeURIComponent(role)}`

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; 
          line-height: 1.6; 
          color: #1f2937; 
          background-color: #ffffff;
          margin: 0;
          padding: 0;
        }
        .container { 
          max-width: 600px; 
          margin: 0 auto; 
          padding: 0;
          background-color: #ffffff;
        }
        .header { 
          background-color: #2563eb; 
          color: #ffffff; 
          padding: 30px 20px; 
          text-align: center; 
          border-radius: 8px 8px 0 0;
        }
        .header h1 {
          margin: 0;
          font-size: 28px;
          font-weight: 700;
          color: #ffffff;
          text-shadow: none;
        }
        .content { 
          background-color: #ffffff; 
          padding: 40px 30px; 
          border-radius: 0 0 8px 8px;
          border: 1px solid #e5e7eb;
          border-top: none;
        }
        .content p {
          margin: 0 0 16px 0;
          font-size: 16px;
          color: #1f2937;
          line-height: 1.6;
        }
        .content strong {
          color: #1f2937;
          font-weight: 600;
          background-color: #f3f4f6;
          padding: 2px 6px;
          border-radius: 4px;
        }
        .button { 
          display: inline-block; 
          padding: 14px 32px; 
          background-color: #2563eb; 
          color: #ffffff !important; 
          text-decoration: none; 
          border-radius: 6px; 
          margin: 20px 0;
          font-weight: 600;
          font-size: 16px;
          text-align: center;
          box-shadow: 0 2px 4px rgba(37, 99, 235, 0.2);
        }
        .button:hover {
          background-color: #1d4ed8;
        }
        .link-text {
          word-break: break-all; 
          color: #2563eb !important; 
          font-size: 14px;
          font-weight: 500;
          text-decoration: underline;
          background-color: #eff6ff;
          padding: 8px 12px;
          border-radius: 4px;
          display: inline-block;
          margin-top: 8px;
        }
        .footer { 
          text-align: center; 
          margin-top: 30px; 
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
          color: #6b7280; 
          font-size: 14px;
        }
        .footer p {
          margin: 0;
          color: #6b7280;
        }
        @media only screen and (max-width: 600px) {
          .content {
            padding: 30px 20px;
          }
          .header {
            padding: 24px 16px;
          }
          .header h1 {
            font-size: 24px;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>You've been invited!</h1>
        </div>
        <div class="content">
          <p>Hello,</p>
          <p>You have been invited to join FleetPro Management System as an <strong>${role}</strong>.</p>
          <p>After creating your account, it will remain <strong>Pending Approval</strong> until an administrator reviews and activates it.</p>
          <p>Please click the button below to create your account:</p>
          
          <p style="text-align: center;">
            <a href="${registerLink}" class="button" style="color: #ffffff !important;">Create Account</a>
          </p>
          
          <p style="text-align: center; margin-top: 20px; color: #4b5563; font-size: 14px;">
            Or copy and paste this link into your browser:<br>
            <a href="${registerLink}" class="link-text" style="color: #2563eb !important;">${registerLink}</a>
          </p>
        </div>
        <div class="footer">
          <p>FleetPro Management System</p>
        </div>
      </div>
    </body>
    </html>
  `

  return sendEmail(email, 'Invitation to join FleetPro', html)
}

// Account Approved Email
export async function sendAccountApprovedEmail(
  email: string,
  name: string,
  role: string
): Promise<boolean> {
  const loginLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/login`

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #10b981; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
        .content { background-color: #f9fafb; padding: 30px; border-radius: 0 0 5px 5px; }
        .button { display: inline-block; padding: 12px 24px; background-color: #10b981; color: white; text-decoration: none; border-radius: 5px; margin: 10px 0; }
        .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Account Approved!</h1>
        </div>
        <div class="content">
          <p>Hello ${name},</p>
          <p>Your account has been approved! You can now access the FleetPro Management System as a <strong>${role}</strong>.</p>
          
          <p style="text-align: center;">
            <a href="${loginLink}" class="button">Log In</a>
          </p>
        </div>
        <div class="footer">
          <p>FleetPro Management System</p>
        </div>
      </div>
    </body>
    </html>
  `

  return sendEmail(email, 'Account Approved - FleetPro', html)
}
