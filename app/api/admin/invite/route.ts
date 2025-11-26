import { NextRequest, NextResponse } from "next/server";
import { sendInvitationEmail } from "@/lib/email";
import { createServerClient } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const { email, role } = await request.json();

    if (!email || !role) {
      return NextResponse.json({ error: "Email and role are required" }, { status: 400 });
    }

    // Validate role
    if (!["admin", "mechanic", "customer", "driver"].includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    const supabase = createServerClient();

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from("users")
      .select("id")
      .eq("email", email.toLowerCase())
      .single();

    if (existingUser) {
      return NextResponse.json({ error: "User with this email already exists" }, { status: 400 });
    }

    // Send invitation email
    const sent = await sendInvitationEmail(email, role);

    if (!sent) {
      return NextResponse.json({ error: "Failed to send invitation email" }, { status: 500 });
    }

    // Optionally pre-create the user with "invited" status?
    // But for now, we just send the email and let them register.
    // We rely on the registration to set the role later?
    // Wait, the registration form doesn't have a role picker.
    // The registration creates a user with default role 'driver' (or 'customer').
    // The admin has to approve and change the role.
    // Alternatively, we could store the invitation in a table or encoded in the token, but let's keep it simple.
    // The invite email just says "You are invited as X".
    // When they register, they become 'pending_approval' driver.
    // The admin will see them and approve them.
    // To make it smoother, we could create the user record now with 'invited' status?
    // But the `users` table approval_status check constraint is ('pending_approval', 'approved').
    // So we can't add 'invited' without migration.
    
    // Let's just send the email. The admin flow is:
    // 1. Admin invites user (Email sent).
    // 2. User registers (Account created, pending approval, role=driver/customer).
    // 3. Admin approves and sets correct role.
    
    // This matches the user's request "ensure the entire create account, > pending approval >admin changes status. to user or admin flow is all put together and working".
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Invite error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

