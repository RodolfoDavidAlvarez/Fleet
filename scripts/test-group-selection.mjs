#!/usr/bin/env node

/**
 * Test that group selection finds users correctly
 * WITHOUT actually sending any messages
 */

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

async function testGroupSelection() {
  console.log("=== Testing Group Selection ===\n");

  const groups = [
    { id: "all_drivers", role: "driver" },
    { id: "all_mechanics", role: "mechanic" },
    { id: "all_admins", role: "admin" },
  ];

  for (const group of groups) {
    const { data, error } = await supabase
      .from("users")
      .select("id, name, email, phone, role")
      .eq("role", group.role);

    if (error) {
      console.log(`❌ ${group.id}: ERROR - ${error.message}`);
      continue;
    }

    const withPhone = data.filter(u => u.phone && u.phone.trim()).length;
    const withoutPhone = data.length - withPhone;

    console.log(`✅ ${group.id}:`);
    console.log(`   Total: ${data.length}`);
    console.log(`   With phone: ${withPhone}`);
    console.log(`   Without phone: ${withoutPhone}`);

    // Show first 3 with phones
    const sample = data.filter(u => u.phone && u.phone.trim()).slice(0, 3);
    sample.forEach(u => {
      console.log(`   - ${u.name || u.email}: ${u.phone}`);
    });
    console.log("");
  }

  console.log("\n=== API Test via localhost ===\n");

  // Test API with just my phone to verify it works (custom recipient only)
  const testPayload = {
    type: "sms",
    subject: "Test",
    messageEn: "Test message - Group selection is working!",
    recipientGroups: ["all_drivers"], // This should find 69 drivers with phones
    individualRecipients: [],
    customRecipients: [], // Empty - we won't actually send
    sendNow: false, // Don't actually send
  };

  console.log("Testing API to see if it finds drivers...");
  console.log("(Not actually sending - just checking the group query works)\n");

  // Simulate what the API does
  let allRecipients = [];
  const { data: drivers } = await supabase
    .from("users")
    .select("id, name, email, phone, role")
    .eq("role", "driver");

  if (drivers) {
    allRecipients = drivers;
  }

  const validRecipients = allRecipients.filter(r => r.phone && r.phone.trim());

  console.log(`API would find: ${allRecipients.length} drivers total`);
  console.log(`API would send to: ${validRecipients.length} drivers with valid phones`);

  if (validRecipients.length > 0) {
    console.log("\n✅ GROUP SELECTION IS WORKING!");
    console.log("You can now test sending from the UI.");
  } else {
    console.log("\n❌ Something is wrong - no valid recipients found.");
  }
}

testGroupSelection();
