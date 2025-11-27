// API endpoint to explore Airtable base structure
// This helps identify tables and fields before importing

import { NextRequest, NextResponse } from 'next/server'
import { getAirtableRecords, getTableSchema, getBaseSchema } from '@/lib/airtable'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const tableName = searchParams.get('table')
    const action = searchParams.get('action') || 'tables' // 'tables', 'schema', or 'records'

    // If no table specified, return list of all tables
    if (!tableName) {
      if (action === 'tables' || !action) {
        const tables = await getBaseSchema()
        return NextResponse.json({
          baseId: process.env.AIRTABLE_BASE_ID || 'appms3yBT9I2DEGl3',
          tables: tables.map((table: any) => ({
            id: table.id,
            name: table.name,
            description: table.description,
            fieldCount: table.fields?.length || 0,
            fields: table.fields?.map((field: any) => ({
              id: field.id,
              name: field.name,
              type: field.type,
            })) || [],
          })),
        })
      } else {
        return NextResponse.json(
          { error: 'Table name is required for schema or records. Use ?action=tables to list all tables.' },
          { status: 400 }
        )
      }
    }

    if (action === 'schema') {
      // Get table schema
      const schema = await getTableSchema(tableName)
      return NextResponse.json(schema)
    } else if (action === 'records') {
      // Get sample records (limit to 10 for exploration)
      const records = await getAirtableRecords(tableName)
      return NextResponse.json({
        count: records.length,
        records: records.slice(0, 10), // Return first 10 for exploration
      })
    } else {
      return NextResponse.json(
        { error: 'Invalid action. Use "tables", "schema", or "records"' },
        { status: 400 }
      )
    }
  } catch (error: any) {
    console.error('Error exploring Airtable:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to explore Airtable' },
      { status: 500 }
    )
  }
}

