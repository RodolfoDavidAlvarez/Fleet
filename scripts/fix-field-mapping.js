const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

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

// Extract Company ID from Unique ID like "5 YD Roll Out High Dump Bucket [Co. ID: 1810]"
function extractCompanyIdFromUniqueId(uniqueId) {
  if (!uniqueId) return null;
  const match = uniqueId.match(/\[Co\.\s*ID:\s*([^\]]+)\]/i);
  return match ? match[1].trim() : null;
}

async function fixFieldMapping() {
  console.log("=== FIXING FIELD MAPPING ISSUES ===\n");

  const stats = {
    analyzed: 0,
    fixed: 0,
    vehicleNumberFixed: 0,
    licensePlateFixed: 0,
    vinFixed: 0,
    errors: []
  };

  // Load CSV data
  const csvPath = path.join(__dirname, "..", "Airtable main tables snapshots csv", "Equipment Inventory-All records.csv");

  if (!fs.existsSync(csvPath)) {
    console.error("CSV file not found at:", csvPath);
    return;
  }

  const csvContent = fs.readFileSync(csvPath, "utf-8");
  const lines = csvContent.split("\n");
  const headers = parseCSVRow(lines[0]);

  // Find column indices
  const cols = {
    uniqueId: headers.findIndex(h => h.includes("Unique ID")),
    recordId: headers.findIndex(h => h === "record id"),
    vehicleNumber: headers.findIndex(h => h === "Vehicle number"),
    licensePlate: headers.findIndex(h => h === "License #"),
    vin: headers.findIndex(h => h === "VIN"),
    makeModel: headers.findIndex(h => h.includes("Make and Model")),
  };

  console.log("CSV Column indices:", cols);

  // Build lookup by Airtable record ID and by extracted Company ID
  const airtableDataByRecordId = new Map();
  const airtableDataByCompanyId = new Map();

  for (let i = 1; i < lines.length; i++) {
    const row = parseCSVRow(lines[i]);
    if (!row || row.length < 5) continue;

    const uniqueId = row[cols.uniqueId] || "";
    const recordId = row[cols.recordId] || "";
    const vehicleNumber = row[cols.vehicleNumber] || "";
    const licensePlate = row[cols.licensePlate] || "";
    const vin = row[cols.vin] || "";
    const makeModel = row[cols.makeModel] || "";

    const companyId = extractCompanyIdFromUniqueId(uniqueId) || vehicleNumber;

    const data = {
      uniqueId,
      recordId,
      vehicleNumber: vehicleNumber.trim(),
      licensePlate: licensePlate.trim(),
      vin: vin.trim(),
      makeModel: makeModel.trim(),
      companyId
    };

    if (recordId) airtableDataByRecordId.set(recordId, data);
    if (companyId) airtableDataByCompanyId.set(companyId, data);
  }

  console.log(`Built lookup with ${airtableDataByRecordId.size} records by ID, ${airtableDataByCompanyId.size} by Company ID\n`);

  // Get all vehicles from database
  const { data: vehicles, error: vErr } = await supabase
    .from("vehicles")
    .select("id, make, model, vin, license_plate, vehicle_number, airtable_id");

  if (vErr) {
    console.error("Error fetching vehicles:", vErr);
    return;
  }

  console.log(`Found ${vehicles.length} vehicles in database\n`);

  // Analyze and fix each vehicle
  for (const vehicle of vehicles) {
    stats.analyzed++;

    // Try to find matching Airtable data
    let airtableData = null;

    // First try by airtable_id
    if (vehicle.airtable_id && airtableDataByRecordId.has(vehicle.airtable_id)) {
      airtableData = airtableDataByRecordId.get(vehicle.airtable_id);
    }
    // Then try by license_plate if it looks like a company ID (numeric 3-4 digits)
    else if (vehicle.license_plate && /^\d{3,4}\*?$/.test(vehicle.license_plate)) {
      const possibleCompanyId = vehicle.license_plate;
      if (airtableDataByCompanyId.has(possibleCompanyId)) {
        airtableData = airtableDataByCompanyId.get(possibleCompanyId);
      }
    }
    // Try by vehicle_number
    else if (vehicle.vehicle_number && airtableDataByCompanyId.has(vehicle.vehicle_number)) {
      airtableData = airtableDataByCompanyId.get(vehicle.vehicle_number);
    }

    if (!airtableData) continue;

    // Check if license_plate contains what should be vehicle_number
    const updates = {};
    let needsUpdate = false;

    // If license_plate looks like a company ID (3-4 digit number) and matches Airtable vehicle_number
    if (vehicle.license_plate && /^\d{3,4}\*?$/.test(vehicle.license_plate)) {
      if (airtableData.vehicleNumber === vehicle.license_plate ||
          airtableData.companyId === vehicle.license_plate) {
        // This is actually a vehicle number, not a license plate
        if (!vehicle.vehicle_number || vehicle.vehicle_number !== vehicle.license_plate) {
          updates.vehicle_number = vehicle.license_plate;
          stats.vehicleNumberFixed++;
        }
        // Clear the license plate or set to actual license plate from Airtable
        if (airtableData.licensePlate && airtableData.licensePlate !== vehicle.license_plate) {
          updates.license_plate = airtableData.licensePlate;
          stats.licensePlateFixed++;
        } else if (!airtableData.licensePlate) {
          updates.license_plate = ''; // Clear it since it's not a real plate (use empty string due to NOT NULL constraint)
          stats.licensePlateFixed++;
        }
        needsUpdate = true;
      }
    }

    // Fix VIN if it's a placeholder or empty but Airtable has real VIN
    if (airtableData.vin && airtableData.vin.length > 5) {
      const currentVin = vehicle.vin || "";
      if (currentVin.startsWith("AIRTABLE-") || currentVin.startsWith("FLEET-") || !currentVin) {
        updates.vin = airtableData.vin;
        stats.vinFixed++;
        needsUpdate = true;
      }
    }

    // Apply updates
    if (needsUpdate && Object.keys(updates).length > 0) {
      try {
        const { error } = await supabase
          .from("vehicles")
          .update(updates)
          .eq("id", vehicle.id);

        if (error) throw error;
        stats.fixed++;

        if (stats.fixed <= 10) {
          console.log(`Fixed: ${vehicle.make || ""} ${vehicle.model || ""}`);
          console.log(`  Updates:`, updates);
        }
      } catch (err) {
        stats.errors.push(`${vehicle.id}: ${err.message}`);
      }
    }
  }

  // Now do a second pass to fix any vehicles where license_plate is still a number
  console.log("\n--- Second pass: Fix remaining numeric license plates ---");

  const { data: vehiclesPass2 } = await supabase
    .from("vehicles")
    .select("id, make, model, license_plate, vehicle_number")
    .is("vehicle_number", null);

  let pass2Fixed = 0;
  for (const v of vehiclesPass2 || []) {
    if (v.license_plate && /^\d{3,4}\*?$/.test(v.license_plate)) {
      try {
        const { error } = await supabase
          .from("vehicles")
          .update({
            vehicle_number: v.license_plate,
            license_plate: '' // Use empty string due to NOT NULL constraint
          })
          .eq("id", v.id);

        if (!error) pass2Fixed++;
      } catch (err) {
        // ignore
      }
    }
  }
  console.log(`Pass 2 fixed: ${pass2Fixed} vehicles\n`);

  console.log("=== FIX SUMMARY ===");
  console.log(`Vehicles analyzed: ${stats.analyzed}`);
  console.log(`Vehicles fixed: ${stats.fixed}`);
  console.log(`Vehicle numbers corrected: ${stats.vehicleNumberFixed}`);
  console.log(`License plates corrected: ${stats.licensePlateFixed}`);
  console.log(`VINs corrected: ${stats.vinFixed}`);
  console.log(`Pass 2 fixes: ${pass2Fixed}`);

  if (stats.errors.length > 0) {
    console.log(`\nErrors (${stats.errors.length}):`);
    stats.errors.slice(0, 5).forEach(e => console.log(`  - ${e}`));
  }

  console.log("\n=== FIELD MAPPING FIX COMPLETE ===");
}

fixFieldMapping().catch(console.error);
