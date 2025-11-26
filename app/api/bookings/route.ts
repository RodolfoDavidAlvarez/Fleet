import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { bookingDB, repairRequestDB } from "@/lib/db";
import { sendBookingConfirmation } from "@/lib/twilio";
import { sendBookingConfirmationEmail, notifyAdminNewBooking } from "@/lib/email";

const bookingSchema = z.object({
  customerName: z.string().min(1, "customerName is required"),
  customerEmail: z.string().email("customerEmail must be a valid email"),
  customerPhone: z.string().min(6, "customerPhone is required"),
  serviceType: z.string().min(1, "serviceType is required"),
  scheduledDate: z.string().min(1, "scheduledDate is required"),
  scheduledTime: z.string().min(1, "scheduledTime is required"),
  vehicleInfo: z.string().optional(),
  notes: z.string().optional(),
  smsConsent: z.boolean().optional(),
  complianceAccepted: z.boolean().optional(),
  vehicleId: z.string().optional(),
  repairRequestId: z.string().uuid().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const mechanicId = searchParams.get("mechanicId") || undefined;
    const bookings = await bookingDB.getAll(mechanicId ? { mechanicId } : undefined);
    return NextResponse.json({ bookings });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch bookings" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const json = await request.json();
    const parsed = bookingSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    if (parsed.data.complianceAccepted !== true) {
      return NextResponse.json({ error: "SMS compliance acknowledgment is required before booking." }, { status: 400 });
    }

    const { smsConsent, complianceAccepted, vehicleInfo, notes, ...bookingData } = parsed.data;

    const complianceNote = [
      vehicleInfo ? `Vehicle: ${vehicleInfo}` : null,
      notes || null,
      smsConsent !== undefined ? `SMS consent: ${smsConsent ? "opted-in" : "declined"}` : null,
      complianceAccepted ? "Compliance acknowledged" : null,
    ]
      .filter(Boolean)
      .join("\n");

    const booking = await bookingDB.create({
      ...bookingData,
      notes: complianceNote || undefined,
      status: "pending",
    });

    if (parsed.data.repairRequestId) {
      await repairRequestDB.update(parsed.data.repairRequestId, {
        bookingId: booking.id,
        status: "scheduled",
        scheduledDate: booking.scheduledDate,
        scheduledTime: booking.scheduledTime,
      });
    }

    // Send SMS confirmation if consented
    if (parsed.data.smsConsent !== false) {
      await sendBookingConfirmation(parsed.data.customerPhone, {
        serviceType: parsed.data.serviceType,
        date: parsed.data.scheduledDate,
        time: parsed.data.scheduledTime,
        bookingId: booking.id,
      });
    }

    // Send email confirmation to customer
    await sendBookingConfirmationEmail(parsed.data.customerEmail, {
      customerName: parsed.data.customerName,
      serviceType: parsed.data.serviceType,
      date: parsed.data.scheduledDate,
      time: parsed.data.scheduledTime,
      bookingId: booking.id,
      vehicleInfo: parsed.data.vehicleInfo,
      notes: parsed.data.notes,
    });

    // Notify admin of new booking
    const adminEmail = process.env.ADMIN_EMAIL || 'ralvarez@bettersystems.ai';
    await notifyAdminNewBooking(adminEmail, {
      bookingId: booking.id,
      customerName: parsed.data.customerName,
      customerEmail: parsed.data.customerEmail,
      customerPhone: parsed.data.customerPhone,
      serviceType: parsed.data.serviceType,
      date: parsed.data.scheduledDate,
      time: parsed.data.scheduledTime,
      vehicleInfo: parsed.data.vehicleInfo,
    });

    return NextResponse.json({ booking }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create booking" }, { status: 500 });
  }
}
