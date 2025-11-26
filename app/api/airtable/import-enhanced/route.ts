// Enhanced Airtable import API - handles all data sources
// Imports vehicles, departments, service records, members, and appointments

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { extractAllEnhancedData } from '@/lib/airtable-enhanced'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { dryRun = false, dataTypes = ['all'] } = body
    
    console.log(`🚀 Starting enhanced Airtable import (dry run: ${dryRun})`)
    
    // Extract all data from Airtable
    const extractedData = await extractAllEnhancedData()
    
    const results = {
      vehicles: { imported: 0, skipped: 0, errors: [] as string[] },
      departments: { imported: 0, skipped: 0, errors: [] as string[] },
      serviceRecords: { imported: 0, skipped: 0, errors: [] as string[] },
      members: { imported: 0, skipped: 0, errors: [] as string[] },
      appointments: { imported: 0, skipped: 0, errors: [] as string[] },
    }
    
    const supabase = createServerClient()
    
    // Import departments first (needed for vehicle references)
    if (dataTypes.includes('all') || dataTypes.includes('departments')) {
      for (const dept of extractedData.departments) {
        try {
          if (!dryRun) {
            const { error } = await supabase
              .from('departments')
              .upsert({
                name: dept.name,
                description: dept.description,
                manager: dept.manager,
                vehicle_count: dept.vehicleCount,
                airtable_id: dept.airtableId,
              }, { onConflict: 'airtable_id' })
            
            if (error) throw error
          }
          results.departments.imported++
        } catch (error: any) {
          results.departments.skipped++
          results.departments.errors.push(`${dept.name}: ${error.message}`)
        }
      }
    }
    
    // Import enhanced vehicles
    if (dataTypes.includes('all') || dataTypes.includes('vehicles')) {
      for (const vehicle of extractedData.vehicles) {
        try {
          if (!dryRun) {
            // First, handle driver creation/linking
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
                // Create new driver
                const { data: newDriver, error: driverError } = await supabase
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
                
                if (!driverError && newDriver) {
                  driverId = newDriver.id
                }
              }
            }
            
            // Insert/update vehicle with enhanced data
            const { error } = await supabase
              .from('vehicles')
              .upsert({
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
              }, { onConflict: 'airtable_id' })
            
            if (error) throw error
            
            // If driver exists, create vehicle-driver assignment
            if (driverId) {
              await supabase
                .from('vehicle_drivers')
                .upsert({
                  vehicle_id: (await supabase.from('vehicles').select('id').eq('airtable_id', vehicle.airtableId).single()).data?.id,
                  driver_id: driverId,
                  is_primary: true,
                }, { onConflict: 'vehicle_id,driver_id' })
            }
          }
          results.vehicles.imported++
        } catch (error: any) {
          results.vehicles.skipped++
          results.vehicles.errors.push(`${vehicle.make} ${vehicle.model}: ${error.message}`)
        }
      }
    }
    
    // Import service records
    if (dataTypes.includes('all') || dataTypes.includes('serviceRecords')) {
      for (const record of extractedData.serviceRecords) {
        try {
          if (!dryRun) {
            // Find vehicle ID from Airtable ID
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
          }
          results.serviceRecords.imported++
        } catch (error: any) {
          results.serviceRecords.skipped++
          results.serviceRecords.errors.push(`Service record: ${error.message}`)
        }
      }
    }
    
    // Import members/staff
    if (dataTypes.includes('all') || dataTypes.includes('members')) {
      for (const member of extractedData.members) {
        try {
          if (!dryRun) {
            const role = mapMemberRole(member.role)
            
            if (role === 'mechanic') {
              // Create in both users and mechanics tables
              const { data: user, error: userError } = await supabase
                .from('users')
                .upsert({
                  name: member.name,
                  email: member.email,
                  phone: member.phone,
                  role: 'mechanic',
                  approval_status: 'approved',
                  airtable_id: member.airtableId,
                }, { onConflict: 'email' })
                .select('id')
                .single()
              
              if (!userError && user) {
                await supabase
                  .from('mechanics')
                  .upsert({
                    user_id: user.id,
                    name: member.name,
                    email: member.email,
                    phone: member.phone,
                    specializations: member.specializations,
                    availability: member.status === 'active' ? 'available' : 'unavailable',
                    airtable_id: member.airtableId,
                  }, { onConflict: 'airtable_id' })
              }
            } else {
              // Regular user
              await supabase
                .from('users')
                .upsert({
                  name: member.name,
                  email: member.email,
                  phone: member.phone,
                  role: role,
                  approval_status: 'approved',
                  airtable_id: member.airtableId,
                }, { onConflict: 'email' })
            }
          }
          results.members.imported++
        } catch (error: any) {
          results.members.skipped++
          results.members.errors.push(`${member.name}: ${error.message}`)
        }
      }
    }
    
    // Import appointments as bookings
    if (dataTypes.includes('all') || dataTypes.includes('appointments')) {
      for (const appt of extractedData.appointments) {
        try {
          if (!dryRun) {
            // Find vehicle and mechanic IDs
            const { data: vehicle } = await supabase
              .from('vehicles')
              .select('id')
              .eq('airtable_id', appt.vehicleId)
              .single()
            
            const { data: mechanic } = appt.mechanicAssigned ? await supabase
              .from('mechanics')
              .select('id')
              .ilike('name', `%${appt.mechanicAssigned}%`)
              .single() : { data: null }
            
            if (vehicle) {
              const { error } = await supabase
                .from('bookings')
                .upsert({
                  vehicle_id: vehicle.id,
                  customer_name: appt.customerName,
                  customer_email: appt.customerEmail,
                  customer_phone: appt.customerPhone,
                  service_type: appt.serviceType,
                  scheduled_date: appt.scheduledDate,
                  scheduled_time: appt.scheduledTime,
                  status: mapBookingStatus(appt.status),
                  mechanic_id: mechanic?.id,
                  notes: appt.notes,
                  airtable_id: appt.airtableId,
                }, { onConflict: 'airtable_id' })
              
              if (error) throw error
            }
          }
          results.appointments.imported++
        } catch (error: any) {
          results.appointments.skipped++
          results.appointments.errors.push(`${appt.customerName}: ${error.message}`)
        }
      }
    }
    
    const totalImported = Object.values(results).reduce((sum, r) => sum + r.imported, 0)
    const totalErrors = Object.values(results).reduce((sum, r) => sum + r.errors.length, 0)
    
    return NextResponse.json({
      success: true,
      message: dryRun 
        ? `Dry run completed. Would import ${totalImported} records across all data types.`
        : `Enhanced import completed. ${totalImported} records imported, ${totalErrors} errors.`,
      summary: extractedData.summary,
      results,
      dryRun,
    })
    
  } catch (error: any) {
    console.error('Error in enhanced Airtable import:', error)
    return NextResponse.json(
      { 
        error: error.message || 'Failed to import enhanced data from Airtable',
        details: error.stack 
      },
      { status: 500 }
    )
  }
}

// Helper functions to map Airtable values to database values
function mapServiceStatus(airtableStatus: any): string {
  const status = (airtableStatus?.toString() || '').toLowerCase()
  if (status.includes('up to date') || status.includes('active')) return 'active'
  if (status.includes('service') || status.includes('maintenance')) return 'in_service'
  if (status.includes('retired') || status.includes('inactive')) return 'retired'
  return 'active'
}

function mapMemberRole(airtableRole: any): string {
  const role = (airtableRole?.toString() || '').toLowerCase()
  if (role.includes('admin') || role.includes('manager')) return 'admin'
  if (role.includes('mechanic') || role.includes('technician')) return 'mechanic'
  if (role.includes('driver')) return 'driver'
  return 'customer'
}

function mapBookingStatus(airtableStatus: any): string {
  const status = (airtableStatus?.toString() || '').toLowerCase()
  if (status.includes('confirm')) return 'confirmed'
  if (status.includes('progress')) return 'in_progress'
  if (status.includes('complete')) return 'completed'
  if (status.includes('cancel')) return 'cancelled'
  return 'pending'
}