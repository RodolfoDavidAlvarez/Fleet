import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServerClient } from "@/lib/supabase";
import { sendSMS } from "@/lib/twilio";

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
  notifyDriver: z.boolean().optional(),
  notificationStatus: z.string().optional(),
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

    const repairRequestIds = Array.from(new Set((records || []).map((r) => r.repair_request_id).filter(Boolean))) as string[];
    const vehicleIds = Array.from(new Set((records || []).map((r) => r.vehicle_id).filter(Boolean))) as string[];
    const mechanicIds = Array.from(new Set((records || []).map((r) => r.mechanic_id).filter(Boolean))) as string[];

    const [repairsLookup, vehiclesLookup, mechanicsLookup] = await Promise.all([
      repairRequestIds.length
        ? supabase
            .from("repair_requests")
            .select("id, driver_name, vehicle_identifier, division, vehicle_type, make_model, vehicle_id")
            .in("id", repairRequestIds)
        : { data: [] },
      vehicleIds.length ? supabase.from("vehicles").select("id, license_plate, make, model, vehicle_number").in("id", vehicleIds) : { data: [] },
      mechanicIds.length ? supabase.from("mechanics").select("id, name, email, airtable_id, user_id").in("id", mechanicIds) : { data: [] },
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

    const mechanicMap = new Map((mechanicsLookup.data || []).map((m: any) => [m.id, m]));

    const hydrated = (records || []).map((r) => {
      const repair = r.repair_request_id ? repairMap.get(r.repair_request_id) : null;
      const vehicle = r.vehicle_id ? vehicleMap.get(r.vehicle_id) : null;
      const mechanic = r.mechanic_id ? mechanicMap.get(r.mechanic_id) : null;
      const mechanicName = cleanMechanicName(r.mechanic_name, mechanic);

      return {
        id: r.id,
        repairRequestId: r.repair_request_id || undefined,
        vehicleId: r.vehicle_id || repair?.vehicleId || undefined,
        mechanicId: r.mechanic_id || undefined,
        mechanicName,
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

function cleanMechanicName(raw: any, mechanicRow?: any): string {
  if (raw) {
    const str = raw.toString();
    try {
      const parsed = JSON.parse(str);
      if (Array.isArray(parsed)) {
        return parsed.filter(Boolean).join(", ");
      }
    } catch (_) {
      // not JSON, fall through
    }
    if (str.trim().length > 0) return str;
  }
  if (mechanicRow?.name) return mechanicRow.name;
  return "";
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
      const { data: repair } = await supabase.from("repair_requests").select("vehicle_id").eq("id", payload.repairRequestId).maybeSingle();
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

    // Send notification SMS to driver if requested and repair request is linked
    if (payload.notifyDriver && payload.repairRequestId) {
      try {
        const { data: repairRequest } = await supabase
          .from("repair_requests")
          .select("driver_name, driver_phone, preferred_language")
          .eq("id", payload.repairRequestId)
          .single();

        if (repairRequest?.driver_phone) {
          const statusMessages: Record<string, { en: string; es: string }> = {
            completed_ready_for_pickup: {
              en: "is completed and ready for pickup",
              es: "está completada y lista para recoger",
            },
            completed: {
              en: "is completed",
              es: "está completada",
            },
            on_hold: {
              en: "is on hold",
              es: "está en espera",
            },
            waiting_for_parts: {
              en: "is waiting for parts",
              es: "está esperando repuestos",
            },
          };

          const notificationStatus = payload.notificationStatus || "completed_ready_for_pickup";
          const messages = statusMessages[notificationStatus] || statusMessages.completed_ready_for_pickup;
          const language = repairRequest.preferred_language || "en";
          const message =
            language === "es"
              ? `${repairRequest.driver_name}, su solicitud de reparación ${messages.es}.`
              : `${repairRequest.driver_name}, your repair request ${messages.en}.`;

          await sendSMS(repairRequest.driver_phone, message);
        }
      } catch (smsError) {
        console.error("Failed to send notification SMS", smsError);
        // Don't fail the request if SMS fails
      }
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
