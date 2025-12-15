import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { repairRequestDB } from "@/lib/db";
import { notifyAdminOfRepair, sendRepairBookingLink } from "@/lib/twilio";
import { sendRepairBookingLinkEmail } from "@/lib/email";

const scheduleSchema = z.object({
  serviceType: z.string().optional(),
  suggestedDate: z.string().optional(),
  suggestedTime: z.string().optional(),
});

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const json = await request.json().catch(() => ({}));
    const parsed = scheduleSchema.safeParse(json || {});
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const existing = await repairRequestDB.getById(params.id);
    if (!existing) {
      return NextResponse.json({ error: "Repair request not found" }, { status: 404 });
    }

    // Prevent duplicate sends - if already sent recently (within last 5 seconds), return existing
    if (existing.bookingLinkSentAt) {
      const sentAt = new Date(existing.bookingLinkSentAt);
      const now = new Date();
      const secondsSinceSent = (now.getTime() - sentAt.getTime()) / 1000;

      if (secondsSinceSent < 5) {
        // Recently sent, return existing without sending again
        return NextResponse.json({
          request: existing,
          link: existing.bookingLink,
          message: "Booking link was already sent recently",
        });
      }
    }

    // Get base URL - prioritize production URL, warn if falling back to localhost
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.NEXTAUTH_URL ||
      process.env.BOOKING_BASE_URL ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      request.headers.get("origin");

    // In production, we must have a proper base URL
    if (!baseUrl || baseUrl.includes("localhost")) {
      const isProduction = process.env.NODE_ENV === "production" || process.env.VERCEL_ENV === "production";
      if (isProduction) {
        console.error("CRITICAL: No production base URL configured. Set NEXT_PUBLIC_APP_URL environment variable.");
        return NextResponse.json(
          {
            error: "Booking link cannot be generated. Please contact support.",
            details: "Server configuration error: missing base URL",
          },
          { status: 500 }
        );
      }
      // In development, use localhost as fallback
      console.warn("Using localhost for booking link - this is only acceptable in development");
    }

    const finalBaseUrl = baseUrl || "http://localhost:3000";

    // Use custom phone if provided, otherwise use existing phone
    const phoneToUse = (parsed.data as any).customPhone || existing.driverPhone;

    // Use the specialized booking link page - use finalBaseUrl
    // NOTE: Do NOT include phone number in URL - iOS detects phone numbers and breaks the link
    // The booking page will fetch the phone from the repair request instead
    const bookingLink = `${finalBaseUrl}/booking-link/${existing.id}?name=${encodeURIComponent(existing.driverName)}`;

    const suggestedSlot =
      parsed.data.suggestedDate && parsed.data.suggestedTime ? `${parsed.data.suggestedDate} • ${parsed.data.suggestedTime}` : undefined;

    // Update repair request, including phone if changed
    const updateData: any = {
      status: "waiting_booking",
      bookingLink: bookingLink,
      bookingLinkSentAt: new Date().toISOString(),
      scheduledDate: parsed.data.suggestedDate,
      scheduledTime: parsed.data.suggestedTime,
    };

    // Update phone number if custom phone was provided
    if ((parsed.data as any).customPhone && (parsed.data as any).customPhone !== existing.driverPhone) {
      updateData.driverPhone = (parsed.data as any).customPhone;
    }

    const updated = await repairRequestDB.update(existing.id, updateData);

    let smsSuccess = true;
    let emailSuccess = true;
    let smsError = null;
    let emailError = null;

    // Try to send SMS if phone number provided AND user consented to SMS
    // Note: For booking links, we check the existing record's smsConsent (if tracked)
    // Since admin is explicitly sending this link, we allow it but log if no consent
    if (phoneToUse) {
      // Check if smsConsent exists on the repair request
      const hasSmsConsent = (existing as any).smsConsent !== false;
      if (!hasSmsConsent) {
        console.warn(`Sending booking link SMS to ${existing.id} - smsConsent not explicitly granted`);
      }

      try {
        smsSuccess = await sendRepairBookingLink(phoneToUse, {
          requestId: existing.id,
          requestNumber: existing.requestNumber,
          link: bookingLink,
          issueSummary: existing.description.slice(0, 120),
          language: existing.preferredLanguage,
          suggestedSlot,
        });
        if (!smsSuccess) {
          smsError = "SMS failed to send - please check Twilio configuration";
        }
      } catch (error) {
        smsSuccess = false;
        smsError = "SMS service error - please verify Twilio credentials";
        console.error("SMS sending error:", error);
      }
    }

    // Try to send email if email provided
    if (existing.driverEmail) {
      try {
        await sendRepairBookingLinkEmail(existing.driverEmail, {
          driverName: existing.driverName,
          requestId: existing.id,
          requestNumber: existing.requestNumber,
          link: bookingLink,
          issueSummary: existing.description.slice(0, 120),
          language: existing.preferredLanguage,
          suggestedSlot,
        });
      } catch (error) {
        emailSuccess = false;
        emailError = "Email failed to send";
        console.error("Email sending error:", error);
      }
    }

    return NextResponse.json({
      request: updated || existing,
      link: bookingLink,
      smsSuccess,
      emailSuccess,
      smsError,
      emailError,
      warnings: [...(smsError ? [smsError] : []), ...(emailError ? [emailError] : [])].filter(Boolean),
    });
  } catch (error) {
    console.error("Failed to send booking link", error);
    return NextResponse.json({ error: "Failed to send booking link" }, { status: 500 });
  }
}
