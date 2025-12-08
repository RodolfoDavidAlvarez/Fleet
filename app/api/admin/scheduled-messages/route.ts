import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = 'force-dynamic';

// GET - List all scheduled messages
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

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
