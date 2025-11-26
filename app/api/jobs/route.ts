import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { jobDB } from "@/lib/db";

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
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch jobs" }, { status: 500 });
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

    return NextResponse.json({ job }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create job" }, { status: 500 });
  }
}
