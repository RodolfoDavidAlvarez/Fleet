import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

function getMaintenanceStatus(milesSinceService: number | null, daysSinceService: number | null): "overdue" | "due_soon" | "good" | "no_record" {
  // No record at all
  if (milesSinceService === null && daysSinceService === null) return "no_record";

  // Overdue: 10K+ miles OR 6+ months (180 days)
  if ((milesSinceService !== null && milesSinceService >= 10000) ||
      (daysSinceService !== null && daysSinceService >= 180)) {
    return "overdue";
  }

  // Due soon: 7.5K-10K miles OR 4-6 months (120-180 days)
  if ((milesSinceService !== null && milesSinceService >= 7500) ||
      (daysSinceService !== null && daysSinceService >= 120)) {
    return "due_soon";
  }

  return "good";
}

export async function GET() {
  try {
    const supabase = createServerClient();

    // Fetch all vehicles with driver info
    const { data: vehicles, error: vehiclesError } = await supabase
      .from("vehicles")
      .select(`*, driver:users!driver_id(name, email, phone)`)
      .order("vehicle_number", { ascending: true });

    if (vehiclesError) throw vehiclesError;

    // Fetch service records with their linked repair request's vehicle_identifier
    // service_records.vehicle_id is often NULL — the vehicle number comes from
    // repair_requests.vehicle_identifier via the repair_request_id foreign key
    const { data: serviceRecords, error: srError } = await supabase
      .from("service_records")
      .select("vehicle_id, repair_request_id, date, mileage, service_type, repair_requests(vehicle_identifier, vehicle_id)")
      .order("date", { ascending: false });

    if (srError) throw srError;

    // Build maps for matching: by vehicle UUID and by vehicle number
    // Now also track records WITHOUT mileage (for date-based status)
    const latestByUUID = new Map<string, { date: string; mileage: number | null; serviceType: string }>();
    const latestByNumber = new Map<string, { date: string; mileage: number | null; serviceType: string }>();

    for (const sr of serviceRecords || []) {
      if (!sr.date) continue;

      const entry = {
        date: sr.date,
        mileage: sr.mileage && sr.mileage > 0 ? sr.mileage : null,
        serviceType: sr.service_type || "",
      };

      // Match by direct vehicle_id
      const directVehicleId = sr.vehicle_id || (sr.repair_requests as any)?.vehicle_id;
      if (directVehicleId && !latestByUUID.has(directVehicleId)) {
        latestByUUID.set(directVehicleId, entry);
      }

      // Match by vehicle number from repair request
      const vehicleNumber = (sr.repair_requests as any)?.vehicle_identifier;
      if (vehicleNumber && !latestByNumber.has(vehicleNumber)) {
        latestByNumber.set(vehicleNumber, entry);
      }
    }

    const today = new Date();

    // Enrich vehicles
    const enriched = (vehicles || []).map((v) => {
      const lastService =
        latestByUUID.get(v.id) ||
        latestByNumber.get(v.vehicle_number || "") ||
        null;

      const currentMileage = v.mileage || 0;
      const lastServiceMileage = lastService?.mileage || null;
      const milesSinceService = lastServiceMileage && lastServiceMileage > 0 ? currentMileage - lastServiceMileage : null;

      const lastServiceDateStr = lastService?.date || v.last_service_date || null;
      let daysSinceService: number | null = null;
      if (lastServiceDateStr) {
        const serviceDate = new Date(lastServiceDateStr + "T12:00:00");
        daysSinceService = Math.floor((today.getTime() - serviceDate.getTime()) / (1000 * 60 * 60 * 24));
      }

      const maintenanceStatus = getMaintenanceStatus(milesSinceService, daysSinceService);

      return {
        id: v.id,
        vehicleNumber: v.vehicle_number || "",
        make: v.make || "",
        model: v.model || "",
        year: v.year,
        vin: v.vin || "",
        licensePlate: v.license_plate || "",
        status: v.status || "",
        department: v.department || "",
        vehicleType: v.vehicle_type || "Vehicle",
        currentMileage,
        lastServiceDate: lastServiceDateStr,
        lastServiceMileage,
        lastServiceType: lastService?.serviceType || null,
        milesSinceService,
        daysSinceService,
        maintenanceStatus,
        driverName: v.driver?.name || "",
        driverEmail: v.driver?.email || "",
        driverPhone: v.driver?.phone || "",
      };
    });

    // Compute summary stats — use combined status
    const totalVehicles = enriched.length;
    const overdueCount = enriched.filter((v) => v.maintenanceStatus === "overdue").length;
    const dueSoonCount = enriched.filter((v) => v.maintenanceStatus === "due_soon").length;
    const goodCount = enriched.filter((v) => v.maintenanceStatus === "good").length;
    const noRecordCount = enriched.filter((v) => v.maintenanceStatus === "no_record").length;

    return NextResponse.json({
      vehicles: enriched,
      summary: {
        totalVehicles,
        overdueCount,
        dueSoonCount,
        goodCount,
        noRecordCount,
      },
    });
  } catch (error: any) {
    console.error("Maintenance tracker error:", error);
    return NextResponse.json({ error: "Failed to fetch maintenance data" }, { status: 500 });
  }
}
