#!/usr/bin/env node
/**
 * Second-wave backfill: resolve orphan repair_requests + service_records
 * via their Airtable record IDs.
 *
 * Path:
 *   1. Pull all Airtable Repair Requests → build map: airtable_id → { vehicle_number, equipment_record_id }
 *   2. Pull all Airtable Service records → build map: airtable_id → equipment_record_id
 *   3. Use Supabase vehicles.airtable_id to map Equipment record ID → vehicles.id
 *   4. Also use vehicles.vehicle_number for direct text-number matches
 *   5. For each orphan Supabase record, resolve and prepare update.
 *
 * SAFETY:
 *   - dry-run by default
 *   - --apply only writes vehicle_id where currently NULL (append-only on this column)
 *   - never touches any other field
 *   - never deletes anything
 *
 * Usage:
 *   node scripts/backfill-via-airtable.js
 *   node scripts/backfill-via-airtable.js --apply
 */

const fs = require("fs");
const path = require("path");

const APPLY = process.argv.includes("--apply");

const envPath = path.join(__dirname, "..", ".env.local");
const env = fs.readFileSync(envPath, "utf8");
const SB = env.match(/NEXT_PUBLIC_SUPABASE_URL=\"([^\"]+)\"/)[1];
const SR_KEY = env.match(/SUPABASE_SERVICE_ROLE_KEY=\"([^\"]+)\"/)[1];

const VERCEL_ENV = fs.readFileSync("/tmp/agave-vercel.env", "utf8");
const AT_KEY = VERCEL_ENV.match(/AIRTABLE_API_KEY="?([^"\n]+)/)[1].replace(/"$/, "");
const AT_BASE = VERCEL_ENV.match(/AIRTABLE_BASE_ID="?([^"\n]+)/)[1].replace(/"$/, "");

const SBH = { apikey: SR_KEY, Authorization: "Bearer " + SR_KEY, "Content-Type": "application/json" };
const ATH = { Authorization: "Bearer " + AT_KEY };

const TBL_REPAIR = "tblNQuA8GnKi2oPLS";
const TBL_SERVICE = "tbluKRycfU6g0xufF";

async function sbGet(p) {
  const r = await fetch(SB + "/rest/v1/" + p, { headers: SBH });
  if (!r.ok) throw new Error(`sbGet ${p}: ${r.status} ${await r.text()}`);
  return r.json();
}

async function sbPatch(p, body) {
  const r = await fetch(SB + "/rest/v1/" + p, {
    method: "PATCH",
    headers: { ...SBH, Prefer: "return=minimal" },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`sbPatch ${p}: ${r.status} ${await r.text()}`);
}

async function listAirtable(table, fields) {
  const rows = [];
  let offset;
  let pages = 0;
  do {
    const params = new URLSearchParams();
    params.set("pageSize", "100");
    for (const f of fields) params.append("fields[]", f);
    if (offset) params.set("offset", offset);
    const url = `https://api.airtable.com/v0/${AT_BASE}/${table}?${params}`;
    const r = await fetch(url, { headers: ATH });
    if (!r.ok) throw new Error(`Airtable list ${table}: ${r.status} ${await r.text()}`);
    const d = await r.json();
    for (const rec of d.records) rows.push(rec);
    offset = d.offset;
    pages++;
    if (pages % 5 === 0) console.log(`    ${rows.length} records so far...`);
  } while (offset);
  return rows;
}

(async () => {
  console.log(APPLY ? "=== APPLY MODE ===" : "=== DRY RUN ===\n");

  console.log("[1/5] Loading Supabase vehicles (build airtable_id + vehicle_number maps)...");
  let allVehicles = [];
  let off = 0;
  while (true) {
    const batch = await sbGet(`vehicles?select=id,airtable_id,vehicle_number&limit=1000&offset=${off}`);
    allVehicles = allVehicles.concat(batch);
    if (batch.length < 1000) break;
    off += 1000;
  }
  const vehByAirtable = new Map();
  const vehByNumber = new Map();
  // Vehicle numbers in this DB sometimes have trailing "*" (legacy Airtable formatting)
  // and may have leading "#". Normalize to bare digits for matching.
  const normalize = (s) => s ? s.toString().trim().replace(/^#+/, "").replace(/\*+$/, "").toUpperCase() : "";
  for (const v of allVehicles) {
    if (v.airtable_id) vehByAirtable.set(v.airtable_id, v.id);
    if (v.vehicle_number) {
      const k = normalize(v.vehicle_number);
      if (k) vehByNumber.set(k, v.id);
    }
  }
  console.log(`    ${allVehicles.length} vehicles, ${vehByAirtable.size} with airtable_id`);

  console.log("\n[2/5] Listing Airtable Repair Requests (this can take a minute)...");
  const repairRows = await listAirtable(TBL_REPAIR, [
    "Vehicle number",
    "Make and Model",
    "Vehicle detected",
  ]);
  console.log(`    ${repairRows.length} Airtable repair requests`);

  const repairAirtableMap = new Map();
  for (const r of repairRows) {
    const f = r.fields || {};
    const veh = (f["Vehicle number"] || "").toString().trim();
    const detected = Array.isArray(f["Vehicle detected"]) ? f["Vehicle detected"][0] : null;
    repairAirtableMap.set(r.id, { vehicleNumber: veh, equipmentId: detected });
  }

  console.log("\n[3/5] Listing Airtable Service records...");
  const serviceRows = await listAirtable(TBL_SERVICE, ["Vehicle", "Repair ID"]);
  console.log(`    ${serviceRows.length} Airtable service records`);

  const serviceAirtableMap = new Map();
  for (const r of serviceRows) {
    const f = r.fields || {};
    const veh = Array.isArray(f["Vehicle"]) ? f["Vehicle"][0] : null;
    const repairId = Array.isArray(f["Repair ID"]) ? f["Repair ID"][0] : null;
    serviceAirtableMap.set(r.id, { equipmentId: veh, repairAirtableId: repairId });
  }

  console.log("\n[4/5] Resolving orphan repair_requests in Supabase...");
  let orphRepairs = [];
  off = 0;
  while (true) {
    const batch = await sbGet(
      `repair_requests?select=id,airtable_id,vehicle_identifier&vehicle_id=is.null&limit=1000&offset=${off}`
    );
    orphRepairs = orphRepairs.concat(batch);
    if (batch.length < 1000) break;
    off += 1000;
  }
  console.log(`    ${orphRepairs.length} orphan repair_requests`);

  let rrMatchAirtableEquip = 0,
    rrMatchAirtableNum = 0,
    rrUnmatched = 0;
  const rrUpdates = [];
  for (const r of orphRepairs) {
    if (!r.airtable_id) {
      rrUnmatched++;
      continue;
    }
    const at = repairAirtableMap.get(r.airtable_id);
    if (!at) {
      rrUnmatched++;
      continue;
    }
    let vid = null;
    if (at.equipmentId && vehByAirtable.has(at.equipmentId)) {
      vid = vehByAirtable.get(at.equipmentId);
      rrMatchAirtableEquip++;
    } else if (at.vehicleNumber) {
      const k = normalize(at.vehicleNumber);
      if (vehByNumber.has(k)) {
        vid = vehByNumber.get(k);
        rrMatchAirtableNum++;
      }
    }
    if (vid) rrUpdates.push({ id: r.id, vehicle_id: vid });
    else rrUnmatched++;
  }
  console.log(
    `    via Equipment link: ${rrMatchAirtableEquip}, via vehicle_number text: ${rrMatchAirtableNum}, still unmatched: ${rrUnmatched}`
  );

  console.log("\n[5/5] Resolving orphan service_records in Supabase...");
  let orphServices = [];
  off = 0;
  while (true) {
    const batch = await sbGet(
      `service_records?select=id,airtable_id,repair_request_id&vehicle_id=is.null&limit=1000&offset=${off}`
    );
    orphServices = orphServices.concat(batch);
    if (batch.length < 1000) break;
    off += 1000;
  }
  console.log(`    ${orphServices.length} orphan service_records`);

  // Pre-build a Supabase repair_request -> vehicle_id map after our pending repair updates
  const rrIdToVid = new Map();
  for (const u of rrUpdates) rrIdToVid.set(u.id, u.vehicle_id);
  // Also include repairs already linked
  const linkedRepairs = await sbGet(
    `repair_requests?select=id,vehicle_id&vehicle_id=not.is.null&limit=2000`
  );
  for (const r of linkedRepairs) rrIdToVid.set(r.id, r.vehicle_id);

  let srMatchEquip = 0,
    srMatchRepair = 0,
    srUnmatched = 0;
  const srUpdates = [];
  for (const s of orphServices) {
    let vid = null;
    if (s.airtable_id && serviceAirtableMap.has(s.airtable_id)) {
      const at = serviceAirtableMap.get(s.airtable_id);
      if (at.equipmentId && vehByAirtable.has(at.equipmentId)) {
        vid = vehByAirtable.get(at.equipmentId);
        srMatchEquip++;
      }
    }
    if (!vid && s.repair_request_id && rrIdToVid.has(s.repair_request_id)) {
      vid = rrIdToVid.get(s.repair_request_id);
      srMatchRepair++;
    }
    if (vid) srUpdates.push({ id: s.id, vehicle_id: vid });
    else srUnmatched++;
  }
  console.log(
    `    via Equipment link: ${srMatchEquip}, via repair chain: ${srMatchRepair}, still unmatched: ${srUnmatched}`
  );

  console.log("\n=== Plan summary ===");
  console.log(`repair_requests to update:  ${rrUpdates.length}`);
  console.log(`service_records to update:  ${srUpdates.length}`);

  if (!APPLY) {
    console.log("\nDRY RUN — no writes. Re-run with --apply.");
    return;
  }

  console.log("\nWriting repair_request updates...");
  let done = 0;
  for (const u of rrUpdates) {
    // Defensive: only update if currently NULL (append-only on this column)
    await sbPatch(`repair_requests?id=eq.${u.id}&vehicle_id=is.null`, { vehicle_id: u.vehicle_id });
    done++;
    if (done % 50 === 0) console.log(`  ${done}/${rrUpdates.length}`);
  }
  console.log("Writing service_record updates...");
  done = 0;
  for (const u of srUpdates) {
    await sbPatch(`service_records?id=eq.${u.id}&vehicle_id=is.null`, { vehicle_id: u.vehicle_id });
    done++;
    if (done % 50 === 0) console.log(`  ${done}/${srUpdates.length}`);
  }
  console.log("\nDone.");
})().catch((e) => {
  console.error("FATAL:", e);
  process.exit(1);
});
