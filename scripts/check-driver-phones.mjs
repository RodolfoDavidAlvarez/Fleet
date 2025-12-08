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

async function checkDriverPhones() {
  console.log("=== Checking Driver Phone Numbers ===\n");

  // Get counts by role
  const { data: users, error } = await supabase
    .from("users")
    .select("id, name, email, phone, role")
    .order("role");

  if (error) {
    console.error("Error fetching users:", error);
    return;
  }

  // Group by role
  const byRole = {};
  for (const user of users) {
    if (!byRole[user.role]) {
      byRole[user.role] = { total: 0, withPhone: 0, withoutPhone: [] };
    }
    byRole[user.role].total++;
    if (user.phone && user.phone.trim()) {
      byRole[user.role].withPhone++;
    } else {
      byRole[user.role].withoutPhone.push(user.name || user.email);
    }
  }

  console.log("Summary by Role:");
  console.log("================");
  for (const [role, stats] of Object.entries(byRole)) {
    console.log(`\n${role.toUpperCase()}:`);
    console.log(`  Total: ${stats.total}`);
    console.log(`  With valid phone: ${stats.withPhone}`);
    console.log(`  Without phone: ${stats.total - stats.withPhone}`);
    if (stats.withoutPhone.length > 0 && stats.withoutPhone.length <= 10) {
      console.log(`  Missing phone: ${stats.withoutPhone.join(", ")}`);
    }
  }

  // Get sample drivers with phones
  console.log("\n\nSample Drivers WITH Phone Numbers:");
  console.log("===================================");
  const driversWithPhone = users.filter(u => u.role === "driver" && u.phone && u.phone.trim());
  driversWithPhone.slice(0, 5).forEach(d => {
    console.log(`  - ${d.name || "No name"}: ${d.phone}`);
  });

  // Get sample drivers without phones
  console.log("\n\nSample Drivers WITHOUT Phone Numbers:");
  console.log("======================================");
  const driversWithoutPhone = users.filter(u => u.role === "driver" && (!u.phone || !u.phone.trim()));
  driversWithoutPhone.slice(0, 5).forEach(d => {
    console.log(`  - ${d.name || "No name"} (${d.email})`);
  });
}

checkDriverPhones();
