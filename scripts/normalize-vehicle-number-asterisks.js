#!/usr/bin/env node
/**
 * Strip trailing "*" from vehicles.vehicle_number.
 *
 * The 41 starred rows are a legacy Airtable formatting artifact.
 * After this runs, the resolver no longer needs the .in([n, n*]) workaround.
 *
 * SAFETY:
 *   - Dry-run by default
 *   - Only updates rows where vehicle_number LIKE '%*'
 *   - Skips any row whose stripped value would collide with an existing bare row
 *     (we'd never want to merge two distinct vehicles)
 *   - Touches no other column
 *
 * Usage:
 *   node scripts/normalize-vehicle-number-asterisks.js
 *   node scripts/normalize-vehicle-number-asterisks.js --apply
 */

const fs = require("fs");
const path = require("path");

const APPLY = process.argv.includes("--apply");

const envPath = path.join(__dirname, "..", ".env.local");
const env = fs.readFileSync(envPath, "utf8");
const SB = env.match(/NEXT_PUBLIC_SUPABASE_URL=\"([^\"]+)\"/)[1];
const SR = env.match(/SUPABASE_SERVICE_ROLE_KEY=\"([^\"]+)\"/)[1];
const H = { apikey: SR, Authorization: "Bearer " + SR, "Content-Type": "application/json" };

async function sbGet(p) {
  const r = await fetch(SB + "/rest/v1/" + p, { headers: H });
  if (!r.ok) throw new Error(`GET ${p}: ${r.status} ${await r.text()}`);
  return r.json();
}

async function sbPatch(p, body) {
  const r = await fetch(SB + "/rest/v1/" + p, {
    method: "PATCH",
    headers: { ...H, Prefer: "return=minimal" },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`PATCH ${p}: ${r.status} ${await r.text()}`);
}

(async () => {
  console.log(APPLY ? "=== APPLY MODE ===" : "=== DRY RUN ===\n");

  const all = await sbGet("vehicles?select=id,vehicle_number&limit=2000");
  const starred = all.filter((v) => v.vehicle_number && v.vehicle_number.endsWith("*"));
  const bareSet = new Set(
    all
      .filter((v) => v.vehicle_number && !v.vehicle_number.endsWith("*"))
      .map((v) => v.vehicle_number.trim())
  );

  console.log(`Total vehicles: ${all.length}`);
  console.log(`Starred: ${starred.length}`);

  let collisions = 0;
  const updates = [];
  for (const v of starred) {
    const stripped = v.vehicle_number.replace(/\*+$/, "").trim();
    if (!stripped) continue;
    if (bareSet.has(stripped)) {
      console.log(`  COLLISION: id=${v.id} "${v.vehicle_number}" -> "${stripped}" already exists bare. SKIP.`);
      collisions++;
      continue;
    }
    updates.push({ id: v.id, from: v.vehicle_number, to: stripped });
  }

  console.log(`\nWill update: ${updates.length}`);
  console.log(`Will skip (collisions): ${collisions}`);
  console.log(`\nFirst 5 updates:`);
  for (const u of updates.slice(0, 5)) console.log(`  ${u.from} -> ${u.to}`);

  if (!APPLY) {
    console.log("\nDRY RUN — no writes. Re-run with --apply.");
    return;
  }

  let done = 0;
  for (const u of updates) {
    // Defensive: only update if vehicle_number is still the starred value we read
    await sbPatch(
      `vehicles?id=eq.${u.id}&vehicle_number=eq.${encodeURIComponent(u.from)}`,
      { vehicle_number: u.to }
    );
    done++;
    if (done % 10 === 0) console.log(`  ${done}/${updates.length}`);
  }
  console.log(`\nDone. Updated ${done} rows.`);
})().catch((e) => {
  console.error("FATAL:", e);
  process.exit(1);
});
