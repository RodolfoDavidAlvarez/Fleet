import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServerClient } from "@/lib/supabase";

const createSchema = z.object({
  repairRequestId: z.string().uuid().optional(),
  vehicleId: z.string().uuid().optional(),
  mechanicId: z.string().uuid().optional(),
  mechanicName: z.string().min(1, "Mechanic name is required"),
  serviceType: z.string().optional(),
  description: z.string().min(1, "Repairs/notes are required"),
  cost: z.coerce.number().optional(),
  mileage: z.coerce.number().optional(),
  status: z.enum(["in_progress", "completed", "cancelled", "open"]).default("in_progress"),
  date: z.string().optional(),
  nextServiceDue: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const limitParam = searchParams.get("limit");
    const limit = limitParam ? parseInt(limitParam, 10) : 200;

    let query = supabase
      .from("service_records")
      .select("*")
      .order("date", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(limit);

    if (status && status !== "all") {
      query = query.eq("status", status);
    }

    const { data: records, error } = await query;
    if (error) {
      console.error("Failed to fetch service records", error);
      return NextResponse.json({ error: "Failed to fetch service records" }, { status: 500 });
    }

    const repairRequestIds = Array.from(
      new Set((records || []).map((r) => r.repair_request_id).filter(Boolean))
    ) as string[];
    const vehicleIds = Array.from(
      new Set((records || []).map((r) => r.vehicle_id).filter(Boolean))
    ) as string[];

    const [repairsLookup, vehiclesLookup] = await Promise.all([
      repairRequestIds.length
        ? supabase
            .from("repair_requests")
            .select("id, driver_name, vehicle_identifier, division, vehicle_type, make_model, vehicle_id")
            .in("id", repairRequestIds)
        : { data: [] },
      vehicleIds.length
        ? supabase
            .from("vehicles")
            .select("id, license_plate, make, model, vehicle_number")
            .in("id", vehicleIds)
        : { data: [] },
    ]);

    const repairMap = new Map(
      (repairsLookup.data || []).map((r: any) => [
        r.id,
        {
          id: r.id,
          driverName: r.driver_name,
          vehicleIdentifier: r.vehicle_identifier,
          division: r.division,
          vehicleType: r.vehicle_type,
          makeModel: r.make_model,
          vehicleId: r.vehicle_id,
        },
      ])
    );
    const vehicleMap = new Map(
      (vehiclesLookup.data || []).map((v: any) => [
        v.id,
        {
          id: v.id,
          label: [v.license_plate, v.vehicle_number, v.make, v.model].filter(Boolean).join(" • "),
          licensePlate: v.license_plate,
          make: v.make,
          model: v.model,
          vehicleNumber: v.vehicle_number,
        },
      ])
    );

    const hydrated = (records || []).map((r) => {
      const repair = r.repair_request_id ? repairMap.get(r.repair_request_id) : null;
      const vehicle = r.vehicle_id ? vehicleMap.get(r.vehicle_id) : null;

      return {
        id: r.id,
        repairRequestId: r.repair_request_id || undefined,
        vehicleId: r.vehicle_id || repair?.vehicleId || undefined,
        mechanicId: r.mechanic_id || undefined,
        mechanicName: r.mechanic_name || "",
        serviceType: r.service_type || repair?.makeModel || "",
        description: r.description || "",
        cost: r.cost !== null && r.cost !== undefined ? Number(r.cost) : undefined,
        mileage: r.mileage !== null && r.mileage !== undefined ? Number(r.mileage) : undefined,
        status: (r.status || "in_progress") as any,
        date: r.date || r.created_at,
        nextServiceDue: r.next_service_due || undefined,
        airtableId: r.airtable_id || undefined,
        createdAt: r.created_at,
        vehicleIdentifier: vehicle?.licensePlate || repair?.vehicleIdentifier,
        vehicleLabel: vehicle?.label,
        division: repair?.division,
        vehicleType: repair?.vehicleType,
        makeModel: repair?.makeModel,
      };
    });

    return NextResponse.json({ records: hydrated });
  } catch (error) {
    console.error("Error in GET /api/service-records", error);
    return NextResponse.json({ error: "Failed to load service records" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 400 });
    }

    const supabase = createServerClient();
    const payload = parsed.data;

    let vehicleId = payload.vehicleId || null;
    if (!vehicleId && payload.repairRequestId) {
      const { data: repair } = await supabase
        .from("repair_requests")
        .select("vehicle_id")
        .eq("id", payload.repairRequestId)
        .maybeSingle();
      if (repair?.vehicle_id) vehicleId = repair.vehicle_id;
    }

    const status = payload.status === "open" ? "in_progress" : payload.status;
    const { data, error } = await supabase
      .from("service_records")
      .insert({
        repair_request_id: payload.repairRequestId || null,
        vehicle_id: vehicleId,
        date: payload.date || new Date().toISOString().split("T")[0],
        service_type: payload.serviceType || "Service",
        description: payload.description,
        cost: payload.cost,
        mileage: payload.mileage,
        mechanic_id: payload.mechanicId || null,
        mechanic_name: payload.mechanicName,
        status,
        next_service_due: payload.nextServiceDue,
      })
      .select()
      .single();

    if (error || !data) {
      console.error("Failed to create service record", error);
      return NextResponse.json({ error: "Failed to create service record" }, { status: 500 });
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
    console.error("Error in POST /api/service-records", error);
    return NextResponse.json({ error: "Failed to create service record" }, { status: 500 });
  }
}
