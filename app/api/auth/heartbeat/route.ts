import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

// Update user's last_seen_at timestamp to track online status
export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    const supabase = createServerClient();

    // Update last_seen_at to current timestamp
    const { error } = await supabase
      .from("users")
      .update({ last_seen_at: new Date().toISOString() })
      .eq("id", userId);

    if (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error("Error updating last_seen_at:", error);
      }
      return NextResponse.json({ error: "Failed to update online status" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (process.env.NODE_ENV === 'development') {
      console.error("Heartbeat error:", error);
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}


