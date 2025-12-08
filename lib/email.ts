import { Resend } from "resend";

const resendApiKey = process.env.RESEND_API_KEY;
const fromEmail = process.env.RESEND_FROM_EMAIL || "ralvarez@bettersystems.ai";
const fromName = process.env.RESEND_FROM_NAME || "AgaveFleet";
const emailEnabled = process.env.ENABLE_EMAIL !== "false"; // Enabled by default if API key exists

let resend: Resend | null = null;

if (resendApiKey) {
  resend = new Resend(resendApiKey);
}

export async function sendEmail(to: string | string[], subject: string, html: string, text?: string): Promise<boolean> {
  if (!emailEnabled || !resend) {
    console.info("[Email disabled] Would send to:", to, subject);
    return false;
  }

  try {
    const recipients = Array.isArray(to) ? to : [to];

    await resend.emails.send({
      from: `${fromName} <${fromEmail}>`,
      to: recipients,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, ""), // Strip HTML tags for text version
    });

    return true;
  } catch (error) {
    console.error("Error sending email:", error);
    return false;
  }
}

// Booking Confirmation Email
export async function sendBookingConfirmationEmail(
  email: string,
  bookingDetails: {
    customerName: string;
    serviceType: string;
    date: string;
    time: string;
    bookingId: string;
    vehicleInfo?: string;
    notes?: string;
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
            ${bookingDetails.vehicleInfo ? `<p><strong>Vehicle:</strong> ${bookingDetails.vehicleInfo}</p>` : ""}
            ${bookingDetails.notes ? `<p><strong>Notes:</strong> ${bookingDetails.notes}</p>` : ""}
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
  `;

  return sendEmail(email, `Booking Confirmed - ${bookingDetails.bookingId}`, html);
}

// Booking Reminder Email
export async function sendBookingReminderEmail(
  email: string,
  bookingDetails: {
    customerName: string;
    serviceType: string;
    date: string;
    time: string;
    bookingId: string;
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
  `;

  return sendEmail(email, `Reminder: Service Appointment Tomorrow - ${bookingDetails.date}`, html);
}

// Status Update Email
export async function sendStatusUpdateEmail(
  email: string,
  details: {
    customerName: string;
    bookingId: string;
    status: string;
    serviceType?: string;
  }
): Promise<boolean> {
  const statusLabels: Record<string, string> = {
    pending: "Pending",
    confirmed: "Confirmed",
    in_progress: "In Progress",
    completed: "Completed",
    cancelled: "Cancelled",
  };

  const statusColor: Record<string, string> = {
    pending: "#6b7280",
    confirmed: "#2563eb",
    in_progress: "#f59e0b",
    completed: "#10b981",
    cancelled: "#ef4444",
  };

  const statusLabel = statusLabels[details.status] || details.status;
  const color = statusColor[details.status] || "#6b7280";

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
            ${details.serviceType ? `<p><strong>Service:</strong> ${details.serviceType}</p>` : ""}
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
  `;

  return sendEmail(email, `Booking Status Updated - ${statusLabel}`, html);
}

// Job Completion Email
export async function sendJobCompletionEmail(
  email: string,
  details: {
    customerName: string;
    serviceType: string;
    totalCost: number;
    bookingId: string;
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
  `;

  return sendEmail(email, `Service Completed - ${details.bookingId}`, html);
}

// Repair Request Submission Email
export async function sendRepairSubmissionEmail(
  email: string,
  details: {
    driverName: string;
    requestId: string;
    requestNumber?: number;
    summary: string;
    urgency: string;
    language?: "en" | "es";
  }
): Promise<boolean> {
  const isSpanish = details.language === "es";

  // Use requestNumber if available (shorter), otherwise fall back to last 8 chars of UUID
  const displayId = details.requestNumber ? `#${details.requestNumber}` : `#${details.requestId.slice(-8)}`;

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
          <h1>${isSpanish ? "Solicitud de Reparación Recibida" : "Repair Request Received"}</h1>
        </div>
        <div class="content">
          <p>${isSpanish ? `Hola ${details.driverName},` : `Hello ${details.driverName},`}</p>
          <p>${isSpanish ? "Hemos recibido su solicitud de reparación:" : "We have received your repair request:"}</p>
          
          <div class="info-box">
            <p><strong>${isSpanish ? "ID de Solicitud" : "Request ID"}:</strong> ${displayId}</p>
            <p><strong>${isSpanish ? "Resumen" : "Summary"}:</strong> ${details.summary}</p>
            <p><strong>${isSpanish ? "Urgencia" : "Urgency"}:</strong> ${details.urgency}</p>
          </div>
          
          <p>${isSpanish ? "Nos pondremos en contacto con usted pronto." : "We will contact you soon."}</p>
        </div>
        <div class="footer">
          <p>${isSpanish ? "Gracias por usar FleetPro!" : "Thank you for using FleetPro!"}</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const subject = isSpanish ? `Solicitud de Reparación Recibida - ${displayId}` : `Repair Request Received - ${displayId}`;

  return sendEmail(email, subject, html);
}

// Admin Notification - New Booking
export async function notifyAdminNewBooking(
  adminEmail: string,
  details: {
    bookingId: string;
    customerName: string;
    customerEmail?: string;
    customerPhone: string;
    serviceType: string;
    date: string;
    time: string;
    vehicleInfo?: string;
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
            <p><strong>Email:</strong> ${details.customerEmail || "Not provided"}</p>
            <p><strong>Phone:</strong> ${details.customerPhone}</p>
            <p><strong>Service:</strong> ${details.serviceType}</p>
            <p><strong>Date:</strong> ${details.date}</p>
            <p><strong>Time:</strong> ${details.time}</p>
            ${details.vehicleInfo ? `<p><strong>Vehicle:</strong> ${details.vehicleInfo}</p>` : ""}
          </div>
          
          <p>Please review and assign a mechanic if needed.</p>
        </div>
        <div class="footer">
          <p>FleetPro Management System</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail(adminEmail, `New Booking: ${details.bookingId}`, html);
}

// Admin Notification - New Repair Request
export async function notifyAdminNewRepairRequest(
  adminEmail: string,
  details: {
    requestId: string;
    driverName: string;
    driverPhone?: string;
    driverEmail?: string;
    urgency: string;
    summary: string;
    vehicleIdentifier?: string;
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
        .header { background-color: ${details.urgency === "critical" || details.urgency === "high" ? "#ef4444" : "#f59e0b"}; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
        .content { background-color: #f9fafb; padding: 30px; border-radius: 0 0 5px 5px; }
        .info-box { background-color: white; padding: 15px; margin: 10px 0; border-left: 4px solid ${details.urgency === "critical" || details.urgency === "high" ? "#ef4444" : "#f59e0b"}; }
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
            ${details.driverPhone ? `<p><strong>Phone:</strong> ${details.driverPhone}</p>` : ""}
            ${details.driverEmail ? `<p><strong>Email:</strong> ${details.driverEmail}</p>` : ""}
            <p><strong>Urgency:</strong> ${details.urgency}</p>
            ${details.vehicleIdentifier ? `<p><strong>Vehicle:</strong> ${details.vehicleIdentifier}</p>` : ""}
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
  `;

  const urgencyLabel = details.urgency.charAt(0).toUpperCase() + details.urgency.slice(1);
  return sendEmail(adminEmail, `[${urgencyLabel}] New Repair Request: ${details.requestId}`, html);
}

// Mechanic Assignment Email
export async function notifyMechanicAssignment(
  mechanicEmail: string,
  details: {
    mechanicName: string;
    jobId: string;
    bookingId: string;
    customerName: string;
    serviceType: string;
    date: string;
    time: string;
    priority: string;
    vehicleInfo?: string;
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
            ${details.vehicleInfo ? `<p><strong>Vehicle:</strong> ${details.vehicleInfo}</p>` : ""}
          </div>
          
          <p>Please log in to your dashboard to view full details and update the job status.</p>
        </div>
        <div class="footer">
          <p>FleetPro Management System</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail(mechanicEmail, `New Job Assignment - ${details.jobId}`, html);
}

// Repair Booking Link Email
export async function sendRepairBookingLinkEmail(
  email: string,
  details: {
    driverName: string;
    requestId: string;
    requestNumber?: number;
    link: string;
    issueSummary: string;
    language?: "en" | "es";
    suggestedSlot?: string;
  }
): Promise<boolean> {
  const isSpanish = details.language === "es";

  // Use requestNumber if available (shorter), otherwise fall back to last 8 chars of UUID
  const displayId = details.requestNumber ? `#${details.requestNumber}` : `#${details.requestId.slice(-8)}`;

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
          <h1>${isSpanish ? "Agendar Reparación" : "Schedule Your Repair"}</h1>
        </div>
        <div class="content">
          <p>${isSpanish ? `Hola ${details.driverName},` : `Hello ${details.driverName},`}</p>
          <p>${isSpanish ? "Por favor, agende su reparación usando el siguiente enlace:" : "Please schedule your repair using the following link:"}</p>
          
          <div class="info-box">
            <p><strong>${isSpanish ? "ID de Solicitud" : "Request ID"}:</strong> ${displayId}</p>
            <p><strong>${isSpanish ? "Motivo" : "Issue"}:</strong> ${details.issueSummary}</p>
            ${details.suggestedSlot ? `<p><strong>${isSpanish ? "Sugerencia" : "Suggested Time"}:</strong> ${details.suggestedSlot}</p>` : ""}
          </div>
          
          <p style="text-align: center;">
            <a href="${details.link}" class="button">${isSpanish ? "Agendar Ahora" : "Schedule Now"}</a>
          </p>
          
          <p>${isSpanish ? "O copie y pegue este enlace en su navegador:" : "Or copy and paste this link into your browser:"}</p>
          <p style="word-break: break-all; color: #2563eb;">${details.link}</p>
        </div>
        <div class="footer">
          <p>${isSpanish ? "Gracias por usar FleetPro!" : "Thank you for using FleetPro!"}</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const subject = isSpanish ? `Agendar Reparación - ${displayId}` : `Schedule Your Repair - ${displayId}`;

  return sendEmail(email, subject, html);
}

// Repair Completion Email
export async function sendRepairCompletionEmail(
  email: string,
  details: {
    driverName: string;
    requestId: string;
    summary: string;
    totalCost?: number;
    language?: "en" | "es";
  }
): Promise<boolean> {
  const isSpanish = details.language === "es";

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
          <h1>${isSpanish ? "Reparación Completada" : "Repair Completed"}</h1>
        </div>
        <div class="content">
          <p>${isSpanish ? `Hola ${details.driverName},` : `Hello ${details.driverName},`}</p>
          <p>${isSpanish ? "Su reparación ha sido completada:" : "Your repair has been completed:"}</p>
          
          <div class="info-box">
            <p><strong>${isSpanish ? "ID de Solicitud" : "Request ID"}:</strong> ${details.requestId}</p>
            <p><strong>${isSpanish ? "Resumen" : "Summary"}:</strong> ${details.summary}</p>
            ${details.totalCost ? `<p class="cost">${isSpanish ? "Total" : "Total Cost"}: $${details.totalCost.toFixed(2)}</p>` : ""}
          </div>
          
          <p>${isSpanish ? "Gracias por usar FleetPro!" : "Thank you for using FleetPro!"}</p>
        </div>
        <div class="footer">
          <p>FleetPro Management System</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const subject = isSpanish ? `Reparación Completada - #${details.requestId}` : `Repair Completed - #${details.requestId}`;

  return sendEmail(email, subject, html);
}

// Password Reset Email
export async function sendPasswordResetEmail(
  email: string,
  details: {
    userName: string;
    resetLink: string;
    resetToken: string;
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
  `;

  return sendEmail(email, "Password Reset Request - FleetPro", html);
}

// Invitation Email
export async function sendInvitationEmail(email: string, role: string): Promise<boolean> {
  const registerLink = `${
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  }/register?email=${encodeURIComponent(email)}&role=${encodeURIComponent(role)}`;

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
  `;

  return sendEmail(email, "Invitation to join FleetPro", html);
}

// Account Approved Email
export async function sendAccountApprovedEmail(email: string, name: string, role: string): Promise<boolean> {
  const loginLink = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/login`;

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
  `;

  return sendEmail(email, "Account Approved - FleetPro", html);
}

// ============================================
// ORCHARD PROTOCOL EMAILS - TEST VARIATIONS
// ============================================

const COMPANY_PHONE = process.env.COMPANY_PHONE || "(928) 123-4567";
const CLIENT_URL = process.env.CLIENT_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

// Test Email 1: Welcome & Protocol Overview
export async function sendOrchardProtocolEmail1(email: string, name?: string) {
  const baseUrl = CLIENT_URL;
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; background: #f5f5f5; }
        .email-wrapper { max-width: 600px; margin: 0 auto; background: #ffffff; }
        .header { background: #2c5530; padding: 30px; text-align: center; }
        .logo { color: #ffffff; font-size: 24px; font-weight: 600; }
        .content { padding: 40px 30px; }
        .greeting { font-size: 22px; color: #1a1a1a; margin-bottom: 20px; }
        .message { font-size: 15px; color: #666; line-height: 1.8; margin-bottom: 20px; }
        .protocol-box { background: #f0fdf4; padding: 25px; border-radius: 8px; border-left: 4px solid #22c55e; margin: 25px 0; }
        .protocol-title { font-size: 18px; color: #166534; font-weight: 600; margin-bottom: 15px; }
        .protocol-item { margin: 12px 0; color: #15803d; }
        .button { display: inline-block; background: #2c5530; color: #ffffff !important; padding: 12px 28px; text-decoration: none; border-radius: 6px; font-weight: 500; margin: 15px 0; }
        .footer { text-align: center; padding: 25px; background: #f9fafb; color: #999; font-size: 13px; border-top: 1px solid #e5e7eb; }
        @media only screen and (max-width: 600px) {
          .content { padding: 30px 20px; }
          .greeting { font-size: 20px; }
        }
      </style>
    </head>
    <body>
      <div class="email-wrapper">
        <div class="header">
          <h1 class="logo">Soil Seed and Water</h1>
        </div>
        <div class="content">
          <h2 class="greeting">${name ? `Hi ${name},` : "Hello,"}</h2>
          <p class="message">Welcome to our Orchard Protocol Program! We're excited to help optimize your orchard's health and productivity.</p>
          <div class="protocol-box">
            <div class="protocol-title">📋 Your Orchard Protocol Overview</div>
            <div class="protocol-item">✓ Soil analysis and amendment recommendations</div>
            <div class="protocol-item">✓ Seasonal application schedules</div>
            <div class="protocol-item">✓ Custom nutrition plans for your crop type</div>
            <div class="protocol-item">✓ Ongoing support and monitoring</div>
          </div>
          <p class="message">Our team will work with you to create a tailored protocol based on your specific orchard needs, soil conditions, and growing goals.</p>
          <p style="text-align: center;">
            <a href="${baseUrl}/contact" class="button">Get Started</a>
          </p>
        </div>
        <div class="footer">
          <p>${COMPANY_PHONE} • Flagstaff, Arizona</p>
          <p>© ${new Date().getFullYear()} Soil Seed and Water</p>
        </div>
      </div>
    </body>
    </html>
  `;
  const text = `
SOIL, SEED, AND WATER

${name ? `Hi ${name},` : "Hello,"}

Welcome to our Orchard Protocol Program! We're excited to help optimize your orchard's health and productivity.

YOUR ORCHARD PROTOCOL OVERVIEW
✓ Soil analysis and amendment recommendations
✓ Seasonal application schedules
✓ Custom nutrition plans for your crop type
✓ Ongoing support and monitoring

Our team will work with you to create a tailored protocol based on your specific orchard needs.

Get Started: ${baseUrl}/contact

${COMPANY_PHONE} • Flagstaff, Arizona
© ${new Date().getFullYear()} Soil Seed and Water
  `;
  return sendEmail(email, "Welcome to Your Orchard Protocol Program", html, text);
}

// Test Email 2: Soil Health Focus
export async function sendOrchardProtocolEmail2(email: string, name?: string) {
  const baseUrl = CLIENT_URL;
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; background: #f5f5f5; }
        .email-wrapper { max-width: 600px; margin: 0 auto; background: #ffffff; }
        .header { background: #166534; padding: 30px; text-align: center; }
        .logo { color: #ffffff; font-size: 24px; font-weight: 600; }
        .content { padding: 40px 30px; }
        .greeting { font-size: 22px; color: #1a1a1a; margin-bottom: 20px; }
        .message { font-size: 15px; color: #666; line-height: 1.8; margin-bottom: 20px; }
        .highlight { background: #dcfce7; padding: 25px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #22c55e; }
        .highlight-title { font-size: 18px; color: #166534; font-weight: 600; margin-bottom: 12px; }
        .button { display: inline-block; background: #166534; color: #ffffff !important; padding: 12px 28px; text-decoration: none; border-radius: 6px; font-weight: 500; margin: 15px 0; }
        .footer { text-align: center; padding: 25px; background: #f9fafb; color: #999; font-size: 13px; border-top: 1px solid #e5e7eb; }
        @media only screen and (max-width: 600px) {
          .content { padding: 30px 20px; }
        }
      </style>
    </head>
    <body>
      <div class="email-wrapper">
        <div class="header">
          <h1 class="logo">Soil Seed and Water</h1>
        </div>
        <div class="content">
          <h2 class="greeting">${name ? `${name},` : "Hello,"}</h2>
          <p class="message">Healthy soil is the foundation of a thriving orchard. Our Orchard Protocol starts with comprehensive soil analysis.</p>
          <div class="highlight">
            <div class="highlight-title">🌱 Why Soil Health Matters</div>
            <p style="color: #15803d; margin-top: 10px;">Proper soil structure, nutrient balance, and microbial activity directly impact tree health, fruit quality, and yield. Our organic amendments work with nature to build long-term soil vitality.</p>
          </div>
          <p class="message">Ready to assess your orchard's soil health? Let's schedule your soil analysis and create a custom protocol.</p>
          <p style="text-align: center;">
            <a href="${baseUrl}/contact" class="button">Schedule Soil Analysis</a>
          </p>
        </div>
        <div class="footer">
          <p>${COMPANY_PHONE} • Flagstaff, Arizona</p>
          <p>© ${new Date().getFullYear()} Soil Seed and Water</p>
        </div>
      </div>
    </body>
    </html>
  `;
  const text = `
SOIL, SEED, AND WATER

${name ? `${name},` : "Hello,"}

Healthy soil is the foundation of a thriving orchard. Our Orchard Protocol starts with comprehensive soil analysis.

🌱 WHY SOIL HEALTH MATTERS
Proper soil structure, nutrient balance, and microbial activity directly impact tree health, fruit quality, and yield.

Ready to assess your orchard's soil health? Let's schedule your soil analysis.

Schedule: ${baseUrl}/contact

${COMPANY_PHONE} • Flagstaff, Arizona
© ${new Date().getFullYear()} Soil Seed and Water
  `;
  return sendEmail(email, "Start with Soil: Your Orchard Protocol Foundation", html, text);
}

// Test Email 3: Seasonal Application Reminder
export async function sendOrchardProtocolEmail3(email: string, name?: string) {
  const baseUrl = CLIENT_URL;
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; background: #f5f5f5; }
        .email-wrapper { max-width: 600px; margin: 0 auto; background: #ffffff; }
        .header { background: #f59e0b; padding: 30px; text-align: center; }
        .logo { color: #ffffff; font-size: 24px; font-weight: 600; }
        .content { padding: 40px 30px; }
        .greeting { font-size: 22px; color: #1a1a1a; margin-bottom: 20px; }
        .message { font-size: 15px; color: #666; line-height: 1.8; margin-bottom: 20px; }
        .reminder-box { background: #fef3c7; padding: 25px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #f59e0b; }
        .reminder-title { font-size: 18px; color: #92400e; font-weight: 600; margin-bottom: 12px; }
        .button { display: inline-block; background: #f59e0b; color: #ffffff !important; padding: 12px 28px; text-decoration: none; border-radius: 6px; font-weight: 500; margin: 15px 0; }
        .footer { text-align: center; padding: 25px; background: #f9fafb; color: #999; font-size: 13px; border-top: 1px solid #e5e7eb; }
        @media only screen and (max-width: 600px) {
          .content { padding: 30px 20px; }
        }
      </style>
    </head>
    <body>
      <div class="email-wrapper">
        <div class="header">
          <h1 class="logo">Soil Seed and Water</h1>
        </div>
        <div class="content">
          <h2 class="greeting">${name ? `Hi ${name},` : "Hello,"}</h2>
          <p class="message">It's time for your seasonal soil amendment application! Following your Orchard Protocol schedule ensures optimal results.</p>
          <div class="reminder-box">
            <div class="reminder-title">⏰ Seasonal Application Reminder</div>
            <p style="color: #78350f; margin-top: 10px;">This is the ideal time to apply organic amendments to support your trees' current growth stage. Consistent applications according to your protocol maximize tree health and fruit production.</p>
          </div>
          <p class="message">Need to restock your amendments or adjust your protocol? We're here to help.</p>
          <p style="text-align: center;">
            <a href="${baseUrl}/contact" class="button">Order Amendments</a>
          </p>
        </div>
        <div class="footer">
          <p>${COMPANY_PHONE} • Flagstaff, Arizona</p>
          <p>© ${new Date().getFullYear()} Soil Seed and Water</p>
        </div>
      </div>
    </body>
    </html>
  `;
  const text = `
SOIL, SEED, AND WATER

${name ? `Hi ${name},` : "Hello,"}

It's time for your seasonal soil amendment application! Following your Orchard Protocol schedule ensures optimal results.

⏰ SEASONAL APPLICATION REMINDER
This is the ideal time to apply organic amendments to support your trees' current growth stage.

Need to restock? We're here to help.

Order: ${baseUrl}/contact

${COMPANY_PHONE} • Flagstaff, Arizona
© ${new Date().getFullYear()} Soil Seed and Water
  `;
  return sendEmail(email, "Seasonal Application Reminder - Your Orchard Protocol", html, text);
}

// Test Email 4: Results & Success Story
export async function sendOrchardProtocolEmail4(email: string, name?: string) {
  const baseUrl = CLIENT_URL;
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; background: #f5f5f5; }
        .email-wrapper { max-width: 600px; margin: 0 auto; background: #ffffff; }
        .header { background: #2563eb; padding: 30px; text-align: center; }
        .logo { color: #ffffff; font-size: 24px; font-weight: 600; }
        .content { padding: 40px 30px; }
        .greeting { font-size: 22px; color: #1a1a1a; margin-bottom: 20px; }
        .message { font-size: 15px; color: #666; line-height: 1.8; margin-bottom: 20px; }
        .success-box { background: #dbeafe; padding: 25px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #2563eb; }
        .success-title { font-size: 18px; color: #1e40af; font-weight: 600; margin-bottom: 12px; }
        .button { display: inline-block; background: #2563eb; color: #ffffff !important; padding: 12px 28px; text-decoration: none; border-radius: 6px; font-weight: 500; margin: 15px 0; }
        .footer { text-align: center; padding: 25px; background: #f9fafb; color: #999; font-size: 13px; border-top: 1px solid #e5e7eb; }
        @media only screen and (max-width: 600px) {
          .content { padding: 30px 20px; }
        }
      </style>
    </head>
    <body>
      <div class="email-wrapper">
        <div class="header">
          <h1 class="logo">Soil Seed and Water</h1>
        </div>
        <div class="content">
          <h2 class="greeting">${name ? `${name},` : "Hello,"}</h2>
          <p class="message">Orchard Protocol growers are seeing impressive results! Here's what consistent protocol application can achieve:</p>
          <div class="success-box">
            <div class="success-title">📊 Protocol Results</div>
            <p style="color: #1e40af; margin-top: 10px;">• Improved soil structure and water retention<br>• Enhanced tree vigor and disease resistance<br>• Better fruit quality and yield consistency<br>• Reduced need for synthetic inputs</p>
          </div>
          <p class="message">Ready to see these results in your orchard? Let's create your custom protocol today.</p>
          <p style="text-align: center;">
            <a href="${baseUrl}/contact" class="button">Start Your Protocol</a>
          </p>
        </div>
        <div class="footer">
          <p>${COMPANY_PHONE} • Flagstaff, Arizona</p>
          <p>© ${new Date().getFullYear()} Soil Seed and Water</p>
        </div>
      </div>
    </body>
    </html>
  `;
  const text = `
SOIL, SEED, AND WATER

${name ? `${name},` : "Hello,"}

Orchard Protocol growers are seeing impressive results! Here's what consistent protocol application can achieve:

📊 PROTOCOL RESULTS
• Improved soil structure and water retention
• Enhanced tree vigor and disease resistance
• Better fruit quality and yield consistency
• Reduced need for synthetic inputs

Ready to see these results in your orchard?

Start: ${baseUrl}/contact

${COMPANY_PHONE} • Flagstaff, Arizona
© ${new Date().getFullYear()} Soil Seed and Water
  `;
  return sendEmail(email, "See the Results: Orchard Protocol Success Stories", html, text);
}

// Test Email 5: Expert Support & Consultation
export async function sendOrchardProtocolEmail5(email: string, name?: string) {
  const baseUrl = CLIENT_URL;
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; background: #f5f5f5; }
        .email-wrapper { max-width: 600px; margin: 0 auto; background: #ffffff; }
        .header { background: #7c3aed; padding: 30px; text-align: center; }
        .logo { color: #ffffff; font-size: 24px; font-weight: 600; }
        .content { padding: 40px 30px; }
        .greeting { font-size: 22px; color: #1a1a1a; margin-bottom: 20px; }
        .message { font-size: 15px; color: #666; line-height: 1.8; margin-bottom: 20px; }
        .support-box { background: #f3e8ff; padding: 25px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #7c3aed; }
        .support-title { font-size: 18px; color: #6b21a8; font-weight: 600; margin-bottom: 12px; }
        .button { display: inline-block; background: #7c3aed; color: #ffffff !important; padding: 12px 28px; text-decoration: none; border-radius: 6px; font-weight: 500; margin: 15px 0; }
        .footer { text-align: center; padding: 25px; background: #f9fafb; color: #999; font-size: 13px; border-top: 1px solid #e5e7eb; }
        @media only screen and (max-width: 600px) {
          .content { padding: 30px 20px; }
        }
      </style>
    </head>
    <body>
      <div class="email-wrapper">
        <div class="header">
          <h1 class="logo">Soil Seed and Water</h1>
        </div>
        <div class="content">
          <h2 class="greeting">${name ? `Hi ${name},` : "Hello,"}</h2>
          <p class="message">You don't have to navigate your Orchard Protocol alone. Our team provides ongoing expert support every step of the way.</p>
          <div class="support-box">
            <div class="support-title">💬 Expert Support Included</div>
            <p style="color: #6b21a8; margin-top: 10px;">• Protocol customization and adjustments<br>• Application timing recommendations<br>• Troubleshooting and problem-solving<br>• Direct access to our growing specialists</p>
          </div>
          <p class="message">Have questions about your protocol or need guidance? We're just a call or email away.</p>
          <p style="text-align: center;">
            <a href="${baseUrl}/contact" class="button">Get Expert Help</a>
          </p>
          <p style="text-align: center; margin-top: 20px; color: #666; font-size: 14px;">Or call us directly: <strong>${COMPANY_PHONE}</strong></p>
        </div>
        <div class="footer">
          <p>${COMPANY_PHONE} • Flagstaff, Arizona</p>
          <p>© ${new Date().getFullYear()} Soil Seed and Water</p>
        </div>
      </div>
    </body>
    </html>
  `;
  const text = `
SOIL, SEED, AND WATER

${name ? `Hi ${name},` : "Hello,"}

You don't have to navigate your Orchard Protocol alone. Our team provides ongoing expert support every step of the way.

💬 EXPERT SUPPORT INCLUDED
• Protocol customization and adjustments
• Application timing recommendations
• Troubleshooting and problem-solving
• Direct access to our growing specialists

Have questions? We're just a call or email away.

Get Help: ${baseUrl}/contact
Call: ${COMPANY_PHONE}

${COMPANY_PHONE} • Flagstaff, Arizona
© ${new Date().getFullYear()} Soil Seed and Water
  `;
  return sendEmail(email, "Expert Support for Your Orchard Protocol", html, text);
}

// ============================================
// CRM EMAIL SEQUENCES - MULTIPLE ITERATIONS
// ============================================

// CRM Email 1: Welcome & Onboarding
export async function sendCRMEmail1(email: string, name?: string) {
  const baseUrl = CLIENT_URL;
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; background: #f5f5f5; }
        .email-wrapper { max-width: 600px; margin: 0 auto; background: #ffffff; }
        .header { background: linear-gradient(135deg, #2c5530 0%, #166534 100%); padding: 35px; text-align: center; }
        .logo { color: #ffffff; font-size: 26px; font-weight: 600; }
        .content { padding: 40px 30px; }
        .greeting { font-size: 24px; color: #1a1a1a; margin-bottom: 20px; font-weight: 500; }
        .message { font-size: 15px; color: #666; line-height: 1.8; margin-bottom: 20px; }
        .welcome-box { background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); padding: 30px; border-radius: 8px; margin: 25px 0; }
        .welcome-title { font-size: 20px; color: #166534; font-weight: 600; margin-bottom: 15px; }
        .feature-list { margin: 15px 0; }
        .feature-item { margin: 10px 0; color: #15803d; font-size: 15px; }
        .button { display: inline-block; background: #2c5530; color: #ffffff !important; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 500; margin: 20px 0; }
        .footer { text-align: center; padding: 30px; background: #f9fafb; color: #999; font-size: 13px; border-top: 1px solid #e5e7eb; }
        @media only screen and (max-width: 600px) {
          .content { padding: 30px 20px; }
          .greeting { font-size: 22px; }
        }
      </style>
    </head>
    <body>
      <div class="email-wrapper">
        <div class="header">
          <h1 class="logo">Soil Seed and Water</h1>
        </div>
        <div class="content">
          <h2 class="greeting">${name ? `Welcome, ${name}!` : "Welcome!"}</h2>
          <p class="message">Thank you for choosing Soil Seed and Water. We're thrilled to have you as part of our growing community!</p>
          <div class="welcome-box">
            <div class="welcome-title">🎉 What to Expect</div>
            <div class="feature-list">
              <div class="feature-item">✓ Premium organic soil amendments</div>
              <div class="feature-item">✓ Expert guidance and support</div>
              <div class="feature-item">✓ Custom solutions for your needs</div>
              <div class="feature-item">✓ Ongoing relationship and care</div>
            </div>
          </div>
          <p class="message">We're here to help you achieve amazing results. Whether you're growing avocados, managing an orchard, or working on landscaping projects, we've got you covered.</p>
          <p style="text-align: center;">
            <a href="${baseUrl}/contact" class="button">Get Started</a>
          </p>
        </div>
        <div class="footer">
          <p>${COMPANY_PHONE} • Flagstaff, Arizona</p>
          <p>© ${new Date().getFullYear()} Soil Seed and Water</p>
        </div>
      </div>
    </body>
    </html>
  `;
  const text = `
SOIL, SEED, AND WATER

${name ? `Welcome, ${name}!` : "Welcome!"}

Thank you for choosing Soil Seed and Water. We're thrilled to have you as part of our growing community!

🎉 WHAT TO EXPECT
✓ Premium organic soil amendments
✓ Expert guidance and support
✓ Custom solutions for your needs
✓ Ongoing relationship and care

We're here to help you achieve amazing results.

Get Started: ${baseUrl}/contact

${COMPANY_PHONE} • Flagstaff, Arizona
© ${new Date().getFullYear()} Soil Seed and Water
  `;
  return sendEmail(email, "Welcome to Soil Seed and Water!", html, text);
}

// CRM Email 2: Post-Purchase Follow-Up
export async function sendCRMEmail2(email: string, name?: string) {
  const baseUrl = CLIENT_URL;
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; background: #f5f5f5; }
        .email-wrapper { max-width: 600px; margin: 0 auto; background: #ffffff; }
        .header { background: #2563eb; padding: 35px; text-align: center; }
        .logo { color: #ffffff; font-size: 26px; font-weight: 600; }
        .content { padding: 40px 30px; }
        .greeting { font-size: 24px; color: #1a1a1a; margin-bottom: 20px; font-weight: 500; }
        .message { font-size: 15px; color: #666; line-height: 1.8; margin-bottom: 20px; }
        .check-in-box { background: #eff6ff; padding: 30px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #2563eb; }
        .check-in-title { font-size: 20px; color: #1e40af; font-weight: 600; margin-bottom: 15px; }
        .button { display: inline-block; background: #2563eb; color: #ffffff !important; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 500; margin: 20px 0; }
        .footer { text-align: center; padding: 30px; background: #f9fafb; color: #999; font-size: 13px; border-top: 1px solid #e5e7eb; }
        @media only screen and (max-width: 600px) {
          .content { padding: 30px 20px; }
        }
      </style>
    </head>
    <body>
      <div class="email-wrapper">
        <div class="header">
          <h1 class="logo">Soil Seed and Water</h1>
        </div>
        <div class="content">
          <h2 class="greeting">${name ? `Hi ${name},` : "Hello,"}</h2>
          <p class="message">We wanted to check in and see how your recent purchase is working out for you. Your success is our priority!</p>
          <div class="check-in-box">
            <div class="check-in-title">💬 How's It Going?</div>
            <p style="color: #1e40af; margin-top: 10px; line-height: 1.8;">Are you seeing the results you hoped for? Do you have any questions about application, timing, or product usage? We're here to help ensure you get the best possible outcomes.</p>
          </div>
          <p class="message">If you need any guidance, have questions, or want to discuss your results, please don't hesitate to reach out.</p>
          <p style="text-align: center;">
            <a href="${baseUrl}/contact" class="button">Get Support</a>
          </p>
          <p style="text-align: center; margin-top: 20px; color: #666; font-size: 14px;">Or call us: <strong>${COMPANY_PHONE}</strong></p>
        </div>
        <div class="footer">
          <p>${COMPANY_PHONE} • Flagstaff, Arizona</p>
          <p>© ${new Date().getFullYear()} Soil Seed and Water</p>
        </div>
      </div>
    </body>
    </html>
  `;
  const text = `
SOIL, SEED, AND WATER

${name ? `Hi ${name},` : "Hello,"}

We wanted to check in and see how your recent purchase is working out for you. Your success is our priority!

💬 HOW'S IT GOING?
Are you seeing the results you hoped for? Do you have any questions about application, timing, or product usage? We're here to help ensure you get the best possible outcomes.

If you need any guidance, have questions, or want to discuss your results, please don't hesitate to reach out.

Get Support: ${baseUrl}/contact
Call: ${COMPANY_PHONE}

${COMPANY_PHONE} • Flagstaff, Arizona
© ${new Date().getFullYear()} Soil Seed and Water
  `;
  return sendEmail(email, "How are things going with your purchase?", html, text);
}

// CRM Email 3: Educational Content
export async function sendCRMEmail3(email: string, name?: string) {
  const baseUrl = CLIENT_URL;
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; background: #f5f5f5; }
        .email-wrapper { max-width: 600px; margin: 0 auto; background: #ffffff; }
        .header { background: #059669; padding: 35px; text-align: center; }
        .logo { color: #ffffff; font-size: 26px; font-weight: 600; }
        .content { padding: 40px 30px; }
        .greeting { font-size: 24px; color: #1a1a1a; margin-bottom: 20px; font-weight: 500; }
        .message { font-size: 15px; color: #666; line-height: 1.8; margin-bottom: 20px; }
        .tip-box { background: #d1fae5; padding: 30px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #059669; }
        .tip-title { font-size: 20px; color: #065f46; font-weight: 600; margin-bottom: 15px; }
        .tip-content { color: #047857; line-height: 1.8; }
        .button { display: inline-block; background: #059669; color: #ffffff !important; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 500; margin: 20px 0; }
        .footer { text-align: center; padding: 30px; background: #f9fafb; color: #999; font-size: 13px; border-top: 1px solid #e5e7eb; }
        @media only screen and (max-width: 600px) {
          .content { padding: 30px 20px; }
        }
      </style>
    </head>
    <body>
      <div class="email-wrapper">
        <div class="header">
          <h1 class="logo">Soil Seed and Water</h1>
        </div>
        <div class="content">
          <h2 class="greeting">${name ? `Hi ${name},` : "Hello,"}</h2>
          <p class="message">We believe in sharing knowledge to help you succeed. Here's a valuable tip for maximizing your soil health:</p>
          <div class="tip-box">
            <div class="tip-title">📚 Growing Tip: Timing Matters</div>
            <div class="tip-content" style="margin-top: 10px;">
              <p style="margin-bottom: 12px;">The best time to apply organic amendments is during active growth periods. For most trees and plants, early spring and fall applications provide optimal nutrient uptake.</p>
              <p style="margin-bottom: 12px;"><strong>Pro Tip:</strong> Apply amendments when soil is moist but not waterlogged, and water thoroughly after application to help nutrients reach the root zone.</p>
            </div>
          </div>
          <p class="message">Want more tips and guidance? Our team is always ready to share expertise tailored to your specific situation.</p>
          <p style="text-align: center;">
            <a href="${baseUrl}/contact" class="button">Learn More</a>
          </p>
        </div>
        <div class="footer">
          <p>${COMPANY_PHONE} • Flagstaff, Arizona</p>
          <p>© ${new Date().getFullYear()} Soil Seed and Water</p>
        </div>
      </div>
    </body>
    </html>
  `;
  const text = `
SOIL, SEED, AND WATER

${name ? `Hi ${name},` : "Hello,"}

We believe in sharing knowledge to help you succeed. Here's a valuable tip for maximizing your soil health:

📚 GROWING TIP: TIMING MATTERS
The best time to apply organic amendments is during active growth periods. For most trees and plants, early spring and fall applications provide optimal nutrient uptake.

Pro Tip: Apply amendments when soil is moist but not waterlogged, and water thoroughly after application to help nutrients reach the root zone.

Want more tips and guidance? Our team is always ready to share expertise tailored to your specific situation.

Learn More: ${baseUrl}/contact

${COMPANY_PHONE} • Flagstaff, Arizona
© ${new Date().getFullYear()} Soil Seed and Water
  `;
  return sendEmail(email, "Growing Tip: Maximize Your Soil Health", html, text);
}

// CRM Email 4: Re-engagement
export async function sendCRMEmail4(email: string, name?: string) {
  const baseUrl = CLIENT_URL;
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; background: #f5f5f5; }
        .email-wrapper { max-width: 600px; margin: 0 auto; background: #ffffff; }
        .header { background: #dc2626; padding: 35px; text-align: center; }
        .logo { color: #ffffff; font-size: 26px; font-weight: 600; }
        .content { padding: 40px 30px; }
        .greeting { font-size: 24px; color: #1a1a1a; margin-bottom: 20px; font-weight: 500; }
        .message { font-size: 15px; color: #666; line-height: 1.8; margin-bottom: 20px; }
        .reengage-box { background: #fef2f2; padding: 30px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #dc2626; }
        .reengage-title { font-size: 20px; color: #991b1b; font-weight: 600; margin-bottom: 15px; }
        .button { display: inline-block; background: #dc2626; color: #ffffff !important; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 500; margin: 20px 0; }
        .footer { text-align: center; padding: 30px; background: #f9fafb; color: #999; font-size: 13px; border-top: 1px solid #e5e7eb; }
        @media only screen and (max-width: 600px) {
          .content { padding: 30px 20px; }
        }
      </style>
    </head>
    <body>
      <div class="email-wrapper">
        <div class="header">
          <h1 class="logo">Soil Seed and Water</h1>
        </div>
        <div class="content">
          <h2 class="greeting">${name ? `Hi ${name},` : "Hello,"}</h2>
          <p class="message">We've missed you! It's been a while since we've connected, and we wanted to reach out and see how your growing projects are going.</p>
          <div class="reengage-box">
            <div class="reengage-title">🌱 We're Still Here for You</div>
            <p style="color: #991b1b; margin-top: 10px; line-height: 1.8;">Whether you need to restock your amendments, have questions about your current setup, or want to explore new solutions, we're ready to help. Our commitment to your success hasn't changed.</p>
          </div>
          <p class="message">What can we help you with today? New projects, seasonal applications, or just catching up—we'd love to hear from you.</p>
          <p style="text-align: center;">
            <a href="${baseUrl}/contact" class="button">Let's Connect</a>
          </p>
        </div>
        <div class="footer">
          <p>${COMPANY_PHONE} • Flagstaff, Arizona</p>
          <p>© ${new Date().getFullYear()} Soil Seed and Water</p>
        </div>
      </div>
    </body>
    </html>
  `;
  const text = `
SOIL, SEED, AND WATER

${name ? `Hi ${name},` : "Hello,"}

We've missed you! It's been a while since we've connected, and we wanted to reach out and see how your growing projects are going.

🌱 WE'RE STILL HERE FOR YOU
Whether you need to restock your amendments, have questions about your current setup, or want to explore new solutions, we're ready to help.

What can we help you with today? New projects, seasonal applications, or just catching up—we'd love to hear from you.

Let's Connect: ${baseUrl}/contact

${COMPANY_PHONE} • Flagstaff, Arizona
© ${new Date().getFullYear()} Soil Seed and Water
  `;
  return sendEmail(email, "We've missed you! Let's reconnect", html, text);
}

// CRM Email 5: Product Recommendation
export async function sendCRMEmail5(email: string, name?: string) {
  const baseUrl = CLIENT_URL;
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; background: #f5f5f5; }
        .email-wrapper { max-width: 600px; margin: 0 auto; background: #ffffff; }
        .header { background: #7c2d12; padding: 35px; text-align: center; }
        .logo { color: #ffffff; font-size: 26px; font-weight: 600; }
        .content { padding: 40px 30px; }
        .greeting { font-size: 24px; color: #1a1a1a; margin-bottom: 20px; font-weight: 500; }
        .message { font-size: 15px; color: #666; line-height: 1.8; margin-bottom: 20px; }
        .product-box { background: #fff7ed; padding: 30px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #f59e0b; }
        .product-title { font-size: 20px; color: #92400e; font-weight: 600; margin-bottom: 15px; }
        .product-feature { margin: 12px 0; color: #78350f; }
        .button { display: inline-block; background: #f59e0b; color: #ffffff !important; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 500; margin: 20px 0; }
        .footer { text-align: center; padding: 30px; background: #f9fafb; color: #999; font-size: 13px; border-top: 1px solid #e5e7eb; }
        @media only screen and (max-width: 600px) {
          .content { padding: 30px 20px; }
        }
      </style>
    </head>
    <body>
      <div class="email-wrapper">
        <div class="header">
          <h1 class="logo">Soil Seed and Water</h1>
        </div>
        <div class="content">
          <h2 class="greeting">${name ? `Hi ${name},` : "Hello,"}</h2>
          <p class="message">Based on your growing needs, we think you might be interested in our premium organic worm castings—one of our most popular products for serious growers.</p>
          <div class="product-box">
            <div class="product-title">🌟 Premium Organic Worm Castings</div>
            <div class="product-feature">✓ Rich in beneficial microorganisms</div>
            <div class="product-feature">✓ Improves soil structure and drainage</div>
            <div class="product-feature">✓ Slow-release nutrients for sustained growth</div>
            <div class="product-feature">✓ Perfect for orchards, gardens, and landscaping</div>
          </div>
          <p class="message">Many of our customers see significant improvements in plant health and yield when incorporating worm castings into their soil amendment program.</p>
          <p style="text-align: center;">
            <a href="${baseUrl}/contact" class="button">Learn More & Order</a>
          </p>
        </div>
        <div class="footer">
          <p>${COMPANY_PHONE} • Flagstaff, Arizona</p>
          <p>© ${new Date().getFullYear()} Soil Seed and Water</p>
        </div>
      </div>
    </body>
    </html>
  `;
  const text = `
SOIL, SEED, AND WATER

${name ? `Hi ${name},` : "Hello,"}

Based on your growing needs, we think you might be interested in our premium organic worm castings—one of our most popular products for serious growers.

🌟 PREMIUM ORGANIC WORM CASTINGS
✓ Rich in beneficial microorganisms
✓ Improves soil structure and drainage
✓ Slow-release nutrients for sustained growth
✓ Perfect for orchards, gardens, and landscaping

Many of our customers see significant improvements in plant health and yield when incorporating worm castings into their soil amendment program.

Learn More & Order: ${baseUrl}/contact

${COMPANY_PHONE} • Flagstaff, Arizona
© ${new Date().getFullYear()} Soil Seed and Water
  `;
  return sendEmail(email, "Product Recommendation: Premium Worm Castings", html, text);
}

// CRM Email 6: Seasonal Reminder
export async function sendCRMEmail6(email: string, name?: string) {
  const baseUrl = CLIENT_URL;
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; background: #f5f5f5; }
        .email-wrapper { max-width: 600px; margin: 0 auto; background: #ffffff; }
        .header { background: linear-gradient(135deg, #0891b2 0%, #0e7490 100%); padding: 35px; text-align: center; }
        .logo { color: #ffffff; font-size: 26px; font-weight: 600; }
        .content { padding: 40px 30px; }
        .greeting { font-size: 24px; color: #1a1a1a; margin-bottom: 20px; font-weight: 500; }
        .message { font-size: 15px; color: #666; line-height: 1.8; margin-bottom: 20px; }
        .seasonal-box { background: #cffafe; padding: 30px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #0891b2; }
        .seasonal-title { font-size: 20px; color: #164e63; font-weight: 600; margin-bottom: 15px; }
        .button { display: inline-block; background: #0891b2; color: #ffffff !important; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 500; margin: 20px 0; }
        .footer { text-align: center; padding: 30px; background: #f9fafb; color: #999; font-size: 13px; border-top: 1px solid #e5e7eb; }
        @media only screen and (max-width: 600px) {
          .content { padding: 30px 20px; }
        }
      </style>
    </head>
    <body>
      <div class="email-wrapper">
        <div class="header">
          <h1 class="logo">Soil Seed and Water</h1>
        </div>
        <div class="content">
          <h2 class="greeting">${name ? `Hi ${name},` : "Hello,"}</h2>
          <p class="message">As the seasons change, so do your soil's needs. This is the perfect time to prepare your growing areas for optimal results.</p>
          <div class="seasonal-box">
            <div class="seasonal-title">🍂 Seasonal Preparation Reminder</div>
            <p style="color: #164e63; margin-top: 10px; line-height: 1.8;">Early preparation with organic amendments sets the foundation for a successful growing season. Whether you're planning spring plantings or preparing for winter, proper soil conditioning now pays dividends later.</p>
          </div>
          <p class="message">Need help planning your seasonal soil amendment schedule? We can create a custom plan tailored to your specific crops and timeline.</p>
          <p style="text-align: center;">
            <a href="${baseUrl}/contact" class="button">Plan Your Season</a>
          </p>
        </div>
        <div class="footer">
          <p>${COMPANY_PHONE} • Flagstaff, Arizona</p>
          <p>© ${new Date().getFullYear()} Soil Seed and Water</p>
        </div>
      </div>
    </body>
    </html>
  `;
  const text = `
SOIL, SEED, AND WATER

${name ? `Hi ${name},` : "Hello,"}

As the seasons change, so do your soil's needs. This is the perfect time to prepare your growing areas for optimal results.

🍂 SEASONAL PREPARATION REMINDER
Early preparation with organic amendments sets the foundation for a successful growing season. Whether you're planning spring plantings or preparing for winter, proper soil conditioning now pays dividends later.

Need help planning your seasonal soil amendment schedule? We can create a custom plan tailored to your specific crops and timeline.

Plan Your Season: ${baseUrl}/contact

${COMPANY_PHONE} • Flagstaff, Arizona
© ${new Date().getFullYear()} Soil Seed and Water
  `;
  return sendEmail(email, "Seasonal Preparation: Time to Plan Ahead", html, text);
}

// CRM Email 7: Customer Success Story
export async function sendCRMEmail7(email: string, name?: string) {
  const baseUrl = CLIENT_URL;
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; background: #f5f5f5; }
        .email-wrapper { max-width: 600px; margin: 0 auto; background: #ffffff; }
        .header { background: linear-gradient(135deg, #9333ea 0%, #7e22ce 100%); padding: 35px; text-align: center; }
        .logo { color: #ffffff; font-size: 26px; font-weight: 600; }
        .content { padding: 40px 30px; }
        .greeting { font-size: 24px; color: #1a1a1a; margin-bottom: 20px; font-weight: 500; }
        .message { font-size: 15px; color: #666; line-height: 1.8; margin-bottom: 20px; }
        .success-box { background: #faf5ff; padding: 30px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #9333ea; }
        .success-title { font-size: 20px; color: #6b21a8; font-weight: 600; margin-bottom: 15px; }
        .quote { font-style: italic; color: #7e22ce; margin: 15px 0; padding-left: 20px; border-left: 3px solid #9333ea; }
        .button { display: inline-block; background: #9333ea; color: #ffffff !important; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 500; margin: 20px 0; }
        .footer { text-align: center; padding: 30px; background: #f9fafb; color: #999; font-size: 13px; border-top: 1px solid #e5e7eb; }
        @media only screen and (max-width: 600px) {
          .content { padding: 30px 20px; }
        }
      </style>
    </head>
    <body>
      <div class="email-wrapper">
        <div class="header">
          <h1 class="logo">Soil Seed and Water</h1>
        </div>
        <div class="content">
          <h2 class="greeting">${name ? `Hi ${name},` : "Hello,"}</h2>
          <p class="message">We love sharing success stories from growers who are seeing amazing results with our products. Here's what one of our customers recently shared:</p>
          <div class="success-box">
            <div class="success-title">✨ Customer Success Story</div>
            <div class="quote">
              "After implementing Soil Seed and Water's organic amendment protocol, we saw a 30% increase in fruit quality and significantly improved tree health. The soil structure improvement was noticeable within the first season."
            </div>
            <p style="color: #6b21a8; margin-top: 15px;">— Avocado Grower, Arizona</p>
          </div>
          <p class="message">Ready to write your own success story? Let's work together to achieve similar results in your operation.</p>
          <p style="text-align: center;">
            <a href="${baseUrl}/contact" class="button">Start Your Success Story</a>
          </p>
        </div>
        <div class="footer">
          <p>${COMPANY_PHONE} • Flagstaff, Arizona</p>
          <p>© ${new Date().getFullYear()} Soil Seed and Water</p>
        </div>
      </div>
    </body>
    </html>
  `;
  const text = `
SOIL, SEED, AND WATER

${name ? `Hi ${name},` : "Hello,"}

We love sharing success stories from growers who are seeing amazing results with our products. Here's what one of our customers recently shared:

✨ CUSTOMER SUCCESS STORY
"After implementing Soil Seed and Water's organic amendment protocol, we saw a 30% increase in fruit quality and significantly improved tree health. The soil structure improvement was noticeable within the first season."
— Avocado Grower, Arizona

Ready to write your own success story? Let's work together to achieve similar results in your operation.

Start Your Success Story: ${baseUrl}/contact

${COMPANY_PHONE} • Flagstaff, Arizona
© ${new Date().getFullYear()} Soil Seed and Water
  `;
  return sendEmail(email, "Success Story: See What's Possible", html, text);
}

// CRM Email 8: Special Offer
export async function sendCRMEmail8(email: string, name?: string) {
  const baseUrl = CLIENT_URL;
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; background: #f5f5f5; }
        .email-wrapper { max-width: 600px; margin: 0 auto; background: #ffffff; }
        .header { background: linear-gradient(135deg, #ea580c 0%, #c2410c 100%); padding: 35px; text-align: center; }
        .logo { color: #ffffff; font-size: 26px; font-weight: 600; }
        .content { padding: 40px 30px; }
        .greeting { font-size: 24px; color: #1a1a1a; margin-bottom: 20px; font-weight: 500; }
        .message { font-size: 15px; color: #666; line-height: 1.8; margin-bottom: 20px; }
        .offer-box { background: #fff7ed; padding: 30px; border-radius: 8px; margin: 25px 0; border: 2px dashed #f59e0b; text-align: center; }
        .offer-title { font-size: 22px; color: #c2410c; font-weight: 700; margin-bottom: 10px; }
        .offer-text { font-size: 18px; color: #ea580c; font-weight: 600; margin: 15px 0; }
        .button { display: inline-block; background: #ea580c; color: #ffffff !important; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 500; margin: 20px 0; }
        .footer { text-align: center; padding: 30px; background: #f9fafb; color: #999; font-size: 13px; border-top: 1px solid #e5e7eb; }
        @media only screen and (max-width: 600px) {
          .content { padding: 30px 20px; }
        }
      </style>
    </head>
    <body>
      <div class="email-wrapper">
        <div class="header">
          <h1 class="logo">Soil Seed and Water</h1>
        </div>
        <div class="content">
          <h2 class="greeting">${name ? `Hi ${name},` : "Hello,"}</h2>
          <p class="message">As a valued customer, we wanted to offer you something special:</p>
          <div class="offer-box">
            <div class="offer-title">🎁 Special Offer</div>
            <div class="offer-text">Free Consultation<br>with Your Next Order</div>
            <p style="color: #92400e; margin-top: 15px;">Get expert guidance on your soil amendment strategy when you place your next order. Our team will work with you to create a customized plan.</p>
          </div>
          <p class="message">This is our way of saying thank you for being part of the Soil Seed and Water community. Take advantage of this offer while it lasts!</p>
          <p style="text-align: center;">
            <a href="${baseUrl}/contact" class="button">Claim Your Offer</a>
          </p>
        </div>
        <div class="footer">
          <p>${COMPANY_PHONE} • Flagstaff, Arizona</p>
          <p>© ${new Date().getFullYear()} Soil Seed and Water</p>
        </div>
      </div>
    </body>
    </html>
  `;
  const text = `
SOIL, SEED, AND WATER

${name ? `Hi ${name},` : "Hello,"}

As a valued customer, we wanted to offer you something special:

🎁 SPECIAL OFFER
Free Consultation with Your Next Order

Get expert guidance on your soil amendment strategy when you place your next order. Our team will work with you to create a customized plan.

This is our way of saying thank you for being part of the Soil Seed and Water community.

Claim Your Offer: ${baseUrl}/contact

${COMPANY_PHONE} • Flagstaff, Arizona
© ${new Date().getFullYear()} Soil Seed and Water
  `;
  return sendEmail(email, "Special Offer: Free Consultation with Your Next Order", html, text);
}

// ============================================
// CROP-SPECIFIC ORCHARD PROTOCOL EMAILS
// ============================================

// Avocado Grower Email
export async function sendAvocadoGrowerEmail(email: string, name?: string) {
  const baseUrl = CLIENT_URL;
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; background: #f5f5f5; }
        .email-wrapper { max-width: 600px; margin: 0 auto; background: #ffffff; }
        .header { background: linear-gradient(135deg, #166534 0%, #22c55e 100%); padding: 35px; text-align: center; }
        .logo { color: #ffffff; font-size: 26px; font-weight: 600; }
        .tagline { color: #dcfce7; font-size: 14px; margin-top: 8px; }
        .content { padding: 40px 30px; }
        .greeting { font-size: 24px; color: #1a1a1a; margin-bottom: 20px; font-weight: 500; }
        .message { font-size: 15px; color: #666; line-height: 1.8; margin-bottom: 20px; }
        .protocol-box { background: #f0fdf4; padding: 30px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #22c55e; }
        .protocol-title { font-size: 20px; color: #166534; font-weight: 600; margin-bottom: 20px; }
        .protocol-section { margin: 20px 0; }
        .section-subtitle { font-size: 16px; color: #15803d; font-weight: 600; margin-bottom: 10px; }
        .protocol-item { margin: 10px 0; color: #15803d; font-size: 14px; padding-left: 20px; position: relative; }
        .protocol-item:before { content: "•"; position: absolute; left: 0; color: #22c55e; font-weight: bold; }
        .highlight-box { background: #dcfce7; padding: 25px; border-radius: 8px; margin: 25px 0; }
        .highlight-text { color: #166534; font-size: 15px; line-height: 1.8; }
        .button { display: inline-block; background: #166534; color: #ffffff !important; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 500; margin: 20px 0; }
        .footer { text-align: center; padding: 30px; background: #f9fafb; color: #999; font-size: 13px; border-top: 1px solid #e5e7eb; }
        @media only screen and (max-width: 600px) {
          .content { padding: 30px 20px; }
          .greeting { font-size: 22px; }
        }
      </style>
    </head>
    <body>
      <div class="email-wrapper">
        <div class="header">
          <h1 class="logo">Soil Seed and Water</h1>
          <p class="tagline">Specialized Protocol for Avocado Growers</p>
        </div>
        <div class="content">
          <h2 class="greeting">${name ? `Hi ${name},` : "Hello Avocado Grower,"}</h2>
          <p class="message">Growing exceptional avocados requires specialized soil management. Our Avocado Orchard Protocol is designed specifically for the unique needs of avocado trees in Arizona's climate.</p>
          
          <div class="protocol-box">
            <div class="protocol-title">🌳 Your Avocado Orchard Protocol</div>
            
            <div class="protocol-section">
              <div class="section-subtitle">Soil Requirements</div>
              <div class="protocol-item">Well-draining soil with pH 6.0-6.5 (slightly acidic)</div>
              <div class="protocol-item">Organic matter content: 3-5% for optimal root health</div>
              <div class="protocol-item">Enhanced drainage to prevent root rot (Phytophthora)</div>
              <div class="protocol-item">Improved soil structure for feeder root development</div>
            </div>

            <div class="protocol-section">
              <div class="section-subtitle">Application Schedule</div>
              <div class="protocol-item">Early Spring (February-March): Pre-bloom application</div>
              <div class="protocol-item">Late Spring (May-June): Post-bloom fruit set support</div>
              <div class="protocol-item">Fall (September-October): Root development preparation</div>
              <div class="protocol-item">Apply around drip line, 2-3 feet from trunk</div>
            </div>

            <div class="protocol-section">
              <div class="section-subtitle">Recommended Products</div>
              <div class="protocol-item">Premium Worm Castings: 50-100 lbs per tree annually</div>
              <div class="protocol-item">Dairy Compost: 100-200 lbs per tree for soil structure</div>
              <div class="protocol-item">Custom blend based on soil analysis results</div>
            </div>
          </div>

          <div class="highlight-box">
            <div class="highlight-text">
              <strong>Key Benefits:</strong> Our organic amendments improve drainage (critical for preventing root rot), enhance nutrient availability during fruit development, and support the beneficial microorganisms that help avocado trees thrive in Arizona's challenging conditions.
            </div>
          </div>

          <p class="message">Ready to optimize your avocado orchard? Let's create a custom protocol based on your soil analysis and tree age.</p>
          <p style="text-align: center;">
            <a href="${baseUrl}/contact" class="button">Get Your Custom Protocol</a>
          </p>
          <p style="text-align: center; margin-top: 20px; color: #666; font-size: 14px;">Call us: <strong>${COMPANY_PHONE}</strong></p>
        </div>
        <div class="footer">
          <p>${COMPANY_PHONE} • Flagstaff, Arizona</p>
          <p>© ${new Date().getFullYear()} Soil Seed and Water</p>
        </div>
      </div>
    </body>
    </html>
  `;
  const text = `
SOIL, SEED, AND WATER
Specialized Protocol for Avocado Growers

${name ? `Hi ${name},` : "Hello Avocado Grower,"}

Growing exceptional avocados requires specialized soil management. Our Avocado Orchard Protocol is designed specifically for the unique needs of avocado trees in Arizona's climate.

🥑 YOUR AVOCADO ORCHARD PROTOCOL

SOIL REQUIREMENTS
• Well-draining soil with pH 6.0-6.5 (slightly acidic)
• Organic matter content: 3-5% for optimal root health
• Enhanced drainage to prevent root rot (Phytophthora)
• Improved soil structure for feeder root development

APPLICATION SCHEDULE
• Early Spring (February-March): Pre-bloom application
• Late Spring (May-June): Post-bloom fruit set support
• Fall (September-October): Root development preparation
• Apply around drip line, 2-3 feet from trunk

RECOMMENDED PRODUCTS
• Premium Worm Castings: 50-100 lbs per tree annually
• Dairy Compost: 100-200 lbs per tree for soil structure
• Custom blend based on soil analysis results

KEY BENEFITS: Our organic amendments improve drainage (critical for preventing root rot), enhance nutrient availability during fruit development, and support beneficial microorganisms.

Ready to optimize your avocado orchard?

Get Your Custom Protocol: ${baseUrl}/contact
Call: ${COMPANY_PHONE}

${COMPANY_PHONE} • Flagstaff, Arizona
© ${new Date().getFullYear()} Soil Seed and Water
  `;
  return sendEmail(email, "Avocado Orchard Protocol: Optimize Your Harvest", html, text);
}

// Apple Grower Email
export async function sendAppleGrowerEmail(email: string, name?: string) {
  const baseUrl = CLIENT_URL;
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; background: #f5f5f5; }
        .email-wrapper { max-width: 600px; margin: 0 auto; background: #ffffff; }
        .header { background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%); padding: 35px; text-align: center; }
        .logo { color: #ffffff; font-size: 26px; font-weight: 600; }
        .tagline { color: #fecaca; font-size: 14px; margin-top: 8px; }
        .content { padding: 40px 30px; }
        .greeting { font-size: 24px; color: #1a1a1a; margin-bottom: 20px; font-weight: 500; }
        .message { font-size: 15px; color: #666; line-height: 1.8; margin-bottom: 20px; }
        .protocol-box { background: #fef2f2; padding: 30px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #dc2626; }
        .protocol-title { font-size: 20px; color: #991b1b; font-weight: 600; margin-bottom: 20px; }
        .protocol-section { margin: 20px 0; }
        .section-subtitle { font-size: 16px; color: #b91c1c; font-weight: 600; margin-bottom: 10px; }
        .protocol-item { margin: 10px 0; color: #991b1b; font-size: 14px; padding-left: 20px; position: relative; }
        .protocol-item:before { content: "•"; position: absolute; left: 0; color: #ef4444; font-weight: bold; }
        .highlight-box { background: #fee2e2; padding: 25px; border-radius: 8px; margin: 25px 0; }
        .highlight-text { color: #991b1b; font-size: 15px; line-height: 1.8; }
        .button { display: inline-block; background: #dc2626; color: #ffffff !important; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 500; margin: 20px 0; }
        .footer { text-align: center; padding: 30px; background: #f9fafb; color: #999; font-size: 13px; border-top: 1px solid #e5e7eb; }
        @media only screen and (max-width: 600px) {
          .content { padding: 30px 20px; }
        }
      </style>
    </head>
    <body>
      <div class="email-wrapper">
        <div class="header">
          <h1 class="logo">Soil Seed and Water</h1>
          <p class="tagline">Specialized Protocol for Apple Orchards</p>
        </div>
        <div class="content">
          <h2 class="greeting">${name ? `Hi ${name},` : "Hello Apple Grower,"}</h2>
          <p class="message">Apple trees in Arizona require careful soil management to produce high-quality fruit. Our Apple Orchard Protocol addresses the specific challenges of growing apples in our unique climate.</p>
          
          <div class="protocol-box">
            <div class="protocol-title">🌳 Your Apple Orchard Protocol</div>
            
            <div class="protocol-section">
              <div class="section-subtitle">Soil Requirements</div>
              <div class="protocol-item">Optimal pH: 6.0-7.0 (slightly acidic to neutral)</div>
              <div class="protocol-item">Deep, well-drained soil for extensive root systems</div>
              <div class="protocol-item">High organic matter: 4-6% for nutrient retention</div>
              <div class="protocol-item">Good water-holding capacity with proper drainage</div>
            </div>

            <div class="protocol-section">
              <div class="section-subtitle">Application Schedule</div>
              <div class="protocol-item">Late Winter (January-February): Pre-bud break application</div>
              <div class="protocol-item">Early Spring (March-April): Bloom and fruit set support</div>
              <div class="protocol-item">Early Fall (September): Post-harvest root development</div>
              <div class="protocol-item">Apply in a 3-4 foot radius around tree base</div>
            </div>

            <div class="protocol-section">
              <div class="section-subtitle">Recommended Products</div>
              <div class="protocol-item">Premium Worm Castings: 75-150 lbs per mature tree annually</div>
              <div class="protocol-item">Dairy Compost: 150-300 lbs per tree for soil structure</div>
              <div class="protocol-item">Calcium-rich amendments for fruit quality</div>
            </div>
          </div>

          <div class="highlight-box">
            <div class="highlight-text">
              <strong>Key Benefits:</strong> Our protocol enhances fruit size and quality, improves tree vigor for better disease resistance, supports consistent annual production, and helps trees withstand Arizona's temperature extremes and water stress.
            </div>
          </div>

          <p class="message">Let's develop a protocol tailored to your apple varieties, tree age, and soil conditions for maximum yield and quality.</p>
          <p style="text-align: center;">
            <a href="${baseUrl}/contact" class="button">Start Your Apple Protocol</a>
          </p>
          <p style="text-align: center; margin-top: 20px; color: #666; font-size: 14px;">Call us: <strong>${COMPANY_PHONE}</strong></p>
        </div>
        <div class="footer">
          <p>${COMPANY_PHONE} • Flagstaff, Arizona</p>
          <p>© ${new Date().getFullYear()} Soil Seed and Water</p>
        </div>
      </div>
    </body>
    </html>
  `;
  const text = `
SOIL, SEED, AND WATER
Specialized Protocol for Apple Orchards

${name ? `Hi ${name},` : "Hello Apple Grower,"}

Apple trees in Arizona require careful soil management to produce high-quality fruit. Our Apple Orchard Protocol addresses the specific challenges of growing apples in our unique climate.

🍎 YOUR APPLE ORCHARD PROTOCOL

SOIL REQUIREMENTS
• Optimal pH: 6.0-7.0 (slightly acidic to neutral)
• Deep, well-drained soil for extensive root systems
• High organic matter: 4-6% for nutrient retention
• Good water-holding capacity with proper drainage

APPLICATION SCHEDULE
• Late Winter (January-February): Pre-bud break application
• Early Spring (March-April): Bloom and fruit set support
• Early Fall (September): Post-harvest root development
• Apply in a 3-4 foot radius around tree base

RECOMMENDED PRODUCTS
• Premium Worm Castings: 75-150 lbs per mature tree annually
• Dairy Compost: 150-300 lbs per tree for soil structure
• Calcium-rich amendments for fruit quality

KEY BENEFITS: Our protocol enhances fruit size and quality, improves tree vigor for better disease resistance, supports consistent annual production, and helps trees withstand Arizona's temperature extremes.

Start Your Apple Protocol: ${baseUrl}/contact
Call: ${COMPANY_PHONE}

${COMPANY_PHONE} • Flagstaff, Arizona
© ${new Date().getFullYear()} Soil Seed and Water
  `;
  return sendEmail(email, "Apple Orchard Protocol: Maximize Quality & Yield", html, text);
}

// Peach Grower Email
export async function sendPeachGrowerEmail(email: string, name?: string) {
  const baseUrl = CLIENT_URL;
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; background: #f5f5f5; }
        .email-wrapper { max-width: 600px; margin: 0 auto; background: #ffffff; }
        .header { background: linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%); padding: 35px; text-align: center; }
        .logo { color: #ffffff; font-size: 26px; font-weight: 600; }
        .tagline { color: #fef3c7; font-size: 14px; margin-top: 8px; }
        .content { padding: 40px 30px; }
        .greeting { font-size: 24px; color: #1a1a1a; margin-bottom: 20px; font-weight: 500; }
        .message { font-size: 15px; color: #666; line-height: 1.8; margin-bottom: 20px; }
        .protocol-box { background: #fffbeb; padding: 30px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #f59e0b; }
        .protocol-title { font-size: 20px; color: #92400e; font-weight: 600; margin-bottom: 20px; }
        .protocol-section { margin: 20px 0; }
        .section-subtitle { font-size: 16px; color: #b45309; font-weight: 600; margin-bottom: 10px; }
        .protocol-item { margin: 10px 0; color: #78350f; font-size: 14px; padding-left: 20px; position: relative; }
        .protocol-item:before { content: "•"; position: absolute; left: 0; color: #f59e0b; font-weight: bold; }
        .highlight-box { background: #fef3c7; padding: 25px; border-radius: 8px; margin: 25px 0; }
        .highlight-text { color: #92400e; font-size: 15px; line-height: 1.8; }
        .button { display: inline-block; background: #f59e0b; color: #ffffff !important; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 500; margin: 20px 0; }
        .footer { text-align: center; padding: 30px; background: #f9fafb; color: #999; font-size: 13px; border-top: 1px solid #e5e7eb; }
        @media only screen and (max-width: 600px) {
          .content { padding: 30px 20px; }
        }
      </style>
    </head>
    <body>
      <div class="email-wrapper">
        <div class="header">
          <h1 class="logo">Soil Seed and Water</h1>
          <p class="tagline">Specialized Protocol for Peach Orchards</p>
        </div>
        <div class="content">
          <h2 class="greeting">${name ? `Hi ${name},` : "Hello Peach Grower,"}</h2>
          <p class="message">Peach trees thrive with proper soil nutrition and structure. Our Peach Orchard Protocol is designed to help you achieve sweet, juicy peaches with consistent production year after year.</p>
          
          <div class="protocol-box">
            <div class="protocol-title">🌳 Your Peach Orchard Protocol</div>
            
            <div class="protocol-section">
              <div class="section-subtitle">Soil Requirements</div>
              <div class="protocol-item">Optimal pH: 6.0-6.5 (slightly acidic)</div>
              <div class="protocol-item">Well-drained, sandy loam to loam soil preferred</div>
              <div class="protocol-item">Organic matter: 3-5% for nutrient availability</div>
              <div class="protocol-item">Good aeration for healthy root development</div>
            </div>

            <div class="protocol-section">
              <div class="section-subtitle">Application Schedule</div>
              <div class="protocol-item">Late Winter (February): Pre-bloom soil preparation</div>
              <div class="protocol-item">Early Spring (March-April): Bloom and fruit development</div>
              <div class="protocol-item">Post-Harvest (July-August): Tree recovery and next season prep</div>
              <div class="protocol-item">Apply in a 2-3 foot radius from trunk, extending to drip line</div>
            </div>

            <div class="protocol-section">
              <div class="section-subtitle">Recommended Products</div>
              <div class="protocol-item">Premium Worm Castings: 50-100 lbs per tree annually</div>
              <div class="protocol-item">Dairy Compost: 100-200 lbs per tree for soil health</div>
              <div class="protocol-item">Potassium-rich amendments for fruit sweetness</div>
            </div>
          </div>

          <div class="highlight-box">
            <div class="highlight-text">
              <strong>Key Benefits:</strong> Our protocol promotes larger, sweeter fruit, improves tree health for better disease resistance, supports consistent annual bearing, and helps trees recover quickly after harvest for next season's production.
            </div>
          </div>

          <p class="message">Let's create a custom protocol for your peach varieties to maximize flavor, size, and production.</p>
          <p style="text-align: center;">
            <a href="${baseUrl}/contact" class="button">Get Your Peach Protocol</a>
          </p>
          <p style="text-align: center; margin-top: 20px; color: #666; font-size: 14px;">Call us: <strong>${COMPANY_PHONE}</strong></p>
        </div>
        <div class="footer">
          <p>${COMPANY_PHONE} • Flagstaff, Arizona</p>
          <p>© ${new Date().getFullYear()} Soil Seed and Water</p>
        </div>
      </div>
    </body>
    </html>
  `;
  const text = `
SOIL, SEED, AND WATER
Specialized Protocol for Peach Orchards

${name ? `Hi ${name},` : "Hello Peach Grower,"}

Peach trees thrive with proper soil nutrition and structure. Our Peach Orchard Protocol is designed to help you achieve sweet, juicy peaches with consistent production year after year.

🍑 YOUR PEACH ORCHARD PROTOCOL

SOIL REQUIREMENTS
• Optimal pH: 6.0-6.5 (slightly acidic)
• Well-drained, sandy loam to loam soil preferred
• Organic matter: 3-5% for nutrient availability
• Good aeration for healthy root development

APPLICATION SCHEDULE
• Late Winter (February): Pre-bloom soil preparation
• Early Spring (March-April): Bloom and fruit development
• Post-Harvest (July-August): Tree recovery and next season prep
• Apply in a 2-3 foot radius from trunk, extending to drip line

RECOMMENDED PRODUCTS
• Premium Worm Castings: 50-100 lbs per tree annually
• Dairy Compost: 100-200 lbs per tree for soil health
• Potassium-rich amendments for fruit sweetness

KEY BENEFITS: Our protocol promotes larger, sweeter fruit, improves tree health for better disease resistance, supports consistent annual bearing, and helps trees recover quickly after harvest.

Get Your Peach Protocol: ${baseUrl}/contact
Call: ${COMPANY_PHONE}

${COMPANY_PHONE} • Flagstaff, Arizona
© ${new Date().getFullYear()} Soil Seed and Water
  `;
  return sendEmail(email, "Peach Orchard Protocol: Sweet Success Awaits", html, text);
}

// Vineyard Email
export async function sendVineyardEmail(email: string, name?: string) {
  const baseUrl = CLIENT_URL;
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; background: #f5f5f5; }
        .email-wrapper { max-width: 600px; margin: 0 auto; background: #ffffff; }
        .header { background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%); padding: 35px; text-align: center; }
        .logo { color: #ffffff; font-size: 26px; font-weight: 600; }
        .tagline { color: #e9d5ff; font-size: 14px; margin-top: 8px; }
        .content { padding: 40px 30px; }
        .greeting { font-size: 24px; color: #1a1a1a; margin-bottom: 20px; font-weight: 500; }
        .message { font-size: 15px; color: #666; line-height: 1.8; margin-bottom: 20px; }
        .protocol-box { background: #faf5ff; padding: 30px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #7c3aed; }
        .protocol-title { font-size: 20px; color: #6b21a8; font-weight: 600; margin-bottom: 20px; }
        .protocol-section { margin: 20px 0; }
        .section-subtitle { font-size: 16px; color: #7e22ce; font-weight: 600; margin-bottom: 10px; }
        .protocol-item { margin: 10px 0; color: #581c87; font-size: 14px; padding-left: 20px; position: relative; }
        .protocol-item:before { content: "•"; position: absolute; left: 0; color: #a855f7; font-weight: bold; }
        .highlight-box { background: #f3e8ff; padding: 25px; border-radius: 8px; margin: 25px 0; }
        .highlight-text { color: #6b21a8; font-size: 15px; line-height: 1.8; }
        .button { display: inline-block; background: #7c3aed; color: #ffffff !important; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 500; margin: 20px 0; }
        .footer { text-align: center; padding: 30px; background: #f9fafb; color: #999; font-size: 13px; border-top: 1px solid #e5e7eb; }
        @media only screen and (max-width: 600px) {
          .content { padding: 30px 20px; }
        }
      </style>
    </head>
    <body>
      <div class="email-wrapper">
        <div class="header">
          <h1 class="logo">Soil Seed and Water</h1>
          <p class="tagline">Specialized Protocol for Vineyards</p>
        </div>
        <div class="content">
          <h2 class="greeting">${name ? `Hi ${name},` : "Hello Vineyard Owner,"}</h2>
          <p class="message">Premium wine grapes and table grapes demand exceptional soil health. Our Vineyard Protocol is designed to enhance terroir expression, improve grape quality, and support sustainable vineyard management.</p>
          
          <div class="protocol-box">
            <div class="protocol-title">🌳 Your Vineyard Protocol</div>
            
            <div class="protocol-section">
              <div class="section-subtitle">Soil Requirements</div>
              <div class="protocol-item">Optimal pH: 5.5-7.0 (varies by grape variety)</div>
              <div class="protocol-item">Well-drained soil with good water-holding capacity</div>
              <div class="protocol-item">Organic matter: 2-4% for balanced nutrition</div>
              <div class="protocol-item">Mineral balance critical for terroir expression</div>
            </div>

            <div class="protocol-section">
              <div class="section-subtitle">Application Schedule</div>
              <div class="protocol-item">Dormant Season (December-January): Pre-bud break preparation</div>
              <div class="protocol-item">Early Spring (March-April): Bud break and shoot development</div>
              <div class="protocol-item">Post-Harvest (September-October): Root development and recovery</div>
              <div class="protocol-item">Apply along vine rows, 12-18 inches from trunk</div>
            </div>

            <div class="protocol-section">
              <div class="section-subtitle">Recommended Products</div>
              <div class="protocol-item">Premium Worm Castings: 25-50 lbs per vine annually</div>
              <div class="protocol-item">Dairy Compost: 50-100 lbs per vine for soil structure</div>
              <div class="protocol-item">Custom blends based on soil analysis and grape variety</div>
            </div>
          </div>

          <div class="highlight-box">
            <div class="highlight-text">
              <strong>Key Benefits:</strong> Our protocol enhances grape quality and flavor complexity, improves vine health and longevity, supports balanced growth (not excessive vigor), helps manage water stress in Arizona's climate, and promotes beneficial soil microbiology for terroir development.
            </div>
          </div>

          <p class="message">Let's develop a vineyard protocol tailored to your grape varieties, soil type, and production goals for exceptional wine or table grapes.</p>
          <p style="text-align: center;">
            <a href="${baseUrl}/contact" class="button">Create Your Vineyard Protocol</a>
          </p>
          <p style="text-align: center; margin-top: 20px; color: #666; font-size: 14px;">Call us: <strong>${COMPANY_PHONE}</strong></p>
        </div>
        <div class="footer">
          <p>${COMPANY_PHONE} • Flagstaff, Arizona</p>
          <p>© ${new Date().getFullYear()} Soil Seed and Water</p>
        </div>
      </div>
    </body>
    </html>
  `;
  const text = `
SOIL, SEED, AND WATER
Specialized Protocol for Vineyards

${name ? `Hi ${name},` : "Hello Vineyard Owner,"}

Premium wine grapes and table grapes demand exceptional soil health. Our Vineyard Protocol is designed to enhance terroir expression, improve grape quality, and support sustainable vineyard management.

🍇 YOUR VINEYARD PROTOCOL

SOIL REQUIREMENTS
• Optimal pH: 5.5-7.0 (varies by grape variety)
• Well-drained soil with good water-holding capacity
• Organic matter: 2-4% for balanced nutrition
• Mineral balance critical for terroir expression

APPLICATION SCHEDULE
• Dormant Season (December-January): Pre-bud break preparation
• Early Spring (March-April): Bud break and shoot development
• Post-Harvest (September-October): Root development and recovery
• Apply along vine rows, 12-18 inches from trunk

RECOMMENDED PRODUCTS
• Premium Worm Castings: 25-50 lbs per vine annually
• Dairy Compost: 50-100 lbs per vine for soil structure
• Custom blends based on soil analysis and grape variety

KEY BENEFITS: Our protocol enhances grape quality and flavor complexity, improves vine health and longevity, supports balanced growth, helps manage water stress, and promotes beneficial soil microbiology for terroir development.

Create Your Vineyard Protocol: ${baseUrl}/contact
Call: ${COMPANY_PHONE}

${COMPANY_PHONE} • Flagstaff, Arizona
© ${new Date().getFullYear()} Soil Seed and Water
  `;
  return sendEmail(email, "Vineyard Protocol: Elevate Your Grape Quality", html, text);
}
