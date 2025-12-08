import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// POST - Cancel a scheduled message
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const { id } = params;

    // Check if message exists and is pending
    const { data: message, error: fetchError } = await supabase.from("scheduled_messages").select("*").eq("id", id).single();

    if (fetchError || !message) {
      return NextResponse.json({ error: "Scheduled message not found" }, { status: 404 });
    }

    if (message.status !== "pending") {
      return NextResponse.json({ error: "Only pending messages can be cancelled" }, { status: 400 });
    }

    // Update status to cancelled
    const { error: updateError } = await supabase
      .from("scheduled_messages")
      .update({ status: "cancelled", updated_at: new Date().toISOString() })
      .eq("id", id);

    if (updateError) {
      console.error("Error cancelling scheduled message:", updateError);
      return NextResponse.json({ error: "Failed to cancel scheduled message" }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Scheduled message cancelled successfully" }, { status: 200 });
  } catch (error) {
    console.error("Error in POST /api/admin/scheduled-messages/[id]/cancel:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
