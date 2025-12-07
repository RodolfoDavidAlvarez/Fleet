import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { vehicleDB } from "@/lib/db";

const updateVehicleSchema = z.object({
  make: z.string().min(1).optional(),
  model: z.string().min(1).optional(),
  year: z.coerce
    .number()
    .int()
    .min(1900)
    .max(new Date().getFullYear() + 1)
    .optional(),
  vin: z.string().min(3).optional(),
  licensePlate: z.string().min(1).optional(),
  mileage: z.coerce.number().nonnegative().optional(),
  status: z
    .enum([
      "operational",
      "active",
      "in_service",
      "broken_down",
      "for_sale",
      "idle",
      "upcoming",
      "retired",
      "maintenance",
      "reserved",
      "out_of_service",
    ])
    .optional(),
  lastServiceDate: z.string().optional(),
  nextServiceDue: z.string().optional(),
  lastUsedDate: z.string().optional(),
  driverId: z.string().uuid().nullable().optional(),
  vehicleNumber: z.string().optional(),
  vehicleType: z.enum(["Vehicle", "Equipment", "Trailer"]).optional(),
  department: z.string().optional(),
  supervisor: z.string().optional(),
  tagExpiry: z.string().optional(),
  loanLender: z.string().optional(),
  firstAidFire: z.string().optional(),
  title: z.string().optional(),
});

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const vehicle = await vehicleDB.getById(params.id);
    if (!vehicle) {
      return NextResponse.json({ error: "Vehicle not found" }, { status: 404 });
    }
    return NextResponse.json({ vehicle });
  } catch (error) {
    console.error("Error fetching vehicle:", error);
    return NextResponse.json({ error: "Failed to fetch vehicle" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const json = await request.json();
    const parsed = updateVehicleSchema.safeParse(json);
    
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const vehicle = await vehicleDB.update(params.id, parsed.data);
    
    if (!vehicle) {
      return NextResponse.json({ error: "Vehicle not found" }, { status: 404 });
    }

    return NextResponse.json({ vehicle });
  } catch (error) {
    console.error("Error updating vehicle:", error);
    return NextResponse.json({ error: "Failed to update vehicle" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const success = await vehicleDB.delete(params.id);
    if (!success) {
      return NextResponse.json({ error: "Vehicle not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting vehicle:", error);
    return NextResponse.json({ error: "Failed to delete vehicle" }, { status: 500 });
  }
}
