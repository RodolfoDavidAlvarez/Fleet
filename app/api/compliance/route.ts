import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

// Vehicle-type-aware field requirements
// Not all fields apply to all vehicle types
const FIELD_REQUIREMENTS: Record<string, { required: string[]; optional: string[] }> = {
  Vehicle: {
    required: ["vehicleNumber", "make", "model", "year", "vin", "licensePlate", "mileage", "department"],
    optional: ["driver"],
  },
  Equipment: {
    required: ["vehicleNumber", "make", "model", "year", "department"],
    optional: ["driver", "mileage"],
    // No VIN or license plate needed for heavy equipment
  },
  "Small Equipment": {
    required: ["vehicleNumber", "make", "model", "department"],
    optional: ["driver"],
    // No VIN, plate, mileage, or year needed
  },
  Trailer: {
    required: ["vehicleNumber", "make", "model", "year", "licensePlate", "department"],
    optional: ["vin"],
    // No mileage or driver needed for trailers
  },
};

const ALL_CHECKS: Record<string, { label: string; check: (v: any) => boolean }> = {
  vehicleNumber: { label: "Vehicle Number", check: (v) => !!v.vehicle_number?.trim() },
  make: { label: "Make", check: (v) => !!v.make?.trim() && v.make !== "-" },
  model: { label: "Model", check: (v) => !!v.model?.trim() && v.model !== "-" },
  year: { label: "Year", check: (v) => !!v.year && v.year > 1900 },
  vin: { label: "VIN", check: (v) => !!v.vin?.trim() && !v.vin.startsWith("AIRTABLE-") && !v.vin.startsWith("FLEET-") },
  licensePlate: { label: "License Plate", check: (v) => !!v.license_plate?.trim() && v.license_plate !== "-" },
  mileage: { label: "Mileage", check: (v) => v.mileage != null && v.mileage > 0 },
  department: { label: "Department", check: (v) => !!v.department?.trim() },
  driver: { label: "Assigned Driver", check: (v) => !!v.driver_id },
};

export async function GET(req: NextRequest) {
  try {
    const supabase = createServerClient();

    const { data: vehicles } = await supabase
      .from("vehicles")
      .select("id, vehicle_number, make, model, year, vin, license_plate, mileage, status, department, supervisor, driver_id, vehicle_type, created_at")
      .order("vehicle_number");

    if (!vehicles) {
      return NextResponse.json({ error: "Failed to fetch vehicles" }, { status: 500 });
    }

    // Get driver names
    const driverIds = [...new Set(vehicles.map(v => v.driver_id).filter(Boolean))];
    const driverMap = new Map<string, string>();
    if (driverIds.length > 0) {
      const { data: drivers } = await supabase
        .from("users")
        .select("id, name")
        .in("id", driverIds);
      for (const d of drivers || []) driverMap.set(d.id, d.name);
    }

    // Process each vehicle with type-aware checks
    const vehicleDetails = vehicles.map((v) => {
      const vType = v.vehicle_type || "Vehicle";
      const reqs = FIELD_REQUIREMENTS[vType] || FIELD_REQUIREMENTS.Vehicle;
      const requiredFields = reqs.required;
      const optionalFields = reqs.optional || [];
      const applicableFields = [...requiredFields, ...optionalFields];

      // Not applicable fields for this type
      const allFieldKeys = Object.keys(ALL_CHECKS);
      const naFields = allFieldKeys.filter(f => !applicableFields.includes(f));

      const fieldResults: Record<string, "pass" | "missing" | "na"> = {};
      let requiredComplete = 0;

      for (const key of allFieldKeys) {
        if (naFields.includes(key)) {
          fieldResults[key] = "na";
        } else {
          const passed = ALL_CHECKS[key].check(v);
          fieldResults[key] = passed ? "pass" : "missing";
          if (requiredFields.includes(key) && passed) requiredComplete++;
        }
      }

      const completeness = requiredFields.length > 0
        ? Math.round((requiredComplete / requiredFields.length) * 100)
        : 100;
      const isComplete = requiredComplete === requiredFields.length;
      const missingRequired = requiredFields.filter(f => fieldResults[f] === "missing");

      return {
        id: v.id,
        vehicleNumber: v.vehicle_number || "",
        make: v.make || "",
        model: v.model || "",
        year: v.year || null,
        vin: v.vin && !v.vin.startsWith("AIRTABLE-") && !v.vin.startsWith("FLEET-") ? v.vin : "",
        licensePlate: v.license_plate || "",
        mileage: v.mileage || 0,
        status: v.status,
        department: v.department || "",
        driverName: v.driver_id ? driverMap.get(v.driver_id) || "" : "",
        driverId: v.driver_id,
        vehicleType: vType,
        completeness,
        requiredFields: requiredFields.length,
        requiredComplete,
        isComplete,
        missingFields: missingRequired.map(f => ALL_CHECKS[f].label),
        missingFieldKeys: missingRequired,
        fieldResults,
      };
    });

    vehicleDetails.sort((a, b) => {
      if (a.isComplete !== b.isComplete) return a.isComplete ? 1 : -1;
      if (a.completeness !== b.completeness) return a.completeness - b.completeness;
      return (a.vehicleNumber || "").localeCompare(b.vehicleNumber || "");
    });

    // Field stats: count only vehicles where the field is required
    const fieldStats: Record<string, { complete: number; missing: number; applicable: number; na: number; percentage: number }> = {};
    for (const key of Object.keys(ALL_CHECKS)) {
      let complete = 0, missing = 0, na = 0;
      for (const v of vehicleDetails) {
        if (v.fieldResults[key] === "pass") complete++;
        else if (v.fieldResults[key] === "missing") missing++;
        else na++;
      }
      const applicable = complete + missing;
      fieldStats[key] = {
        complete,
        missing,
        applicable,
        na,
        percentage: applicable > 0 ? Math.round((complete / applicable) * 100) : 100,
      };
    }

    const completeCount = vehicleDetails.filter(v => v.isComplete).length;
    const incompleteCount = vehicleDetails.filter(v => !v.isComplete).length;
    const overallCompleteness = vehicles.length > 0
      ? Math.round(vehicleDetails.reduce((sum, v) => sum + v.completeness, 0) / vehicles.length)
      : 0;

    // Breakdown by vehicle type
    const typeBreakdown: Record<string, { total: number; complete: number; incomplete: number }> = {};
    for (const v of vehicleDetails) {
      if (!typeBreakdown[v.vehicleType]) typeBreakdown[v.vehicleType] = { total: 0, complete: 0, incomplete: 0 };
      typeBreakdown[v.vehicleType].total++;
      if (v.isComplete) typeBreakdown[v.vehicleType].complete++;
      else typeBreakdown[v.vehicleType].incomplete++;
    }

    return NextResponse.json({
      summary: {
        totalVehicles: vehicles.length,
        completeRecords: completeCount,
        incompleteRecords: incompleteCount,
        overallCompleteness,
      },
      fieldStats,
      checkLabels: Object.fromEntries(Object.entries(ALL_CHECKS).map(([k, v]) => [k, v.label])),
      typeBreakdown,
      fieldRequirements: FIELD_REQUIREMENTS,
      vehicles: vehicleDetails,
    });
  } catch (err: any) {
    console.error("Compliance data error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
