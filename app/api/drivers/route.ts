import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { driverDB } from "@/lib/db";

const driverSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(6).optional(),
});

export async function GET() {
  try {
    const drivers = await driverDB.getAll();
    return NextResponse.json({ drivers });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch drivers" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const json = await request.json();
    const parsed = driverSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const driver = await driverDB.create(parsed.data);
    return NextResponse.json({ driver }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create driver" }, { status: 500 });
  }
}
