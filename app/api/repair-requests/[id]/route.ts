import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { repairReportDB, repairRequestDB } from "@/lib/db";
import { sendRepairCompletion } from "@/lib/twilio";

// Define valid status transitions for repair requests
// This ensures the workflow is followed correctly
const VALID_STATUS_TRANSITIONS: Record<string, string[]> = {
  submitted: ["triaged", "waiting_booking", "scheduled", "in_progress", "cancelled"],
  triaged: ["waiting_booking", "scheduled", "in_progress", "cancelled"],
  waiting_booking: ["scheduled", "triaged", "in_progress", "cancelled"],
  scheduled: ["in_progress", "completed", "waiting_booking", "cancelled"], // Allow direct completion for same-day repairs
  in_progress: ["completed", "scheduled", "cancelled"],
  completed: ["in_progress"], // Allow reopening if needed
  cancelled: ["submitted", "triaged"], // Allow reopening cancelled requests
};

function isValidStatusTransition(currentStatus: string, newStatus: string): boolean {
  // Same status is always valid (no-op)
  if (currentStatus === newStatus) return true;

  // Check if the transition is allowed
  const validNextStatuses = VALID_STATUS_TRANSITIONS[currentStatus];
  return validNextStatuses?.includes(newStatus) ?? false;
}

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

    // Determine the target status
    const targetStatus = parsed.data.status || (parsed.data.bookingId ? "scheduled" : undefined);

    // Validate status transition if a new status is being set
    if (targetStatus && targetStatus !== existingRecord.status) {
      if (!isValidStatusTransition(existingRecord.status, targetStatus)) {
        return NextResponse.json({
          error: `Invalid status transition: cannot change from "${existingRecord.status}" to "${targetStatus}"`,
          currentStatus: existingRecord.status,
          requestedStatus: targetStatus,
          validTransitions: VALID_STATUS_TRANSITIONS[existingRecord.status] || []
        }, { status: 400 });
      }
    }

    const updates = {
      ...parsed.data,
      status: targetStatus,
    };

    const record = await repairRequestDB.update(params.id, updates);

    if (!record) {
      return NextResponse.json({ error: "Repair request not found" }, { status: 404 });
    }

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
