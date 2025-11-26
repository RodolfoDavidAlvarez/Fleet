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

    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.NEXTAUTH_URL ||
      process.env.BOOKING_BASE_URL ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      request.headers.get("origin") ||
      "http://localhost:3000";
    
    // Use the specialized booking link page
    const bookingLink = `${baseUrl}/booking-link/${existing.id}?name=${encodeURIComponent(existing.driverName)}&phone=${encodeURIComponent(existing.driverPhone || '')}`;

    const suggestedSlot =
      parsed.data.suggestedDate && parsed.data.suggestedTime
        ? `${parsed.data.suggestedDate} • ${parsed.data.suggestedTime}`
        : undefined;

    const updated = await repairRequestDB.update(existing.id, {
      status: "waiting_booking",
      bookingLink: bookingLink,
      scheduledDate: parsed.data.suggestedDate,
      scheduledTime: parsed.data.suggestedTime,
    });

    if (existing.driverPhone) {
      await sendRepairBookingLink(existing.driverPhone, {
        requestId: existing.id,
        link: bookingLink,
        issueSummary: existing.description.slice(0, 120),
        language: existing.preferredLanguage,
        suggestedSlot,
      });
    }

    // Send email with booking link if email provided
    if (existing.driverEmail) {
      await sendRepairBookingLinkEmail(existing.driverEmail, {
        driverName: existing.driverName,
        requestId: existing.id,
        link: bookingLink,
        issueSummary: existing.description.slice(0, 120),
        language: existing.preferredLanguage,
        suggestedSlot,
      });
    }

    // We don't need to notify admin again that they sent the link, but we could log it
    // await notifyAdminOfRepair(...) 

    return NextResponse.json({ request: updated || existing, link: bookingLink });
  } catch (error) {
    console.error("Failed to send booking link", error);
    return NextResponse.json({ error: "Failed to send booking link" }, { status: 500 });
  }
}
