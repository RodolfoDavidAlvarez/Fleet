// API endpoint to check current import status and identify duplicates
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient()

    // Helper to count total vs Airtable-linked rows
    const countWithAirtable = async (table: string) => {
      const [totalResult, airtableResult] = await Promise.all([
        supabase.from(table).select('*', { count: 'exact', head: true }),
        supabase.from(table).select('*', { count: 'exact', head: true }).not('airtable_id', 'is', null),
      ])

      const total = totalResult.count || 0
      const fromAirtable = airtableResult.count || 0

      return {
        total,
        fromAirtable,
        legacy: Math.max(total - fromAirtable, 0),
      }
    }

    const [
      vehiclesSummary,
      usersSummary,
      mechanicsSummary,
      bookingsSummary,
      serviceRecordsSummary,
      departmentsSummary,
      repairRequestsSummary,
      sampleVehiclesResult,
      sampleUsersResult,
      sampleBookingsResult,
      sampleServiceRecordsResult,
      sampleRepairRequestsResult,
      sampleDepartmentsResult,
      duplicateEmailsResult,
      duplicateVINsResult,
    ] = await Promise.all([
      countWithAirtable('vehicles'),
      countWithAirtable('users'),
      countWithAirtable('mechanics'),
      countWithAirtable('bookings'),
      countWithAirtable('service_records'),
      countWithAirtable('departments'),
      countWithAirtable('repair_requests'),
      supabase
        .from('vehicles')
        .select('make, model, year, department, status, mileage, vehicle_number, supervisor, tag_expiry, first_aid_fire, airtable_id, created_at')
        .order('created_at', { ascending: false })
        .limit(5),
      supabase
        .from('users')
        .select('name, email, role, airtable_id, created_at')
        .order('created_at', { ascending: false })
        .limit(5),
      supabase
        .from('bookings')
        .select('customer_name, service_type, scheduled_date, scheduled_time, status, airtable_id, created_at')
        .order('created_at', { ascending: false })
        .limit(5),
      supabase
        .from('service_records')
        .select('service_type, date, mileage, status, next_service_due, airtable_id, created_at')
        .order('created_at', { ascending: false })
        .limit(5),
      supabase
        .from('repair_requests')
        .select('driver_name, vehicle_identifier, urgency, status, airtable_id, created_at')
        .order('created_at', { ascending: false })
        .limit(5),
      supabase
        .from('departments')
        .select('name, manager, vehicle_count, airtable_id, created_at')
        .order('created_at', { ascending: false })
        .limit(5),
      supabase
        .from('users')
        .select('email, count:count(*)')
        .not('email', 'is', null)
        .group('email'),
      supabase
        .from('vehicles')
        .select('vin, count:count(*)')
        .not('vin', 'is', null)
        .not('vin', 'eq', '')
        .group('vin'),
    ])

    const duplicateEmails = (duplicateEmailsResult.data || []).filter((row: any) => (row.count || 0) > 1)
    const duplicateVINs = (duplicateVINsResult.data || []).filter((row: any) => (row.count || 0) > 1)

    return NextResponse.json({
      summary: {
        vehicles: vehiclesSummary,
        users: usersSummary,
        mechanics: mechanicsSummary,
        bookings: bookingsSummary,
        serviceRecords: serviceRecordsSummary,
        departments: departmentsSummary,
        repairRequests: repairRequestsSummary,
      },
      duplicates: {
        emails: duplicateEmails,
        vins: duplicateVINs,
      },
      samples: {
        vehicles: sampleVehiclesResult.data || [],
        users: sampleUsersResult.data || [],
        bookings: sampleBookingsResult.data || [],
        serviceRecords: sampleServiceRecordsResult.data || [],
        repairRequests: sampleRepairRequestsResult.data || [],
        departments: sampleDepartmentsResult.data || [],
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
