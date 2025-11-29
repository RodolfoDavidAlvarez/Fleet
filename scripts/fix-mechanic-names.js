#!/usr/bin/env node

/**
 * Script to fix mechanic_name field in service_records table
 * Replaces Airtable record IDs with actual names from Members CSV
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://kxcixjiafdohbpwijfmd.supabase.co";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY is not set in environment variables.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

/**
 * Parse Members CSV and create mapping from Airtable record IDs to names
 */
function createIdToNameMapping() {
  return new Promise((resolve, reject) => {
    const csvPath = path.join(__dirname, '..', 'Airtable main tables snapshots csv', 'Members-All records.csv');
    
    if (!fs.existsSync(csvPath)) {
      console.error(`❌ CSV file not found: ${csvPath}`);
      process.exit(1);
    }

    const mapping = new Map();
    const results = [];
    
    fs.createReadStream(csvPath)
      .pipe(csv())
      .on('data', (row) => {
        results.push(row);
        // Handle BOM character in CSV (first column might be '﻿Name' instead of 'Name')
        const name = row['Name']?.trim() || row['﻿Name']?.trim();
        const recordId = row['Record ID']?.trim();
        
        if (name && recordId) {
          mapping.set(recordId, name);
          // Also handle case variations (Airtable IDs might have slight variations)
          mapping.set(recordId.toLowerCase(), name);
          mapping.set(recordId.toUpperCase(), name);
        }
      })
      .on('end', () => {
        console.log(`✅ Created mapping for ${mapping.size} members`);
        resolve(mapping);
      })
      .on('error', (error) => {
        console.error('❌ Error parsing CSV:', error);
        reject(error);
      });
  });
}

/**
 * Check if a string looks like an Airtable record ID
 */
function isAirtableId(str) {
  if (!str || typeof str !== 'string') return false;
  // Airtable record IDs typically start with "rec" and are 17 characters long
  return /^rec[a-zA-Z0-9]{14}$/i.test(str.trim());
}

/**
 * Main function to fix mechanic names
 */
async function fixMechanicNames() {
  try {
    console.log('🔧 Starting mechanic name fix...\n');
    
    // Create ID to name mapping
    const idToNameMap = await createIdToNameMapping();
    
    // Fetch all service records
    console.log('📥 Fetching service records...');
    const { data: serviceRecords, error: fetchError } = await supabase
      .from('service_records')
      .select('id, mechanic_name, airtable_id')
      .not('mechanic_name', 'is', null);
    
    if (fetchError) {
      console.error('❌ Error fetching service records:', fetchError);
      process.exit(1);
    }
    
    console.log(`📊 Found ${serviceRecords.length} service records with mechanic_name\n`);
    
    // Find records that need fixing
    const recordsToFix = [];
    const idCounts = new Map();
    
    for (const record of serviceRecords) {
      const mechanicName = record.mechanic_name;
      
      if (!mechanicName) continue;
      
      const trimmed = mechanicName.trim();
      let ids = [];
      
      // Try to parse as JSON array first (most common case)
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          ids = parsed.filter(id => isAirtableId(id));
        } else if (isAirtableId(parsed)) {
          ids = [parsed];
        }
      } catch (e) {
        // Not JSON, check if it's a single ID
        if (isAirtableId(trimmed)) {
          ids = [trimmed];
        } else {
          // Check if it contains IDs (comma-separated)
          ids = trimmed.split(/[,\s]+/).filter(s => isAirtableId(s));
        }
      }
      
      if (ids.length > 0) {
        recordsToFix.push({
          id: record.id,
          currentValue: trimmed,
          ids,
          airtableId: record.airtable_id,
        });
        ids.forEach(id => {
          idCounts.set(id, (idCounts.get(id) || 0) + 1);
        });
      }
    }
    
    console.log(`🔍 Found ${recordsToFix.length} records that need fixing\n`);
    console.log('📋 Airtable IDs found:');
    for (const [id, count] of Array.from(idCounts.entries()).sort((a, b) => b[1] - a[1])) {
      const name = idToNameMap.get(id) || idToNameMap.get(id.toLowerCase()) || '❌ NOT FOUND';
      console.log(`   ${id}: ${name} (${count} records)`);
    }
    console.log();
    
    // Update records
    let updated = 0;
    let notFound = 0;
    let errors = 0;
    
    for (const record of recordsToFix) {
      try {
        // Find names for all IDs
        const names = record.ids
          .map(id => idToNameMap.get(id) || idToNameMap.get(id.toLowerCase()))
          .filter(Boolean);
        
        if (names.length === 0) {
          console.log(`⚠️  Could not find name for ID(s): ${record.ids.join(', ')} (record ${record.id})`);
          notFound++;
          continue;
        }
        
        // Join multiple names with comma
        const newName = names.join(', ');
        
        if (!newName) {
          console.log(`⚠️  Could not find name for ID: ${record.currentValue} (record ${record.id})`);
          notFound++;
          continue;
        }
        
        // Update the record
        const { error: updateError } = await supabase
          .from('service_records')
          .update({ mechanic_name: newName })
          .eq('id', record.id);
        
        if (updateError) {
          console.error(`❌ Error updating record ${record.id}:`, updateError.message);
          errors++;
        } else {
          updated++;
          if (updated % 10 === 0) {
            process.stdout.write(`\r✅ Updated ${updated} records...`);
          }
        }
      } catch (error) {
        console.error(`❌ Error processing record ${record.id}:`, error.message);
        errors++;
      }
    }
    
    console.log(`\n\n✨ Fix completed!`);
    console.log(`   ✅ Updated: ${updated} records`);
    console.log(`   ⚠️  Not found: ${notFound} records`);
    console.log(`   ❌ Errors: ${errors} records`);
    
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

// Run the fix
fixMechanicNames()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });

