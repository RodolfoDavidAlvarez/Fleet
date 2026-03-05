import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

// GET /api/vehicles/lookup?number=3333
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const number = searchParams.get("number")?.trim();

    if (!number) {
      return NextResponse.json({ vehicle: null });
    }

    const supabase = createServerClient();

    const { data: vehicle } = await supabase
      .from("vehicles")
      .select("id, vehicle_number, make, model, year, mileage, status, department, vin, driver_id")
      .eq("vehicle_number", number)
      .maybeSingle();

    if (!vehicle) {
      return NextResponse.json({ vehicle: null });
    }

    // Fetch assigned driver name if driver_id exists
    let assignedDriver: string | null = null;
    if (vehicle.driver_id) {
      const { data: driver } = await supabase
        .from("users")
        .select("name")
        .eq("id", vehicle.driver_id)
        .maybeSingle();
      assignedDriver = driver?.name || null;
    }

    return NextResponse.json({
      vehicle: { ...vehicle, assigned_driver: assignedDriver },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
