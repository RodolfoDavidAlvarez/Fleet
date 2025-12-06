const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function analyzeDataDetailed() {
  console.log("=== DETAILED DATA ANALYSIS ===\n");

  // 1. Check vehicle_drivers junction table
  console.log("--- VEHICLE_DRIVERS TABLE ANALYSIS ---");
  const { data: vd, error: vdErr } = await supabase
    .from("vehicle_drivers")
    .select(`
      *,
      vehicle:vehicles(id, make, model, year, vehicle_number, vin, license_plate),
      driver:users(id, name, phone, email, role)
    `)
    .eq("is_primary", true);

  if (vdErr) {
    console.error("Error:", vdErr);
    return;
  }

  console.log(`\nPrimary vehicle-driver assignments: ${vd.length}\n`);

  // Show some examples
  console.log("Sample vehicle-driver relationships:");
  vd.slice(0, 15).forEach(rel => {
    const v = rel.vehicle;
    const d = rel.driver;
    console.log(`\n  Vehicle: ${v?.make || ""} ${v?.model || ""} [Co. ID: ${v?.vehicle_number || "N/A"}]`);
    console.log(`    VIN: ${v?.vin || "N/A"}`);
    console.log(`    License: ${v?.license_plate || "N/A"}`);
    console.log(`    Driver: ${d?.name || "Unknown"} (${d?.phone || "no phone"})`);
  });

  // 2. Check vehicles that have actual VINs (not AIRTABLE- prefixed)
  console.log("\n\n--- VEHICLES WITH REAL VINs ---");
  const { data: vehicles } = await supabase
    .from("vehicles")
    .select("*");

  const realVins = vehicles.filter(v => v.vin && !v.vin.startsWith("AIRTABLE-"));
  console.log(`Vehicles with real VINs: ${realVins.length}`);

  console.log("\nSample vehicles with real VINs:");
  realVins.slice(0, 10).forEach(v => {
    console.log(`  ${v.make || ""} ${v.model || ""} [Co. ID: ${v.vehicle_number || "N/A"}]`);
    console.log(`    VIN: ${v.vin}`);
    console.log(`    License: ${v.license_plate || "N/A"}`);
  });

  // 3. Check make/model distribution
  console.log("\n\n--- VEHICLE MAKE/MODEL ANALYSIS ---");
  const makeModelCount = {};
  vehicles.forEach(v => {
    const key = `${v.make || "Unknown"} ${v.model || ""}`.trim();
    makeModelCount[key] = (makeModelCount[key] || 0) + 1;
  });

  const sorted = Object.entries(makeModelCount).sort((a, b) => b[1] - a[1]);
  console.log("Top 20 make/model combinations:");
  sorted.slice(0, 20).forEach(([makeModel, count]) => {
    console.log(`  ${makeModel}: ${count}`);
  });

  // 4. Check for vehicles that appear to be Equipment or Trailers based on model name
  console.log("\n\n--- EQUIPMENT/TRAILER DETECTION ---");
  const equipmentKeywords = ["trailer", "loader", "gator", "exmark", "mower", "boat", "golf", "utv", "cart", "toro", "moffett", "kubota", "john deere", "cat ", "caterpillar", "bucket"];
  const trailerKeywords = ["trailer", "flatbed"];

  let equipmentCount = 0;
  let trailerCount = 0;
  let vehicleCount = 0;

  const potentialEquipment = [];
  const potentialTrailers = [];

  vehicles.forEach(v => {
    const fullName = `${v.make || ""} ${v.model || ""}`.toLowerCase();
    const isEquipment = equipmentKeywords.some(kw => fullName.includes(kw)) && !trailerKeywords.some(kw => fullName.includes(kw));
    const isTrailer = trailerKeywords.some(kw => fullName.includes(kw));

    if (isTrailer) {
      trailerCount++;
      potentialTrailers.push(v);
    } else if (isEquipment) {
      equipmentCount++;
      potentialEquipment.push(v);
    } else {
      vehicleCount++;
    }
  });

  console.log(`Detected as Equipment: ${equipmentCount}`);
  console.log(`Detected as Trailer: ${trailerCount}`);
  console.log(`Detected as Vehicle: ${vehicleCount}`);

  console.log("\nSample detected equipment:");
  potentialEquipment.slice(0, 5).forEach(v => {
    console.log(`  ${v.make || ""} ${v.model || ""} [Co. ID: ${v.vehicle_number || "N/A"}]`);
  });

  console.log("\nSample detected trailers:");
  potentialTrailers.slice(0, 5).forEach(v => {
    console.log(`  ${v.make || ""} ${v.model || ""} [Co. ID: ${v.vehicle_number || "N/A"}]`);
  });

  // 5. Check users for member_legacy_id population
  console.log("\n\n--- USERS WITH AIRTABLE DATA ---");
  const { data: users } = await supabase.from("users").select("*");

  const usersWithAirtableId = users.filter(u => u.airtable_id);
  console.log(`Users with airtable_id: ${usersWithAirtableId.length}`);

  console.log("\nSample users:");
  users.slice(0, 10).forEach(u => {
    console.log(`  ${u.name} (${u.role})`);
    console.log(`    Phone: ${u.phone || "N/A"}`);
    console.log(`    Legacy ID: ${u.member_legacy_id || "N/A"}`);
    console.log(`    Airtable ID: ${u.airtable_id || "N/A"}`);
  });

  console.log("\n=== DETAILED ANALYSIS COMPLETE ===");
}

analyzeDataDetailed().catch(console.error);
