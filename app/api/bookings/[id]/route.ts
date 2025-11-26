import { NextRequest, NextResponse } from "next/server";
import { bookingDB, repairRequestDB } from "@/lib/db";
import { sendStatusUpdate } from "@/lib/twilio";
import { z } from "zod";

const bookingUpdateSchema = z.object({
  customerName: z.string().optional(),
  customerEmail: z.string().email().optional(),
  customerPhone: z.string().optional(),
  serviceType: z.string().optional(),
  scheduledDate: z.string().optional(),
  scheduledTime: z.string().optional(),
  status: z.enum(["pending", "confirmed", "in_progress", "completed", "cancelled"]).optional(),
  mechanicId: z.string().optional(),
  vehicleId: z.string().optional(),
  vehicleInfo: z.string().optional(),
  smsConsent: z.boolean().optional(),
  complianceAccepted: z.boolean().optional(),
  notes: z.string().optional(),
  repairRequestId: z.string().uuid().optional(),
});

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const booking = await bookingDB.getById(params.id);
    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }
    return NextResponse.json({ booking });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch booking" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const json = await request.json();
    const parsed = bookingUpdateSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    // Get current booking to compare status
    const currentBooking = await bookingDB.getById(params.id);
    if (!currentBooking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    const booking = await bookingDB.update(params.id, parsed.data);

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // Send SMS if status changed
    if (parsed.data.status && parsed.data.status !== currentBooking.status) {
      await sendStatusUpdate(booking.customerPhone, parsed.data.status, booking.id);
    }

    const linkedRequestId = parsed.data.repairRequestId || booking.repairRequestId;
    if (linkedRequestId) {
      await repairRequestDB.update(linkedRequestId, {
        bookingId: booking.id,
        status:
          parsed.data.status === "completed"
            ? "completed"
            : parsed.data.status === "cancelled"
            ? "cancelled"
            : "scheduled",
        scheduledDate: booking.scheduledDate,
        scheduledTime: booking.scheduledTime,
      });
    }

    return NextResponse.json({ booking });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update booking" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const success = await bookingDB.delete(params.id);
    if (!success) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }
    return NextResponse.json({ message: "Booking deleted" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete booking" }, { status: 500 });
  }
}
