import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { sendInvitationEmail } from "@/lib/email";

const ALLOWED_ROLES = ["admin", "mechanic", "customer", "driver"] as const;

export async function POST(request: NextRequest) {
  try {
    const { email, role, userId } = await request.json();

    if (!email || !role) {
      return NextResponse.json({ error: "Email and role are required" }, { status: 400 });
    }

    const normalizedRole = typeof role === "string" ? role.toLowerCase().trim() : "";

    if (!ALLOWED_ROLES.includes(normalizedRole as (typeof ALLOWED_ROLES)[number])) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const supabase = createServerClient();

    // Check if user exists in users table
    const { data: existingUser } = await supabase
      .from("users")
      .select("id, approval_status, role, name")
      .eq("email", normalizedEmail)
      .maybeSingle();

    // Check if user has an auth account
    let hasAuthAccount = false;
    if (existingUser) {
      // Check if their ID exists in auth.users
      const { data: authUser } = await supabase.auth.admin.getUserById(existingUser.id);
      hasAuthAccount = !!authUser?.user;
    }

    if (existingUser && hasAuthAccount) {
      // User already has an account - cannot send onboarding link
      return NextResponse.json(
        {
          error:
            existingUser.approval_status === "approved"
              ? "This user already has an account and is approved."
              : "This user already has an account and is pending approval.",
        },
        { status: 400 }
      );
    }

    // Send invitation email FIRST before updating database
    const emailSent = await sendInvitationEmail(normalizedEmail, normalizedRole);

    if (!emailSent) {
      return NextResponse.json(
        { error: "Unable to send invitation email. Check RESEND_API_KEY and RESEND_FROM_EMAIL configuration." },
        { status: 500 }
      );
    }

    // Email sent successfully - now update the database
    // If user exists but doesn't have auth account, mark them as admin_invited
    if (existingUser && !hasAuthAccount) {
      await supabase
        .from("users")
        .update({
          role: normalizedRole, // Update role if different
          admin_invited: true, // Mark as admin invited for auto-approval
        })
        .eq("id", existingUser.id);
    }

    return NextResponse.json({
      success: true,
      message: existingUser
        ? `Onboarding link sent to ${existingUser.name || normalizedEmail}. They will have access once they create their account.`
        : `Invitation sent to ${normalizedEmail}.`,
      isExistingUser: !!existingUser,
    });
  } catch (error) {
    console.error("Invite error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
