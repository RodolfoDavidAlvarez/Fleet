
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { createClient } from '@supabase/supabase-js';
import { extractAllEnhancedData } from './lib/airtable-enhanced';

// Re-implement createServerClient for CLI
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

// Helper functions
function mapServiceStatus(airtableStatus: any): string {
  const status = (airtableStatus?.toString() || '').toLowerCase()
  if (status.includes('up to date') || status.includes('active')) return 'active'
  if (status.includes('service') || status.includes('maintenance')) return 'in_service'
  if (status.includes('retired') || status.includes('inactive')) return 'retired'
  return 'active'
}

function mapBookingStatus(airtableStatus: any): string {
  const status = (airtableStatus?.toString() || '').toLowerCase()
  if (status.includes('confirm')) return 'confirmed'
  if (status.includes('progress')) return 'in_progress'
  if (status.includes('complete')) return 'completed'
  if (status.includes('cancel')) return 'cancelled'
  return 'pending'
}

function mapMemberRole(airtableRole: any): string {
    const role = (airtableRole?.toString() || '').toLowerCase()
    if (role.includes('admin') || role.includes('manager')) return 'admin'
    if (role.includes('mechanic') || role.includes('technician')) return 'mechanic'
    if (role.includes('driver')) return 'driver'
    return 'customer'
}

async function runImport() {
  try {
    console.log('🚀 Starting enhanced Airtable import (CLI mode)...');
    
    // Extract all data from Airtable
    const extractedData = await extractAllEnhancedData();
    console.log(`📊 Extracted Data Summary:`);
    console.log(`   - Vehicles: ${extractedData.vehicles.length}`);
    console.log(`   - Departments: ${extractedData.departments.length}`);
    console.log(`   - Service Records: ${extractedData.serviceRecords.length}`);
    console.log(`   - Members: ${extractedData.members.length}`);
    console.log(`   - Repair Requests: ${extractedData.repairRequests.length}`);
    
    const results = {
      vehicles: { imported: 0, skipped: 0, errors: [] as string[] },
      departments: { imported: 0, skipped: 0, errors: [] as string[] },
      serviceRecords: { imported: 0, skipped: 0, errors: [] as string[] },
      members: { imported: 0, skipped: 0, errors: [] as string[] },
      appointments: { imported: 0, skipped: 0, errors: [] as string[] },
      repairRequests: { imported: 0, skipped: 0, errors: [] as string[] },
    };
    
    const supabase = createCLIClient();
    
    // Import departments
    console.log('📦 Importing Departments...');
    for (const dept of extractedData.departments) {
        try {
            const { error } = await supabase
              .from('departments')
              .upsert({
                name: dept.name,
                description: dept.description,
                manager: dept.manager,
                vehicle_count: dept.vehicleCount,
                airtable_id: dept.airtableId,
              }, { onConflict: 'name' })
            
            if (error) throw error
          results.departments.imported++
        } catch (error: any) {
          results.departments.skipped++
          results.departments.errors.push(`${dept.name}: ${error.message}`)
        }
    }

    // Import vehicles (Manual Upsert to avoid constraint issues)
    console.log('📦 Importing Vehicles...');
    for (const vehicle of extractedData.vehicles) {
        try {
            if (!vehicle.airtableId) throw new Error("Missing airtable_id");

            // 1. Handle Driver
            let driverId = null
            if (vehicle.driverName && vehicle.driverEmail) {
              const { data: existingDriver } = await supabase
                .from('users')
                .select('id')
                .eq('email', vehicle.driverEmail)
                .single()
              
              if (existingDriver) {
                driverId = existingDriver.id
              } else {
                const { data: newDriver } = await supabase
                  .from('users')
                  .insert({
                    name: vehicle.driverName,
                    email: vehicle.driverEmail,
                    phone: vehicle.driverPhone,
                    role: 'driver',
                    approval_status: 'approved',
                  })
                  .select('id')
                  .single()
                
                if (newDriver) driverId = newDriver.id
              }
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
            const { data: existingVehicle } = await supabase
                .from('vehicles')
                .select('id')
                .eq('airtable_id', vehicle.airtableId)
                .single();

            let vehicleId = existingVehicle?.id;

            if (existingVehicle) {
                // Update
                const { error: uError } = await supabase
                    .from('vehicles')
                    .update(vehicleData)
                    .eq('id', existingVehicle.id);
                if (uError) throw uError;
            } else {
                // Insert
                const { data: newV, error: iError } = await supabase
                    .from('vehicles')
                    .insert(vehicleData)
                    .select('id')
                    .single();
                if (iError) throw iError;
                vehicleId = newV.id;
            }
            
            // 3. Link Driver
            if (driverId && vehicleId) {
                 const { data: existingLink } = await supabase
                    .from('vehicle_drivers')
                    .select('id')
                    .eq('vehicle_id', vehicleId)
                    .eq('driver_id', driverId)
                    .single();
                
                if (!existingLink) {
                    await supabase.from('vehicle_drivers').insert({
                        vehicle_id: vehicleId,
                        driver_id: driverId,
                        is_primary: true
                    });
                }
            }

          results.vehicles.imported++
        } catch (error: any) {
          results.vehicles.skipped++
          results.vehicles.errors.push(`${vehicle.make}: ${error.message}`)
        }
    }

    // Import service records
    console.log('📦 Importing Service Records...');
    for (const record of extractedData.serviceRecords) {
        try {
            const { data: vehicle } = await supabase
              .from('vehicles')
              .select('id')
              .eq('airtable_id', record.vehicleId)
              .single()
            
            if (vehicle) {
              const { error } = await supabase
                .from('service_records')
                .upsert({
                  vehicle_id: vehicle.id,
                  date: record.serviceDate,
                  service_type: record.serviceType,
                  description: record.description,
                  cost: record.cost,
                  mileage: record.mileage,
                  mechanic_name: record.mechanicName,
                  status: record.status,
                  next_service_due: record.nextServiceDue,
                  airtable_id: record.airtableId,
                }, { onConflict: 'airtable_id' })
              
              if (error) throw error
            }
          results.serviceRecords.imported++
        } catch (error: any) {
          results.serviceRecords.skipped++
          results.serviceRecords.errors.push(`Service record: ${error.message}`)
        }
    }

    // Repair Requests
    console.log('📦 Importing Repair Requests...');
    for (const request of extractedData.repairRequests) {
        try {
            const { error } = await supabase
              .from('repair_requests')
              .upsert({
                driver_name: request.driverName,
                driver_phone: request.driverPhone,
                driver_email: request.driverEmail,
                vehicle_identifier: request.vehicleIdentifier,
                description: request.description,
                urgency: request.urgency,
                status: request.status,
                location: request.location,
                odometer: request.odometer,
                photo_urls: request.photoUrls,
                ai_category: request.aiCategory,
                airtable_id: request.airtableId,
              }, { onConflict: 'airtable_id' })
            
            if (error) throw error
          results.repairRequests.imported++
        } catch (error: any) {
          results.repairRequests.skipped++
          results.repairRequests.errors.push(`${request.driverName}: ${error.message}`)
        }
    }

    console.log('✅ Import Completed!');
    console.log(`Vehicles: ${results.vehicles.imported} imported, ${results.vehicles.skipped} skipped`);
    if (results.vehicles.errors.length > 0) console.log('First 3 vehicle errors:', results.vehicles.errors.slice(0, 3));
    console.log(`Repair Requests: ${results.repairRequests.imported} imported`);

  } catch (error) {
    console.error('❌ Import Failed:', error);
  }
}

runImport();
