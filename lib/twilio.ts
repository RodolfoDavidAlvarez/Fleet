import twilio from "twilio";

// Helper function to check SMS enabled at runtime (not module load time)
// Handles string "true" (case-insensitive) and trims whitespace/newlines
function isSmsEnabled(): boolean {
  const value = process.env.ENABLE_SMS;
  if (!value) return false;
  // Trim whitespace and newlines, then check for "true" (case-insensitive)
  const trimmed = String(value).trim().toLowerCase();
  return trimmed === "true";
}

// Helper function to get Twilio client (recreated if needed)
function getTwilioClient(): twilio.Twilio | null {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const smsEnabled = isSmsEnabled();

  if (accountSid && authToken && smsEnabled) {
    return twilio(accountSid, authToken);
  }
  return null;
}

export async function sendSMS(to: string, message: string): Promise<boolean> {
  // Check SMS enabled at runtime, not module load time
  const smsEnabled = isSmsEnabled();

  if (!smsEnabled) {
    console.info("[SMS disabled] Would send to:", to, message);
    console.info("[SMS disabled] ENABLE_SMS value:", process.env.ENABLE_SMS);
    console.info("[SMS disabled] ENABLE_SMS type:", typeof process.env.ENABLE_SMS);
    console.info("[SMS disabled] ENABLE_SMS === 'true':", process.env.ENABLE_SMS === "true");
    return false;
  }

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const phoneNumber = process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken) {
    console.warn("Twilio credentials missing. Please set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN environment variables.");
    console.warn("TWILIO_ACCOUNT_SID:", accountSid ? "SET" : "MISSING");
    console.warn("TWILIO_AUTH_TOKEN:", authToken ? "SET" : "MISSING");
    return false;
  }

  if (!phoneNumber) {
    console.warn("TWILIO_PHONE_NUMBER missing. SMS would be sent to:", to, message);
    return false;
  }

  const client = getTwilioClient();
  if (!client) {
    console.warn("Twilio client not initialized. SMS would be sent to:", to, message);
    return false;
  }

  try {
    await client.messages.create({
      body: message,
      from: phoneNumber,
      to: to,
    });
    return true;
  } catch (error: any) {
    // Handle Twilio authentication errors gracefully
    if (error?.code === 20003) {
      console.warn("Twilio authentication failed. Please verify TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN are correct.");
    } else if (error?.status === 401) {
      console.warn("Twilio authentication error. Please check TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN in your environment variables.");
    } else if (error?.code === 21211) {
      console.warn("Invalid phone number format. Please check the recipient phone number.");
    } else if (error?.code === 21608) {
      console.warn("Twilio phone number not verified or invalid. Please check TWILIO_PHONE_NUMBER.");
    } else {
      console.error("Error sending SMS:", error?.message || error);
      console.error("Error code:", error?.code);
    }
    return false;
  }
}

export async function sendBookingConfirmation(
  phone: string,
  bookingDetails: {
    serviceType: string;
    date: string;
    time: string;
    bookingId: string;
  }
): Promise<boolean> {
  const message = `Your booking has been confirmed!\n\nService: ${bookingDetails.serviceType}\nDate: ${bookingDetails.date}\nTime: ${bookingDetails.time}\nBooking ID: ${bookingDetails.bookingId}\n\nThank you for choosing FleetPro!`;
  return sendSMS(phone, message);
}

export async function sendBookingReminder(
  phone: string,
  bookingDetails: {
    serviceType: string;
    date: string;
    time: string;
  }
): Promise<boolean> {
  const message = `Reminder: You have a service appointment tomorrow!\n\nService: ${bookingDetails.serviceType}\nDate: ${bookingDetails.date}\nTime: ${bookingDetails.time}\n\nSee you soon!`;
  return sendSMS(phone, message);
}

export async function sendStatusUpdate(phone: string, status: string, bookingId: string): Promise<boolean> {
  const message = `Your booking status has been updated!\n\nBooking ID: ${bookingId}\nStatus: ${status}\n\nCheck your booking for more details.`;
  return sendSMS(phone, message);
}

export async function sendJobCompletion(
  phone: string,
  jobDetails: {
    serviceType: string;
    totalCost: number;
    bookingId: string;
  }
): Promise<boolean> {
  const message = `Your service is complete!\n\nService: ${jobDetails.serviceType}\nTotal Cost: $${jobDetails.totalCost.toFixed(2)}\nBooking ID: ${jobDetails.bookingId}\n\nThank you for your business!`;
  return sendSMS(phone, message);
}

export async function sendRepairSubmissionNotice(
  phone: string,
  details: {
    requestId: string;
    requestNumber?: number;
    summary: string;
    language?: "en" | "es";
  }
): Promise<boolean> {
  // Use requestNumber if available (shorter), otherwise fall back to last 8 chars of UUID
  const displayId = details.requestNumber ? `#${details.requestNumber}` : `#${details.requestId.slice(-8)}`;

  const message =
    details.language === "es"
      ? `Solicitud de reparación recibida (${displayId}). Su solicitud ha sido enviada y será revisada pronto.`
      : `Repair request received (${displayId}). Your request has been submitted and will be reviewed soon.`;
  return sendSMS(phone, message);
}

export async function notifyAdminOfRepair(
  details: {
    requestId: string;
    driverName?: string;
    driverPhone?: string;
    urgency?: string;
  },
  toPhone?: string
) {
  const adminPhone = process.env.ADMIN_PHONE_NUMBER;
  const targetPhone = toPhone || adminPhone;
  if (!targetPhone) {
    return false;
  }
  const message = `New repair request #${details.requestId}\nDriver: ${details.driverName || "Unknown"} (${details.driverPhone || "n/a"})\nUrgency: ${details.urgency || "unspecified"}.`;
  return sendSMS(targetPhone, message);
}

export async function sendRepairBookingLink(
  phone: string,
  details: {
    requestId: string;
    requestNumber?: number;
    link: string;
    issueSummary: string;
    language?: "en" | "es";
    suggestedSlot?: string;
  }
) {
  // Use requestNumber if available (shorter), otherwise fall back to last 8 chars of UUID
  const displayId = details.requestNumber ? `#${details.requestNumber}` : `#${details.requestId.slice(-8)}`;

  const message =
    details.language === "es"
      ? `Agenda tu reparación (${displayId}): ${details.link}\nMotivo: ${details.issueSummary}${details.suggestedSlot ? `\nSugerencia: ${details.suggestedSlot}` : ""}`
      : `Book your repair (${displayId}): ${details.link}\nIssue: ${details.issueSummary}${details.suggestedSlot ? `\nSuggested: ${details.suggestedSlot}` : ""}`;
  return sendSMS(phone, message);
}

export async function sendRepairCompletion(
  phone: string,
  details: { requestId: string; summary: string; totalCost?: number; language?: "en" | "es" }
) {
  const costLine = details.totalCost ? `\nTotal: $${details.totalCost.toFixed(2)}` : "";
  const message =
    details.language === "es"
      ? `Reparación completada (#${details.requestId}). ${details.summary}${costLine}`
      : `Repair completed (#${details.requestId}). ${details.summary}${costLine}`;
  return sendSMS(phone, message);
}
