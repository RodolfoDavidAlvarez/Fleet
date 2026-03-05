import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

// GET - Accountability overview for managers
export async function GET(req: NextRequest) {
  try {
    const supabase = createServerClient();

    // Get all operational vehicles
    const { data: vehicles } = await supabase
      .from("vehicles")
      .select("id, vehicle_number, make, model, year, mileage, status, department, supervisor, last_service_date, next_service_due, driver_id")
      .in("status", ["operational", "active"])
      .order("vehicle_number");

    // Get all driver names in one query for driver_id lookups
    const driverIds = [...new Set((vehicles || []).map(v => v.driver_id).filter(Boolean))];
    const driverMap = new Map<string, string>();
    if (driverIds.length > 0) {
      const { data: drivers } = await supabase
        .from("users")
        .select("id, name")
        .in("id", driverIds);
      for (const d of drivers || []) {
        driverMap.set(d.id, d.name);
      }
    }

    // Build unique department list
    const departments = [...new Set((vehicles || []).map(v => v.department).filter(Boolean))].sort();

    // Get latest inspection per vehicle (last 90 days)
    const { data: inspections } = await supabase
      .from("vehicle_inspections")
      .select("*")
      .gte("created_at", new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString())
      .order("created_at", { ascending: false });

    // Get active campaigns
    const { data: campaigns } = await supabase
      .from("inspection_campaigns")
      .select("*")
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(5);

    // Get manager activity (last 30 days)
    const { data: managerActivity } = await supabase
      .from("manager_activity_log")
      .select("user_id, action, created_at")
      .gte("created_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .order("created_at", { ascending: false })
      .limit(500);

    // Build per-vehicle status
    const vehicleMap = new Map<string, any>();
    const inspectionsByVehicle = new Map<string, any[]>();

    for (const insp of inspections || []) {
      const vid = insp.vehicle_id;
      if (!vid) continue;
      if (!inspectionsByVehicle.has(vid)) inspectionsByVehicle.set(vid, []);
      inspectionsByVehicle.get(vid)!.push(insp);
    }

    const now = Date.now();
    const thirtyDays = 30 * 24 * 60 * 60 * 1000;
    const sixtyDays = 60 * 24 * 60 * 60 * 1000;

    let totalVehicles = 0;
    let inspectedCount = 0;
    let overdueCount = 0;
    let criticalCount = 0;
    let flaggedItems: any[] = [];

    for (const v of vehicles || []) {
      totalVehicles++;
      const vInspections = inspectionsByVehicle.get(v.id) || [];
      const latest = vInspections[0]; // already sorted desc

      // healthStatus reflects INSPECTION RECENCY only (green/yellow/red = timing)
      // hasCriticalIssues is a separate flag for condition problems
      let healthStatus: "green" | "yellow" | "red" = "red"; // default: no inspection = overdue
      let daysSinceInspection: number | null = null;
      let hasCriticalIssues = false;

      if (latest) {
        inspectedCount++;
        const inspDate = new Date(latest.created_at).getTime();
        daysSinceInspection = Math.floor((now - inspDate) / (24 * 60 * 60 * 1000));

        // Health status based on inspection recency ONLY
        if (daysSinceInspection <= 30) healthStatus = "green";
        else if (daysSinceInspection <= 60) healthStatus = "yellow";
        else healthStatus = "red";

        // Check for critical conditions (separate from overdue)
        const hasCritical = ["tire_condition", "brake_condition", "fluid_levels", "body_condition"]
          .some(f => latest[f] === "critical" || latest[f] === "poor");
        if (hasCritical || latest.warning_lights_on) {
          hasCriticalIssues = true;
          criticalCount++;
          flaggedItems.push({
            vehicleNumber: v.vehicle_number,
            vehicleLabel: `${v.year} ${v.make} ${v.model}`,
            issue: [
              latest.tire_condition === "critical" || latest.tire_condition === "poor" ? "Tires" : null,
              latest.brake_condition === "critical" || latest.brake_condition === "poor" ? "Brakes" : null,
              latest.fluid_levels === "critical" || latest.fluid_levels === "poor" ? "Fluids" : null,
              latest.body_condition === "critical" || latest.body_condition === "poor" ? "Body" : null,
              latest.warning_lights_on ? "Warning Lights" : null,
            ].filter(Boolean).join(", "),
            driverName: latest.driver_name,
            inspectionDate: latest.created_at,
          });
        }
      }

      if (healthStatus === "red") overdueCount++;

      vehicleMap.set(v.id, {
        ...v,
        assignedDriver: v.driver_id ? driverMap.get(v.driver_id) || null : null,
        healthStatus,
        hasCriticalIssues,
        daysSinceInspection,
        latestInspection: latest || null,
        inspectionCount: vInspections.length,
      });
    }

    // Manager login summary
    const managerLogins = new Map<string, number>();
    for (const a of managerActivity || []) {
      managerLogins.set(a.user_id, (managerLogins.get(a.user_id) || 0) + 1);
    }

    const complianceRate = totalVehicles > 0 ? Math.round((inspectedCount / totalVehicles) * 100) : 0;

    return NextResponse.json({
      summary: {
        totalVehicles,
        inspectedLast90Days: inspectedCount,
        overdueOrCritical: overdueCount,
        criticalIssues: criticalCount,
        complianceRate,
      },
      vehicles: Array.from(vehicleMap.values()),
      departments,
      flaggedItems,
      campaigns: campaigns || [],
      managerActivity: Object.fromEntries(managerLogins),
    });
  } catch (err: any) {
    console.error("Inspection overview error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
