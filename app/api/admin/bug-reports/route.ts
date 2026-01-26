import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

// GET - Fetch ALL bug reports (admin only)
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient();

    // Fetch all bug reports ordered by newest first
    const { data: reports, error } = await supabase
      .from("bug_reports")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching bug reports:", error);
      return NextResponse.json({ error: "Failed to fetch bug reports" }, { status: 500 });
    }

    return NextResponse.json({ reports: reports || [] });
  } catch (error) {
    console.error("Error in GET /api/admin/bug-reports:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH - Update bug report status (admin only)
export async function PATCH(request: NextRequest) {
  try {
    const { reportId, status, adminNotes } = await request.json();

    if (!reportId) {
      return NextResponse.json({ error: "Report ID is required" }, { status: 400 });
    }

    const validStatuses = ["pending", "in_progress", "resolved", "closed"];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const supabase = createServerClient();

    const updates: any = {
      updated_at: new Date().toISOString(),
    };

    if (status) {
      updates.status = status;
      if (status === "resolved" || status === "closed") {
        updates.resolved_at = new Date().toISOString();
      }
    }

    if (adminNotes !== undefined) {
      updates.admin_notes = adminNotes;
    }

    const { data, error } = await supabase
      .from("bug_reports")
      .update(updates)
      .eq("id", reportId)
      .select()
      .single();

    if (error) {
      console.error("Error updating bug report:", error);
      return NextResponse.json({ error: "Failed to update bug report" }, { status: 500 });
    }

    return NextResponse.json({ success: true, report: data });
  } catch (error) {
    console.error("Error in PATCH /api/admin/bug-reports:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
