import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { sendInvitationEmail } from "@/lib/email";

const ALLOWED_ROLES = ["admin", "mechanic", "customer", "driver"] as const;

export async function POST(request: NextRequest) {
  try {
    const { email, role } = await request.json();

    if (!email || !role) {
      return NextResponse.json({ error: "Email and role are required" }, { status: 400 });
    }

    const normalizedRole = typeof role === "string" ? role.toLowerCase().trim() : "";

    if (!ALLOWED_ROLES.includes(normalizedRole as (typeof ALLOWED_ROLES)[number])) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const supabase = createServerClient();

    // Prevent duplicate invitations/accounts
    const { data: existingUser } = await supabase
      .from("users")
      .select("id, approval_status, role")
      .eq("email", normalizedEmail)
      .maybeSingle();

    if (existingUser) {
      return NextResponse.json(
        {
          error:
            existingUser.approval_status === "approved"
              ? "A user with this email is already approved."
              : "A user with this email is already pending approval.",
        },
        { status: 400 }
      );
    }

    const emailSent = await sendInvitationEmail(normalizedEmail, normalizedRole);

    if (!emailSent) {
      return NextResponse.json(
        { error: "Unable to send invitation email. Check RESEND_API_KEY and RESEND_FROM_EMAIL configuration." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Invite error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
