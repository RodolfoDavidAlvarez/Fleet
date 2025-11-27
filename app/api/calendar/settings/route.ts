import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { z } from "zod";

const settingsSchema = z.object({
  maxBookingsPerWeek: z.number().int().min(1).max(20),
  startTime: z.string().regex(/^\d{2}:\d{2}$/), // HH:MM format
  endTime: z.string().regex(/^\d{2}:\d{2}$/), // HH:MM format
  slotDuration: z.number().int().min(15).max(120), // minutes
  slotBufferTime: z.number().int().min(0).max(60).optional(), // buffer time between slots
  workingDays: z.array(z.number().int().min(0).max(6)), // 0=Sunday, 1=Monday, etc.
  advanceBookingWindow: z.number().int().min(0).optional(),
  advanceBookingUnit: z.enum(["hours", "days"]).optional(),
});

export async function GET() {
  try {
    const supabase = createServerClient();

    // Get calendar settings (store in a settings table or use environment defaults)
    const { data, error } = await supabase.from("calendar_settings").select("*").single();

    if (error && error.code !== "PGRST116") {
      // PGRST116 = no rows returned
      console.error("Error fetching calendar settings:", error);
    }

    // Default settings
    const defaults = {
      maxBookingsPerWeek: 5,
      startTime: "06:00",
      endTime: "14:00",
      slotDuration: 30,
      slotBufferTime: 0,
      workingDays: [1, 2, 3, 4, 5], // Monday to Friday
      advanceBookingWindow: 0,
      advanceBookingUnit: "days",
    };

    return NextResponse.json({
      settings: data || defaults,
    });
  } catch (error) {
    console.error("Error fetching calendar settings:", error);
    return NextResponse.json({
      settings: {
        maxBookingsPerWeek: 5,
        startTime: "06:00",
        endTime: "14:00",
        slotDuration: 30,
        slotBufferTime: 0,
        workingDays: [1, 2, 3, 4, 5],
        advanceBookingWindow: 0,
        advanceBookingUnit: "days",
      },
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const json = await request.json();
    const parsed = settingsSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const supabase = createServerClient();

    // Upsert calendar settings
    const { data, error } = await supabase
      .from("calendar_settings")
      .upsert({
        id: "default",
        max_bookings_per_week: parsed.data.maxBookingsPerWeek,
        start_time: parsed.data.startTime,
        end_time: parsed.data.endTime,
        slot_duration: parsed.data.slotDuration,
        working_days: parsed.data.workingDays,
        advance_booking_window: parsed.data.advanceBookingWindow ?? 0,
        advance_booking_unit: parsed.data.advanceBookingUnit ?? "days",
        slot_buffer_time: parsed.data.slotBufferTime ?? 0,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error("Error saving calendar settings:", error);
      return NextResponse.json({ error: "Failed to save calendar settings" }, { status: 500 });
    }

    return NextResponse.json({
      settings: {
        maxBookingsPerWeek: data.max_bookings_per_week,
        startTime: data.start_time,
        endTime: data.end_time,
        slotDuration: data.slot_duration,
        workingDays: data.working_days,
        advanceBookingWindow: data.advance_booking_window ?? 0,
        advanceBookingUnit: data.advance_booking_unit ?? "days",
        slotBufferTime: data.slot_buffer_time ?? 0,
      },
    });
  } catch (error) {
    console.error("Error saving calendar settings:", error);
    return NextResponse.json({ error: "Failed to save calendar settings" }, { status: 500 });
  }
}
