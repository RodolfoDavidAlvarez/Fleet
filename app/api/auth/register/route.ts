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
      .select("id, admin_invited, role, approval_status")
      .eq("email", normalizedEmail)
      .single();

    // If user exists, check if they already have an auth account
    if (existingUser) {
      const { data: authUser } = await supabase.auth.admin.getUserById(existingUser.id);

      if (authUser?.user) {
        // User already has an auth account
        return NextResponse.json({ error: "User with this email already has an account" }, { status: 400 });
      }

      // User exists but doesn't have auth account - create auth account and link
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

      // Determine approval status:
      // - If admin invited them, auto-approve
      // - Otherwise, keep their current approval status or set to pending
      const newApprovalStatus = existingUser.admin_invited
        ? 'approved'
        : (existingUser.approval_status || 'pending_approval');

      // Update existing user record to link with auth ID
      const { data: updatedUser, error: updateError } = await supabase
        .from("users")
        .update({
          id: authData.user.id, // Link to Auth ID
          name,
          phone: phone || null,
          approval_status: newApprovalStatus,
          admin_invited: false, // Clear the flag after use
        })
        .eq("email", normalizedEmail)
        .select("id, email, name, role, approval_status")
        .single();

      if (updateError) {
        console.error("Error updating user profile:", updateError);
        // Try to rollback auth user
        await supabase.auth.admin.deleteUser(authData.user.id);
        return NextResponse.json({ error: "Failed to link user profile" }, { status: 500 });
      }

      return NextResponse.json({
        user: updatedUser,
        message: existingUser.admin_invited
          ? "Account created and approved! You can now log in."
          : "Account created. Please wait for admin approval."
      });
    }

    // 2. User doesn't exist - create new auth user and profile
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
      // Rollback auth user if profile creation fails
      await supabase.auth.admin.deleteUser(authData.user.id);
      return NextResponse.json({ error: "Failed to create user profile" }, { status: 500 });
    }

    return NextResponse.json({
      user: newUser,
      message: "Account created. Please wait for admin approval."
    });
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
