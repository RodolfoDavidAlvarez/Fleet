import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServerClient } from "@/lib/supabase";

const driverSchema = z.object({
  name: z.string().min(1),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().min(6).optional(),
  role: z.enum(["driver", "mechanic", "admin"]).optional(),
  approval_status: z.enum(["pending_approval", "approved"]).optional(),
});

export async function GET() {
  try {
    const supabase = createServerClient();

    // Get all users from the users table
    const { data: users, error } = await supabase
      .from("users")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching drivers:", error);
      return NextResponse.json({
        error: "Failed to fetch drivers",
        details: error.message
      }, { status: 500 });
    }

    // Get all auth users to check who has an account
    const { data: authData, error: authError } = await supabase.auth.admin.listUsers({
      perPage: 1000, // Get all auth users
    });

    // Create a set of auth user IDs for fast lookup
    const authUserIds = new Set(
      authError ? [] : (authData?.users || []).map(u => u.id)
    );

    // Map users and add hasAuthAccount flag
    const drivers = (users || []).map((row) => ({
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
      // Check if this user has an auth account
      hasAuthAccount: authUserIds.has(row.id),
    }));

    return NextResponse.json({ drivers });
  } catch (error) {
    console.error("Error in GET /api/drivers:", error);
    return NextResponse.json({
      error: "Failed to fetch drivers",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const json = await request.json();
    const parsed = driverSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("users")
      .insert({
        name: parsed.data.name,
        email: parsed.data.email || null,
        phone: parsed.data.phone || null,
        role: parsed.data.role || "driver",
        approval_status: parsed.data.approval_status || "approved", // Auto-approve when admin creates
      })
      .select()
      .single();

    if (error || !data) {
      console.error("Error creating driver:", error);
      return NextResponse.json({ error: error?.message || "Failed to create driver" }, { status: 500 });
    }

    const driver = {
      id: data.id,
      email: data.email,
      name: data.name,
      role: data.role,
      phone: data.phone,
      approval_status: data.approval_status,
      createdAt: data.created_at,
      hasAuthAccount: false, // Newly created members don't have auth accounts yet
    };

    return NextResponse.json({ driver }, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/drivers:", error);
    return NextResponse.json({ error: "Failed to create driver" }, { status: 500 });
  }
}
