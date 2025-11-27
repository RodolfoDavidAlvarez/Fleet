
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { createClient } from '@supabase/supabase-js';
import { extractAllEnhancedData } from './lib/airtable-enhanced';

function createCLIClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase credentials in .env.local');
  }

  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

function mapServiceStatus(airtableStatus: any): string {
  const status = (airtableStatus?.toString() || '').toLowerCase()
  if (status.includes('up to date') || status.includes('active')) return 'active'
  if (status.includes('service') || status.includes('maintenance')) return 'in_service'
  if (status.includes('retired') || status.includes('inactive')) return 'retired'
  return 'active'
}

async function runImport() {
  try {
    console.log('🚀 Starting enhanced Airtable import (CLI mode)...');
    
    const extractedData = await extractAllEnhancedData();
    console.log(`📊 Extracted Data Summary:`);
    console.log(`   - Vehicles: ${extractedData.vehicles.length}`);
    
    const results = {
      vehicles: { imported: 0, skipped: 0, errors: [] as string[] },
    };
    
    const supabase = createCLIClient();

    // Import vehicles (Debug Mode)
    console.log('📦 Importing Vehicles...');
    let count = 0;
    for (const vehicle of extractedData.vehicles) {
        count++;
        try {
            if (!vehicle.airtableId) throw new Error("Missing airtable_id");

            // 1. Handle Driver
            let driverId = null;
            if (vehicle.driverName && vehicle.driverEmail) {
               // Driver logic omitted for brevity if not the cause, but let's keep it simple
               const { data: existingDriver } = await supabase
                .from('users')
                .select('id')
                .eq('email', vehicle.driverEmail)
                .single();
               if (existingDriver) driverId = existingDriver.id;
            }

            // 2. Manual Upsert Vehicle
            const vehicleData = {
                make: vehicle.make,
                model: vehicle.model,
                year: vehicle.year,
                vin: vehicle.vin,
                license_plate: vehicle.licensePlate,
                vehicle_number: vehicle.vehicleNumber,
                department: vehicle.department,
                status: mapServiceStatus(vehicle.serviceStatus),
                mileage: vehicle.currentMileage,
                last_service_date: vehicle.lastInspectionDate,
                next_service_due: vehicle.nextServiceDue,
                driver_id: driverId,
                supervisor: vehicle.supervisor,
                loan_lender: vehicle.loanLender,
                tag_expiry: vehicle.tagExp,
                first_aid_fire: vehicle.firstAidFire,
                title: vehicle.title,
                photo_urls: vehicle.photoUrls,
                airtable_id: vehicle.airtableId,
            };

            // Check existence
            const { data: existingVehicle, error: findError } = await supabase
                .from('vehicles')
                .select('id')
                .eq('airtable_id', vehicle.airtableId)
                .maybeSingle(); // Use maybeSingle to avoid error on not found

            if (findError) {
                throw new Error(`Find error: ${findError.message}`);
            }

            if (existingVehicle) {
                // Update
                console.log(`   Updating vehicle ${vehicle.airtableId} (ID: ${existingVehicle.id})...`);
                const { error: uError } = await supabase
                    .from('vehicles')
                    .update(vehicleData)
                    .eq('id', existingVehicle.id);
                
                if (uError) {
                    console.error(`   ❌ Update failed for ${vehicle.airtableId}:`, uError);
                    throw uError;
                }
            } else {
                // Insert
                console.log(`   Inserting vehicle ${vehicle.airtableId}...`);
                const { error: iError } = await supabase
                    .from('vehicles')
                    .insert(vehicleData);
                
                if (iError) {
                    console.error(`   ❌ Insert failed for ${vehicle.airtableId}:`, iError);
                    throw iError;
                }
            }
            
          results.vehicles.imported++;
        } catch (error: any) {
          results.vehicles.skipped++;
          results.vehicles.errors.push(`${vehicle.make}: ${error.message}`);
          if (results.vehicles.skipped <= 5) {
             console.error(`   ❌ Failed on vehicle ${count}:`, error);
          }
        }
    }

    console.log('✅ Import Completed!');
    console.log(`Vehicles: ${results.vehicles.imported} imported, ${results.vehicles.skipped} skipped`);

  } catch (error) {
    console.error('❌ Import Failed:', error);
  }
}

runImport();
