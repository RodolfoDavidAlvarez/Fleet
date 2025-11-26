import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { jobDB } from "@/lib/db";
import { sendJobCompletion } from "@/lib/twilio";
import { bookingDB } from "@/lib/db";

const jobUpdateSchema = z.object({
  status: z.enum(["assigned", "in_progress", "waiting_parts", "completed", "cancelled"]).optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  estimatedHours: z.coerce.number().nonnegative().optional(),
  actualHours: z.coerce.number().nonnegative().optional(),
  laborCost: z.coerce.number().nonnegative().optional(),
  totalCost: z.coerce.number().nonnegative().optional(),
  notes: z.string().optional(),
  mechanicId: z.string().optional(),
});

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const job = await jobDB.getById(params.id);
    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }
    return NextResponse.json({ job });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch job" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const json = await request.json();
    const parsed = jobUpdateSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const job = await jobDB.update(params.id, parsed.data);

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // Send SMS if job is completed
    if (parsed.data.status === "completed" && job.totalCost) {
      const booking = await bookingDB.getById(job.bookingId);
      if (booking) {
        await sendJobCompletion(booking.customerPhone, {
          serviceType: booking.serviceType,
          totalCost: job.totalCost,
          bookingId: booking.id,
        });
      }
    }

    return NextResponse.json({ job });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update job" }, { status: 500 });
  }
}
