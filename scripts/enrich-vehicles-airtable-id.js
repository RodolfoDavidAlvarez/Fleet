#!/usr/bin/env node
/**
 * Enrich vehicles.airtable_id by matching vehicle_number against Airtable
 * Equipment Inventory records.
 *
 * SAFETY:
 *   - Only updates vehicles where airtable_id IS NULL (append-only)
 *   - Only updates if the Airtable Vehicle number is unambiguous (single match)
 *   - Touches no other column
 *
 * Usage:
 *   node scripts/enrich-vehicles-airtable-id.js          # dry run
 *   node scripts/enrich-vehicles-airtable-id.js --apply  # write
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

const TBL_EQUIPMENT = "tblP0QKVJNdaDpcrD";

async function sbGet(p) {
  const r = await fetch(SB + "/rest/v1/" + p, { headers: SBH });
  if (!r.ok) throw new Error(`sbGet ${p}: ${r.status}`);
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
  do {
    const params = new URLSearchParams();
    params.set("pageSize", "100");
    for (const f of fields) params.append("fields[]", f);
    if (offset) params.set("offset", offset);
    const r = await fetch(`https://api.airtable.com/v0/${AT_BASE}/${table}?${params}`, { headers: ATH });
    if (!r.ok) throw new Error(`Airtable ${table}: ${r.status}`);
    const d = await r.json();
    rows.push(...d.records);
    offset = d.offset;
  } while (offset);
  return rows;
}

(async () => {
  console.log(APPLY ? "=== APPLY MODE ===" : "=== DRY RUN ===\n");

  console.log("Loading Airtable Equipment Inventory...");
  const eq = await listAirtable(TBL_EQUIPMENT, ["Vehicle number"]);
  const eqByNum = new Map();
  const eqDups = new Set();
  for (const r of eq) {
    const n = (r.fields["Vehicle number"] || "").toString().trim();
    if (!n) continue;
    if (eqByNum.has(n)) eqDups.add(n);
    eqByNum.set(n, r.id);
  }
  console.log(`  ${eq.length} equipment records, ${eqByNum.size} unique numbers, ${eqDups.size} duplicates`);

  console.log("\nLoading Supabase vehicles (airtable_id IS NULL)...");
  const vRows = await sbGet("vehicles?select=id,vehicle_number,airtable_id&airtable_id=is.null&limit=1000");
  console.log(`  ${vRows.length} vehicles without airtable_id`);

  let toUpdate = 0;
  let ambiguous = 0;
  let noMatch = 0;
  const updates = [];
  for (const v of vRows) {
    const num = (v.vehicle_number || "").trim();
    if (!num) {
      noMatch++;
      continue;
    }
    if (eqDups.has(num)) {
      ambiguous++;
      continue;
    }
    if (eqByNum.has(num)) {
      updates.push({ id: v.id, airtable_id: eqByNum.get(num) });
      toUpdate++;
    } else {
      noMatch++;
    }
  }
  console.log(`  ${toUpdate} clean matches, ${ambiguous} ambiguous, ${noMatch} no match`);

  if (!APPLY) {
    console.log("\nDRY RUN — no writes. Re-run with --apply.");
    return;
  }

  console.log("\nWriting...");
  let done = 0;
  for (const u of updates) {
    await sbPatch(`vehicles?id=eq.${u.id}&airtable_id=is.null`, { airtable_id: u.airtable_id });
    done++;
    if (done % 50 === 0) console.log(`  ${done}/${updates.length}`);
  }
  console.log("Done.");
})().catch((e) => {
  console.error("FATAL:", e);
  process.exit(1);
});
