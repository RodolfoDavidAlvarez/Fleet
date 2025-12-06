import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { repairReportDB, repairRequestDB } from "@/lib/db";
import { sendRepairCompletionEmail } from "@/lib/email";
import { sendRepairCompletion } from "@/lib/twilio";

const reportSchema = z.object({
  mechanicId: z.string().optional(),
  summary: z.string().min(3, "Summary is required"),
  partsUsed: z
    .array(
      z.object({
        name: z.string(),
        quantity: z.number().default(1),
        cost: z.number().default(0),
      })
    )
    .optional(),
  laborHours: z.number().optional(),
  laborCost: z.number().optional(),
  partsCost: z.number().optional(),
  totalCost: z.number().optional(),
  status: z.enum(["in_progress", "completed"]).optional(),
});

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const json = await request.json();
    const parsed = reportSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const existing = await repairRequestDB.getById(params.id);
    if (!existing) {
      return NextResponse.json({ error: "Repair request not found" }, { status: 404 });
    }

    // Check if a report already exists for this repair request
    const existingReport = await repairReportDB.getByRequest(params.id);
    if (existingReport && existingReport.length > 0) {
      return NextResponse.json({
        error: "A repair report already exists for this request",
        existingReport: existingReport[0]
      }, { status: 409 }); // 409 Conflict
    }

    const report = await repairReportDB.create({
      ...parsed.data,
      repairRequestId: params.id,
    });

    const newStatus = parsed.data.status || "completed";
    const previousStatus = existing.status;
    const updated = await repairRequestDB.update(params.id, {
      status: newStatus,
    });

    // Send SMS notification when status changes to completed
    if (newStatus === 'completed' && previousStatus !== 'completed' && existing.driverPhone) {
      try {
        await sendRepairCompletion(existing.driverPhone, {
          requestId: existing.id,
          summary: parsed.data.summary.slice(0, 100),
          language: existing.preferredLanguage,
        });
      } catch (smsError) {
        console.error("Failed to send completion SMS", smsError);
        // Don't fail the request just because SMS failed
      }
    }

    // Send email notification if email provided
    if (existing.driverEmail) {
      try {
        await sendRepairCompletionEmail(existing.driverEmail, {
          driverName: existing.driverName,
          requestId: existing.id,
          summary: parsed.data.summary,
          totalCost: parsed.data.totalCost,
          language: existing.preferredLanguage,
        });
      } catch (emailError) {
        console.error("Failed to send completion email", emailError);
        // Don't fail the request just because email failed
      }
    }

    return NextResponse.json({ report, request: updated || existing });
  } catch (error) {
    console.error("Failed to submit repair report", error);
    return NextResponse.json({ error: "Failed to submit repair report" }, { status: 500 });
  }
}
