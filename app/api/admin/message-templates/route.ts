import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: templates, error } = await supabase.from("message_templates").select("*").order("updated_at", { ascending: false });

    if (error) {
      console.error("Error fetching templates:", error);
      return NextResponse.json({ error: "Failed to fetch templates", details: error.message }, { status: 500 });
    }

    return NextResponse.json({ templates: templates || [] }, { status: 200 });
  } catch (error) {
    console.error("Error in GET /api/admin/message-templates:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const { name, subject, messageEn, messageEs, type, category } = body;

    if (!name || !messageEn) {
      return NextResponse.json({ error: "Template name and message are required" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("message_templates")
      .insert({
        name,
        subject,
        message_en: messageEn,
        message_es: messageEs,
        type: type || "email",
        category: category || "announcement",
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating template:", error);
      return NextResponse.json({ error: "Failed to create template", details: error.message }, { status: 500 });
    }

    return NextResponse.json({ template: data }, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/admin/message-templates:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
