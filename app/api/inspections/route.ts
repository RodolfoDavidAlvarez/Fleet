import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

// POST - Submit a vehicle inspection
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const supabase = createServerClient();

    const {
      driverName,
      driverPhone,
      preferredLanguage,
      vehicleNumber,
      currentMileage,
      lastOilChangeDate,
      lastOilChangeMileage,
      lastMaintenanceDate,
      lastMaintenanceType,
      tireCondition,
      brakeCondition,
      lightsWorking,
      fluidLevels,
      bodyCondition,
      warningLightsOn,
      warningLightsDescription,
      notes,
      photoUrls,
      isFuelEntry,
      fuelGallons,
      campaignId,
    } = body;

    if (!driverName || !currentMileage) {
      return NextResponse.json(
        { error: "Driver name and current mileage are required" },
        { status: 400 }
      );
    }

    // Try to find the vehicle by vehicle_number
    let vehicleId: string | null = null;
    if (vehicleNumber) {
      const { data: vehicle } = await supabase
        .from("vehicles")
        .select("id")
        .eq("vehicle_number", vehicleNumber)
        .maybeSingle();
      if (vehicle) vehicleId = vehicle.id;
    }

    const { data: inspection, error } = await supabase
      .from("vehicle_inspections")
      .insert({
        vehicle_id: vehicleId,
        vehicle_number: vehicleNumber || null,
        driver_name: driverName.trim(),
        driver_phone: driverPhone || null,
        preferred_language: preferredLanguage || "en",
        current_mileage: parseInt(currentMileage),
        last_oil_change_date: lastOilChangeDate || null,
        last_oil_change_mileage: lastOilChangeMileage ? parseInt(lastOilChangeMileage) : null,
        last_maintenance_date: lastMaintenanceDate || null,
        last_maintenance_type: lastMaintenanceType || null,
        tire_condition: tireCondition || "good",
        brake_condition: brakeCondition || "good",
        lights_working: lightsWorking !== false,
        fluid_levels: fluidLevels || "good",
        body_condition: bodyCondition || "good",
        warning_lights_on: warningLightsOn === true,
        warning_lights_description: warningLightsDescription || null,
        notes: notes || null,
        photo_urls: photoUrls || [],
        is_fuel_entry: isFuelEntry === true,
        fuel_gallons: fuelGallons ? parseFloat(fuelGallons) : null,
        campaign_id: campaignId || null,
        status: "submitted",
      })
      .select()
      .single();

    if (error) {
      console.error("Insert inspection error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Update vehicle mileage + assign current driver
    if (vehicleId) {
      const updates: any = { mileage: parseInt(currentMileage) };

      // If we have a driver_id from the payload, assign them to this vehicle
      if (body.driverId) {
        updates.driver_id = body.driverId;
      }

      await supabase
        .from("vehicles")
        .update(updates)
        .eq("id", vehicleId);
    }

    return NextResponse.json({ ok: true, inspection });
  } catch (err: any) {
    console.error("Inspection submit error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// GET - List inspections (admin)
export async function GET(req: NextRequest) {
  try {
    const supabase = createServerClient();
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "200");
    const status = searchParams.get("status");
    const vehicleId = searchParams.get("vehicle_id");

    let query = supabase
      .from("vehicle_inspections")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (status) query = query.eq("status", status);
    if (vehicleId) query = query.eq("vehicle_id", vehicleId);

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ inspections: data || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
