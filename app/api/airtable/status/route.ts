// API endpoint to check current import status and identify duplicates
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient()
    
    // Get counts from all relevant tables
    const [
      { count: vehiclesCount },
      { count: vehiclesWithAirtableId },
      { count: usersCount },
      { count: usersWithAirtableId },
      { count: mechanicsCount },
      { count: mechanicsWithAirtableId },
      { count: bookingsCount },
      { count: bookingsWithAirtableId },
      { count: serviceRecordsCount },
      { count: serviceRecordsWithAirtableId },
      { count: departmentsCount },
    ] = await Promise.all([
      supabase.from('vehicles').select('*', { count: 'exact', head: true }),
      supabase.from('vehicles').select('*', { count: 'exact', head: true }).not('airtable_id', 'is', null),
      supabase.from('users').select('*', { count: 'exact', head: true }),
      supabase.from('users').select('*', { count: 'exact', head: true }).not('airtable_id', 'is', null),
      supabase.from('mechanics').select('*', { count: 'exact', head: true }),
      supabase.from('mechanics').select('*', { count: 'exact', head: true }).not('airtable_id', 'is', null),
      supabase.from('bookings').select('*', { count: 'exact', head: true }),
      supabase.from('bookings').select('*', { count: 'exact', head: true }).not('airtable_id', 'is', null),
      supabase.from('service_records').select('*', { count: 'exact', head: true }),
      supabase.from('service_records').select('*', { count: 'exact', head: true }).not('airtable_id', 'is', null),
      supabase.from('departments').select('*', { count: 'exact', head: true }),
    ])

    // Check for potential duplicates (same email, phone, etc.)
    const { data: duplicateEmails } = await supabase
      .from('users')
      .select('email, count')
      .not('email', 'is', null)
      .group('email')
      .having('count', 'gt', 1)

    const { data: duplicateVINs } = await supabase
      .from('vehicles')
      .select('vin, count')
      .not('vin', 'is', null)
      .not('vin', 'eq', '')
      .group('vin')
      .having('count', 'gt', 1)

    // Get sample records to understand data structure
    const { data: sampleVehicles } = await supabase
      .from('vehicles')
      .select('make, model, year, airtable_id, created_at')
      .order('created_at', { ascending: false })
      .limit(5)

    const { data: sampleUsers } = await supabase
      .from('users')
      .select('name, email, role, airtable_id, created_at')
      .order('created_at', { ascending: false })
      .limit(5)

    return NextResponse.json({
      summary: {
        vehicles: {
          total: vehiclesCount || 0,
          fromAirtable: vehiclesWithAirtableId || 0,
          legacy: (vehiclesCount || 0) - (vehiclesWithAirtableId || 0),
        },
        users: {
          total: usersCount || 0,
          fromAirtable: usersWithAirtableId || 0,
          legacy: (usersCount || 0) - (usersWithAirtableId || 0),
        },
        mechanics: {
          total: mechanicsCount || 0,
          fromAirtable: mechanicsWithAirtableId || 0,
          legacy: (mechanicsCount || 0) - (mechanicsWithAirtableId || 0),
        },
        bookings: {
          total: bookingsCount || 0,
          fromAirtable: bookingsWithAirtableId || 0,
          legacy: (bookingsCount || 0) - (bookingsWithAirtableId || 0),
        },
        serviceRecords: {
          total: serviceRecordsCount || 0,
          fromAirtable: serviceRecordsWithAirtableId || 0,
          legacy: (serviceRecordsCount || 0) - (serviceRecordsWithAirtableId || 0),
        },
        departments: departmentsCount || 0,
      },
      duplicates: {
        emails: duplicateEmails || [],
        vins: duplicateVINs || [],
      },
      samples: {
        vehicles: sampleVehicles || [],
        users: sampleUsers || [],
      },
    })
    
  } catch (error: any) {
    console.error('Error checking import status:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to check import status' },
      { status: 500 }
    )
  }
}