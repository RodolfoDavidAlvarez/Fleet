#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase configuration. Please check your .env.local file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Utility function to parse CSV files
function parseCSV(filePath) {
  return new Promise((resolve, reject) => {
    const results = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', reject);
  });
}

// Clean and normalize string values
function cleanString(value) {
  if (!value || typeof value !== 'string') return null;
  return value.trim().replace(/\n/g, ' ').replace(/"/g, '') || null;
}

// Clean and parse number values
function cleanNumber(value) {
  if (!value) return null;
  const cleaned = String(value).replace(/[,$]/g, '');
  const num = parseInt(cleaned, 10);
  return isNaN(num) ? null : num;
}

// Clean and parse float values
function cleanFloat(value) {
  if (!value) return null;
  const cleaned = String(value).replace(/[,$]/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

// Parse date values
function parseDate(dateStr) {
  if (!dateStr || dateStr === 'NaN') return null;
  
  // Try different date formats
  let date = new Date(dateStr);
  if (isNaN(date)) {
    // Try MM/DD/YYYY format
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      date = new Date(parts[2], parts[0] - 1, parts[1]);
    }
  }
  
  return isNaN(date) ? null : date.toISOString().split('T')[0];
}

// Migrate Equipment Inventory (Vehicles)
async function migrateEquipment() {
  console.log('🚛 Migrating Equipment Inventory to Vehicles...');
  
  const equipmentData = await parseCSV(path.join(__dirname, '..', 'Airtable main tables snapshots csv', 'Equipment Inventory-All records.csv'));
  
  console.log(`Found ${equipmentData.length} equipment records`);
  
  const vehicles = [];
  
  for (const row of equipmentData) {
    const vehicleInfo = cleanString(row['* Unique ID'] || row['Vehicle Year, Make and Model or Item Brand and Model']);
    if (!vehicleInfo) continue;
    
    // Extract make, model, year from vehicle info
    const year = cleanNumber(row['Vehicle year']) || extractYearFromString(vehicleInfo);
    const vin = cleanString(row['VIN']) || cleanString(row['Serial Number']) || `FLEET-${cleanString(row['Vehicle number']) || Date.now()}`;
    const license = cleanString(row['License #']) || cleanString(row['Vehicle number']) || `TEMP-${Date.now()}`;
    
    // Parse make and model from vehicle info
    const { make, model } = parseMakeModel(vehicleInfo);
    
    const vehicle = {
      make: make || 'Unknown',
      model: model || vehicleInfo.substring(0, 50),
      year: year || new Date().getFullYear(),
      vin: vin,
      license_plate: license,
      status: parseVehicleStatus(row['* Service Status'] || row['Vehicle State']),
      mileage: cleanNumber(row['* Current Mileage'] || row['Vehicle Last Recorded Mileage']) || 0,
      last_service_date: parseDate(row['Last Maintenance Date']),
      next_service_due: parseDate(row['Next service due date'])
    };
    
    vehicles.push(vehicle);
  }
  
  console.log(`Processed ${vehicles.length} vehicles for insertion`);
  
  // Insert vehicles in batches
  const batchSize = 50;
  for (let i = 0; i < vehicles.length; i += batchSize) {
    const batch = vehicles.slice(i, i + batchSize);
    
    const { data, error } = await supabase
      .from('vehicles')
      .insert(batch);
    
    if (error) {
      console.error(`Error inserting vehicle batch ${Math.floor(i/batchSize) + 1}:`, error);
    } else {
      console.log(`✅ Inserted batch ${Math.floor(i/batchSize) + 1} (${batch.length} vehicles)`);
    }
  }
  
  console.log('🚛 Equipment migration completed');
}

// Migrate Members (Users)
async function migrateMembers() {
  console.log('👥 Migrating Members to Users...');
  
  const membersData = await parseCSV(path.join(__dirname, '..', 'Airtable main tables snapshots csv', 'Members-All records.csv'));
  
  console.log(`Found ${membersData.length} member records`);
  
  const users = [];
  
  for (const row of membersData) {
    // Handle BOM character in CSV headers
    const nameKey = Object.keys(row).find(key => key.includes('Name')) || 'Name';
    const name = cleanString(row[nameKey]);
    const email = cleanString(row['Email']);
    const phone = cleanString(row['Phone Number']);
    const role = parseUserRole(row['Role']);
    
    if (!name || name === 'Not applicable') continue;
    
    const user = {
      name,
      email: email || `${name.replace(/\s+/g, '.').toLowerCase()}@agave-inc.com`,
      phone,
      role,
      approval_status: 'approved' // Existing members are pre-approved
    };
    
    users.push(user);
  }
  
  console.log(`Processed ${users.length} users for insertion`);
  
  // Insert users in batches
  const batchSize = 50;
  for (let i = 0; i < users.length; i += batchSize) {
    const batch = users.slice(i, i + batchSize);
    
    const { data, error } = await supabase
      .from('users')
      .insert(batch);
    
    if (error) {
      console.error(`Error inserting user batch ${Math.floor(i/batchSize) + 1}:`, error);
    } else {
      console.log(`✅ Inserted batch ${Math.floor(i/batchSize) + 1} (${batch.length} users)`);
    }
  }
  
  console.log('👥 Members migration completed');
}

// Migrate Repair Requests
async function migrateRepairRequests() {
  console.log('🔧 Migrating Repair Requests...');
  
  const repairsData = await parseCSV(path.join(__dirname, '..', 'Airtable main tables snapshots csv', 'Repair Requests-Chronological.csv'));
  
  console.log(`Found ${repairsData.length} repair records`);
  
  const repairRequests = [];
  
  for (const row of repairsData) {
    const serviceId = cleanString(row['Service ID']);
    const description = cleanString(row['Problem Description']);
    const employee = cleanString(row['Employee']);
    
    if (!serviceId && !description) continue;
    
    const repairRequest = {
      driver_name: employee || 'Unknown',
      driver_phone: cleanString(row['Phone Number']),
      description: description || 'No description provided',
      urgency: row['Requires Immediate Attention'] === 'YES' ? 'high' : 'medium',
      status: parseRepairStatus(row['Status'])
    };
    
    repairRequests.push(repairRequest);
  }
  
  console.log(`Processed ${repairRequests.length} repair requests for insertion`);
  
  // Insert repair requests in batches
  const batchSize = 50;
  for (let i = 0; i < repairRequests.length; i += batchSize) {
    const batch = repairRequests.slice(i, i + batchSize);
    
    const { data, error } = await supabase
      .from('repair_requests')
      .insert(batch);
    
    if (error) {
      console.error(`Error inserting repair request batch ${Math.floor(i/batchSize) + 1}:`, error);
    } else {
      console.log(`✅ Inserted batch ${Math.floor(i/batchSize) + 1} (${batch.length} repair requests)`);
    }
  }
  
  console.log('🔧 Repair requests migration completed');
}

// Helper functions
function extractYearFromString(str) {
  const yearMatch = str.match(/\b(19|20)\d{2}\b/);
  return yearMatch ? parseInt(yearMatch[0], 10) : null;
}

function parseMakeModel(vehicleInfo) {
  if (!vehicleInfo) return { make: null, model: null };
  
  // Common patterns
  const patterns = [
    /^(\d{4})\s+([^-\[]+)/,  // "2018 Toyota Tacoma [Co. ID: 1599]"
    /^([^-\[]+?)\s*-\s*([^-\[]+)/,  // "John Deere - Gator TX [Co. ID: 1277]"
    /^([^\s]+)\s+([^-\[]+)/,  // "Toyota Tacoma SR5"
  ];
  
  for (const pattern of patterns) {
    const match = vehicleInfo.match(pattern);
    if (match) {
      let make = match[1];
      let model = match[2];
      
      // If first capture is a year, use different logic
      if (/^\d{4}$/.test(make)) {
        const parts = vehicleInfo.replace(make, '').trim().split(/\s+/);
        make = parts[0] || 'Unknown';
        model = parts.slice(1).join(' ') || 'Unknown';
      }
      
      return {
        make: cleanString(make),
        model: cleanString(model)
      };
    }
  }
  
  // Fallback: split on first space
  const parts = vehicleInfo.split(/\s+/);
  return {
    make: parts[0] || 'Unknown',
    model: parts.slice(1).join(' ') || vehicleInfo
  };
}

function parseVehicleStatus(status) {
  if (!status) return 'active';
  const normalized = status.toLowerCase();
  if (normalized.includes('service') || normalized.includes('maintenance')) return 'in_service';
  if (normalized.includes('retired') || normalized.includes('inactive')) return 'retired';
  return 'active';
}

function parseUserRole(roleStr) {
  if (!roleStr) return 'driver';
  const normalized = roleStr.toLowerCase();
  if (normalized.includes('admin') || normalized.includes('ceo') || normalized.includes('manager')) return 'admin';
  if (normalized.includes('mechanic')) return 'mechanic';
  if (normalized.includes('customer')) return 'customer';
  return 'driver';
}

function parseRepairStatus(status) {
  if (!status) return 'submitted';
  const normalized = status.toLowerCase();
  if (normalized.includes('progress')) return 'in_progress';
  if (normalized.includes('completed') || normalized.includes('closed')) return 'completed';
  return 'submitted';
}

// Main migration function
async function main() {
  console.log('🚀 Starting Airtable data migration to Supabase...');
  console.log(`Using Supabase URL: ${supabaseUrl}`);
  
  try {
    // Test connection
    const { data: testData, error: testError } = await supabase
      .from('users')
      .select('id')
      .limit(1);
    
    if (testError) {
      console.error('❌ Failed to connect to Supabase:', testError);
      process.exit(1);
    }
    
    console.log('✅ Connected to Supabase successfully');
    
    // Run migrations in sequence
    await migrateMembers();
    await migrateEquipment();
    await migrateRepairRequests();
    
    console.log('🎉 All migrations completed successfully!');
    
    // Print summary
    const { data: vehicles } = await supabase.from('vehicles').select('id');
    const { data: users } = await supabase.from('users').select('id');
    const { data: repairs } = await supabase.from('repair_requests').select('id');
    
    console.log('\n📊 Migration Summary:');
    console.log(`- Vehicles: ${vehicles?.length || 0}`);
    console.log(`- Users: ${users?.length || 0}`);
    console.log(`- Repair Requests: ${repairs?.length || 0}`);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { main };