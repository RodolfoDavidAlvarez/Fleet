import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// This endpoint sets up the message logs table and fixes RLS policies
export async function POST(request: NextRequest) {
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
    const { data: userData } = await supabase
      .from("users")
      .select("role, approval_status")
      .eq("id", authUser.id)
      .single();

    // Mechanics are treated as admins with full permissions
    if (!userData || (userData.role !== "admin" && userData.role !== "mechanic") || userData.approval_status !== "approved") {
      return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 });
    }

    const sql = `
-- ============================================
-- FIX MESSAGE TEMPLATES RLS POLICY
-- ============================================
DROP POLICY IF EXISTS "Allow authenticated users to read message templates" ON message_templates;

CREATE POLICY "Allow anyone to read message templates via API"
  ON message_templates FOR SELECT
  USING (true);


-- ============================================
-- CREATE MESSAGE LOGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS message_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('email', 'sms', 'both')),
  subject TEXT,
  message_content TEXT NOT NULL,
  recipient_type TEXT NOT NULL CHECK (recipient_type IN ('individual', 'group', 'custom')),
  recipient_identifier TEXT NOT NULL,
  recipient_name TEXT,
  status TEXT NOT NULL CHECK (status IN ('sent', 'failed', 'bounced')),
  error_message TEXT,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  scheduled_message_id UUID REFERENCES scheduled_messages(id) ON DELETE SET NULL,
  template_id UUID REFERENCES message_templates(id) ON DELETE SET NULL,
  was_scheduled BOOLEAN DEFAULT false,
  sent_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_message_logs_sent_at ON message_logs(sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_message_logs_recipient ON message_logs(recipient_identifier);
CREATE INDEX IF NOT EXISTS idx_message_logs_status ON message_logs(status);
CREATE INDEX IF NOT EXISTS idx_message_logs_scheduled_message ON message_logs(scheduled_message_id);

ALTER TABLE message_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated users to read message logs" ON message_logs;
DROP POLICY IF EXISTS "Allow anyone to insert message logs via API" ON message_logs;

CREATE POLICY "Allow authenticated users to read message logs"
  ON message_logs FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow anyone to insert message logs via API"
  ON message_logs FOR INSERT
  WITH CHECK (true);


-- ============================================
-- ADD MISSING COLUMNS TO SCHEDULED_MESSAGES
-- ============================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'scheduled_messages' AND column_name = 'processed_at'
  ) THEN
    ALTER TABLE scheduled_messages ADD COLUMN processed_at TIMESTAMPTZ;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'scheduled_messages' AND column_name = 'error_details'
  ) THEN
    ALTER TABLE scheduled_messages ADD COLUMN error_details TEXT;
  END IF;
END $$;
    `;

    console.log("[Setup Messaging System] Executing SQL setup...");
    console.log("[Setup Messaging System] SQL:", sql);

    return NextResponse.json(
      {
        message: "Setup instructions ready",
        sql: sql,
        instructions: [
          "Copy the SQL from the 'sql' field in this response",
          "Go to https://supabase.com/dashboard/project/kxcixjiafdohbpwijfmd/sql/new",
          "Paste and execute the SQL",
          "Return to the announcements page and refresh",
        ],
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[Setup Messaging System] Error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
