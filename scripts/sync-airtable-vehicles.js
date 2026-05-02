/**
 * Sync Airtable Equipment to Supabase Vehicles
 *
 * This script ONLY UPDATES existing vehicles - it does NOT delete anything.
 * It matches vehicles by VIN and updates:
 * - license_plate
 * - vehicle_number (company 4-digit ID)
 * - airtable_id
 *
 * Run with: node scripts/sync-airtable-vehicles.js
 */

const fs = require('fs');
const path = require('path');
const envPath = path.join(__dirname, '..', '.env.local');
const env = fs.readFileSync(envPath, 'utf8');
const get = (k) => {
  const m = env.match(new RegExp(`${k}=\"?([^"\n]+)`));
  return m ? m[1].replace(/"$/, '') : '';
};
const AIRTABLE_API_KEY = get('AIRTABLE_API_KEY');
const AIRTABLE_BASE_ID = get('AIRTABLE_BASE_ID');
const SUPABASE_URL = get('NEXT_PUBLIC_SUPABASE_URL');
const SUPABASE_SERVICE_KEY = get('SUPABASE_SERVICE_ROLE_KEY');
if (!AIRTABLE_API_KEY || !SUPABASE_SERVICE_KEY) {
  console.error('Missing AIRTABLE_API_KEY or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

async function fetchAllAirtableRecords() {
  const allRecords = [];
  let offset = null;

  do {
    const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Equipment%20Inventory${offset ? `?offset=${offset}` : ''}`;
    const res = await fetch(url, {
      headers: { 'Authorization': `Bearer ${AIRTABLE_API_KEY}` }
    });
    const data = await res.json();
    if (data.records) {
      allRecords.push(...data.records);
    }
    offset = data.offset;
  } while (offset);

  return allRecords;
}

async function fetchAllSupabaseVehicles() {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/vehicles?select=*`, {
    headers: {
      'apikey': SUPABASE_SERVICE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
    }
  });
  return await res.json();
}

async function updateSupabaseVehicle(vehicleId, updates) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/vehicles?id=eq.${vehicleId}`, {
    method: 'PATCH',
    headers: {
      'apikey': SUPABASE_SERVICE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify(updates)
  });
  return await res.json();
}

function normalizeVin(vin) {
  if (!vin) return '';
  return vin.toString().trim().toUpperCase().replace(/\s+/g, '');
}

async function main() {
  console.log('=== Airtable to Supabase Vehicle Sync ===\n');
  console.log('NOTE: This script ONLY UPDATES existing vehicles. It does NOT delete anything.\n');

  // Step 1: Fetch all Airtable records
  console.log('1. Fetching Airtable Equipment Inventory...');
  const airtableRecords = await fetchAllAirtableRecords();
  console.log(`   Found ${airtableRecords.length} total records in Airtable`);

  // Build a map of VIN -> Airtable data
  const airtableByVin = new Map();
  let duplicateVins = [];

  for (const record of airtableRecords) {
    const vin = normalizeVin(record.fields['VIN']);
    if (!vin) continue;

    const data = {
      airtableId: record.id,
      vin: vin,
      licensePlate: record.fields['License #']?.trim() || null,
      vehicleNumber: record.fields['Vehicle number']?.trim().replace(/\*+$/, '') || null,
      makeModel: record.fields['Vehicle Year, Make and Model or Item Brand and Model'] || null
    };

    if (airtableByVin.has(vin)) {
      duplicateVins.push(vin);
    }
    airtableByVin.set(vin, data);
  }

  console.log(`   Vehicles with VINs: ${airtableByVin.size}`);
  if (duplicateVins.length > 0) {
    console.log(`   WARNING: ${duplicateVins.length} duplicate VINs found in Airtable (using latest)`);
  }

  // Step 2: Fetch all Supabase vehicles
  console.log('\n2. Fetching Supabase vehicles...');
  const supabaseVehicles = await fetchAllSupabaseVehicles();
  console.log(`   Found ${supabaseVehicles.length} vehicles in Supabase`);

  // Step 3: Match and update
  console.log('\n3. Matching and updating vehicles...');
  let updated = 0;
  let skipped = 0;
  let noMatch = 0;
  let errors = 0;

  for (const vehicle of supabaseVehicles) {
    const normalizedVin = normalizeVin(vehicle.vin);

    if (!normalizedVin) {
      console.log(`   SKIP: Vehicle ${vehicle.id} has no VIN`);
      skipped++;
      continue;
    }

    const airtableData = airtableByVin.get(normalizedVin);

    if (!airtableData) {
      console.log(`   NO MATCH: VIN ${normalizedVin} not found in Airtable`);
      noMatch++;
      continue;
    }

    // Check if update is needed
    const needsUpdate = (
      vehicle.license_plate !== airtableData.licensePlate ||
      vehicle.vehicle_number !== airtableData.vehicleNumber ||
      vehicle.airtable_id !== airtableData.airtableId
    );

    if (!needsUpdate) {
      skipped++;
      continue;
    }

    // Update the vehicle
    const updates = {
      license_plate: airtableData.licensePlate,
      vehicle_number: airtableData.vehicleNumber,
      airtable_id: airtableData.airtableId
    };

    try {
      await updateSupabaseVehicle(vehicle.id, updates);
      console.log(`   UPDATED: ${vehicle.make} ${vehicle.model} | VIN: ${normalizedVin.substring(0,8)}... | Plate: ${vehicle.license_plate || 'N/A'} -> ${airtableData.licensePlate || 'N/A'} | #: ${airtableData.vehicleNumber || 'N/A'}`);
      updated++;
    } catch (err) {
      console.log(`   ERROR: Failed to update vehicle ${vehicle.id}: ${err.message}`);
      errors++;
    }
  }

  // Summary
  console.log('\n=== SYNC SUMMARY ===');
  console.log(`Total Supabase vehicles: ${supabaseVehicles.length}`);
  console.log(`Updated: ${updated}`);
  console.log(`Skipped (already up-to-date or no VIN): ${skipped}`);
  console.log(`No match in Airtable: ${noMatch}`);
  console.log(`Errors: ${errors}`);
  console.log('\nNOTE: No vehicles were deleted. Only license plates and vehicle numbers were updated.');
}

main().catch(console.error);
