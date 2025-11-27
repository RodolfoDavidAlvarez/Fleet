import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServerClient } from "@/lib/supabase";

const updateSchema = z.object({
  mechanicName: z.string().optional(),
  serviceType: z.string().optional(),
  description: z.string().optional(),
  cost: z.coerce.number().optional(),
  mileage: z.coerce.number().optional(),
  status: z.enum(["in_progress", "completed", "cancelled", "open"]).optional(),
  date: z.string().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const supabase = createServerClient();
    const payload = parsed.data;

    const updateData: any = {};
    if (payload.mechanicName !== undefined) updateData.mechanic_name = payload.mechanicName;
    if (payload.serviceType !== undefined) updateData.service_type = payload.serviceType;
    if (payload.description !== undefined) updateData.description = payload.description;
    if (payload.cost !== undefined) updateData.cost = payload.cost;
    if (payload.mileage !== undefined) updateData.mileage = payload.mileage;
    if (payload.status !== undefined) {
      updateData.status = payload.status === "open" ? "in_progress" : payload.status;
    }
    if (payload.date !== undefined) updateData.date = payload.date;

    const { data, error } = await supabase
      .from("service_records")
      .update(updateData)
      .eq("id", params.id)
      .select()
      .single();

    if (error || !data) {
      console.error("Failed to update service record", error);
      return NextResponse.json({ error: "Failed to update service record" }, { status: 500 });
    }

    return NextResponse.json({
      record: {
        id: data.id,
        repairRequestId: data.repair_request_id || undefined,
        vehicleId: data.vehicle_id || undefined,
        mechanicId: data.mechanic_id || undefined,
        mechanicName: data.mechanic_name,
        serviceType: data.service_type,
        description: data.description,
        cost: data.cost !== null && data.cost !== undefined ? Number(data.cost) : undefined,
        mileage: data.mileage !== null && data.mileage !== undefined ? Number(data.mileage) : undefined,
        status: data.status,
        date: data.date,
        nextServiceDue: data.next_service_due || undefined,
        createdAt: data.created_at,
      },
    });
  } catch (error) {
    console.error("Error in PATCH /api/service-records/[id]", error);
    return NextResponse.json({ error: "Failed to update service record" }, { status: 500 });
  }
}
