import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServerClient } from "@/lib/supabase";

const driverUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  phone: z.preprocess((val) => (val === "" || val === null ? undefined : val), z.string().optional()),
  role: z.enum(["admin", "mechanic", "customer", "driver"]).optional(),
  approval_status: z.enum(["pending_approval", "approved"]).optional(),
  level_certification: z.preprocess((val) => (val === "" || val === null ? undefined : val), z.string().optional()),
  notes: z.preprocess((val) => (val === "" || val === null ? undefined : val), z.string().optional()),
  preferred_language: z.preprocess((val) => (val === "" || val === null ? undefined : val), z.string().optional()),
});

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createServerClient();
    const { data, error } = await supabase.from("users").select("*").eq("id", params.id).single();

    if (error || !data) {
      return NextResponse.json({ error: "Driver not found" }, { status: 404 });
    }

    return NextResponse.json({
      driver: {
        id: data.id,
        email: data.email,
        name: data.name,
        role: data.role,
        phone: data.phone,
        approval_status: data.approval_status,
        airtable_id: data.airtable_id,
        member_legacy_id: data.member_legacy_id,
        level_certification: data.level_certification,
        notes: data.notes,
        preferred_language: data.preferred_language,
        equipment_oversight: data.equipment_oversight,
        last_seen_at: data.last_seen_at,
        createdAt: data.created_at,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch driver" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const driverId = params.id;
    if (!driverId) {
      return NextResponse.json({ error: "Driver ID is required" }, { status: 400 });
    }

    const json = await request.json();

    // Clean up empty strings - convert to undefined for optional fields
    const cleanedJson: any = {};
    Object.keys(json).forEach((key) => {
      const value = json[key];
      if (value !== undefined && value !== null) {
        // For optional string fields, convert empty strings to undefined
        if (typeof value === "string" && value.trim() === "" && key !== "name" && key !== "email") {
          cleanedJson[key] = undefined;
        } else {
          cleanedJson[key] = value;
        }
      }
    });

    const parsed = driverUpdateSchema.safeParse(cleanedJson);

    if (!parsed.success) {
      console.error("Validation error:", parsed.error.flatten().fieldErrors);
      return NextResponse.json(
        {
          error: "Validation failed",
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    // Build update object, only including provided fields
    const updateData: any = {};
    if (parsed.data.name !== undefined && parsed.data.name !== null) updateData.name = parsed.data.name;
    if (parsed.data.email !== undefined && parsed.data.email !== null) updateData.email = parsed.data.email;
    if (parsed.data.phone !== undefined) updateData.phone = parsed.data.phone || null;
    if (parsed.data.role !== undefined) updateData.role = parsed.data.role;
    if (parsed.data.approval_status !== undefined) updateData.approval_status = parsed.data.approval_status;
    if (parsed.data.level_certification !== undefined) updateData.level_certification = parsed.data.level_certification || null;
    if (parsed.data.notes !== undefined) updateData.notes = parsed.data.notes || null;
    if (parsed.data.preferred_language !== undefined) updateData.preferred_language = parsed.data.preferred_language || null;

    // Don't update if no fields to update
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    const { data, error } = await supabase.from("users").update(updateData).eq("id", driverId).select().single();

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        {
          error: "Failed to update driver",
          details: error.message,
        },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json({ error: "Driver not found" }, { status: 404 });
    }

    return NextResponse.json({
      driver: {
        id: data.id,
        email: data.email,
        name: data.name,
        role: data.role,
        phone: data.phone,
        approval_status: data.approval_status,
        airtable_id: data.airtable_id,
        member_legacy_id: data.member_legacy_id,
        level_certification: data.level_certification,
        notes: data.notes,
        preferred_language: data.preferred_language,
        equipment_oversight: data.equipment_oversight,
        last_seen_at: data.last_seen_at,
        createdAt: data.created_at,
      },
    });
  } catch (error) {
    console.error("Error updating driver:", error);
    return NextResponse.json(
      {
        error: "Failed to update driver",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createServerClient();
    const { error } = await supabase.from("users").delete().eq("id", params.id);

    if (error) {
      return NextResponse.json({ error: "Failed to delete driver" }, { status: 500 });
    }

    return NextResponse.json({ message: "Driver deleted" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete driver" }, { status: 500 });
  }
}
