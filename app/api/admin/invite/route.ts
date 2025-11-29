import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const { email, role } = await request.json();

    if (!email || !role) {
      return NextResponse.json({ error: "Email and role are required" }, { status: 400 });
    }

    if (!["admin", "mechanic", "customer", "driver"].includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    const supabase = createServerClient();

    // Invite user using Supabase Auth
    // This sends an email automatically if configured, or returns user data
    const { data, error } = await supabase.auth.admin.inviteUserByEmail(email);

    if (error) {
      console.error("Supabase invite error:", error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Upsert into public.users to set role
    // user.id comes from the invited auth user
    if (data.user) {
      const { error: profileError } = await supabase.from('users').upsert({
        id: data.user.id,
        email: email.toLowerCase(),
        role: role,
        name: email.split('@')[0], // Default name
        approval_status: 'approved' // Invited users are implicitly approved
      });

      if (profileError) {
        console.error("Failed to create profile:", profileError);
        // We don't fail the request because the auth invite succeeded, 
        // but we log it. The user might need to be fixed manually or on login.
      }
    }

    return NextResponse.json({ success: true, user: data.user });
  } catch (error) {
    console.error("Invite error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

