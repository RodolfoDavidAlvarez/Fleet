import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { bookingDB, repairRequestDB } from "@/lib/db";
import { sendBookingConfirmation } from "@/lib/twilio";
import { sendBookingConfirmationEmail, notifyAdminNewBooking } from "@/lib/email";

const bookingSchema = z.object({
  customerName: z.string().min(1, "customerName is required"),
  customerEmail: z.string().email("customerEmail must be a valid email").optional(),
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
    
    // Fetch repair request data for bookings that have repairRequestId
    const bookingsWithRepairRequests = await Promise.all(
      bookings.map(async (booking) => {
        if (booking.repairRequestId) {
          try {
            const repairRequest = await repairRequestDB.getById(booking.repairRequestId);
            return {
              ...booking,
              repairRequest: repairRequest ? {
                id: repairRequest.id,
                status: repairRequest.status,
                urgency: repairRequest.urgency,
                description: repairRequest.description,
                aiCategory: repairRequest.aiCategory,
              } : null,
            };
          } catch (err) {
            console.error(`Error fetching repair request for booking ${booking.id}:`, err);
            return { ...booking, repairRequest: null };
          }
        }
        return { ...booking, repairRequest: null };
      })
    );
    
    return NextResponse.json({ bookings: bookingsWithRepairRequests });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch bookings" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const json = await request.json();
    // Transform empty email strings to undefined
    if (json.customerEmail === "" || json.customerEmail === null) {
      json.customerEmail = undefined;
    }
    const parsed = bookingSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    if (parsed.data.complianceAccepted !== true) {
      return NextResponse.json({ error: "SMS compliance acknowledgment is required before booking." }, { status: 400 });
    }

    // Check if repair request already has a booking (prevent duplicate bookings)
    if (parsed.data.repairRequestId) {
      const repairRequest = await repairRequestDB.getById(parsed.data.repairRequestId);
      if (!repairRequest) {
        return NextResponse.json({ error: "Repair request not found" }, { status: 404 });
      }
      
      // If repair request already has a booking, prevent creating another one
      if (repairRequest.bookingId) {
        // Check if the booking still exists
        try {
          const existingBooking = await bookingDB.getById(repairRequest.bookingId);
          if (existingBooking) {
            return NextResponse.json({ 
              error: "This repair request already has a booking. The booking link can only be used once.",
              existingBookingId: repairRequest.bookingId 
            }, { status: 409 }); // 409 Conflict
          }
        } catch (err) {
          // Booking doesn't exist, allow creating a new one
          console.warn("Existing booking ID not found, allowing new booking creation");
        }
      }
    }

    const { smsConsent, complianceAccepted, vehicleInfo, notes, ...bookingData } = parsed.data;
    const asyncNotifications: Promise<unknown>[] = [];

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

    // Send email confirmation to customer (only if email provided)
    if (parsed.data.customerEmail) {
      asyncNotifications.push(
        sendBookingConfirmationEmail(parsed.data.customerEmail, {
          customerName: parsed.data.customerName,
          serviceType: parsed.data.serviceType,
          date: parsed.data.scheduledDate,
          time: parsed.data.scheduledTime,
          bookingId: booking.id,
          vehicleInfo: parsed.data.vehicleInfo,
          notes: parsed.data.notes,
        })
      );
    }

    // Notify admin of new booking
    const adminEmail = process.env.ADMIN_EMAIL || 'ralvarez@bettersystems.ai';
    asyncNotifications.push(
      notifyAdminNewBooking(adminEmail, {
        bookingId: booking.id,
        customerName: parsed.data.customerName,
        customerEmail: parsed.data.customerEmail,
        customerPhone: parsed.data.customerPhone,
        serviceType: parsed.data.serviceType,
        date: parsed.data.scheduledDate,
        time: parsed.data.scheduledTime,
        vehicleInfo: parsed.data.vehicleInfo,
      })
    );

    Promise.allSettled(asyncNotifications).catch((err) => {
      console.error("Background booking notifications failed", err);
    });

    return NextResponse.json({ booking }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create booking" }, { status: 500 });
  }
}
