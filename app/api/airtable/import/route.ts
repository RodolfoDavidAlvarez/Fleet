// API endpoint to import data from Airtable to Supabase
// This will map Airtable data to your database schema

import { NextRequest, NextResponse } from 'next/server'
import { getAirtableRecords } from '@/lib/airtable'
import { vehicleDB, mechanicDB, bookingDB } from '@/lib/db'
import { normalizePhoneNumber, normalizeEmail, parseDate, parseTime } from '@/lib/airtable'

interface ImportConfig {
  tableName: string
  entityType: 'vehicle' | 'mechanic' | 'booking' | 'driver'
  fieldMapping: Record<string, string> // Airtable field -> Database field
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { tableName, entityType, fieldMapping, dryRun = false } = body

    if (!tableName || !entityType || !fieldMapping) {
      return NextResponse.json(
        { error: 'Missing required fields: tableName, entityType, fieldMapping' },
        { status: 400 }
      )
    }

    // Fetch records from Airtable
    const records = await getAirtableRecords(tableName)
    
    if (records.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No records found in Airtable table',
        imported: 0,
        skipped: 0,
        errors: [],
      })
    }

    const results = {
      imported: 0,
      skipped: 0,
      errors: [] as string[],
    }

    // Process each record based on entity type
    for (const record of records) {
      try {
        const mappedData = mapFields(record.fields, fieldMapping, entityType)

        if (dryRun) {
          // Just validate, don't import
          console.log('DRY RUN - Would import:', mappedData)
          results.imported++
        } else {
          // Actually import
          await importEntity(entityType, mappedData)
          results.imported++
        }
      } catch (error: any) {
        results.skipped++
        results.errors.push(`Record ${record.id}: ${error.message}`)
        console.error(`Error importing record ${record.id}:`, error)
      }
    }

    return NextResponse.json({
      success: true,
      message: dryRun 
        ? `Dry run completed. Would import ${results.imported} records.`
        : `Import completed. ${results.imported} records imported, ${results.skipped} skipped.`,
      ...results,
    })
  } catch (error: any) {
    console.error('Error importing from Airtable:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to import from Airtable' },
      { status: 500 }
    )
  }
}

function mapFields(
  fields: Record<string, any>,
  fieldMapping: Record<string, string>,
  entityType: string
): any {
  const mapped: any = {}

  for (const [airtableField, dbField] of Object.entries(fieldMapping)) {
    const value = fields[airtableField]
    
    if (value === undefined || value === null) {
      continue
    }

    // Apply transformations based on field type
    if (dbField.includes('phone') || dbField.includes('Phone')) {
      mapped[dbField] = normalizePhoneNumber(value)
    } else if (dbField.includes('email') || dbField.includes('Email')) {
      mapped[dbField] = normalizeEmail(value)
    } else if (dbField.includes('date') || dbField.includes('Date')) {
      mapped[dbField] = parseDate(value)
    } else if (dbField.includes('time') || dbField.includes('Time')) {
      mapped[dbField] = parseTime(value)
    } else {
      // Direct mapping
      mapped[dbField] = value
    }
  }

  return mapped
}

async function importEntity(entityType: string, data: any) {
  switch (entityType) {
    case 'vehicle':
      await vehicleDB.create({
        make: data.make || '',
        model: data.model || '',
        year: data.year || new Date().getFullYear(),
        vin: data.vin || '',
        licensePlate: data.licensePlate || data.license_plate || '',
        status: data.status || 'active',
        mileage: data.mileage || 0,
        lastServiceDate: data.lastServiceDate,
        nextServiceDue: data.nextServiceDue,
        serviceHistory: [], // Service history is loaded separately from database
      })
      break

    case 'mechanic':
      await mechanicDB.create({
        name: data.name || '',
        email: data.email || '',
        phone: data.phone || '',
        specializations: Array.isArray(data.specializations) 
          ? data.specializations 
          : data.specializations?.split(',').map((s: string) => s.trim()) || [],
        availability: data.availability || 'available',
        currentJobs: [], // Current jobs are loaded separately from database
      })
      break

    case 'booking':
      await bookingDB.create({
        vehicleId: data.vehicleId,
        customerName: data.customerName || '',
        customerEmail: data.customerEmail || '',
        customerPhone: data.customerPhone || '',
        serviceType: data.serviceType || '',
        scheduledDate: data.scheduledDate || '',
        scheduledTime: data.scheduledTime || '',
        status: data.status || 'pending',
        mechanicId: data.mechanicId,
        notes: data.notes,
      })
      break

    default:
      throw new Error(`Unknown entity type: ${entityType}`)
  }
}

