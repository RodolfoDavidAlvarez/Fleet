import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { driverDB } from "@/lib/db";

const driverSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(6).optional(),
  role: z.enum(["driver", "mechanic"]).optional(),
  approval_status: z.enum(["pending_approval", "approved"]).optional(),
});

export async function GET() {
  try {
    const drivers = await driverDB.getAll();
    console.log("Fetched drivers:", drivers.length, drivers);
    return NextResponse.json({ drivers });
  } catch (error) {
    console.error("Error in GET /api/drivers:", error);
    return NextResponse.json({ 
      error: "Failed to fetch drivers",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const json = await request.json();
    const parsed = driverSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const driver = await driverDB.create({
      name: parsed.data.name,
      email: parsed.data.email,
      phone: parsed.data.phone,
      role: parsed.data.role || "driver",
      approval_status: parsed.data.approval_status || "approved",
    });
    return NextResponse.json({ driver }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create driver" }, { status: 500 });
  }
}
