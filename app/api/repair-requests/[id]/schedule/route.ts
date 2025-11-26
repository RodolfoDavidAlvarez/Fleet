import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { repairRequestDB } from "@/lib/db";
import { notifyAdminOfRepair, sendRepairBookingLink } from "@/lib/twilio";

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
      process.env.BOOKING_BASE_URL ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      request.headers.get("origin") ||
      "http://localhost:3000";
    const link = new URL("/booking", baseUrl);
    link.searchParams.set("repairRequestId", existing.id);
    link.searchParams.set("driverName", existing.driverName);
    if (existing.driverPhone) link.searchParams.set("driverPhone", existing.driverPhone);
    if (existing.vehicleIdentifier) link.searchParams.set("vehicleInfo", existing.vehicleIdentifier);
    if (parsed.data.serviceType || existing.aiCategory) {
      link.searchParams.set("serviceType", parsed.data.serviceType || existing.aiCategory || "Repair booking");
    }

    const suggestedSlot =
      parsed.data.suggestedDate && parsed.data.suggestedTime
        ? `${parsed.data.suggestedDate} • ${parsed.data.suggestedTime}`
        : undefined;

    const updated = await repairRequestDB.update(existing.id, {
      status: "waiting_booking",
      bookingLink: link.toString(),
      scheduledDate: parsed.data.suggestedDate,
      scheduledTime: parsed.data.suggestedTime,
    });

    if (existing.driverPhone) {
      await sendRepairBookingLink(existing.driverPhone, {
        requestId: existing.id,
        link: link.toString(),
        issueSummary: existing.description.slice(0, 120),
        language: existing.preferredLanguage,
        suggestedSlot,
      });
    }

    await notifyAdminOfRepair({
      requestId: existing.id,
      driverName: existing.driverName,
      driverPhone: existing.driverPhone,
      urgency: existing.urgency,
    });

    return NextResponse.json({ request: updated || existing, link: link.toString() });
  } catch (error) {
    console.error("Failed to send booking link", error);
    return NextResponse.json({ error: "Failed to send booking link" }, { status: 500 });
  }
}
