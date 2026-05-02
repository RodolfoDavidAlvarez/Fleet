#!/usr/bin/env node
/**
 * Backfill vehicle_id on orphaned repair_requests + service_records.
 *
 * Strategy:
 *   1. Build an in-memory map of vehicles keyed by vehicle_number, license_plate, vin
 *   2. For repair_requests with vehicle_id IS NULL but vehicle_identifier set,
 *      try to match against the map. Update if found.
 *   3. For service_records with vehicle_id IS NULL but repair_request_id set,
 *      copy vehicle_id from the (now-backfilled) repair_request.
 *
 * Usage:
 *   node scripts/backfill-vehicle-associations.js          # dry run, no writes
 *   node scripts/backfill-vehicle-associations.js --apply  # actually update DB
 */

const fs = require("fs");
const path = require("path");

const APPLY = process.argv.includes("--apply");

const envPath = path.join(__dirname, "..", ".env.local");
const env = fs.readFileSync(envPath, "utf8");
const SUPABASE_URL = env.match(/NEXT_PUBLIC_SUPABASE_URL=\"([^\"]+)\"/)[1];
const KEY = env.match(/SUPABASE_SERVICE_ROLE_KEY=\"([^\"]+)\"/)[1];
const H = { apikey: KEY, Authorization: "Bearer " + KEY, "Content-Type": "application/json" };

async function get(p) {
  const r = await fetch(SUPABASE_URL + "/rest/v1/" + p, { headers: H });
  if (!r.ok) throw new Error(`GET ${p} failed: ${r.status} ${await r.text()}`);
  return r.json();
}

async function patch(p, body) {
  const r = await fetch(SUPABASE_URL + "/rest/v1/" + p, {
    method: "PATCH",
    headers: { ...H, Prefer: "return=minimal" },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`PATCH ${p} failed: ${r.status} ${await r.text()}`);
}

function normalizeKey(s) {
  if (!s) return "";
  return s.toString().trim().replace(/^#+/, "").replace(/\*+$/, "").toUpperCase();
}

(async () => {
  console.log(APPLY ? "=== APPLY MODE — writes will happen ===" : "=== DRY RUN — no writes ===\n");

  console.log("Loading vehicles...");
  let vehicles = [];
  let offset = 0;
  while (true) {
    const batch = await get(`vehicles?select=id,vehicle_number,license_plate,vin&limit=1000&offset=${offset}`);
    vehicles = vehicles.concat(batch);
    if (batch.length < 1000) break;
    offset += 1000;
  }
  console.log(`  Loaded ${vehicles.length} vehicles`);

  const byNumber = new Map();
  const byPlate = new Map();
  const byVin = new Map();
  for (const v of vehicles) {
    if (v.vehicle_number) {
      const k = normalizeKey(v.vehicle_number);
      if (k) byNumber.set(k, v.id);
    }
    if (v.license_plate) {
      const k = normalizeKey(v.license_plate);
      if (k) byPlate.set(k, v.id);
    }
    if (v.vin) {
      const k = normalizeKey(v.vin);
      if (k) byVin.set(k, v.id);
    }
  }
  console.log(`  Index: ${byNumber.size} vehicle_numbers, ${byPlate.size} plates, ${byVin.size} VINs\n`);

  console.log("Loading orphan repair_requests (vehicle_id IS NULL, vehicle_identifier NOT NULL)...");
  let repairs = [];
  offset = 0;
  while (true) {
    const batch = await get(
      `repair_requests?select=id,vehicle_identifier&vehicle_id=is.null&vehicle_identifier=not.is.null&limit=1000&offset=${offset}`
    );
    repairs = repairs.concat(batch);
    if (batch.length < 1000) break;
    offset += 1000;
  }
  console.log(`  ${repairs.length} orphan repair_requests with typed identifier\n`);

  let matched = 0,
    unmatched = 0;
  const repairUpdates = [];
  const sampleUnmatched = [];

  for (const r of repairs) {
    const raw = r.vehicle_identifier.trim();
    const numericPart = raw.split(/\s+/)[0];
    const candidates = [normalizeKey(numericPart), normalizeKey(raw)];
    let vid = null;
    for (const k of candidates) {
      if (k && byNumber.has(k)) {
        vid = byNumber.get(k);
        break;
      }
    }
    if (!vid) {
      const k = normalizeKey(raw);
      if (k && byPlate.has(k)) vid = byPlate.get(k);
      else if (k && byVin.has(k)) vid = byVin.get(k);
    }
    if (vid) {
      matched++;
      repairUpdates.push({ id: r.id, vehicle_id: vid });
    } else {
      unmatched++;
      if (sampleUnmatched.length < 15) sampleUnmatched.push(raw);
    }
  }

  console.log(`Repair_requests resolution: ${matched} matched, ${unmatched} unmatched`);
  if (sampleUnmatched.length) console.log(`  Sample unmatched identifiers:`, sampleUnmatched);

  if (APPLY && repairUpdates.length) {
    console.log(`\nWriting ${repairUpdates.length} repair_request updates...`);
    let done = 0;
    for (const u of repairUpdates) {
      await patch(`repair_requests?id=eq.${u.id}`, { vehicle_id: u.vehicle_id });
      done++;
      if (done % 100 === 0) console.log(`  ${done}/${repairUpdates.length}`);
    }
    console.log(`  Done.`);
  }

  console.log("\nLoading orphan service_records (vehicle_id IS NULL)...");
  let services = [];
  offset = 0;
  while (true) {
    const batch = await get(
      `service_records?select=id,repair_request_id&vehicle_id=is.null&limit=1000&offset=${offset}`
    );
    services = services.concat(batch);
    if (batch.length < 1000) break;
    offset += 1000;
  }
  console.log(`  ${services.length} orphan service_records`);

  // Build a fresh repair → vehicle map (after applying updates above if APPLY)
  const repairToVehicle = new Map();
  for (const u of repairUpdates) repairToVehicle.set(u.id, u.vehicle_id);

  // For service_records that link to repair_requests we didn't update (already had vehicle_id?)
  // also pull those mappings.
  const remainingRepairIds = new Set();
  for (const s of services) {
    if (s.repair_request_id && !repairToVehicle.has(s.repair_request_id)) {
      remainingRepairIds.add(s.repair_request_id);
    }
  }
  if (remainingRepairIds.size) {
    console.log(`  Fetching vehicle_id for ${remainingRepairIds.size} additional linked repairs...`);
    const ids = [...remainingRepairIds];
    for (let i = 0; i < ids.length; i += 200) {
      const chunk = ids.slice(i, i + 200);
      const data = await get(
        `repair_requests?select=id,vehicle_id&id=in.(${chunk.join(",")})`
      );
      for (const r of data) if (r.vehicle_id) repairToVehicle.set(r.id, r.vehicle_id);
    }
  }

  let srMatched = 0,
    srUnmatched = 0;
  const srUpdates = [];
  for (const s of services) {
    if (!s.repair_request_id) {
      srUnmatched++;
      continue;
    }
    const vid = repairToVehicle.get(s.repair_request_id);
    if (vid) {
      srMatched++;
      srUpdates.push({ id: s.id, vehicle_id: vid });
    } else {
      srUnmatched++;
    }
  }

  console.log(`\nService_records resolution: ${srMatched} matched (via repair_request), ${srUnmatched} unmatched`);

  if (APPLY && srUpdates.length) {
    console.log(`\nWriting ${srUpdates.length} service_record updates...`);
    let done = 0;
    for (const u of srUpdates) {
      await patch(`service_records?id=eq.${u.id}`, { vehicle_id: u.vehicle_id });
      done++;
      if (done % 100 === 0) console.log(`  ${done}/${srUpdates.length}`);
    }
    console.log(`  Done.`);
  }

  console.log("\n=== Summary ===");
  console.log(`Repair_requests:    ${matched} matched, ${unmatched} unmatched`);
  console.log(`Service_records:    ${srMatched} matched, ${srUnmatched} unmatched`);
  console.log(APPLY ? "\nWrites applied." : "\nDry run only — re-run with --apply to write.");
})().catch((e) => {
  console.error("FATAL:", e);
  process.exit(1);
});
