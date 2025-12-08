#!/usr/bin/env node

import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, "../.env.local") });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function addBatchIdColumn() {
  console.log("Adding batch_id and batch_subject columns to message_logs...\n");

  // Execute the SQL directly via RPC or use raw SQL
  const { error } = await supabase.rpc('exec_sql', {
    sql: `
      ALTER TABLE public.message_logs
      ADD COLUMN IF NOT EXISTS batch_id UUID,
      ADD COLUMN IF NOT EXISTS batch_subject TEXT;

      CREATE INDEX IF NOT EXISTS idx_message_logs_batch_id ON public.message_logs(batch_id);
    `
  });

  if (error) {
    // Try alternative approach - just insert a test record to see if columns exist
    console.log("RPC not available, checking columns directly...");

    // Check if columns exist by trying to query them
    const { data, error: queryError } = await supabase
      .from("message_logs")
      .select("batch_id, batch_subject")
      .limit(1);

    if (queryError) {
      console.log("Columns don't exist yet. Please run this SQL in Supabase dashboard:\n");
      console.log(`
ALTER TABLE public.message_logs
ADD COLUMN IF NOT EXISTS batch_id UUID,
ADD COLUMN IF NOT EXISTS batch_subject TEXT;

CREATE INDEX IF NOT EXISTS idx_message_logs_batch_id ON public.message_logs(batch_id);
      `);
      return false;
    } else {
      console.log("✅ Columns already exist!");
      return true;
    }
  }

  console.log("✅ Columns added successfully!");
  return true;
}

addBatchIdColumn();
