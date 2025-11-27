import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date"); // YYYY-MM-DD format
    const weekStart = searchParams.get("weekStart"); // YYYY-MM-DD format

    if (!date && !weekStart) {
      return NextResponse.json({ error: "date or weekStart parameter required" }, { status: 400 });
    }

    const supabase = createServerClient();

    // Get calendar settings
    const { data: settings } = await supabase.from("calendar_settings").select("*").single();

    const maxBookingsPerWeek = settings?.max_bookings_per_week || 5;
    const startTime = settings?.start_time || "06:00";
    const endTime = settings?.end_time || "14:00";
    const slotDuration = settings?.slot_duration || 30;
    const slotBufferTime = settings?.slot_buffer_time || 0; // Buffer time between slots
    const workingDays = settings?.working_days || [1, 2, 3, 4, 5]; // Mon-Fri
    const advanceBookingWindow = settings?.advance_booking_window || 0;
    const advanceBookingUnit = settings?.advance_booking_unit || "days";

    // Calculate week start (Monday)
    let weekStartDate: Date;
    if (weekStart) {
      weekStartDate = new Date(weekStart);
    } else if (date) {
      const checkDate = new Date(date);
      const dayOfWeek = checkDate.getDay();
      const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // If Sunday, go back 6 days
      weekStartDate = new Date(checkDate);
      weekStartDate.setDate(checkDate.getDate() + mondayOffset);
      weekStartDate.setHours(0, 0, 0, 0);
    } else {
      return NextResponse.json({ error: "Invalid date" }, { status: 400 });
    }

    const weekEndDate = new Date(weekStartDate);
    weekEndDate.setDate(weekStartDate.getDate() + 6);
    weekEndDate.setHours(23, 59, 59, 999);

    // Count bookings for this week
    const { count: weeklyBookings } = await supabase
      .from("bookings")
      .select("*", { count: "exact", head: true })
      .gte("scheduled_date", weekStartDate.toISOString().split("T")[0])
      .lte("scheduled_date", weekEndDate.toISOString().split("T")[0])
      .in("status", ["pending", "confirmed", "in_progress"]);

    const bookingsRemaining = maxBookingsPerWeek - (weeklyBookings || 0);

    // Get available time slots for the requested date
    let availableSlots: string[] = [];
    if (date) {
      const checkDate = new Date(date);
      // Use UTC day to avoid timezone shifts when parsing YYYY-MM-DD
      const dayOfWeek = checkDate.getUTCDay();

      // Check advance booking window
      const now = new Date();
      const minBookingDate = new Date(now);
      if (advanceBookingUnit === "hours") {
        minBookingDate.setHours(now.getHours() + advanceBookingWindow);
      } else {
        minBookingDate.setDate(now.getDate() + advanceBookingWindow);
        minBookingDate.setHours(0, 0, 0, 0);
      }
      checkDate.setHours(0, 0, 0, 0);

      const isWithinAdvanceWindow = checkDate >= minBookingDate;

      // Only generate slots if it's a working day AND we haven't reached the weekly limit AND it's within advance booking window
      if (workingDays.includes(dayOfWeek) && bookingsRemaining > 0 && isWithinAdvanceWindow) {
        const [startHour, startMin] = startTime.split(":").map(Number);
        const [endHour, endMin] = endTime.split(":").map(Number);

        const startMinutes = startHour * 60 + startMin;
        const endMinutes = endHour * 60 + endMin;

        // Generate slots with buffer time between them
        // Total time per slot = slotDuration + slotBufferTime
        const totalSlotTime = slotDuration + slotBufferTime;

        for (let minutes = startMinutes; minutes < endMinutes; minutes += totalSlotTime) {
          // Check if there's enough time for a full slot (duration + buffer)
          if (minutes + slotDuration > endMinutes) break;

          const hour = Math.floor(minutes / 60);
          const min = minutes % 60;
          const timeString = `${hour.toString().padStart(2, "0")}:${min.toString().padStart(2, "0")}`;

          // Check if this slot overlaps with any existing booking
          // Need to check if any booking exists in the time range [slotStart, slotStart + slotDuration + buffer]
          const slotStartMinutes = minutes;
          const slotEndMinutes = minutes + slotDuration + slotBufferTime;

          // Get all bookings for this date
          const { data: dateBookings } = await supabase
            .from("bookings")
            .select("scheduled_time")
            .eq("scheduled_date", date)
            .in("status", ["pending", "confirmed", "in_progress"]);

          // Check if this slot overlaps with any existing booking
          let hasOverlap = false;
          if (dateBookings) {
            for (const booking of dateBookings) {
              const [bookingHour, bookingMin] = booking.scheduled_time.split(":").map(Number);
              const bookingStartMinutes = bookingHour * 60 + bookingMin;
              const bookingEndMinutes = bookingStartMinutes + slotDuration + slotBufferTime;

              // Check for overlap: slot overlaps if it starts before booking ends and ends after booking starts
              if (slotStartMinutes < bookingEndMinutes && slotEndMinutes > bookingStartMinutes) {
                hasOverlap = true;
                break;
              }
            }
          }

          if (!hasOverlap) {
            availableSlots.push(timeString);
          }
        }
      }
    }

    return NextResponse.json({
      weekStart: weekStartDate.toISOString().split("T")[0],
      weekEnd: weekEndDate.toISOString().split("T")[0],
      weeklyBookings: weeklyBookings || 0,
      maxBookingsPerWeek,
      bookingsRemaining,
      availableSlots,
      workingDays,
      advanceBookingWindow,
      advanceBookingUnit,
    });
  } catch (error) {
    console.error("Error checking availability:", error);
    return NextResponse.json({ error: "Failed to check availability" }, { status: 500 });
  }
}
