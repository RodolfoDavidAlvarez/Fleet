import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { repairReportDB, repairRequestDB } from "@/lib/db";
import { sendRepairCompletion } from "@/lib/twilio";

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const record = await repairRequestDB.getById(params.id);
    if (!record) {
      return NextResponse.json({ error: "Repair request not found" }, { status: 404 });
    }
    return NextResponse.json({ request: record });
  } catch (error) {
    console.error("Failed to fetch repair request", error);
    return NextResponse.json({ error: "Failed to fetch repair request" }, { status: 500 });
  }
}

const updateSchema = z.object({
  status: z
    .enum(["submitted", "triaged", "waiting_booking", "scheduled", "in_progress", "completed", "cancelled"])
    .optional(),
  aiCategory: z.string().optional(),
  aiTags: z.array(z.string()).optional(),
  aiSummary: z.string().optional(),
  aiConfidence: z.number().optional(),
  bookingId: z.string().uuid().optional(),
  bookingLink: z.string().url().optional(),
  scheduledDate: z.string().optional(),
  scheduledTime: z.string().optional(),
});

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const json = await request.json();
    const parsed = updateSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const existingRecord = await repairRequestDB.getById(params.id);
    if (!existingRecord) {
        return NextResponse.json({ error: "Repair request not found" }, { status: 404 });
    }

    const updates = {
      ...parsed.data,
      status: parsed.data.status || (parsed.data.bookingId ? "scheduled" : undefined),
    };

    const record = await repairRequestDB.update(params.id, updates);

    // Send completion SMS if status changed to completed
    if (parsed.data.status === 'completed' && existingRecord.status !== 'completed' && record.driverPhone) {
        try {
            await sendRepairCompletion(record.driverPhone, {
                requestId: record.id,
                summary: record.description.slice(0, 50) + '...', // Brief summary
                language: record.preferredLanguage,
            });
        } catch (smsError) {
            console.error("Failed to send completion SMS", smsError);
            // Don't fail the request just because SMS failed
        }
    }

    return NextResponse.json({ request: record });
  } catch (error) {
    console.error("Failed to update repair request", error);
    return NextResponse.json({ error: "Failed to update repair request" }, { status: 500 });
  }
}
