import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { jobDB, bookingDB } from "@/lib/db";
import { notifyMechanicAssignment } from "@/lib/email";
import { createServerClient } from "@/lib/supabase";

const jobSchema = z.object({
  bookingId: z.string().min(1),
  vehicleId: z.string().min(1),
  mechanicId: z.string().min(1),
  priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
  estimatedHours: z.coerce.number().nonnegative().optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  notes: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const mechanicId = searchParams.get("mechanicId");

    let jobs;
    if (mechanicId) {
      jobs = await jobDB.getByMechanic(mechanicId);
    } else {
      jobs = await jobDB.getAll();
    }

    return NextResponse.json({ jobs });
  } catch (error: any) {
    console.error("Error fetching jobs:", error);
    const errorMessage = error?.message || "Failed to fetch jobs";

    // Check if it's a missing environment variable error
    if (errorMessage.includes("SUPABASE_SERVICE_ROLE_KEY")) {
      return NextResponse.json(
        {
          error: "Database configuration error. Please check server logs.",
          details: "SUPABASE_SERVICE_ROLE_KEY is missing from environment variables.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        error: "Failed to fetch jobs",
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const json = await request.json();
    const parsed = jobSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const job = await jobDB.create({
      ...parsed.data,
      status: "assigned",
      priority: parsed.data.priority || "medium",
      estimatedHours: parsed.data.estimatedHours || 0,
      partsUsed: [],
    });

    // Send email notification to mechanic
    try {
      const supabase = createServerClient();
      const { data: mechanic } = await supabase.from("users").select("email, name").eq("id", parsed.data.mechanicId).single();

      const booking = await bookingDB.getById(parsed.data.bookingId);

      if (mechanic?.email && booking) {
        await notifyMechanicAssignment(mechanic.email, {
          mechanicName: mechanic.name || "Mechanic",
          jobId: job.id,
          bookingId: booking.id,
          customerName: booking.customerName,
          serviceType: booking.serviceType,
          date: booking.scheduledDate,
          time: booking.scheduledTime,
          priority: parsed.data.priority || "medium",
          vehicleInfo: booking.vehicleInfo,
        });
      }
    } catch (error) {
      console.error("Error sending mechanic assignment email:", error);
      // Don't fail the request if email fails
    }

    return NextResponse.json({ job }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create job" }, { status: 500 });
  }
}
