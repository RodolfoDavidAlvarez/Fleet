import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const { name, email, password, phone, role } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Name, email, and password are required" }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const allowedRoles = ["admin", "mechanic", "customer", "driver"];
    const normalizedRole = typeof role === "string" ? role.toLowerCase().trim() : "";
    const userRole = allowedRoles.includes(normalizedRole) ? normalizedRole : "driver";

    // Use the service role client (createServerClient from lib/supabase)
    const supabase = createServerClient();

    // 1. Check if user already exists in public.users
    const { data: existingUser } = await supabase
      .from("users")
      .select("id")
      .eq("email", normalizedEmail)
      .single();

    if (existingUser) {
      return NextResponse.json({ error: "User with this email already exists" }, { status: 400 });
    }

    // 2. Create Auth User
    // We auto-confirm the email for now to allow immediate "pending approval" state interaction.
    // If you want email verification, set email_confirm: false.
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: normalizedEmail,
      password: password,
      email_confirm: true,
      user_metadata: { name, phone }
    });

    if (authError) {
      console.error("Auth creation error:", authError);
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    if (!authData.user) {
      return NextResponse.json({ error: "Failed to create auth user" }, { status: 500 });
    }

    // 3. Create Public User
    const { data: newUser, error: createError } = await supabase
      .from("users")
      .insert({
        id: authData.user.id, // Link to Auth ID
        name,
        email: normalizedEmail,
        phone: phone || null,
        role: userRole,
        approval_status: 'pending_approval'
      })
      .select("id, email, name, role, approval_status")
      .single();

    if (createError) {
      console.error("Error creating public profile:", createError);
      // Rollback auth user if profile creation fails?
      await supabase.auth.admin.deleteUser(authData.user.id);
      return NextResponse.json({ error: "Failed to create user profile" }, { status: 500 });
    }

    return NextResponse.json({ user: newUser });
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
