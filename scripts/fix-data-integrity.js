const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Equipment detection keywords
const EQUIPMENT_KEYWORDS = [
  "loader", "gator", "exmark", "mower", "boat", "golf", "utv", "cart", "toro",
  "moffett", "kubota", "john deere", "cat ", "caterpillar", "bucket", "excavator",
  "backhoe", "forklift", "skid", "bobcat", "mini excavator", "compactor", "roller",
  "navigator", "workman", "radius"
];

const TRAILER_KEYWORDS = [
  "trailer", "flatbed", "doonan", "felling", "mesa", "tank trailer", "butler",
  "carson", "pj ", "dump trailer", "cargo trailer", "utility trailer", "east texas"
];

function detectVehicleType(make, model) {
  const fullName = `${make || ""} ${model || ""}`.toLowerCase();

  // Check for trailers first (more specific)
  if (TRAILER_KEYWORDS.some(kw => fullName.includes(kw))) {
    return "Trailer";
  }

  // Check for equipment
  if (EQUIPMENT_KEYWORDS.some(kw => fullName.includes(kw))) {
    return "Equipment";
  }

  // Default to Vehicle
  return "Vehicle";
}

// Parse Company ID from various formats like "2015 Chevy Silverado 2500 [Co. ID: 1582*]"
function extractCompanyIdFromName(name) {
  if (!name) return null;
  const match = name.match(/\[Co\.\s*ID:\s*([^\]]+)\]/i);
  return match ? match[1].trim() : null;
}

async function fixDataIntegrity() {
  console.log("=== DATA INTEGRITY FIX ===\n");

  let stats = {
    driversLinked: 0,
    vehicleTypesSet: 0,
    companyIdsUpdated: 0,
    errors: []
  };

  // ============================================
  // STEP 1: Sync driver_id from vehicle_drivers
  // ============================================
  console.log("--- STEP 1: Syncing driver_id from vehicle_drivers ---");

  const { data: vehicleDrivers, error: vdErr } = await supabase
    .from("vehicle_drivers")
    .select("vehicle_id, driver_id")
    .eq("is_primary", true);

  if (vdErr) {
    console.error("Error fetching vehicle_drivers:", vdErr);
    return;
  }

  console.log(`Found ${vehicleDrivers.length} primary vehicle-driver assignments`);

  for (const vd of vehicleDrivers) {
    try {
      const { error } = await supabase
        .from("vehicles")
        .update({ driver_id: vd.driver_id })
        .eq("id", vd.vehicle_id);

      if (error) throw error;
      stats.driversLinked++;
    } catch (err) {
      stats.errors.push(`Driver link: ${err.message}`);
    }
  }
  console.log(`Linked ${stats.driversLinked} drivers to vehicles\n`);

  // ============================================
  // STEP 2: Populate vehicle_type field
  // ============================================
  console.log("--- STEP 2: Setting vehicle_type field ---");

  const { data: vehicles, error: vErr } = await supabase
    .from("vehicles")
    .select("id, make, model, vehicle_type");

  if (vErr) {
    console.error("Error fetching vehicles:", vErr);
    return;
  }

  const vehiclesToUpdate = vehicles.filter(v => !v.vehicle_type || v.vehicle_type.trim() === "");
  console.log(`Found ${vehiclesToUpdate.length} vehicles without type`);

  for (const vehicle of vehiclesToUpdate) {
    try {
      const detectedType = detectVehicleType(vehicle.make, vehicle.model);
      const { error } = await supabase
        .from("vehicles")
        .update({ vehicle_type: detectedType })
        .eq("id", vehicle.id);

      if (error) throw error;
      stats.vehicleTypesSet++;
    } catch (err) {
      stats.errors.push(`Vehicle type: ${err.message}`);
    }
  }
  console.log(`Set vehicle_type for ${stats.vehicleTypesSet} vehicles\n`);

  // ============================================
  // STEP 3: Extract Company IDs from CSV
  // ============================================
  console.log("--- STEP 3: Extracting Company IDs from Airtable data ---");

  const csvPath = path.join(__dirname, "..", "Airtable main tables snapshots csv", "Equipment Inventory-All records.csv");

  if (fs.existsSync(csvPath)) {
    const csvContent = fs.readFileSync(csvPath, "utf-8");
    const lines = csvContent.split("\n");
    const headers = lines[0].split(",");

    // Find relevant column indices
    const uniqueIdIdx = headers.findIndex(h => h.includes("Unique ID"));
    const vehicleNumIdx = headers.findIndex(h => h.includes("Vehicle number"));
    const recordIdIdx = headers.findIndex(h => h.includes("record id"));
    const vinIdx = headers.findIndex(h => h.toLowerCase().includes("vin"));
    const licensePlateIdx = headers.findIndex(h => h.toLowerCase().includes("license"));

    console.log(`CSV has ${lines.length - 1} records`);
    console.log(`Column indices - UniqueID: ${uniqueIdIdx}, VehicleNum: ${vehicleNumIdx}, RecordID: ${recordIdIdx}, VIN: ${vinIdx}`);

    // Build lookup map: airtable_id -> company ID
    const companyIdMap = new Map();
    const vinMap = new Map();

    for (let i = 1; i < lines.length; i++) {
      const row = parseCSVRow(lines[i]);
      if (!row || row.length < 2) continue;

      const uniqueId = row[uniqueIdIdx] || "";
      const vehicleNum = row[vehicleNumIdx] || "";
      const recordId = row[recordIdIdx] || "";
      const vin = row[vinIdx] || "";
      const licensePlate = row[licensePlateIdx] || "";

      // Extract Company ID from Unique ID if present
      const companyId = extractCompanyIdFromName(uniqueId) || vehicleNum;

      if (recordId && companyId) {
        companyIdMap.set(recordId, { companyId, vin: vin.trim(), licensePlate: licensePlate.trim() });
      }

      // Also map by VIN for fallback matching
      if (vin && vin.trim().length > 5 && companyId) {
        vinMap.set(vin.trim().toUpperCase(), { companyId, licensePlate: licensePlate.trim() });
      }
    }

    console.log(`Built lookup with ${companyIdMap.size} Airtable records and ${vinMap.size} VIN mappings`);

    // Update vehicles that are missing company IDs
    const { data: allVehicles } = await supabase
      .from("vehicles")
      .select("id, airtable_id, vin, vehicle_number, license_plate");

    const vehiclesMissingCompanyId = allVehicles.filter(v => !v.vehicle_number || v.vehicle_number.trim() === "");
    console.log(`Found ${vehiclesMissingCompanyId.length} vehicles missing company ID`);

    for (const vehicle of vehiclesMissingCompanyId) {
      try {
        let updates = {};

        // Try to match by airtable_id first
        if (vehicle.airtable_id && companyIdMap.has(vehicle.airtable_id)) {
          const data = companyIdMap.get(vehicle.airtable_id);
          if (data.companyId) updates.vehicle_number = data.companyId;
          if (data.vin && (!vehicle.vin || vehicle.vin.startsWith("AIRTABLE-"))) updates.vin = data.vin;
          if (data.licensePlate && !vehicle.license_plate) updates.license_plate = data.licensePlate;
        }
        // Try to match by VIN
        else if (vehicle.vin && !vehicle.vin.startsWith("AIRTABLE-")) {
          const vinKey = vehicle.vin.toUpperCase();
          if (vinMap.has(vinKey)) {
            const data = vinMap.get(vinKey);
            if (data.companyId) updates.vehicle_number = data.companyId;
            if (data.licensePlate && !vehicle.license_plate) updates.license_plate = data.licensePlate;
          }
        }

        if (Object.keys(updates).length > 0) {
          const { error } = await supabase
            .from("vehicles")
            .update(updates)
            .eq("id", vehicle.id);

          if (error) throw error;
          stats.companyIdsUpdated++;
        }
      } catch (err) {
        stats.errors.push(`Company ID: ${err.message}`);
      }
    }
    console.log(`Updated ${stats.companyIdsUpdated} vehicles with Company IDs\n`);
  } else {
    console.log("CSV file not found, skipping Company ID extraction\n");
  }

  // ============================================
  // SUMMARY
  // ============================================
  console.log("=== FIX SUMMARY ===");
  console.log(`Drivers linked to vehicles: ${stats.driversLinked}`);
  console.log(`Vehicle types set: ${stats.vehicleTypesSet}`);
  console.log(`Company IDs updated: ${stats.companyIdsUpdated}`);
  if (stats.errors.length > 0) {
    console.log(`\nErrors (${stats.errors.length}):`);
    stats.errors.slice(0, 5).forEach(e => console.log(`  - ${e}`));
  }
  console.log("\n=== DATA FIX COMPLETE ===");
}

// Simple CSV row parser that handles quoted fields
function parseCSVRow(row) {
  const result = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < row.length; i++) {
    const char = row[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current.trim());

  return result;
}

fixDataIntegrity().catch(console.error);
