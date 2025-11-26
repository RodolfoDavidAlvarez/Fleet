import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { repairReportDB, repairRequestDB } from "@/lib/db";
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

    const report = await repairReportDB.create({
      ...parsed.data,
      repairRequestId: params.id,
    });

    const newStatus = parsed.data.status || "completed";
    const updated = await repairRequestDB.update(params.id, {
      status: newStatus,
    });

    if (existing.driverPhone) {
      await sendRepairCompletion(existing.driverPhone, {
        requestId: existing.id,
        summary: parsed.data.summary,
        totalCost: parsed.data.totalCost,
        language: existing.preferredLanguage,
      });
    }

    return NextResponse.json({ report, request: updated || existing });
  } catch (error) {
    console.error("Failed to submit repair report", error);
    return NextResponse.json({ error: "Failed to submit repair report" }, { status: 500 });
  }
}
