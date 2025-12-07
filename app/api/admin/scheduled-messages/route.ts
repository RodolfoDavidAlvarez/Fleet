import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET - List all scheduled messages
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify user is admin
    const { data: userData } = await supabase.from("users").select("role, approval_status").eq("id", authUser.id).single();
    if (!userData || userData.role !== "admin" || userData.approval_status !== "approved") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Fetch scheduled messages
    const { data: messages, error } = await supabase.from("scheduled_messages").select("*").order("scheduled_at", { ascending: true });

    if (error) {
      console.error("Error fetching scheduled messages:", error);
      return NextResponse.json({ error: "Failed to fetch scheduled messages" }, { status: 500 });
    }

    return NextResponse.json({ messages: messages || [] }, { status: 200 });
  } catch (error) {
    console.error("Error in GET /api/admin/scheduled-messages:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
