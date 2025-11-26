import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { sendAccountApprovedEmail } from "@/lib/email";

// Get all users (admin only)
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const { searchParams } = new URL(request.url);
    const roleFilter = searchParams.get("role");

    // Build query - filter by role if specified, otherwise get all users
    let query = supabase.from("users").select("*");

    // If role filter is specified, apply it
    if (roleFilter) {
      if (roleFilter.includes(',')) {
        const roles = roleFilter.split(',');
        query = query.in("role", roles);
      } else {
        query = query.eq("role", roleFilter);
      }
    }

    const { data: users, error } = await query.order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching users:", error);
      return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
    }

    // Calculate online status (online if last_seen_at is within last 5 minutes)
    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

    const usersWithOnlineStatus =
      users?.map((user) => ({
        ...user,
        isOnline: user.last_seen_at ? new Date(user.last_seen_at) > fiveMinutesAgo : false,
      })) || [];

    return NextResponse.json({ users: usersWithOnlineStatus });
  } catch (error) {
    console.error("Error in GET /api/admin/users:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Update user role or approval status
export async function PATCH(request: NextRequest) {
  try {
    const { userId, role, approvalStatus, notifyOnRepair } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    const supabase = createServerClient();
    const updates: any = {};

    if (role) {
      if (!["admin", "mechanic", "customer", "driver"].includes(role)) {
        return NextResponse.json({ error: "Invalid role" }, { status: 400 });
      }
      updates.role = role;
    }

    if (approvalStatus) {
      if (!["pending_approval", "approved"].includes(approvalStatus)) {
        return NextResponse.json({ error: "Invalid approval status" }, { status: 400 });
      }
      updates.approval_status = approvalStatus;
    }
    
    if (typeof notifyOnRepair === 'boolean') {
      updates.notify_on_repair = notifyOnRepair;
    }

    // Check if we are approving the user
    let shouldSendEmail = false;
    if (approvalStatus === 'approved') {
      const { data: currentUser } = await supabase.from("users").select("approval_status").eq("id", userId).single();
      if (currentUser && currentUser.approval_status !== 'approved') {
        shouldSendEmail = true;
      }
    }

    const { data, error } = await supabase.from("users").update(updates).eq("id", userId).select().single();

    if (error) {
      console.error("Error updating user:", error);
      return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
    }

    // Send email if approved
    if (shouldSendEmail) {
      // Run in background to not block response
      sendAccountApprovedEmail(data.email, data.name, data.role).catch(err => 
        console.error("Error sending approval email:", err)
      );
    }

    return NextResponse.json({ user: data });
  } catch (error) {
    console.error("Error in PATCH /api/admin/users:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
