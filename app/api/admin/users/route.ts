import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { sendAccountApprovedEmail } from "@/lib/email";

// Get all users (admin only)
export async function GET(request: NextRequest) {
  try {
    let supabase;
    try {
      supabase = createServerClient();
    } catch (clientError: any) {
      console.error("Error creating Supabase client:", clientError);
      return NextResponse.json(
        { 
          error: clientError.message || "Failed to initialize database connection. Check SUPABASE_SERVICE_ROLE_KEY environment variable." 
        },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(request.url);
    const roleFilter = searchParams.get("role");

    // Build query - only select needed fields for better performance
    let query = supabase.from("users").select("id, email, name, role, phone, approval_status, last_seen_at, created_at, notify_on_repair");

    // If role filter is specified, apply it
    if (roleFilter) {
      if (roleFilter.includes(',')) {
        const roles = roleFilter.split(',');
        query = query.in("role", roles);
      } else {
        query = query.eq("role", roleFilter);
      }
    }

    // Limit results to prevent loading too many users
    let { data: users, error } = await query.order("created_at", { ascending: false }).limit(500);

    // If error is about missing notify_on_repair column, try query without it
    if (error && error.message && error.message.includes('notify_on_repair')) {
      console.warn("notify_on_repair column missing, fetching without it:", error.message);
      // Retry without notify_on_repair column
      query = supabase.from("users").select("id, email, name, role, phone, approval_status, last_seen_at, created_at");
      const retryResult = await query.order("created_at", { ascending: false }).limit(500);
      users = retryResult.data;
      error = retryResult.error;
    }

    if (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error("Error fetching users:", error);
      }
      return NextResponse.json(
        { 
          error: "Failed to fetch users",
          details: error.message 
        },
        { status: 500 }
      );
    }

    // Calculate online status (online if last_seen_at is within last 5 minutes)
    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

    const usersWithOnlineStatus =
      users?.map((user) => ({
        ...user,
        notify_on_repair: user.notify_on_repair ?? false, // Default to false if column doesn't exist
        isOnline: user.last_seen_at ? new Date(user.last_seen_at) > fiveMinutesAgo : false,
      })) || [];

    return NextResponse.json({ users: usersWithOnlineStatus });
  } catch (error: any) {
    if (process.env.NODE_ENV === 'development') {
      console.error("Error in GET /api/admin/users:", error);
    }
    return NextResponse.json(
      { 
        error: "Internal server error",
        details: error.message || String(error)
      },
      { status: 500 }
    );
  }
}

// Update user role or approval status
export async function PATCH(request: NextRequest) {
  try {
    const { userId, role, approvalStatus, approval_status, notifyOnRepair } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    let supabase;
    try {
      supabase = createServerClient();
    } catch (clientError: any) {
      console.error("Error creating Supabase client:", clientError);
      return NextResponse.json(
        { 
          error: clientError.message || "Failed to initialize database connection. Check SUPABASE_SERVICE_ROLE_KEY environment variable." 
        },
        { status: 500 }
      );
    }
    const updates: any = {};
    const normalizedApprovalStatus = approvalStatus || approval_status;

    if (role) {
      if (!["admin", "mechanic", "customer", "driver"].includes(role)) {
        return NextResponse.json({ error: "Invalid role" }, { status: 400 });
      }
      updates.role = role;
    }

    if (normalizedApprovalStatus) {
      if (!["pending_approval", "approved"].includes(normalizedApprovalStatus)) {
        return NextResponse.json({ error: "Invalid approval status" }, { status: 400 });
      }
      updates.approval_status = normalizedApprovalStatus;
    }
    
    if (typeof notifyOnRepair === 'boolean') {
      updates.notify_on_repair = notifyOnRepair;
    }

    // Check if we are approving the user
    let shouldSendEmail = false;
    if (normalizedApprovalStatus === 'approved') {
      const { data: currentUser } = await supabase.from("users").select("approval_status").eq("id", userId).single();
      if (currentUser && currentUser.approval_status !== 'approved') {
        shouldSendEmail = true;
      }
    }

    const { data, error } = await supabase.from("users").update(updates).eq("id", userId).select().single();

    if (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error("Error updating user:", error);
      }
      return NextResponse.json(
        { 
          error: "Failed to update user",
          details: error.message 
        },
        { status: 500 }
      );
    }

    // Send email if approved
    if (shouldSendEmail) {
      // Run in background to not block response
      sendAccountApprovedEmail(data.email, data.name, data.role).catch(err => {
        if (process.env.NODE_ENV === 'development') {
          console.error("Error sending approval email:", err);
        }
      });
    }

    return NextResponse.json({ user: data });
  } catch (error: any) {
    if (process.env.NODE_ENV === 'development') {
      console.error("Error in PATCH /api/admin/users:", error);
    }
    return NextResponse.json(
      { 
        error: "Internal server error",
        details: error.message || String(error)
      },
      { status: 500 }
    );
  }
}

// Delete user (admin only)
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    let supabase;
    try {
      supabase = createServerClient();
    } catch (clientError: any) {
      if (process.env.NODE_ENV === 'development') {
        console.error("Error creating Supabase client:", clientError);
      }
      return NextResponse.json(
        { 
          error: clientError.message || "Failed to initialize database connection. Check SUPABASE_SERVICE_ROLE_KEY environment variable." 
        },
        { status: 500 }
      );
    }

    // First, delete the auth user
    const { error: authError } = await supabase.auth.admin.deleteUser(userId);
    
    if (authError && authError.message !== 'User not found') {
      if (process.env.NODE_ENV === 'development') {
        console.error("Error deleting auth user:", authError);
      }
      // Continue to delete public user even if auth deletion fails
    }

    // Then, delete the public user record
    const { error: deleteError } = await supabase
      .from("users")
      .delete()
      .eq("id", userId);

    if (deleteError) {
      if (process.env.NODE_ENV === 'development') {
        console.error("Error deleting user:", deleteError);
      }
      return NextResponse.json(
        { 
          error: "Failed to delete user",
          details: deleteError.message 
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, message: "User deleted successfully" });
  } catch (error: any) {
    if (process.env.NODE_ENV === 'development') {
      console.error("Error in DELETE /api/admin/users:", error);
    }
    return NextResponse.json(
      { 
        error: "Internal server error",
        details: error.message || String(error)
      },
      { status: 500 }
    );
  }
}
