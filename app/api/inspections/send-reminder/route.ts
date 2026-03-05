import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { sendSMS } from "@/lib/twilio";

// POST - Send inspection reminder to a specific driver
export async function POST(req: NextRequest) {
  try {
    const supabase = createServerClient();
    const { driverId } = await req.json();

    if (!driverId) {
      return NextResponse.json({ error: "driverId is required" }, { status: 400 });
    }

    // Get driver info
    const { data: driver } = await supabase
      .from("users")
      .select("id, name, phone, preferred_language")
      .eq("id", driverId)
      .single();

    if (!driver) {
      return NextResponse.json({ error: "Driver not found" }, { status: 404 });
    }

    if (!driver.phone) {
      return NextResponse.json({ error: "Driver has no phone number" }, { status: 400 });
    }

    const inspectUrl = "https://agavefleet.com/inspect";
    const isSpanish = driver.preferred_language === "es";
    const message = isSpanish
      ? `AGAVE FLEET: Su vehículo necesita una inspección. Por favor complete el formulario aquí: ${inspectUrl}`
      : `AGAVE FLEET: Your vehicle is overdue for inspection. Please complete the form here: ${inspectUrl}`;

    await sendSMS(driver.phone, message);

    return NextResponse.json({ ok: true, driverName: driver.name });
  } catch (err: any) {
    console.error("Send inspection reminder error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
