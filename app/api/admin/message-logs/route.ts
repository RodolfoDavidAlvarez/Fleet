import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

// GET - List all message logs
export async function GET(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const type = searchParams.get("type");
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : 100;
    const offset = searchParams.get("offset") ? parseInt(searchParams.get("offset")!) : 0;

    // Build query
    let query = supabase.from("message_logs").select("*", { count: "exact" }).order("sent_at", { ascending: false }).range(offset, offset + limit - 1);

    // Apply filters
    if (status) {
      query = query.eq("status", status);
    }
    if (type) {
      query = query.eq("type", type);
    }

    const { data: logs, error, count } = await query;

    if (error) {
      // If table doesn't exist yet, return empty array
      if (error.code === "42P01") {
        return NextResponse.json(
          {
            logs: [],
            count: 0,
            tableNotCreated: true,
            message: "message_logs table not created yet. Please run the SQL setup.",
          },
          { status: 200 }
        );
      }
      console.error("Error fetching message logs:", error);
      return NextResponse.json({ error: "Failed to fetch message logs" }, { status: 500 });
    }

    return NextResponse.json(
      {
        logs: logs || [],
        count: count || 0,
        limit,
        offset,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in GET /api/admin/message-logs:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
