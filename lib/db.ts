// Supabase database operations
// Replaces in-memory storage with Supabase PostgreSQL

import { createServerClient } from "./supabase";
import { Vehicle, Booking, Job, Mechanic, User, DashboardStats, ServiceRecord, Part, RepairRequest, RepairReport } from "@/types";

// Helper to convert database row to Vehicle
function rowToVehicle(row: any): Vehicle {
  return {
    id: row.id,
    make: row.make,
    model: row.model,
    year: row.year,
    vin: row.vin,
    licensePlate: row.license_plate,
    status: row.status,
    lastServiceDate: row.last_service_date,
    nextServiceDue: row.next_service_due,
    mileage: row.mileage || 0,
    serviceHistory: [], // Will be loaded separately if needed
    driverId: row.driver_id || row.driver?.id,
    driverName: row.driver_name || row.driver?.name,
    driverPhone: row.driver_phone || row.driver?.phone,
    driverEmail: row.driver_email || row.driver?.email,
    driverRole: row.users?.role || (row.driver_name ? 'driver' : undefined),
    driverAssignedDate: row.assigned_date,
    photoUrl: row.photo_url,
    // Enhanced fields mapping
    department: row.department,
    supervisor: row.supervisor,
    vehicleNumber: row.vehicle_num || row.vehicle_number, // Handle both alias and raw column
    tagExpiry: row.tag_expiry,
    loanLender: row.loan_lender,
    firstAidFire: row.first_aid_fire,
    title: row.title,
    photoUrls: row.photo_urls || [],
    airtableId: row.airtable_id,
    createdAt: row.created_at,
  };
}

// Helper to convert Vehicle to database row
function vehicleToRow(vehicle: Partial<Vehicle>): any {
  return {
    make: vehicle.make,
    model: vehicle.model,
    year: vehicle.year,
    vin: vehicle.vin,
    license_plate: vehicle.licensePlate,
    status: vehicle.status,
    last_service_date: vehicle.lastServiceDate,
    next_service_due: vehicle.nextServiceDue,
    mileage: vehicle.mileage,
    driver_id: vehicle.driverId,
    photo_url: vehicle.photoUrl,
  };
}

// Helper to convert database row to Booking
function rowToBooking(row: any): Booking {
  return {
    id: row.id,
    vehicleId: row.vehicle_id,
    customerName: row.customer_name,
    customerEmail: row.customer_email,
    customerPhone: row.customer_phone,
    serviceType: row.service_type,
    scheduledDate: row.scheduled_date,
    scheduledTime: row.scheduled_time,
    status: row.status,
    mechanicId: row.mechanic_id,
    repairRequestId: row.repair_request_id,
    vehicleInfo: row.vehicle_info,
    smsConsent: row.sms_consent,
    complianceAccepted: row.compliance_accepted,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// Helper to convert Booking to database row
function bookingToRow(booking: Partial<Booking>): any {
  return {
    vehicle_id: booking.vehicleId,
    customer_name: booking.customerName,
    customer_email: booking.customerEmail,
    customer_phone: booking.customerPhone,
    service_type: booking.serviceType,
    scheduled_date: booking.scheduledDate,
    scheduled_time: booking.scheduledTime,
    status: booking.status,
    mechanic_id: booking.mechanicId,
    repair_request_id: booking.repairRequestId,
    vehicle_info: booking.vehicleInfo,
    sms_consent: booking.smsConsent,
    compliance_accepted: booking.complianceAccepted,
    notes: booking.notes,
  };
}

// Helper to convert database row to RepairRequest
function rowToRepairRequest(row: any): RepairRequest {
  return {
    id: row.id,
    driverId: row.driver_id,
    driverName: row.driver_name,
    driverPhone: row.driver_phone,
    driverEmail: row.driver_email,
    preferredLanguage: row.preferred_language,
    vehicleId: row.vehicle_id,
    vehicleIdentifier: row.vehicle_identifier,
    odometer: row.odometer || undefined,
    location: row.location,
    description: row.description,
    urgency: row.urgency,
    status: row.status,
    aiCategory: row.ai_category,
    aiTags: row.ai_tags || [],
    aiSummary: row.ai_summary,
    aiConfidence: row.ai_confidence ? parseFloat(row.ai_confidence) : undefined,
    photoUrls: row.photo_urls || [],
    thumbUrls: row.thumb_urls || [],
    bookingId: row.booking_id,
    bookingLink: row.booking_link,
    bookingLinkSentAt: row.booking_link_sent_at,
    scheduledDate: row.scheduled_date,
    scheduledTime: row.scheduled_time,
    division: row.division,
    vehicleType: row.vehicle_type,
    makeModel: row.make_model,
    incidentDate: row.incident_date,
    isImmediate: row.is_immediate,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// Helper to convert RepairRequest to database row
function repairRequestToRow(request: Partial<RepairRequest>): any {
  return {
    driver_id: request.driverId,
    driver_name: request.driverName,
    driver_phone: request.driverPhone,
    driver_email: request.driverEmail,
    preferred_language: request.preferredLanguage,
    vehicle_id: request.vehicleId,
    vehicle_identifier: request.vehicleIdentifier,
    odometer: request.odometer,
    location: request.location,
    description: request.description,
    urgency: request.urgency,
    status: request.status,
    ai_category: request.aiCategory,
    ai_tags: request.aiTags,
    ai_summary: request.aiSummary,
    ai_confidence: request.aiConfidence,
    photo_urls: request.photoUrls,
    thumb_urls: request.thumbUrls,
    booking_id: request.bookingId,
    booking_link: request.bookingLink,
    booking_link_sent_at: request.bookingLinkSentAt,
    scheduled_date: request.scheduledDate,
    scheduled_time: request.scheduledTime,
    division: request.division,
    vehicle_type: request.vehicleType,
    make_model: request.makeModel,
    incident_date: request.incidentDate,
    is_immediate: request.isImmediate,
  };
}

function rowToRepairReport(row: any): RepairReport {
  return {
    id: row.id,
    repairRequestId: row.repair_request_id,
    mechanicId: row.mechanic_id,
    summary: row.summary,
    partsUsed: (row.parts_used || []).map((p: any) => ({
      id: p.id || `${row.id}-${p.name}`,
      name: p.name,
      quantity: p.quantity,
      cost: parseFloat(p.cost),
    })),
    laborHours: row.labor_hours ? parseFloat(row.labor_hours) : undefined,
    laborCost: row.labor_cost ? parseFloat(row.labor_cost) : undefined,
    partsCost: row.parts_cost ? parseFloat(row.parts_cost) : undefined,
    totalCost: row.total_cost ? parseFloat(row.total_cost) : undefined,
    createdAt: row.created_at,
  };
}

// Helper to convert database row to Job
function rowToJob(row: any, parts: any[] = []): Job {
  return {
    id: row.id,
    bookingId: row.booking_id,
    vehicleId: row.vehicle_id,
    mechanicId: row.mechanic_id,
    status: row.status,
    priority: row.priority,
    startTime: row.start_time,
    endTime: row.end_time,
    estimatedHours: row.estimated_hours ? parseFloat(row.estimated_hours) : undefined,
    actualHours: row.actual_hours ? parseFloat(row.actual_hours) : undefined,
    partsUsed: parts.map((p) => ({
      id: p.id,
      name: p.name,
      quantity: p.quantity,
      cost: parseFloat(p.cost),
    })),
    laborCost: row.labor_cost ? parseFloat(row.labor_cost) : undefined,
    totalCost: row.total_cost ? parseFloat(row.total_cost) : undefined,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// Helper to convert database row to Mechanic
function rowToMechanic(row: any): Mechanic {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    specializations: row.specializations || [],
    currentJobs: [], // Will be loaded separately if needed
    availability: row.availability,
    createdAt: row.created_at,
  };
}

// Driver helpers (drivers live in users table)
export const driverDB = {
  getAll: async (): Promise<User[]> => {
    const supabase = createServerClient();

    const { data, error } = await supabase.from("users").select("*").order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching drivers:", error);
      console.error("Error details:", JSON.stringify(error, null, 2));
      throw error; // Re-throw to be caught by API route
    }

    return (data || []).map((row) => ({
      id: row.id,
      email: row.email,
      name: row.name,
      role: row.role,
      phone: row.phone,
      approval_status: row.approval_status,
      airtable_id: row.airtable_id,
      member_legacy_id: row.member_legacy_id,
      level_certification: row.level_certification,
      notes: row.notes,
      preferred_language: row.preferred_language,
      equipment_oversight: row.equipment_oversight,
      last_seen_at: row.last_seen_at,
      createdAt: row.created_at,
    }));
  },

  create: async (user: Pick<User, "name" | "email"> & { phone?: string }): Promise<User> => {
    const supabase = createServerClient();
    const { data, error } = await supabase
      .from("users")
      .insert({
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: "driver",
        approval_status: "pending_approval",
      })
      .select()
      .single();

    if (error || !data) {
      throw new Error(error?.message || "Failed to create driver");
    }

    return {
      id: data.id,
      email: data.email,
      name: data.name,
      role: data.role,
      phone: data.phone,
      createdAt: data.created_at,
    };
  },
};

// Vehicle operations
export const vehicleDB = {
  getAll: async (): Promise<Vehicle[]> => {
    const supabase = createServerClient();
    const { data, error } = await supabase
      .from("vehicles_with_drivers")
      .select("*, users!vehicles_with_drivers_driver_id_fkey(role)")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching vehicles:", error);
      return [];
    }

    return (data || []).map(rowToVehicle);
  },

  getById: async (id: string): Promise<Vehicle | undefined> => {
    const supabase = createServerClient();
    const { data, error } = await supabase.from("vehicles_with_drivers").select("*").eq("id", id).single();

    if (error || !data) {
      return undefined;
    }

    // Fetch service history
    const { data: serviceHistory } = await supabase
      .from("service_records")
      .select("*")
      .eq("vehicle_id", id)
      .order("date", { ascending: false });

    // Fetch repair requests (try matching by exact ID first, then fallback to identifiers)
    // Note: Repair requests from Airtable might only have text identifiers
    const { data: repairRequests } = await supabase
      .from("repair_requests")
      .select("*")
      .or(`vehicle_id.eq.${id},vehicle_identifier.eq.${data.vin},vehicle_identifier.eq.${data.vehicle_number || 'fallback'}`)
      .order("created_at", { ascending: false });

    const vehicle = rowToVehicle(data);
    
    vehicle.serviceHistory = (serviceHistory || []).map((record: any) => ({
        id: record.id,
        vehicleId: record.vehicle_id,
        date: record.date,
        serviceType: record.service_type,
        description: record.description,
        cost: record.cost,
        mechanicId: record.mechanic_id,
        mechanicName: record.mechanic_name,
        status: record.status,
        mileage: record.mileage,
        nextServiceDue: record.next_service_due,
        createdAt: record.created_at
    }));

    vehicle.repairRequests = (repairRequests || []).map(rowToRepairRequest);

    return vehicle;
  },

  create: async (vehicle: Omit<Vehicle, "id" | "createdAt">): Promise<Vehicle> => {
    const supabase = createServerClient();
    const { data, error } = await supabase.from("vehicles").insert(vehicleToRow(vehicle)).select().single();

    if (error || !data) {
      throw new Error(error?.message || "Failed to create vehicle");
    }

    const detailed = await vehicleDB.getById(data.id);
    return detailed || rowToVehicle(data);
  },

  update: async (id: string, updates: Partial<Vehicle>): Promise<Vehicle | null> => {
    const supabase = createServerClient();
    
    // Handle driver assignment separately using the assign_driver_to_vehicle function
    const driverId = updates.driverId;
    const updatesWithoutDriver = { ...updates };
    delete (updatesWithoutDriver as any).driverId;
    
    // Update vehicle fields (excluding driverId)
    const vehicleRow = vehicleToRow(updatesWithoutDriver);
    // Remove undefined/null values
    Object.keys(vehicleRow).forEach(key => {
      if (vehicleRow[key] === undefined || vehicleRow[key] === null) {
        delete vehicleRow[key];
      }
    });
    
    if (Object.keys(vehicleRow).length > 0) {
      const { data, error } = await supabase.from("vehicles").update(vehicleRow).eq("id", id).select().single();
      if (error) {
        console.error("Error updating vehicle:", error);
        return null;
      }
    }
    
    // Handle driver assignment
    if (driverId !== undefined) {
      if (driverId === null || driverId === '') {
        // Remove driver assignment
        await supabase.from("vehicle_drivers").delete().eq("vehicle_id", id).eq("is_primary", true);
      } else {
        // Assign driver using the database function
        const { error: assignError } = await supabase.rpc('assign_driver_to_vehicle', {
          p_vehicle_id: id,
          p_driver_id: driverId,
          p_is_primary: true
        });
        if (assignError) {
          console.error("Error assigning driver:", assignError);
          // Continue anyway - vehicle update might have succeeded
        }
      }
    }

    const detailed = await vehicleDB.getById(id);
    return detailed || null;
  },

  delete: async (id: string): Promise<boolean> => {
    const supabase = createServerClient();
    const { error } = await supabase.from("vehicles").delete().eq("id", id);

    return !error;
  },
};

// Booking operations
export const bookingDB = {
  getAll: async (filter?: { mechanicId?: string }): Promise<Booking[]> => {
    const supabase = createServerClient();
    let query = supabase.from("bookings").select("*").order("created_at", { ascending: false });
    if (filter?.mechanicId) {
      query = query.eq("mechanic_id", filter.mechanicId);
    }
    const { data, error } = await query;

    if (error) {
      console.error("Error fetching bookings:", error);
      return [];
    }

    return (data || []).map(rowToBooking);
  },

  getById: async (id: string): Promise<Booking | undefined> => {
    const supabase = createServerClient();
    const { data, error } = await supabase.from("bookings").select("*").eq("id", id).single();

    if (error || !data) {
      return undefined;
    }

    return rowToBooking(data);
  },

  create: async (booking: Omit<Booking, "id" | "createdAt" | "updatedAt">): Promise<Booking> => {
    const supabase = createServerClient();
    const { data, error } = await supabase.from("bookings").insert(bookingToRow(booking)).select().single();

    if (error || !data) {
      throw new Error(error?.message || "Failed to create booking");
    }

    return rowToBooking(data);
  },

  update: async (id: string, updates: Partial<Booking>): Promise<Booking | null> => {
    const supabase = createServerClient();
    const { data, error } = await supabase.from("bookings").update(bookingToRow(updates)).eq("id", id).select().single();

    if (error || !data) {
      return null;
    }

    return rowToBooking(data);
  },

  delete: async (id: string): Promise<boolean> => {
    const supabase = createServerClient();
    const { error } = await supabase.from("bookings").delete().eq("id", id);

    return !error;
  },
};

// Repair request operations
export const repairRequestDB = {
  getAll: async (status?: string): Promise<RepairRequest[]> => {
    const supabase = createServerClient();
    let query = supabase.from("repair_requests").select("*").order("created_at", { ascending: false });
    if (status && status !== "all") {
      query = query.eq("status", status);
    }

    const { data, error } = await query;
    if (error) {
      console.error("Error fetching repair requests:", error);
      return [];
    }

    return (data || []).map(rowToRepairRequest);
  },

  getById: async (id: string): Promise<RepairRequest | undefined> => {
    const supabase = createServerClient();
    const { data, error } = await supabase.from("repair_requests").select("*").eq("id", id).single();

    if (error || !data) {
      return undefined;
    }

    return rowToRepairRequest(data);
  },

  create: async (request: Omit<RepairRequest, "id" | "createdAt" | "updatedAt">): Promise<RepairRequest> => {
    const supabase = createServerClient();
    const row = repairRequestToRow({
      ...request,
      photoUrls: request.photoUrls || [],
      thumbUrls: request.thumbUrls || [],
    });
    Object.keys(row).forEach((key) => row[key] === undefined && delete row[key]);
    const { data, error } = await supabase.from("repair_requests").insert(row).select().single();

    if (error || !data) {
      throw new Error(error?.message || "Failed to create repair request");
    }

    return rowToRepairRequest(data);
  },

  update: async (id: string, updates: Partial<RepairRequest>): Promise<RepairRequest | null> => {
    const supabase = createServerClient();
    const row = repairRequestToRow(updates);
    Object.keys(row).forEach((key) => row[key] === undefined && delete row[key]);
    const { data, error } = await supabase.from("repair_requests").update(row).eq("id", id).select().single();

    if (error || !data) {
      return null;
    }

    return rowToRepairRequest(data);
  },
};

export const repairReportDB = {
  getByRequest: async (requestId: string): Promise<RepairReport[]> => {
    const supabase = createServerClient();
    const { data, error } = await supabase
      .from("repair_reports")
      .select("*")
      .eq("repair_request_id", requestId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching repair reports:", error);
      return [];
    }

    return (data || []).map(rowToRepairReport);
  },

  create: async (report: Omit<RepairReport, "id" | "createdAt">): Promise<RepairReport> => {
    const supabase = createServerClient();
    const serializedParts = (report.partsUsed || []).map((p) => ({
      name: p.name,
      quantity: p.quantity,
      cost: p.cost,
    }));
    const totalCost = report.totalCost ?? (report.laborCost || 0) + (report.partsCost || 0);

    const { data, error } = await supabase
      .from("repair_reports")
      .insert({
        repair_request_id: report.repairRequestId,
        mechanic_id: report.mechanicId,
        summary: report.summary,
        parts_used: serializedParts,
        labor_hours: report.laborHours,
        labor_cost: report.laborCost,
        parts_cost: report.partsCost,
        total_cost: totalCost,
      })
      .select()
      .single();

    if (error || !data) {
      throw new Error(error?.message || "Failed to create repair report");
    }

    return rowToRepairReport(data);
  },
};

// Job operations
export const jobDB = {
  getAll: async (): Promise<Job[]> => {
    const supabase = createServerClient();
    const { data: jobs, error } = await supabase.from("jobs").select("*").order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching jobs:", error);
      return [];
    }

    const jobList = jobs || [];
    if (jobList.length === 0) return [];

    const jobIds = jobList.map((job) => job.id).filter(Boolean);
    const partsByJob: Record<string, any[]> = {};

    if (jobIds.length > 0) {
      const { data: parts } = await supabase.from("job_parts").select("*").in("job_id", jobIds);
      (parts || []).forEach((part) => {
        if (!part?.job_id) return;
        partsByJob[part.job_id] = [...(partsByJob[part.job_id] || []), part];
      });
    }

    return jobList.map((job) => rowToJob(job, partsByJob[job.id] || []));
  },

  getById: async (id: string): Promise<Job | undefined> => {
    const supabase = createServerClient();
    const { data: job, error } = await supabase.from("jobs").select("*").eq("id", id).single();

    if (error || !job) {
      return undefined;
    }

    const { data: parts } = await supabase.from("job_parts").select("*").eq("job_id", id);

    return rowToJob(job, parts || []);
  },

  getByMechanic: async (mechanicId: string): Promise<Job[]> => {
    const supabase = createServerClient();
    const { data: jobs, error } = await supabase.from("jobs").select("*").eq("mechanic_id", mechanicId).order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching jobs by mechanic:", error);
      return [];
    }

    const jobList = jobs || [];
    if (jobList.length === 0) return [];

    const jobIds = jobList.map((job) => job.id).filter(Boolean);
    const partsByJob: Record<string, any[]> = {};

    if (jobIds.length > 0) {
      const { data: parts } = await supabase.from("job_parts").select("*").in("job_id", jobIds);
      (parts || []).forEach((part) => {
        if (!part?.job_id) return;
        partsByJob[part.job_id] = [...(partsByJob[part.job_id] || []), part];
      });
    }

    return jobList.map((job) => rowToJob(job, partsByJob[job.id] || []));
  },

  create: async (job: Omit<Job, "id" | "createdAt" | "updatedAt">): Promise<Job> => {
    const supabase = createServerClient();

    // Insert job
    const { data: jobData, error: jobError } = await supabase
      .from("jobs")
      .insert({
        booking_id: job.bookingId,
        vehicle_id: job.vehicleId,
        mechanic_id: job.mechanicId,
        status: job.status,
        priority: job.priority,
        start_time: job.startTime,
        end_time: job.endTime,
        estimated_hours: job.estimatedHours,
        actual_hours: job.actualHours,
        labor_cost: job.laborCost,
        total_cost: job.totalCost,
        notes: job.notes,
      })
      .select()
      .single();

    if (jobError || !jobData) {
      throw new Error(jobError?.message || "Failed to create job");
    }

    // Insert parts if any
    if (job.partsUsed && job.partsUsed.length > 0) {
      const partsToInsert = job.partsUsed.map((part) => ({
        job_id: jobData.id,
        name: part.name,
        quantity: part.quantity,
        cost: part.cost,
      }));

      await supabase.from("job_parts").insert(partsToInsert);
    }

    const { data: parts } = await supabase.from("job_parts").select("*").eq("job_id", jobData.id);

    return rowToJob(jobData, parts || []);
  },

  update: async (id: string, updates: Partial<Job>): Promise<Job | null> => {
    const supabase = createServerClient();

    const updateData: any = {};
    if (updates.status !== undefined) updateData.status = updates.status;
    if (updates.priority !== undefined) updateData.priority = updates.priority;
    if (updates.startTime !== undefined) updateData.start_time = updates.startTime;
    if (updates.endTime !== undefined) updateData.end_time = updates.endTime;
    if (updates.estimatedHours !== undefined) updateData.estimated_hours = updates.estimatedHours;
    if (updates.actualHours !== undefined) updateData.actual_hours = updates.actualHours;
    if (updates.laborCost !== undefined) updateData.labor_cost = updates.laborCost;
    if (updates.totalCost !== undefined) updateData.total_cost = updates.totalCost;
    if (updates.notes !== undefined) updateData.notes = updates.notes;

    const { data, error } = await supabase.from("jobs").update(updateData).eq("id", id).select().single();

    if (error || !data) {
      return null;
    }

    // Update parts if provided
    if (updates.partsUsed) {
      // Delete existing parts
      await supabase.from("job_parts").delete().eq("job_id", id);

      // Insert new parts
      if (updates.partsUsed.length > 0) {
        const partsToInsert = updates.partsUsed.map((part) => ({
          job_id: id,
          name: part.name,
          quantity: part.quantity,
          cost: part.cost,
        }));
        await supabase.from("job_parts").insert(partsToInsert);
      }
    }

    const { data: parts } = await supabase.from("job_parts").select("*").eq("job_id", id);

    return rowToJob(data, parts || []);
  },
};

// Mechanic operations
export const mechanicDB = {
  getAll: async (): Promise<Mechanic[]> => {
    const supabase = createServerClient();
    const { data, error } = await supabase.from("mechanics").select("*").order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching mechanics:", error);
      return [];
    }

    const mechanics = data || [];
    if (mechanics.length === 0) return [];

    const mechanicIds = mechanics.map((m) => m.id).filter(Boolean);
    const jobsByMechanic: Record<string, string[]> = {};

    if (mechanicIds.length > 0) {
      const { data: jobs } = await supabase
        .from("jobs")
        .select("id, mechanic_id")
        .in("mechanic_id", mechanicIds)
        .in("status", ["assigned", "in_progress"]);

      (jobs || []).forEach((job) => {
        if (!job?.mechanic_id) return;
        jobsByMechanic[job.mechanic_id] = [...(jobsByMechanic[job.mechanic_id] || []), job.id];
      });
    }

    return mechanics.map((mechanic) => ({
      ...rowToMechanic(mechanic),
      currentJobs: jobsByMechanic[mechanic.id] || [],
    }));
  },

  getById: async (id: string): Promise<Mechanic | undefined> => {
    const supabase = createServerClient();
    const { data, error } = await supabase.from("mechanics").select("*").eq("id", id).single();

    if (error || !data) {
      return undefined;
    }

    const { data: jobs } = await supabase.from("jobs").select("id").eq("mechanic_id", id).in("status", ["assigned", "in_progress"]);

    return {
      ...rowToMechanic(data),
      currentJobs: (jobs || []).map((j) => j.id),
    };
  },

  create: async (mechanic: Omit<Mechanic, "id" | "createdAt">): Promise<Mechanic> => {
    const supabase = createServerClient();
    const { data, error } = await supabase
      .from("mechanics")
      .insert({
        name: mechanic.name,
        email: mechanic.email,
        phone: mechanic.phone,
        specializations: mechanic.specializations,
        availability: mechanic.availability,
      })
      .select()
      .single();

    if (error || !data) {
      throw new Error(error?.message || "Failed to create mechanic");
    }

    return rowToMechanic(data);
  },

  update: async (id: string, updates: Partial<Mechanic>): Promise<Mechanic | null> => {
    const supabase = createServerClient();
    const updateData: any = {};
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.email !== undefined) updateData.email = updates.email;
    if (updates.phone !== undefined) updateData.phone = updates.phone;
    if (updates.specializations !== undefined) updateData.specializations = updates.specializations;
    if (updates.availability !== undefined) updateData.availability = updates.availability;

    const { data, error } = await supabase.from("mechanics").update(updateData).eq("id", id).select().single();

    if (error || !data) {
      return null;
    }

    return rowToMechanic(data);
  },
};

// Dashboard stats
export async function getDashboardStats(): Promise<DashboardStats> {
  const supabase = createServerClient();

  const [
    { count: totalVehicles },
    { count: activeVehicles },
    { count: vehiclesInService },
    { count: totalBookings },
    { count: pendingBookings },
    { count: completedJobs },
    { count: totalMechanics },
    { count: availableMechanics },
    { count: totalRepairRequests },
    { count: openRepairRequests },
    { count: waitingBookingRepairRequests },
    { count: completedRepairRequests },
    { count: urgentRepairRequests },
    { data: jobsData },
    { data: recentBookingsData },
    { data: vehiclesData },
  ] = await Promise.all([
    supabase.from("vehicles").select("*", { count: "exact", head: true }),
    supabase.from("vehicles").select("*", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("vehicles").select("*", { count: "exact", head: true }).eq("status", "in_service"),
    supabase.from("bookings").select("*", { count: "exact", head: true }),
    supabase.from("bookings").select("*", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("jobs").select("*", { count: "exact", head: true }).eq("status", "completed"),
    supabase.from("mechanics").select("*", { count: "exact", head: true }),
    supabase.from("mechanics").select("*", { count: "exact", head: true }).eq("availability", "available"),
    supabase.from("repair_requests").select("*", { count: "exact", head: true }),
    supabase
      .from("repair_requests")
      .select("*", { count: "exact", head: true })
      .in("status", ["submitted", "triaged", "waiting_booking", "scheduled", "in_progress"]),
    supabase.from("repair_requests").select("*", { count: "exact", head: true }).eq("status", "waiting_booking"),
    supabase.from("repair_requests").select("*", { count: "exact", head: true }).eq("status", "completed"),
    supabase
      .from("repair_requests")
      .select("*", { count: "exact", head: true })
      .in("urgency", ["high", "critical"])
      .neq("status", "completed"),
    supabase.from("jobs").select("total_cost").eq("status", "completed"),
    supabase.from("bookings").select("*").order("created_at", { ascending: false }).limit(5),
    supabase.from("vehicles").select("status"),
  ]);

  const totalMaintenanceCost = (jobsData || []).reduce((sum, job) => sum + (job.total_cost || 0), 0);
  const recentBookings = (recentBookingsData || []).map(rowToBooking);

  const vehiclesByStatus: Record<string, number> = {};
  (vehiclesData || []).forEach((v) => {
    const status = v.status || "unknown";
    vehiclesByStatus[status] = (vehiclesByStatus[status] || 0) + 1;
  });

  return {
    totalVehicles: totalVehicles || 0,
    activeVehicles: activeVehicles || 0,
    vehiclesInService: vehiclesInService || 0,
    totalBookings: totalBookings || 0,
    pendingBookings: pendingBookings || 0,
    completedJobs: completedJobs || 0,
    totalMechanics: totalMechanics || 0,
    availableMechanics: availableMechanics || 0,
    totalRepairRequests: totalRepairRequests || 0,
    openRepairRequests: openRepairRequests || 0,
    waitingBookingRepairRequests: waitingBookingRepairRequests || 0,
    completedRepairRequests: completedRepairRequests || 0,
    urgentRepairRequests: urgentRepairRequests || 0,
    totalMaintenanceCost,
    recentBookings,
    vehiclesByStatus,
  };
}
