import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { bookingDB, repairRequestDB } from "@/lib/db";
import { sendBookingConfirmation } from "@/lib/twilio";
import { sendBookingConfirmationEmail, notifyAdminNewBooking } from "@/lib/email";
import { createClient } from "@/lib/supabase/server";
import { createServerClient as createServiceClient } from "@/lib/supabase";
import { formatDateInputLocal, parseDateOnlyLocal } from "@/lib/utils";

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

const ACTIVE_BOOKING_STATUSES = ["pending", "confirmed", "in_progress"];

function getWeekBounds(dateString: string) {
  const checkDate = parseDateOnlyLocal(dateString);
  const dayOfWeek = checkDate.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const weekStart = new Date(checkDate);
  weekStart.setDate(checkDate.getDate() + mondayOffset);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);

  return {
    weekStart: formatDateInputLocal(weekStart),
    weekEnd: formatDateInputLocal(weekEnd),
  };
}

function timeToMinutes(time: string): number | null {
  const [hoursRaw, minutesRaw] = time.split(":");
  const hours = Number(hoursRaw);
  const minutes = Number(minutesRaw);

  if (!Number.isInteger(hours) || !Number.isInteger(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    return null;
  }

  return hours * 60 + minutes;
}

async function validateBookingAvailability(
  supabase: ReturnType<typeof createServiceClient>,
  scheduledDate: string,
  scheduledTime: string
): Promise<{ ok: true } | { ok: false; status: number; error: string }> {
  const requestedStartMinutes = timeToMinutes(scheduledTime);
  if (requestedStartMinutes === null) {
    return { ok: false, status: 400, error: "Invalid scheduled time." };
  }

  const { data: settings } = await supabase.from("calendar_settings").select("*").single();

  const maxBookingsPerWeek = settings?.max_bookings_per_week || 5;
  const startTime = settings?.start_time || "06:00";
  const endTime = settings?.end_time || "14:00";
  const slotDuration = settings?.slot_duration || 30;
  const slotBufferTime = settings?.slot_buffer_time || 0;
  const workingDays = settings?.working_days || [1, 2, 3, 4, 5];
  const advanceBookingWindow = settings?.advance_booking_window || 0;
  const advanceBookingUnit = settings?.advance_booking_unit || "days";

  const requestedDate = parseDateOnlyLocal(scheduledDate);
  const dayOfWeek = requestedDate.getDay();
  if (!workingDays.includes(dayOfWeek)) {
    return { ok: false, status: 409, error: "Selected date is not available for bookings." };
  }

  const now = new Date();
  const minBookingDate = new Date(now);
  if (advanceBookingUnit === "hours") {
    minBookingDate.setHours(now.getHours() + advanceBookingWindow);
  } else {
    minBookingDate.setDate(now.getDate() + advanceBookingWindow);
    minBookingDate.setHours(0, 0, 0, 0);
  }
  const requestedDateForCompare = parseDateOnlyLocal(scheduledDate);
  requestedDateForCompare.setHours(0, 0, 0, 0);

  if (requestedDateForCompare < minBookingDate) {
    return { ok: false, status: 409, error: "Selected date is no longer available." };
  }

  const startMinutes = timeToMinutes(startTime);
  const endMinutes = timeToMinutes(endTime);
  if (startMinutes === null || endMinutes === null) {
    return { ok: false, status: 500, error: "Calendar settings are invalid." };
  }

  if (requestedStartMinutes < startMinutes || requestedStartMinutes + slotDuration > endMinutes) {
    return { ok: false, status: 409, error: "Selected time is outside booking hours." };
  }

  const { weekStart, weekEnd } = getWeekBounds(scheduledDate);
  const { count: weeklyBookings } = await supabase
    .from("bookings")
    .select("*", { count: "exact", head: true })
    .gte("scheduled_date", weekStart)
    .lte("scheduled_date", weekEnd)
    .in("status", ACTIVE_BOOKING_STATUSES);

  if ((weeklyBookings || 0) >= maxBookingsPerWeek) {
    return { ok: false, status: 409, error: "This week is fully booked." };
  }

  const { data: dateBookings } = await supabase
    .from("bookings")
    .select("scheduled_time")
    .eq("scheduled_date", scheduledDate)
    .in("status", ACTIVE_BOOKING_STATUSES);

  const requestedEndMinutes = requestedStartMinutes + slotDuration + slotBufferTime;
  const hasOverlap = (dateBookings || []).some((booking) => {
    if (!booking.scheduled_time) return false;
    const bookingStartMinutes = timeToMinutes(booking.scheduled_time);
    if (bookingStartMinutes === null) return false;
    const bookingEndMinutes = bookingStartMinutes + slotDuration + slotBufferTime;
    return requestedStartMinutes < bookingEndMinutes && requestedEndMinutes > bookingStartMinutes;
  });

  if (hasOverlap) {
    return { ok: false, status: 409, error: "Selected time is no longer available." };
  }

  return { ok: true };
}

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

    const serviceSupabase = createServiceClient();
    const availability = await validateBookingAvailability(serviceSupabase, parsed.data.scheduledDate, parsed.data.scheduledTime);
    if (!availability.ok) {
      return NextResponse.json({ error: availability.error }, { status: availability.status });
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

    // Notify admins based on notification assignments ONLY
    try {
      const supabase = await createClient();
      const { data: assignments } = await supabase
        .from("notification_assignments")
        .select("notification_type, admin_user_ids")
        .eq("notification_type", "email_admin_new_booking")
        .single();

      if (assignments && assignments.admin_user_ids && assignments.admin_user_ids.length > 0) {
        const { data: assignedAdmins } = await supabase
          .from("users")
          .select("id, email")
          .in("id", assignments.admin_user_ids);

        if (assignedAdmins && assignedAdmins.length > 0) {
          assignedAdmins.forEach((admin: { id: string; email: string }) => {
            if (admin.email) {
              asyncNotifications.push(
                notifyAdminNewBooking(admin.email, {
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
            }
          });
        }
      }
    } catch (err) {
      console.error("Failed to fetch booking notification assignments:", err);
    }

    Promise.allSettled(asyncNotifications).catch((err) => {
      console.error("Background booking notifications failed", err);
    });

    return NextResponse.json({ booking }, { status: 201 });
  } catch (error) {
    console.error("Booking creation error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: "Failed to create booking", details: errorMessage }, { status: 500 });
  }
}
